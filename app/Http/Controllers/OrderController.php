<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Confirmar y guardar un pedido a partir del carrito.
     */
    public function confirm(Request $request)
    {
        $submittedToken = trim((string) $request->input('checkout_token', ''));
        $completedTokens = (array) $request->session()->get('checkout_completed_tokens', []);

        if ($submittedToken !== '' && isset($completedTokens[$submittedToken])) {
            $existingOrderId = (int) $completedTokens[$submittedToken];
            if ($existingOrderId > 0) {
                return redirect()
                    ->route('orders.thankyou', $existingOrderId)
                    ->with('success', 'El pedido ya estaba confirmado.');
            }
        }

        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            return redirect()
                ->route('store.index')
                ->with('success', 'Tu carrito está vacío.');
        }

        $user = Auth::user();

        if (!$user || empty(trim((string) ($user->last_name ?? ''))) || empty(trim((string) ($user->phone ?? '')))) {
            $request->session()->put('profile_return_to', route('checkout'));

            return redirect()
                ->route('account.edit')
                ->withErrors(['profile' => 'Completá tu apellido y teléfono para poder confirmar pedidos.']);
        }

        $data = $request->validate([
            'payment_method' => ['required', 'in:local,mercado_pago,transferencia'],
            'notes' => ['nullable', 'string'],
            'pickup_delegate_name' => ['nullable', 'string', 'max:255', 'required_with:pickup_delegate_phone'],
            'pickup_delegate_phone' => ['nullable', 'string', 'max:30', 'required_with:pickup_delegate_name', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],
            'checkout_token' => ['required', 'string', 'max:64'],
        ]);

        $submittedToken = trim((string) $data['checkout_token']);
        $sessionToken = trim((string) $request->session()->get('checkout_token', ''));

        if ($sessionToken === '' || !hash_equals($sessionToken, $submittedToken)) {
            return redirect()
                ->route('checkout')
                ->withErrors(['cart' => 'La confirmación del checkout expiró. Revisá y confirmá de nuevo.']);
        }

        $lock = Cache::lock('checkout:token:' . $submittedToken, 20);
        if (!$lock->get()) {
            $completedTokens = (array) $request->session()->get('checkout_completed_tokens', []);
            if (isset($completedTokens[$submittedToken])) {
                $existingOrderId = (int) $completedTokens[$submittedToken];
                if ($existingOrderId > 0) {
                    return redirect()
                        ->route('orders.thankyou', $existingOrderId)
                        ->with('success', 'El pedido ya estaba confirmado.');
                }
            }

            return redirect()
                ->route('checkout')
                ->withErrors(['cart' => 'Ya estamos procesando este pedido. Esperá unos segundos.']);
        }

        try {
            try {
                $order = null;

                DB::transaction(function () use (&$order, $cart, $data, $user) {
                    $productIds = collect($cart)->pluck('id')->filter()->unique()->values()->all();

                    $products = Product::query()
                        ->whereIn('id', $productIds)
                        ->where('active', 1)
                        ->whereHas('category', fn($q) => $q->where('active', 1))
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get()
                        ->keyBy('id');

                    $itemsToCreate = [];
                    $total = 0;

                    foreach ($cart as $item) {
                        $productId = (int) ($item['id'] ?? 0);
                        $qty = (int) ($item['quantity'] ?? 1);
                        if ($qty < 1) {
                            $qty = 1;
                        }

                        $product = $products->get($productId);

                        if (!$product) {
                            throw ValidationException::withMessages([
                                'cart' => 'Uno o más productos ya no existen o fueron eliminados. Volvé a armar el carrito.',
                            ]);
                        }

                        if ($qty > (int) $product->stock) {
                            throw ValidationException::withMessages([
                                'cart' => "Stock insuficiente para \"{$product->name}\". Disponible: {$product->stock}.",
                            ]);
                        }

                        $unitPrice = (int) $product->price;
                        $subtotal = $unitPrice * $qty;
                        $total += $subtotal;

                        $itemsToCreate[] = [
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'price' => $unitPrice,
                            'quantity' => $qty,
                            'subtotal' => $subtotal,
                        ];
                    }

                    $order = Order::create([
                        'user_id' => Auth::id(),
                        'status' => 'pendiente',
                        'payment_method' => $data['payment_method'],
                        'total' => $total,
                        'pickup_name' => trim($user->name . ' ' . $user->last_name),
                        'pickup_phone' => $user->phone,
                        'notes' => $data['notes'] ?? null,
                        'pickup_delegate_name' => isset($data['pickup_delegate_name']) ? trim((string) $data['pickup_delegate_name']) : null,
                        'pickup_delegate_phone' => isset($data['pickup_delegate_phone']) ? trim((string) $data['pickup_delegate_phone']) : null,
                    ]);

                    OrderStatusHistory::create([
                        'order_id' => $order->id,
                        'from_status' => null,
                        'to_status' => 'pendiente',
                        'changed_by' => Auth::id(),
                        'changed_at' => now(),
                        'comment' => 'Pedido creado',
                    ]);

                    foreach ($itemsToCreate as $it) {
                        OrderItem::create([
                            'order_id' => $order->id,
                            'product_id' => $it['product_id'],
                            'product_name' => $it['product_name'],
                            'price' => $it['price'],
                            'quantity' => $it['quantity'],
                            'subtotal' => $it['subtotal'],
                        ]);

                        $product = $products->get($it['product_id']);
                        if ($product) {
                            $qty = (int) $it['quantity'];

                            $affected = Product::query()
                                ->whereKey($product->id)
                                ->where('stock', '>=', $qty)
                                ->decrement('stock', $qty);

                            if ($affected === 0) {
                                throw ValidationException::withMessages([
                                    'cart' => "No se pudo confirmar: el stock de \"{$product->name}\" cambió. Volvé a intentar.",
                                ]);
                            }
                        }
                    }

                    $order->stock_deducted_at = now();
                    $order->save();
                }, 3);

                $request->session()->forget('cart');

                $completedTokens = (array) $request->session()->get('checkout_completed_tokens', []);
                $completedTokens[$submittedToken] = (int) $order->id;
                if (count($completedTokens) > 20) {
                    $completedTokens = array_slice($completedTokens, -20, null, true);
                }
                $request->session()->put('checkout_completed_tokens', $completedTokens);
                $request->session()->forget('checkout_token');

                return redirect()
                    ->route('orders.thankyou', $order->id)
                    ->with('success', 'Pedido confirmado!');
            } catch (ValidationException $e) {
                $request->session()->forget('checkout_token');
                return redirect()
                    ->route('cart.index')
                    ->withErrors($e->errors());
            } catch (QueryException $e) {
                if (!$this->isCheckoutConcurrencyException($e)) {
                    throw $e;
                }

                return redirect()
                    ->route('checkout')
                    ->withErrors([
                        'cart' => 'Detectamos concurrencia en el stock. Actualizá el checkout y volvé a confirmar.',
                    ]);
            }
        } finally {
            $lock->release();
        }
    }

    private function isCheckoutConcurrencyException(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? '');
        $driverCode = (int) ($e->errorInfo[1] ?? 0);

        if (in_array($sqlState, ['40001', 'HY000'], true) && in_array($driverCode, [1205, 1213], true)) {
            return true;
        }

        $message = strtolower($e->getMessage());

        return str_contains($message, 'deadlock')
            || str_contains($message, 'lock wait timeout');
    }

    /**
     * Listado de pedidos del usuario logueado.
     */
    public function index(Request $request)
    {
        $tab = (string) $request->query('tab', 'activos');
        $q = trim((string) $request->query('q', ''));

        $query = Auth::user()
            ->orders()
            ->select([
                'id',
                'user_id',
                'status',
                'payment_method',
                'total',
                'pickup_name',
                'pickup_phone',
                'created_at',
            ])
            ->withCount('items')
            ->with(['items' => function ($itemsQuery) {
                $itemsQuery->select('id', 'order_id', 'product_name', 'quantity');
            }])
            ->latest();

        if ($tab === 'historial') {
            $query->whereIn('status', ['entregado', 'cancelado']);
        } else {
            $tab = 'activos';
            $query->whereNotIn('status', ['entregado', 'cancelado']);
        }

        if ($q !== '') {
            $digits = preg_replace('/\D+/', '', $q);

            $query->where(function ($sub) use ($q, $digits) {
                if (ctype_digit($q)) {
                    $sub->orWhere('id', (int) $q);
                }

                $sub->orWhere('pickup_name', 'like', "%{$q}%");

                if ($digits !== '') {
                    $sub->orWhere('pickup_phone', 'like', "%{$digits}%");
                }
            });
        }

        $orders = $query->paginate(10)->withQueryString();

        return view('orders.index', [
            'orders' => $orders,
            'tab' => $tab,
            'q' => $q,
        ]);
    }

    /**
     * Detalle de un pedido del usuario.
     */
    public function show(Order $order)
    {
        $this->authorize('view', $order);

        $order->load(['items:id,order_id,product_name,price,quantity,subtotal']);

        $shopPhoneRaw = (string) (BusinessSetting::allValues()->get('shop_phone') ?? '');
        $waNumber = preg_replace('/\D+/', '', $shopPhoneRaw);

        $lines = [];
        foreach ($order->items as $it) {
            $lines[] = ((int) $it->quantity) . 'x ' . $it->product_name;
        }

        $waText =
            "Hola! Soy {$order->pickup_name}.\n" .
            "Hice el pedido #{$order->id}.\n" .
            "Me confirmas cuando este listo para retirar?\n\n" .
            "Items:\n- " . implode("\n- ", $lines) . "\n" .
            "Total: $" . number_format((float) $order->total, 0, ',', '.') . "\n" .
            "Gracias!";

        return view('orders.show', [
            'order' => $order,
            'waNumber' => $waNumber,
            'waText' => $waText,
        ]);
    }

    public function thankYou(Order $order)
    {
        $this->authorize('view', $order);

        $order->load(['items:id,order_id,product_name,subtotal,quantity']);

        $shopPhoneRaw = (string) (BusinessSetting::allValues()->get('shop_phone') ?? '');
        $waNumber = preg_replace('/\D+/', '', $shopPhoneRaw);

        $lines = [];
        foreach ($order->items as $it) {
            $lines[] = ((int) $it->quantity) . 'x ' . $it->product_name;
        }

        $waText =
            "Hola! Soy {$order->pickup_name}.\n" .
            "Hice el pedido #{$order->id}.\n" .
            "Me confirmas cuando este listo para retirar?\n\n" .
            "Items:\n- " . implode("\n- ", $lines) . "\n" .
            "Total: $" . number_format((float) $order->total, 0, ',', '.') . "\n" .
            "Gracias!";

        return view('orders.thankyou', [
            'order' => $order,
            'waNumber' => $waNumber,
            'waText' => $waText,
        ]);
    }
}

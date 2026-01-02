<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

use App\Models\BusinessSetting;


class OrderController extends Controller
{
    /**
     * Confirmar y guardar un pedido a partir del carrito.
     */
    public function confirm(Request $request)
    {
        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            return redirect()
                ->route('store.index')
                ->with('success', 'Tu carrito está vacío.');
        }

        $user = Auth::user();

        // Requerimos datos mínimos del perfil para evitar pedidos "incompletos"
        if (!$user || empty($user->last_name) || empty($user->phone)) {
            return redirect()
                ->route('account.edit')
                ->withErrors(['profile' => 'Completá tu apellido y teléfono para poder confirmar pedidos.']);
        }

        $data = $request->validate([
            'payment_method'        => ['required', 'in:local,mercado_pago,transferencia'],
            'notes'                 => ['nullable', 'string'],
            'pickup_delegate_name'  => ['nullable', 'string', 'max:255', 'required_with:pickup_delegate_phone'],
            'pickup_delegate_phone' => ['nullable', 'string', 'max:50', 'required_with:pickup_delegate_name'],
        ]);

        try {
            $order = null;

            DB::transaction(function () use (&$order, $cart, $data, $user) {
                // 1) Productos actualizados + lock para evitar overselling
                $productIds = collect($cart)->pluck('id')->filter()->unique()->values()->all();

                $products = Product::query()
                    ->whereIn('id', $productIds)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $itemsToCreate = [];
                $total = 0;

                foreach ($cart as $item) {
                    $productId = (int)($item['id'] ?? 0);
                    $qty = (int)($item['quantity'] ?? 1);
                    if ($qty < 1) $qty = 1;

                    $product = $products->get($productId);

                    if (!$product) {
                        throw ValidationException::withMessages([
                            'cart' => 'Uno o más productos ya no existen o fueron eliminados. Volvé a armar el carrito.',
                        ]);
                    }

                    // Nota: hoy el proyecto usa "stock = 0" como "sin control".
                    // Si querés que 0 signifique "sin stock", lo ajustamos aparte.
                    if ($product->stock > 0 && $qty > $product->stock) {
                        throw ValidationException::withMessages([
                            'cart' => "Stock insuficiente para \"{$product->name}\". Disponible: {$product->stock}.",
                        ]);
                    }

                    // Precio real de BD (evita manipulación del precio en sesión)
                    $unitPrice = (int)$product->price;
                    $subtotal = $unitPrice * $qty;

                    $total += $subtotal;

                    $itemsToCreate[] = [
                        'product_id'   => $product->id,
                        'product_name' => $product->name,
                        'price'        => $unitPrice,   // 👈 la columna real
                        'quantity'     => $qty,
                        'subtotal'     => $subtotal,
                    ];

                }

                // 2) Pedido + historia inicial
                $order = Order::create([
                    'user_id'               => Auth::id(),
                    'status'                => 'pendiente',
                    'payment_method'        => $data['payment_method'],
                    'total'                 => $total,
                    'pickup_name'           => trim($user->name . ' ' . $user->last_name),
                    'pickup_phone'          => $user->phone,
                    'notes'                 => $data['notes'] ?? null,
                    'pickup_delegate_name'  => $data['pickup_delegate_name'] ?? null,
                    'pickup_delegate_phone' => $data['pickup_delegate_phone'] ?? null,
                ]);

                OrderStatusHistory::create([
                    'order_id'    => $order->id,
                    'from_status' => null,
                    'to_status'   => 'pendiente',
                    'changed_by'  => Auth::id(),
                    'changed_at'  => now(),
                    'comment'     => 'Pedido creado',
                ]);

                // 3) Items + descuento de stock (cuando aplica)
                foreach ($itemsToCreate as $it) {
                    OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $it['product_id'],
                    'product_name' => $it['product_name'],
                    'price'        => $it['price'],   // 👈 la columna real
                    'quantity'     => $it['quantity'],
                    'subtotal'     => $it['subtotal'],
                    ]);

                    $product = $products->get($it['product_id']);
                    if ($product && $product->stock > 0) {
                        $product->decrement('stock', $it['quantity']);
                    }
                }
            });

            // 4) Si salió bien, vaciamos carrito
            $request->session()->forget('cart');

            return redirect()
                ->route('orders.thankyou', $order->id)
                ->with('success', '¡Pedido confirmado!');
        } catch (ValidationException $e) {
            return redirect()
                ->route('carrito.index')
                ->withErrors($e->errors());
        }
    }


    /**
     * Listado de pedidos del usuario logueado.
     */
    public function index(Request $request)
    {
        $tab = (string) $request->query('tab', 'activos');
        $q   = trim((string) $request->query('q', ''));

        $query = Auth::user()
            ->orders()
            ->withCount('items')
            ->with(['items' => function ($q) {
                $q->select('id', 'order_id', 'product_name', 'quantity');
            }])
            ->latest();

        // Tabs: activos vs historial
        if ($tab === 'historial') {
            $query->whereIn('status', ['entregado', 'cancelado']);
        } else {
            $tab = 'activos';
            $query->whereNotIn('status', ['entregado', 'cancelado']);
        }

        // Búsqueda: por #id, nombre o teléfono
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
            'tab'    => $tab,
            'q'      => $q,
        ]);
    }


    /**
     * Detalle de un pedido del usuario.
     */
    public function show(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        $order->load(['items', 'statusHistories']);

        // Teléfono del local para WhatsApp (solo números)
        $shopPhoneRaw = BusinessSetting::getValue('shop_phone', '');
        $waNumber = preg_replace('/\D+/', '', (string) $shopPhoneRaw);

        $payLabel = fn(?string $m) => match($m) {
            'local' => 'Pago en el local',
            'mercado_pago' => 'Mercado Pago',
            'transferencia' => 'Transferencia',
            default => $m ? ucfirst(str_replace('_',' ',$m)) : '—',
        };

        $lines = [];
        foreach ($order->items as $it) {
            $lines[] = ((int)$it->quantity) . 'x ' . $it->product_name;
        }

        $waText =
            "Hola! Soy {$order->pickup_name}.\n" .
            "Hice el pedido #{$order->id}.\n" .
            "¿Me confirmás cuando esté listo para retirar?\n\n" .
            "Items:\n- " . implode("\n- ", $lines) . "\n" .
            "Total: $" . number_format((float)$order->total, 0, ',', '.') . "\n" .
            "Gracias!";


        return view('orders.show', [
            'order' => $order,
            'waNumber' => $waNumber,
            'waText' => $waText,
        ]);

    }

    public function thankYou(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        $order->load(['items']);

        // Teléfono del local para WhatsApp (solo números)
        $shopPhoneRaw = BusinessSetting::getValue('shop_phone', '');
        $waNumber = preg_replace('/\D+/', '', (string) $shopPhoneRaw);

        $payLabel = fn(?string $m) => match($m) {
            'local' => 'Pago en el local',
            'mercado_pago' => 'Mercado Pago',
            'transferencia' => 'Transferencia',
            default => $m ? ucfirst(str_replace('_',' ',$m)) : '—',
        };

        // Mensaje prearmado
        $lines = [];
        foreach ($order->items as $it) {
            $lines[] = ((int)$it->quantity) . 'x ' . $it->product_name;
        }

        $waText =
            "Hola! Soy {$order->pickup_name}.\n" .
            "Hice el pedido #{$order->id}.\n" .
            "¿Me confirmás cuando esté listo para retirar?\n\n" .
            "Items:\n- " . implode("\n- ", $lines) . "\n" .
            "Total: $" . number_format((float)$order->total, 0, ',', '.') . "\n" .
            "Gracias!";


        return view('orders.thankyou', [
            'order' => $order,
            'waNumber' => $waNumber,
            'waText' => $waText,
        ]);
    }


}

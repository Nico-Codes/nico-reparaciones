<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\BusinessSetting;
use App\Models\Product;
use App\Models\User;
use App\Support\LedgerBook;
use App\Support\SimpleXlsxWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminQuickSaleController extends Controller
{
    private const CART_SESSION_KEY = 'admin_quick_sale_cart';
    private const WALKIN_EMAIL = 'walkin@nico.local';

    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $hasSku = Schema::hasColumn('products', 'sku');
        $hasBarcode = Schema::hasColumn('products', 'barcode');

        $selectColumns = ['id', 'name', 'price', 'stock', 'category_id', 'active'];
        if ($hasSku) {
            $selectColumns[] = 'sku';
        }
        if ($hasBarcode) {
            $selectColumns[] = 'barcode';
        }

        $searchQuery = Product::query()
            ->select($selectColumns)
            ->with('category:id,name')
            ->where('active', 1)
            ->where('stock', '>', 0)
            ->orderByDesc('id');

        if ($q !== '') {
            $searchQuery->where(function ($sub) use ($q, $hasSku, $hasBarcode): void {
                $sub->where('name', 'like', "%{$q}%");
                if ($hasSku) {
                    $sub->orWhere('sku', 'like', "%{$q}%");
                }
                if ($hasBarcode) {
                    $sub->orWhere('barcode', 'like', "%{$q}%");
                }
            });
        }

        $products = $searchQuery->limit(20)->get();
        $cart = $this->cartWithProducts();
        $marginSummary = $this->cartMarginSummary($cart);
        $preventNegativeMargin = $this->boolSetting('product_prevent_negative_margin', true);

        return view('admin.quick_sales.index', [
            'products' => $products,
            'cart' => $cart,
            'cartTotal' => $this->cartTotal($cart),
            'cartItemsCount' => $this->cartItemsCount($cart),
            'cartMarginSummary' => $marginSummary,
            'preventNegativeMargin' => $preventNegativeMargin,
            'q' => $q,
            'paymentMethods' => Order::PAYMENT_METHODS,
            'quickSaleHistoryHref' => route('admin.quick_sales.history'),
        ]);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:80'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:999'],
        ]);

        $qty = (int) ($data['quantity'] ?? 1);
        $code = trim((string) ($data['code'] ?? ''));
        $productId = (int) ($data['product_id'] ?? 0);
        $hasSku = Schema::hasColumn('products', 'sku');
        $hasBarcode = Schema::hasColumn('products', 'barcode');

        $product = null;
        if ($code !== '') {
            $productQuery = Product::query();
            if ($hasBarcode) {
                $productQuery->where('barcode', $code);
            }
            if ($hasSku) {
                if ($hasBarcode) {
                    $productQuery->orWhere('sku', strtoupper($code));
                } else {
                    $productQuery->where('sku', strtoupper($code));
                }
            }
            if ($hasSku || $hasBarcode) {
                $product = $productQuery->first();
            }
        }
        if (!$product && $productId > 0) {
            $product = Product::find($productId);
        }

        if (!$product) {
            return $this->quickSaleError($request, 'Producto no encontrado por codigo o seleccion.');
        }

        if (!(bool) $product->active) {
            return $this->quickSaleError($request, 'El producto seleccionado esta inactivo.');
        }

        if ((int) $product->stock <= 0) {
            return $this->quickSaleError($request, 'El producto seleccionado no tiene stock.');
        }

        $cart = $this->rawCart();
        $line = $cart[$product->id] ?? [
            'product_id' => (int) $product->id,
            'quantity' => 0,
        ];

        $line['quantity'] = min((int) $product->stock, (int) $line['quantity'] + $qty);
        $cart[$product->id] = $line;
        $this->storeRawCart($cart);

        if ($request->expectsJson()) {
            $cartWithProducts = $this->cartWithProducts();

            return response()->json([
                'ok' => true,
                'message' => 'Producto agregado a venta rapida.',
                'cartItemsCount' => $this->cartItemsCount($cartWithProducts),
                'cartTotal' => $this->cartTotal($cartWithProducts),
            ]);
        }

        return back()->with('success', 'Producto agregado a venta rapida.');
    }

    public function ticketPartial(): Response
    {
        $cart = $this->cartWithProducts();
        $marginSummary = $this->cartMarginSummary($cart);
        $preventNegativeMargin = $this->boolSetting('product_prevent_negative_margin', true);

        return response()->view('admin.quick_sales.partials.ticket', [
            'cart' => $cart,
            'cartTotal' => $this->cartTotal($cart),
            'cartItemsCount' => $this->cartItemsCount($cart),
            'cartMarginSummary' => $marginSummary,
            'preventNegativeMargin' => $preventNegativeMargin,
            'paymentMethods' => Order::PAYMENT_METHODS,
        ]);
    }

    public function updateItem(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:0', 'max:999'],
        ]);

        $cart = $this->rawCart();
        $quantity = (int) $data['quantity'];

        if ($quantity <= 0) {
            unset($cart[$product->id]);
            $this->storeRawCart($cart);

            return back()->with('success', 'Producto removido de la venta.');
        }

        $cart[$product->id] = [
            'product_id' => (int) $product->id,
            'quantity' => min((int) $product->stock, $quantity),
        ];
        $this->storeRawCart($cart);

        return back()->with('success', 'Cantidad actualizada.');
    }

    public function removeItem(Product $product)
    {
        $cart = $this->rawCart();
        unset($cart[$product->id]);
        $this->storeRawCart($cart);

        return back()->with('success', 'Producto removido de la venta.');
    }

    public function clear()
    {
        session()->forget(self::CART_SESSION_KEY);

        return back()->with('success', 'Venta rapida limpiada.');
    }

    public function confirm(Request $request)
    {
        $cart = $this->cartWithProducts();
        if ($cart === []) {
            return back()->withErrors(['quick_sale' => 'No hay productos cargados en la venta rapida.']);
        }
        $preventNegativeMargin = $this->boolSetting('product_prevent_negative_margin', true);

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'payment_method' => ['required', 'in:' . implode(',', array_keys(Order::PAYMENT_METHODS))],
            'notes' => ['nullable', 'string', 'max:1000'],
            'after_action' => ['nullable', 'in:view,print_ticket,print_a4'],
        ]);

        $order = DB::transaction(function () use ($cart, $data, $preventNegativeMargin): Order {
            $productIds = array_map(
                static fn (array $line): int => (int) ($line['product_id'] ?? 0),
                $cart
            );
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $total = 0;
            foreach ($cart as $line) {
                $productId = (int) $line['product_id'];
                $quantity = (int) $line['quantity'];
                $product = $products->get($productId);

                if (!$product || !(bool) $product->active) {
                    throw ValidationException::withMessages([
                        'quick_sale' => 'Uno de los productos ya no esta disponible.',
                    ]);
                }

                if ((int) $product->stock < $quantity) {
                    throw ValidationException::withMessages([
                        'quick_sale' => "Stock insuficiente para {$product->name}.",
                    ]);
                }

                $costPrice = (int) ($product->cost_price ?? 0);
                $salePrice = (int) ($product->price ?? 0);
                if ($preventNegativeMargin && $costPrice > 0 && $salePrice < $costPrice) {
                    throw ValidationException::withMessages([
                        'quick_sale' => "No se puede confirmar: {$product->name} tiene margen negativo (guard activo).",
                    ]);
                }

                $total += ((int) $product->price) * $quantity;
            }

            $order = Order::create([
                'user_id' => $this->walkinUser()->id,
                'status' => 'entregado',
                'payment_method' => $data['payment_method'],
                'total' => $total,
                'pickup_name' => trim((string) $data['customer_name']),
                'pickup_phone' => trim((string) ($data['customer_phone'] ?? '')),
                'notes' => trim((string) ($data['notes'] ?? '')),
                'is_quick_sale' => true,
                'quick_sale_admin_id' => auth()->id(),
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => 'entregado',
                'changed_by' => auth()->id(),
                'changed_at' => now(),
                'comment' => 'Venta rapida de mostrador',
            ]);

            foreach ($cart as $line) {
                $productId = (int) $line['product_id'];
                $quantity = (int) $line['quantity'];
                $product = $products->get($productId);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => (int) $product->price,
                    'quantity' => $quantity,
                    'subtotal' => ((int) $product->price) * $quantity,
                ]);

                $product->decrement('stock', $quantity);
            }

            LedgerBook::record([
                'happened_at' => now(),
                'direction' => 'inflow',
                'amount' => (int) $order->total,
                'category' => 'quick_sale',
                'description' => 'Venta rapida pedido #' . $order->id,
                'source' => $order,
                'event_key' => 'quick_sale:' . $order->id,
                'created_by' => auth()->id(),
                'meta' => [
                    'payment_method' => (string) $order->payment_method,
                    'is_quick_sale' => true,
                ],
            ]);

            return $order;
        });

        session()->forget(self::CART_SESSION_KEY);

        $afterAction = (string) ($data['after_action'] ?? 'view');
        if ($afterAction === 'print_ticket') {
            return redirect()
                ->route('admin.orders.ticket', [
                    'order' => $order->id,
                    'autoprint' => 1,
                    'paper' => $this->defaultTicketPaper(),
                ])
                ->with('success', 'Venta rapida confirmada. Ticket listo para imprimir.');
        }

        if ($afterAction === 'print_a4') {
            return redirect()
                ->route('admin.orders.print', ['order' => $order->id, 'autoprint' => 1])
                ->with('success', 'Venta rapida confirmada. Hoja A4 lista para imprimir.');
        }

        return redirect()
            ->route('admin.orders.show', $order)
            ->with('success', 'Venta rapida confirmada. Pedido #' . $order->id . ' generado.');
    }

    public function history(Request $request)
    {
        $from = trim((string) $request->query('from', now()->format('Y-m-d')));
        $to = trim((string) $request->query('to', now()->format('Y-m-d')));
        $payment = trim((string) $request->query('payment', ''));
        $adminId = (int) $request->query('admin_id', 0);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
            $from = now()->format('Y-m-d');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            $to = now()->format('Y-m-d');
        }

        $query = $this->quickSaleHistoryQuery($from, $to, $payment, $adminId);
        $sales = $query->paginate(20)->withQueryString();

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as sales_count, COALESCE(SUM(total),0) as sales_total')
            ->first();

        $admins = User::query()
            ->whereIn('id', Order::query()->where('is_quick_sale', true)->whereNotNull('quick_sale_admin_id')->select('quick_sale_admin_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'last_name']);

        return view('admin.quick_sales.history', [
            'sales' => $sales,
            'from' => $from,
            'to' => $to,
            'payment' => $payment,
            'adminId' => $adminId,
            'paymentMethods' => Order::PAYMENT_METHODS,
            'admins' => $admins,
            'salesCount' => (int) ($totals->sales_count ?? 0),
            'salesTotal' => (int) ($totals->sales_total ?? 0),
            'defaultTicketPaper' => $this->defaultTicketPaper(),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $from = trim((string) $request->query('from', now()->format('Y-m-d')));
        $to = trim((string) $request->query('to', now()->format('Y-m-d')));
        $payment = trim((string) $request->query('payment', ''));
        $adminId = (int) $request->query('admin_id', 0);

        $rows = $this->quickSaleExportRows($from, $to, $payment, $adminId);
        $filename = 'ventas_rapidas_'.$from.'_a_'.$to.'_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['pedido_id', 'fecha', 'cliente', 'telefono', 'pago', 'total', 'admin']);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function exportXlsx(Request $request, SimpleXlsxWriter $xlsxWriter): Response
    {
        $from = trim((string) $request->query('from', now()->format('Y-m-d')));
        $to = trim((string) $request->query('to', now()->format('Y-m-d')));
        $payment = trim((string) $request->query('payment', ''));
        $adminId = (int) $request->query('admin_id', 0);

        $rows = $this->quickSaleExportRows($from, $to, $payment, $adminId);
        $filename = 'ventas_rapidas_'.$from.'_a_'.$to.'_'.now()->format('Ymd_His').'.xlsx';
        $binary = $xlsxWriter->build($rows, 'VentasRapidas');

        return response($binary, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * @return array<int, array{product_id:int,quantity:int,product:Product,subtotal:int}>
     */
    private function cartWithProducts(): array
    {
        $raw = $this->rawCart();
        if ($raw === []) {
            return [];
        }

        $products = Product::query()
            ->whereIn('id', array_keys($raw))
            ->get()
            ->keyBy('id');

        $cart = [];
        foreach ($raw as $productId => $line) {
            $product = $products->get((int) $productId);
            if (!$product) {
                continue;
            }

            $qty = max(1, (int) ($line['quantity'] ?? 1));
            $qty = min($qty, max(1, (int) $product->stock));

            $cart[] = [
                'product_id' => (int) $product->id,
                'quantity' => $qty,
                'product' => $product,
                'subtotal' => ((int) $product->price) * $qty,
            ];
        }

        return $cart;
    }

    /**
     * @return array<int, array{product_id:int,quantity:int}>
     */
    private function rawCart(): array
    {
        $raw = session()->get(self::CART_SESSION_KEY, []);
        if (!is_array($raw)) {
            return [];
        }

        $cart = [];
        foreach ($raw as $productId => $line) {
            $pid = (int) $productId;
            $qty = (int) ($line['quantity'] ?? 0);
            if ($pid <= 0 || $qty <= 0) {
                continue;
            }
            $cart[$pid] = [
                'product_id' => $pid,
                'quantity' => $qty,
            ];
        }

        return $cart;
    }

    /**
     * @param array<int, array{product_id:int,quantity:int}> $cart
     */
    private function storeRawCart(array $cart): void
    {
        session()->put(self::CART_SESSION_KEY, $cart);
    }

    /**
     * @param array<int, array{subtotal:int}> $cart
     */
    private function cartTotal(array $cart): int
    {
        $sum = 0;
        foreach ($cart as $line) {
            $sum += (int) ($line['subtotal'] ?? 0);
        }

        return $sum;
    }

    /**
     * @param array<int, array{quantity:int}> $cart
     */
    private function cartItemsCount(array $cart): int
    {
        $sum = 0;
        foreach ($cart as $line) {
            $sum += (int) ($line['quantity'] ?? 0);
        }

        return $sum;
    }

    private function walkinUser(): User
    {
        $user = User::query()->where('email', self::WALKIN_EMAIL)->first();
        if ($user) {
            return $user;
        }

        return User::create([
            'name' => 'Venta',
            'last_name' => 'Mostrador',
            'phone' => null,
            'email' => self::WALKIN_EMAIL,
            'email_verified_at' => now(),
            'password' => Hash::make(bin2hex(random_bytes(12))),
            'role' => 'user',
        ]);
    }

    private function quickSaleError(Request $request, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'ok' => false,
                'message' => $message,
            ], 422);
        }

        return back()->withErrors(['quick_sale' => $message]);
    }

    private function quickSaleHistoryQuery(string $from, string $to, string $payment, int $adminId)
    {
        $query = Order::query()
            ->where('is_quick_sale', true)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->with(['quickSaleAdmin:id,name,last_name', 'items:id,order_id,quantity']);

        if ($payment !== '' && array_key_exists($payment, Order::PAYMENT_METHODS)) {
            $query->where('payment_method', $payment);
        }

        if ($adminId > 0) {
            $query->where('quick_sale_admin_id', $adminId);
        }

        return $query->latest('id');
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function quickSaleExportRows(string $from, string $to, string $payment, int $adminId): array
    {
        $sales = $this->quickSaleHistoryQuery($from, $to, $payment, $adminId)
            ->with('quickSaleAdmin:id,name,last_name')
            ->get(['id', 'created_at', 'pickup_name', 'pickup_phone', 'payment_method', 'total', 'quick_sale_admin_id']);

        $adminNames = User::query()
            ->whereIn('id', $sales->pluck('quick_sale_admin_id')->filter()->unique()->values())
            ->get(['id', 'name', 'last_name'])
            ->keyBy('id');

        $rows = [];
        foreach ($sales as $sale) {
            $admin = $adminNames->get((int) $sale->quick_sale_admin_id);
            $adminLabel = $admin ? trim(($admin->name ?? '').' '.($admin->last_name ?? '')) : '';

            $rows[] = [
                (string) $sale->id,
                optional($sale->created_at)->format('Y-m-d H:i:s') ?? '',
                (string) ($sale->pickup_name ?? ''),
                (string) ($sale->pickup_phone ?? ''),
                (string) (Order::PAYMENT_METHODS[$sale->payment_method] ?? $sale->payment_method),
                (string) ((int) $sale->total),
                $adminLabel,
            ];
        }

        return $rows;
    }

    private function defaultTicketPaper(): string
    {
        if (!Schema::hasTable('business_settings')) {
            return '80';
        }

        $paper = (string) BusinessSetting::getValue('default_ticket_paper', '80');

        return in_array($paper, ['58', '80'], true) ? $paper : '80';
    }

    private function boolSetting(string $key, bool $default): bool
    {
        if (!Schema::hasTable('business_settings')) {
            return $default;
        }

        return BusinessSetting::getValue($key, $default ? '1' : '0') === '1';
    }

    /**
     * @param array<int, array{quantity:int,product:Product,subtotal:int}> $cart
     * @return array{
     *   total_cost:int,
     *   total_revenue:int,
     *   total_profit:int,
     *   margin_percent:float|null,
     *   negative_lines:int,
     *   low_lines:int
     * }
     */
    private function cartMarginSummary(array $cart): array
    {
        $totalCost = 0;
        $totalRevenue = 0;
        $negativeLines = 0;
        $lowLines = 0;

        foreach ($cart as $line) {
            $product = $line['product'];
            $qty = (int) ($line['quantity'] ?? 0);
            $cost = (int) ($product->cost_price ?? 0);
            $sale = (int) ($product->price ?? 0);
            if ($qty <= 0) {
                continue;
            }

            $lineCost = $cost * $qty;
            $lineRevenue = $sale * $qty;
            $lineProfit = $lineRevenue - $lineCost;

            $totalCost += $lineCost;
            $totalRevenue += $lineRevenue;

            if ($cost > 0) {
                if ($sale < $cost) {
                    $negativeLines++;
                } elseif ($sale === $cost || (($sale - $cost) / $cost) <= 0.10) {
                    $lowLines++;
                }
            }
        }

        $totalProfit = $totalRevenue - $totalCost;
        $marginPercent = $totalCost > 0 ? round(($totalProfit / $totalCost) * 100, 1) : null;

        return [
            'total_cost' => $totalCost,
            'total_revenue' => $totalRevenue,
            'total_profit' => $totalProfit,
            'margin_percent' => $marginPercent,
            'negative_lines' => $negativeLines,
            'low_lines' => $lowLines,
        ];
    }
}

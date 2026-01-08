<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\OrderWhatsappLog;
use App\Models\OrderWhatsappTemplate;
use App\Models\Product;
use App\Support\WhatsApp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    /**
     * Listado de pedidos (Admin).
     * Incluye filtros por estado, búsqueda y filtro WhatsApp (pending/sent/no_phone).
     */
    public function index(Request $request)
    {
        $status = (string) $request->query('status', '');
        $wa = (string) $request->query('wa', '');
        $q = trim((string) $request->query('q', ''));

        $query = Order::query()->with(['user']);

        if ($status !== '') {
            $query->where('status', $status);
        }

        // Buscar por ID, nombre, teléfono, email
        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q);

            $query->where(function ($sub) use ($q, $qDigits) {
                if (ctype_digit($q)) {
                    $sub->orWhere('id', (int) $q);
                }

                $sub->orWhere('pickup_name', 'like', "%{$q}%")
                    ->orWhere('payment_method', 'like', "%{$q}%");

                if ($qDigits !== '') {
                    $sub->orWhere('pickup_phone', 'like', "%{$qDigits}%");
                }

                $sub->orWhereHas('user', function ($u) use ($q) {
                    $u->where('name', 'like', "%{$q}%")
                      ->orWhere('email', 'like', "%{$q}%");
                });
            });
        }

        // Filtro WhatsApp
        if ($wa === 'no_phone') {
            $query->where(function ($q) {
                $q->whereNull('pickup_phone')
                  ->orWhere('pickup_phone', '');
            })->whereDoesntHave('user', function ($u) {
                $u->whereNotNull('phone')->where('phone', '!=', '');
            });
        } elseif ($wa === 'pending') {
            // Tiene teléfono (pickup o user) pero no log para estado actual
            $query->where(function ($q) {
                $q->where(function ($a) {
                    $a->whereNotNull('pickup_phone')->where('pickup_phone', '!=', '');
                })->orWhereHas('user', function ($u) {
                    $u->whereNotNull('phone')->where('phone', '!=', '');
                });
            })->whereDoesntHave('whatsappLogs', function ($l) {
                $l->whereColumn('order_whatsapp_logs.notified_status', 'orders.status');
            });
        } elseif ($wa === 'sent') {
            // Tiene teléfono y sí log para estado actual
            $query->where(function ($q) {
                $q->where(function ($a) {
                    $a->whereNotNull('pickup_phone')->where('pickup_phone', '!=', '');
                })->orWhereHas('user', function ($u) {
                    $u->whereNotNull('phone')->where('phone', '!=', '');
                });
            })->whereHas('whatsappLogs', function ($l) {
                $l->whereColumn('order_whatsapp_logs.notified_status', 'orders.status');
            });
        }

        if ($status === 'pendiente') {
            // ✅ Pendientes: mostrar primero los más viejos
            $orders = $query->orderBy('created_at', 'asc')->paginate(20)->withQueryString();
        } else {
            $orders = $query->latest()->paginate(20)->withQueryString();
        }


        // Contadores por status (para tabs)
        $statusCounts = Order::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->toArray();

        $totalCount = (int) array_sum($statusCounts);

        return view('admin.orders.index', [
            'orders' => $orders,
            'currentStatus' => $status,
            'wa' => $wa,
            'q' => $q,
            'statusCounts' => $statusCounts,
            'totalCount' => $totalCount,
        ]);
    }

    /**
     * Detalle del pedido (Admin).
     */
    public function show(Order $order)
    {
        $order->load(['user', 'items', 'statusHistories', 'whatsappLogs']);

        $rawPhone = (string) ($order->pickup_phone ?: ($order->user?->phone ?? ''));
        $waPhone = $this->normalizeWhatsappPhone($rawPhone);
        $waMessage = $this->buildWhatsappMessage($order);

        $waUrl = $waPhone
            ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage))
            : null;

        $waLastForStatus = $order->whatsappLogs
            ->firstWhere('notified_status', $order->status);

        return view('admin.orders.show', [
            'order' => $order,
            'waPhone' => $waPhone,
            'waMessage' => $waMessage,
            'waUrl' => $waUrl,
            'waLastForStatus' => $waLastForStatus,
        ]);
    }

    /**
     * Actualizar estado de un pedido.
     * Registra historial (order_status_histories) para auditoría.
     * ✅ Si pasa a cancelado, devuelve stock.
     */
    public function updateStatus(Request $request, Order $order)
    {
        $finalStatuses = ['entregado', 'cancelado'];

        if (in_array($order->status, $finalStatuses, true)) {
            // Si es AJAX devolvemos JSON, si no, volvemos con error
            if ($request->expectsJson()) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Este pedido ya está finalizado y no puede cambiar de estado.',
                ], 422);
            }

            return back()->with('error', 'Este pedido ya está finalizado y no puede cambiar de estado.');
        }


        $data = $request->validate([
            'status' => ['required', 'in:pendiente,confirmado,preparando,listo_retirar,entregado,cancelado'],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $from = (string) $order->status;
        $to = (string) $data['status'];

        $isAjax = $request->expectsJson()
            || $request->wantsJson()
            || $request->header('X-Requested-With') === 'XMLHttpRequest';

        if ($from === $to) {
            if ($isAjax) {
                return response()->json([
                    'ok' => true,
                    'changed' => false,
                    'message' => 'El pedido ya estaba en ese estado.',
                    'order_id' => $order->id,
                    'status' => $from,
                    'status_label' => \App\Models\Order::STATUSES[$from] ?? $from,
                ]);
            }

            return redirect()
                ->back()
                ->with('success', 'El pedido ya estaba en ese estado.');
        }

        // ✅ Evita devolver stock por error en pedidos ya entregados
        if ($to === 'cancelado' && $from === 'entregado') {

            if ($isAjax) {
                return response()->json([
                    'ok' => false,
                    'changed' => false,
                    'message' => 'No podés cancelar un pedido ya entregado.',
                    'order_id' => $order->id,
                    'status' => $from,
                    'status_label' => \App\Models\Order::STATUSES[$from] ?? $from,
                ], 422);
            }

            return redirect()->back()->withErrors([
                'status' => 'No podés cancelar un pedido ya entregado.',
            ]);
        }


                // ✅ Simple: si está cancelado, no se puede volver atrás (evita stocks inconsistentes)
            if ($from === 'cancelado' && $to !== 'cancelado') {
                if ($isAjax) {
                    return response()->json([
                        'ok' => false,
                        'changed' => false,
                        'message' => 'Un pedido cancelado no puede volver a otro estado.',
                        'order_id' => $order->id,
                        'status' => $from,
                        'status_label' => \App\Models\Order::STATUSES[$from] ?? $from,
                    ], 422);
                }

                return redirect()
                    ->back()
                    ->withErrors(['status' => 'Un pedido cancelado no puede volver a otro estado.']);
            }

            // ✅ Si ya está ENTREGADO, no permitimos volver a otros estados
            if ($from === 'entregado' && $to !== 'entregado') {
                if ($isAjax) {
                    return response()->json([
                        'ok' => false,
                        'changed' => false,
                        'message' => 'Un pedido entregado no puede volver a otro estado.',
                        'order_id' => $order->id,
                        'status' => $from,
                        'status_label' => \App\Models\Order::STATUSES[$from] ?? $from,
                    ], 422);
                }

                return redirect()
                    ->back()
                    ->withErrors(['status' => 'Un pedido entregado no puede volver a otro estado.']);
            }

            DB::transaction(function () use ($order, $from, $to, $data) {

            // ✅ Si pasa a cancelado, devolvemos stock (solo si aún no fue devuelto)
            if ($to === 'cancelado' && $from !== 'cancelado') {

                // Si ya fue devuelto antes, no volvemos a tocar stock
                if (!$order->stock_restored_at) {

                    $order->load('items');

                    $pids = $order->items
                        ->pluck('product_id')
                        ->filter()
                        ->unique()
                        ->values()
                        ->all();

                    if (!empty($pids)) {
                        $products = Product::query()
                            ->whereIn('id', $pids)
                            ->lockForUpdate()
                            ->get()
                            ->keyBy('id');

                        foreach ($order->items as $it) {
                            $pid = $it->product_id;
                            if (!$pid) continue;

                            $p = $products->get($pid);
                            if ($p) {
                                $p->increment('stock', (int) $it->quantity);
                            }
                        }
                    }

                    // ✅ Audit: marcamos que ya devolvimos stock
                    $order->stock_restored_at = now();
                }
            }


            $order->status = $to;
            $order->save();

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => $from,
                'to_status' => $to,
                'changed_by' => Auth::id(),
                'changed_at' => now(),
                'comment' => $data['comment'] ?? null,
            ]);
        });

        if ($isAjax) {
            $order->load(['user', 'items']);

            $rawPhone = (string) ($order->pickup_phone ?: ($order->user?->phone ?? ''));
            $waPhone = $this->normalizeWhatsappPhone($rawPhone);
            $waMessage = $this->buildWhatsappMessage($order);

            $waUrl = $waPhone
                ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage))
                : null;

            $lastLog = OrderWhatsappLog::where('order_id', $order->id)
                ->where('notified_status', $to)
                ->orderByDesc('sent_at')
                ->first();

            $waNotifiedCurrent = (bool) $lastLog;
            $waNotifiedAtLabel = $lastLog?->sent_at?->format('d/m/Y H:i') ?? '—';
            $waState = !$waPhone ? 'no_phone' : ($waNotifiedCurrent ? 'ok' : 'pending');

            return response()->json([
                'ok' => true,
                'changed' => true,
                'message' => 'Estado actualizado.',
                'order_id' => $order->id,
                'from_status' => $from,
                'to_status' => $to,
                'status' => $to,
                'status_label' => \App\Models\Order::STATUSES[$to] ?? $to,

                'wa' => [
                    'phone' => $waPhone,
                    'message' => $waMessage,
                    'url' => $waUrl,
                    'log_ajax_url' => route('admin.orders.whatsappLogAjax', $order->id),
                    'state' => $waState,
                    'notified_current' => $waNotifiedCurrent,
                    'notified_at_label' => $waNotifiedAtLabel,
                ],
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Estado actualizado.');
    }

    /**
     * Compat: registra el envío de WhatsApp (POST clásico).
     * No envía WhatsApp automáticamente: solo registra el evento.
     */
    public function whatsappLog(Request $request, Order $order)
    {
        $order->load(['user', 'items']);

        $rawPhone = (string) ($order->pickup_phone ?: ($order->user?->phone ?? ''));
        $waPhone = $this->normalizeWhatsappPhone($rawPhone);
        $waMessage = $this->buildWhatsappMessage($order);

        $created = $this->createWhatsappLogIfNotDuplicate($order, $waPhone, $waMessage);

        return redirect()
            ->route('admin.orders.show', $order->id)
            ->with('success', $created ? 'Envío de WhatsApp registrado.' : 'Ya estaba registrado recientemente.');
    }

    /**
     * AJAX: registra WhatsApp log (desde listado o modal).
     */
    public function whatsappLogAjax(Request $request, Order $order)
    {
        $order->load(['user', 'items']);

        $rawPhone = (string) ($order->pickup_phone ?: ($order->user?->phone ?? ''));
        $waPhone = $this->normalizeWhatsappPhone($rawPhone);
        $waMessage = $this->buildWhatsappMessage($order);

        $created = $this->createWhatsappLogIfNotDuplicate($order, $waPhone, $waMessage);

        $lastLog = OrderWhatsappLog::where('order_id', $order->id)
            ->where('notified_status', $order->status)
            ->orderByDesc('sent_at')
            ->first();

        $waNotifiedAtLabel = $lastLog?->sent_at?->format('d/m/Y H:i') ?? '—';

        return response()->json([
            'ok' => true,
            'created' => $created,
            'message' => $created ? 'Log registrado.' : 'Ya estaba registrado recientemente.',
            'notified_at_label' => $waNotifiedAtLabel,
        ]);
    }

    private function buildWhatsappMessage(Order $order): string
    {
        $status = (string) $order->status;

        $template = OrderWhatsappTemplate::where('status', $status)->value('template');
        $template = is_string($template) && trim($template) !== ''
            ? $template
            : "Hola {customer_name}, tu pedido #{order_id} está en estado: {status_label}.";

        $settings = BusinessSetting::all()->pluck('value', 'key');

        $shopPhone = (string) ($settings->get('shop_phone') ?? '');
        $shopAddress = (string) ($settings->get('shop_address') ?? '');
        $shopHours = (string) ($settings->get('shop_hours') ?? '');
        $shopName = (string) ($settings->get('company_name') ?? config('app.name'));

        $customerName = (string) ($order->pickup_name ?: ($order->user?->name ?? ''));
        $itemsSummary = $order->items
            ->map(function ($it) {
                $name = (string) ($it->product_name ?? 'Item');
                $qty = (int) ($it->quantity ?? 1);
                return "{$qty}x {$name}";
            })
            ->implode(', ');

        $repl = [
            '{order_id}' => (string) $order->id,
            '{customer_name}' => $customerName,
            '{status}' => $status,
            '{status_label}' => Order::STATUSES[$status] ?? $status,
            '{items_summary}' => $itemsSummary,
            '{total}' => (string) ($order->total ?? ''),
            '{shop_phone}' => $shopPhone,
            '{shop_address}' => $shopAddress,
            '{shop_hours}' => $shopHours,
            '{shop_name}' => $shopName,
        ];

        return strtr($template, $repl);
    }

    private function normalizeWhatsappPhone(string $raw): ?string
    {
        $raw = trim($raw);
        if ($raw === '') return null;

        return WhatsApp::normalizePhoneAR($raw);
    }


    private function createWhatsappLogIfNotDuplicate(Order $order, ?string $waPhone, string $message): bool
    {
        if (!$waPhone) return false;

        // Evita duplicados en ventana corta (15 min) para el mismo estado
        $recent = OrderWhatsappLog::where('order_id', $order->id)
            ->where('notified_status', $order->status)
            ->where('phone', $waPhone)
            ->where('sent_at', '>=', now()->subMinutes(15))
            ->exists();

        if ($recent) return false;

        OrderWhatsappLog::create([
            'order_id' => $order->id,
            'notified_status' => $order->status,
            'sent_at' => now(),
            'sent_by' => Auth::id(),
            'phone' => $waPhone,
            'message' => $message,
        ]);

        return true;
    }
}

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
            'currentWa' => $wa,
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
        $data = $request->validate([
            'status' => ['required', 'in:pendiente,confirmado,preparando,listo_retirar,entregado,cancelado'],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $to = (string) $data['status'];

        $isAjax = $request->expectsJson()
            || $request->wantsJson()
            || $request->header('X-Requested-With') === 'XMLHttpRequest';

        $result = DB::transaction(function () use ($order, $to, $data) {
            // Lock fuerte de la fila para evitar doble restauración de stock por requests concurrentes.
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $from = (string) $lockedOrder->status;

            if ($from === $to) {
                return [
                    'ok' => true,
                    'changed' => false,
                    'message' => 'El pedido ya estaba en ese estado.',
                    'from' => $from,
                    'to' => $from,
                ];
            }

            // Estados finales: no se puede volver atrás.
            if ($from === 'cancelado' && $to !== 'cancelado') {
                return [
                    'ok' => false,
                    'changed' => false,
                    'message' => 'Un pedido cancelado no puede volver a otro estado.',
                    'from' => $from,
                    'to' => $from,
                ];
            }

            if ($from === 'entregado' && $to !== 'entregado') {
                return [
                    'ok' => false,
                    'changed' => false,
                    'message' => 'Un pedido entregado no puede volver a otro estado.',
                    'from' => $from,
                    'to' => $from,
                ];
            }

            // Si pasa a cancelado, devolvemos stock una sola vez.
            if ($to === 'cancelado' && $from !== 'cancelado' && !$lockedOrder->stock_restored_at) {
                $items = $lockedOrder->items()->get(['product_id', 'quantity']);
                $pids = $items
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

                    foreach ($items as $it) {
                        $pid = (int) ($it->product_id ?? 0);
                        if ($pid <= 0) {
                            continue;
                        }

                        $p = $products->get($pid);
                        if ($p) {
                            $p->increment('stock', (int) $it->quantity);
                        }
                    }
                }

                $lockedOrder->stock_restored_at = now();
            }

            $lockedOrder->status = $to;
            $lockedOrder->save();

            OrderStatusHistory::create([
                'order_id' => $lockedOrder->id,
                'from_status' => $from,
                'to_status' => $to,
                'changed_by' => Auth::id(),
                'changed_at' => now(),
                'comment' => $data['comment'] ?? null,
            ]);

            return [
                'ok' => true,
                'changed' => true,
                'message' => 'Estado actualizado.',
                'from' => $from,
                'to' => $to,
            ];
        });

        $from = (string) ($result['from'] ?? '');
        $to = (string) ($result['to'] ?? $to);

        if (!($result['ok'] ?? false)) {
            $msg = (string) ($result['message'] ?? 'No se pudo actualizar el estado.');

            if ($isAjax) {
                return response()->json([
                    'ok' => false,
                    'changed' => false,
                    'message' => $msg,
                    'order_id' => $order->id,
                    'status' => $from,
                    'status_label' => \App\Models\Order::STATUSES[$from] ?? $from,
                ], 422);
            }

            return redirect()->back()->withErrors(['status' => $msg]);
        }

        if (!($result['changed'] ?? false)) {
            if ($isAjax) {
                return response()->json([
                    'ok' => true,
                    'changed' => false,
                    'message' => (string) ($result['message'] ?? 'Sin cambios.'),
                    'order_id' => $order->id,
                    'status' => $from,
                    'status_label' => \App\Models\Order::STATUSES[$from] ?? $from,
                ]);
            }

            return redirect()
                ->back()
                ->with('success', (string) ($result['message'] ?? 'Sin cambios.'));
        }

        if ($isAjax) {
            $order->refresh()->load(['user', 'items']);

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
                    'message' => (string) ($result['message'] ?? 'Estado actualizado.'),
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

        if (!$waPhone) {
            return redirect()
                ->route('admin.orders.show', $order->id)
                ->withErrors(['pickup_phone' => 'No hay un teléfono válido para enviar WhatsApp.']);
        }

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

        if (!$waPhone) {
            return response()->json([
                'ok' => false,
                'message' => 'No hay un teléfono válido para enviar WhatsApp.',
                'error' => 'invalid_phone',
            ], 422);
        }

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
        $myOrdersUrl = url('/mis-pedidos');
        $storeUrl = url('/tienda');

        $pickupName = (string) ($order->pickup_name ?: ($order->user?->name ?? ''));
        $pickupPhone = (string) ($order->pickup_phone ?: ($order->user?->phone ?? ''));
        $customerName = $pickupName;

        $items = $order->items ?? collect();
        $itemsSummary = $items
            ->map(function ($it) {
                $name = (string) ($it->product_name ?? 'Item');
                $qty = (int) ($it->quantity ?? 1);
                return "{$qty}x {$name}";
            })
            ->implode("\n");
        $itemsCount = (int) $items->sum(function ($it) {
            return (int) ($it->quantity ?? 0);
        });

        $totalFormatted = '$ ' . number_format((float) ($order->total ?? 0), 0, ',', '.');
        $notes = trim((string) ($order->notes ?? ''));

        $repl = [
            '{order_id}' => (string) $order->id,
            '{customer_name}' => $customerName,
            '{status}' => $status,
            '{status_label}' => Order::STATUSES[$status] ?? $status,
            '{items_summary}' => $itemsSummary,
            '{items_count}' => (string) $itemsCount,
            '{total}' => $totalFormatted,
            '{total_raw}' => (string) ($order->total ?? ''),
            '{pickup_name}' => $pickupName,
            '{pickup_phone}' => $pickupPhone,
            '{phone}' => $pickupPhone,
            '{notes}' => $notes,
            '{my_orders_url}' => $myOrdersUrl,
            '{store_url}' => $storeUrl,
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

<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\OrderWhatsappLog;
use App\Models\OrderWhatsappTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminOrderController extends Controller
{
    /**
     * Listado de todos los pedidos (para admin).
     */
    public function index(Request $request)
    {
        $status = (string) $request->query('status', '');
        $q = trim((string) $request->query('q', ''));

        $query = Order::query()
            ->with('user')
            ->latest();

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q);

            $query->where(function ($sub) use ($q, $qDigits) {
                // ID exacto si es numérico
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

        $orders = $query->paginate(20)->withQueryString();

        return view('admin.orders.index', [
            'orders' => $orders,
            'currentStatus' => $status,
            'q' => $q,
        ]);
    }

    /**
     * Detalle de un pedido.
     */
    public function show(Order $order)
    {
        $order->load([
            'user',
            'items',
            'statusHistories.changer',
            'whatsappLogs.sentBy',
        ]);

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
     */
    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', 'in:pendiente,confirmado,preparando,listo_retirar,entregado,cancelado'],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        $from = (string) $order->status;
        $to = (string) $data['status'];

        if ($from === $to) {
            return redirect()
              ->back()
             ->with('success', 'El pedido ya estaba en ese estado.');
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
     * Registra el envío de WhatsApp (AJAX).
     * Respuesta: { ok: true, created: bool }
     */
    public function whatsappLogAjax(Request $request, Order $order)
    {
        $order->load(['user', 'items']);

        $rawPhone = (string) ($order->pickup_phone ?: ($order->user?->phone ?? ''));
        $waPhone = $this->normalizeWhatsappPhone($rawPhone);
        $waMessage = $this->buildWhatsappMessage($order);

        $created = $this->createWhatsappLogIfNotDuplicate($order, $waPhone, $waMessage);

        return response()->json([
            'ok' => true,
            'created' => $created,
        ]);
    }

    private function buildWhatsappMessage(Order $order): string
    {
        $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

        $statusLabel = Order::STATUSES[$order->status] ?? (string) $order->status;
        $customerName = (string) ($order->pickup_name ?: ($order->user?->name ?? ''));
        $itemsCount = (int) $order->items->sum('quantity');

        $itemsSummary = $order->items
            ->map(function ($it) use ($money) {
                $name = (string) ($it->product_name ?? 'Item');
                $qty = (int) ($it->quantity ?? 1);
                $subtotal = $money($it->subtotal ?? 0);
                return "• {$name} x{$qty} ({$subtotal})";
            })
            ->implode("\n");

        $template = OrderWhatsappTemplate::where('status', $order->status)->value('template');

        if (!$template) {
            // Fallback por defecto
            $template = "Hola {customer_name} 👋\n\n"
                . "Te escribimos por tu pedido #{order_id}.\n"
                . "Estado: {status_label}\n"
                . "Total: {total}\n\n"
                . "Items ({items_count}):\n{items_summary}\n\n"
                . "Ver tus pedidos: {my_orders_url}\n"
                . "Tienda: {store_url}\n\n"
                . "{shop_address}\n"
                . "{shop_hours}";
        }

        $myOrdersUrl = \Route::has('orders.index') ? route('orders.index') : '';
        $storeUrl = \Route::has('store.index') ? route('store.index') : '';

        $shopAddress = trim(BusinessSetting::getValue('shop_address', ''));
        $shopHours = trim(BusinessSetting::getValue('shop_hours', ''));

        $replacements = [
            '{customer_name}' => $customerName ?: 'Hola',
            '{order_id}' => (string) $order->id,
            '{status_label}' => $statusLabel,
            '{total}' => $money($order->total ?? 0),
            '{items_count}' => (string) $itemsCount,
            '{items_summary}' => $itemsSummary ?: '—',
            '{my_orders_url}' => $myOrdersUrl,
            '{store_url}' => $storeUrl,
            '{shop_address}' => $shopAddress,
            '{shop_hours}' => $shopHours,
        ];

        $msg = strtr((string) $template, $replacements);
        $msg = preg_replace("/\n{3,}/", "\n\n", trim($msg));

        return $msg;
    }

    private function normalizeWhatsappPhone(string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $raw);
        if (!$digits) return null;

        if (str_starts_with($digits, '54')) {
            return $digits;
        }

        if (strlen($digits) < 8) {
            return null;
        }

        return '54' . $digits;
    }

    /**
     * Evita duplicar el log si ya se registró el mismo status recientemente (10 min).
     */
    private function createWhatsappLogIfNotDuplicate(Order $order, ?string $waPhone, string $message): bool
    {
        if (!$waPhone) return false;

        $recent = OrderWhatsappLog::query()
            ->where('order_id', $order->id)
            ->where('notified_status', $order->status)
            ->where('sent_at', '>=', now()->subMinutes(10))
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

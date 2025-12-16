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
    public function index(Request $request)
    {
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $query = Order::with('user')->latest();

        if ($status) {
            $query->where('status', $status);
        }

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                if (ctype_digit($q)) {
                    $qq->orWhere('id', (int) $q);
                }

                $qq->orWhere('pickup_name', 'like', "%{$q}%")
                   ->orWhere('pickup_phone', 'like', "%{$q}%")
                   ->orWhereHas('user', function ($u) use ($q) {
                       $u->where('name', 'like', "%{$q}%")
                         ->orWhere('email', 'like', "%{$q}%");
                   });
            });
        }

        $orders = $query->paginate(25)->withQueryString();

        return view('admin.orders.index', [
            'orders' => $orders,
            'currentStatus' => $status,
            'q' => $q,
        ]);
    }

    public function show(Order $order)
    {
        $order->load([
            'user',
            'items',
            'statusHistories.changer',
            'whatsappLogs.sentBy',
        ]);

        $waPhone = $this->normalizeWhatsappPhone((string)($order->pickup_phone ?? ''));
        $waMessage = $this->buildWhatsappMessage($order);

        $waUrl = $waPhone
            ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage))
            : null;

        $waNotifiedAt = $order->whatsappLogs
            ->firstWhere('notified_status', $order->status)
            ?->sent_at;

        return view('admin.orders.show', [
            'order' => $order,
            'statuses' => Order::STATUSES,
            'waPhone' => $waPhone,
            'waMessage' => $waMessage,
            'waUrl' => $waUrl,
            'waLogs' => $order->whatsappLogs,
            'waNotifiedAt' => $waNotifiedAt,
        ]);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status'  => ['required', 'in:pendiente,confirmado,preparando,listo_retirar,entregado,cancelado'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $from = (string) $order->status;
        $to = (string) $data['status'];
        $comment = $data['comment'] ?? null;

        if ($from === $to && (!$comment || trim($comment) === '')) {
            return redirect()
                ->route('admin.orders.show', $order->id)
                ->with('success', 'No hubo cambios para guardar.');
        }

        if ($from !== $to) {
            $order->status = $to;
            $order->save();
        }

        OrderStatusHistory::create([
            'order_id'    => $order->id,
            'from_status' => $from !== $to ? $from : $from,
            'to_status'   => $to,
            'changed_by'  => Auth::id(),
            'changed_at'  => now(),
            'comment'     => $comment,
        ]);

        return redirect()
            ->route('admin.orders.show', $order->id)
            ->with('success', 'Estado / historial actualizado.');
    }

    // ✅ Compat: log manual (si lo querés)
    public function whatsappLog(Order $order)
    {
        $waPhone = $this->normalizeWhatsappPhone((string)($order->pickup_phone ?? ''));
        $waMessage = $this->buildWhatsappMessage($order);

        if (!$waPhone) {
            return back()->withErrors(['pickup_phone' => 'No se pudo armar el WhatsApp: revisá el teléfono del cliente.']);
        }

        $created = $this->createWhatsappLogIfNotDuplicate($order, $waPhone, $waMessage);

        return back()->with('success', $created
            ? 'Envío de WhatsApp registrado en el historial.'
            : 'Ya estaba registrado un envío reciente para este mismo estado.'
        );
    }

    // ✅ Log por AJAX al abrir WhatsApp (sin recargar)
    public function whatsappLogAjax(Request $request, Order $order)
    {
        $waPhone = $this->normalizeWhatsappPhone((string)($order->pickup_phone ?? ''));
        $waMessage = $this->buildWhatsappMessage($order);

        if (!$waPhone) {
            return response()->json(['ok' => false, 'error' => 'invalid_phone'], 422);
        }

        $created = $this->createWhatsappLogIfNotDuplicate($order, $waPhone, $waMessage);

        return response()->json([
            'ok' => true,
            'created' => $created,
        ]);
    }

    private function createWhatsappLogIfNotDuplicate(Order $order, string $waPhone, string $waMessage): bool
    {
        $last = OrderWhatsappLog::where('order_id', $order->id)
            ->where('notified_status', $order->status)
            ->orderByDesc('sent_at')
            ->first();

        if ($last && $last->sent_at && $last->sent_at->diffInMinutes(now()) < 10) {
            return false;
        }

        OrderWhatsappLog::create([
            'order_id'       => $order->id,
            'notified_status'=> $order->status,
            'phone'          => $waPhone,
            'message'        => $waMessage,
            'sent_by'        => auth()->id(),
            'sent_at'        => now(),
        ]);

        return true;
    }

    private function normalizeWhatsappPhone(string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', $raw);
        if (!$digits) return null;

        if (str_starts_with($digits, '54')) return $digits;

        if (str_starts_with($digits, '0')) {
            $digits = ltrim($digits, '0');
        }

        if (strlen($digits) >= 10 && strlen($digits) <= 12) {
            return '54' . $digits;
        }

        return $digits;
    }

    private function buildWhatsappMessage(Order $order): string
    {
        $statusLabel = Order::STATUSES[$order->status] ?? $order->status;

        $tpl = OrderWhatsappTemplate::where('status', $order->status)->value('template');
        if (!$tpl || trim($tpl) === '') {
            $tpl = $this->defaultTemplate($order->status);
        }

        $shopAddress = BusinessSetting::getValue('shop_address', '');
        $shopHours = BusinessSetting::getValue('shop_hours', '');

        $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

        $itemsSummary = '';
        foreach ($order->items as $it) {
            $itemsSummary .= "- {$it->product_name} x{$it->quantity}\n";
        }
        $itemsSummary = trim($itemsSummary);

        $replacements = [
            '{customer_name}' => (string)($order->pickup_name ?: ($order->user?->name ?? '')),
            '{order_id}'      => (string)$order->id,
            '{status}'        => (string)$order->status,
            '{status_label}'  => (string)$statusLabel,
            '{total}'         => (string)$money($order->total),
            '{items_count}'   => (string)($order->items?->count() ?? 0),
            '{items_summary}' => (string)$itemsSummary,
            '{pickup_name}'   => (string)($order->pickup_name ?? ''),
            '{pickup_phone}'  => (string)($order->pickup_phone ?? ''),
            '{phone}'         => (string)($order->pickup_phone ?? ''),
            '{notes}'         => (string)($order->notes ?? ''),
            '{my_orders_url}' => url('/mis-pedidos'),
            '{store_url}'     => url('/tienda'),
            '{shop_address}'  => (string)$shopAddress,
            '{shop_hours}'    => (string)$shopHours,
        ];

        return strtr($tpl, $replacements);
    }

    private function defaultTemplate(string $status): string
    {
        $base = "Hola {customer_name} 👋\n";
        $base .= "Tu pedido *#{order_id}* está en estado: *{status_label}*.\n";
        $base .= "Total: {total}\n";
        $base .= "Ítems: {items_count}\n\n";
        $base .= "{items_summary}\n";

        if ($status === 'listo_retirar') {
            $base .= "\n📍 Dirección: {shop_address}\n";
            $base .= "🕒 Horarios: {shop_hours}\n";
            $base .= "¡Ya está listo para retirar! ✅\n";
        } elseif ($status === 'entregado') {
            $base .= "\n¡Gracias por tu compra! 🙌\n";
        } elseif ($status === 'cancelado') {
            $base .= "\nTu pedido fue cancelado. Si querés lo revisamos por WhatsApp.\n";
        }

        $base .= "\nVer tus pedidos: {my_orders_url}\n";
        $base .= "Tienda: {store_url}\n";
        $base .= "NicoReparaciones";

        return $base;
    }
}

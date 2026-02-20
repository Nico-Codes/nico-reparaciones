<?php

namespace App\Support;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\Product;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class AdminAlertCenter
{
    private const LOW_STOCK_THRESHOLD = 3;

    public function __construct(private readonly User $user)
    {
    }

    /**
     * @return array{alerts:array<int,array<string,mixed>>,total_count:int,unseen_count:int}
     */
    public function summary(): array
    {
        $alerts = $this->collectAlerts();
        $seenMap = $this->seenMap();

        $unseen = 0;
        foreach ($alerts as &$alert) {
            $isSeen = isset($seenMap[$alert['key']]) && $seenMap[$alert['key']] === $alert['signature'];
            $alert['seen'] = $isSeen;
            if (!$isSeen) {
                $unseen++;
            }
        }
        unset($alert);

        return [
            'alerts' => $alerts,
            'total_count' => count($alerts),
            'unseen_count' => $unseen,
        ];
    }

    public function markSeen(string $alertKey): bool
    {
        $alerts = $this->collectAlerts();
        $map = [];
        foreach ($alerts as $alert) {
            $map[$alert['key']] = $alert['signature'];
        }

        if (!isset($map[$alertKey])) {
            return false;
        }

        $seenMap = $this->seenMap();
        $seenMap[$alertKey] = $map[$alertKey];
        $this->saveSeenMap($seenMap);

        return true;
    }

    public function markAllSeen(): void
    {
        $alerts = $this->collectAlerts();
        $seenMap = [];
        foreach ($alerts as $alert) {
            $seenMap[$alert['key']] = $alert['signature'];
        }
        $this->saveSeenMap($seenMap);
    }

    private function seenSettingKey(): string
    {
        return 'admin_alert_center_seen_user_' . $this->user->id;
    }

    /**
     * @return array<string,string>
     */
    private function seenMap(): array
    {
        $raw = (string) BusinessSetting::getValue($this->seenSettingKey(), '{}');
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        $result = [];
        foreach ($decoded as $key => $signature) {
            if (is_string($key) && is_string($signature) && $key !== '' && $signature !== '') {
                $result[$key] = $signature;
            }
        }

        return $result;
    }

    /**
     * @param array<string,string> $seenMap
     */
    private function saveSeenMap(array $seenMap): void
    {
        BusinessSetting::updateOrCreate(
            ['key' => $this->seenSettingKey()],
            [
                'value' => json_encode($seenMap, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}',
                'updated_by' => $this->user->id,
            ]
        );
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function collectAlerts(): array
    {
        $alerts = [];

        $orderStaleHours = max(1, min(720, (int) BusinessSetting::getValue('ops_alert_order_stale_hours', '24')));
        $repairStaleDays = max(1, min(180, (int) BusinessSetting::getValue('ops_alert_repair_stale_days', '3')));

        $ordersStaleCount = (int) Order::query()
            ->whereIn('status', ['pendiente', 'confirmado', 'preparando'])
            ->where('created_at', '<', now()->copy()->subHours($orderStaleHours))
            ->count();
        if ($ordersStaleCount > 0) {
            $alerts[] = $this->buildAlert(
                key: 'orders_stale',
                title: 'Pedidos demorados',
                description: 'Mas de ' . $orderStaleHours . ' horas en pendiente/confirmado/preparando.',
                count: $ordersStaleCount,
                href: route('admin.orders.index')
            );
        }

        $repairsStaleCount = (int) Repair::query()
            ->whereIn('status', ['received', 'diagnosing', 'waiting_approval', 'repairing'])
            ->where('created_at', '<', now()->copy()->subDays($repairStaleDays))
            ->count();
        if ($repairsStaleCount > 0) {
            $alerts[] = $this->buildAlert(
                key: 'repairs_stale',
                title: 'Reparaciones demoradas',
                description: 'Mas de ' . $repairStaleDays . ' dias en estados activos.',
                count: $repairsStaleCount,
                href: route('admin.repairs.index')
            );
        }

        $lowStockCount = (int) Product::query()
            ->where('stock', '<=', self::LOW_STOCK_THRESHOLD)
            ->count();
        if ($lowStockCount > 0) {
            $alerts[] = $this->buildAlert(
                key: 'products_low_stock',
                title: 'Stock bajo',
                description: 'Productos con stock menor o igual a ' . self::LOW_STOCK_THRESHOLD . '.',
                count: $lowStockCount,
                href: route('admin.products.index')
            );
        }

        $waitingApprovalOver48h = (int) Repair::query()
            ->where('status', 'waiting_approval')
            ->where('created_at', '<', now()->copy()->subHours(48))
            ->count();
        if ($waitingApprovalOver48h > 0) {
            $alerts[] = $this->buildAlert(
                key: 'repairs_waiting_approval_48h',
                title: 'Presupuestos esperando aprobacion',
                description: 'Reparaciones con mas de 48 horas en espera de aprobacion.',
                count: $waitingApprovalOver48h,
                href: route('admin.repairs.index', ['status' => 'waiting_approval'])
            );
        }

        $ordersWaPending = $this->ordersWaPendingCount();
        if ($ordersWaPending > 0) {
            $alerts[] = $this->buildAlert(
                key: 'orders_wa_pending',
                title: 'WhatsApp pendiente en pedidos',
                description: 'Pedidos activos sin notificacion de WhatsApp para su estado actual.',
                count: $ordersWaPending,
                href: route('admin.orders.index', ['wa' => 'pending'])
            );
        }

        $repairsWaPending = $this->repairsWaPendingCount();
        if ($repairsWaPending > 0) {
            $alerts[] = $this->buildAlert(
                key: 'repairs_wa_pending',
                title: 'WhatsApp pendiente en reparaciones',
                description: 'Reparaciones activas sin notificacion de WhatsApp para su estado actual.',
                count: $repairsWaPending,
                href: route('admin.repairs.index', ['wa' => 'pending'])
            );
        }

        usort($alerts, static fn (array $a, array $b): int => (int) $b['count'] <=> (int) $a['count']);
        return $alerts;
    }

    /**
     * @return array{key:string,title:string,description:string,count:int,href:string,signature:string}
     */
    private function buildAlert(string $key, string $title, string $description, int $count, string $href): array
    {
        return [
            'key' => $key,
            'title' => $title,
            'description' => $description,
            'count' => $count,
            'href' => $href,
            'signature' => sha1($key . '|' . $count),
        ];
    }

    private function ordersWaPendingCount(): int
    {
        if (!Schema::hasTable('order_whatsapp_logs')) {
            return 0;
        }

        $activeStatuses = ['pendiente', 'confirmado', 'preparando', 'listo_retirar'];

        $activeCount = (int) Order::query()
            ->whereIn('status', $activeStatuses)
            ->count();

        $waSent = (int) Order::query()
            ->whereIn('status', $activeStatuses)
            ->whereExists(function ($q) {
                $q->selectRaw('1')
                    ->from('order_whatsapp_logs')
                    ->whereColumn('order_whatsapp_logs.order_id', 'orders.id')
                    ->whereColumn('order_whatsapp_logs.notified_status', 'orders.status');
            })
            ->count();

        return max(0, $activeCount - $waSent);
    }

    private function repairsWaPendingCount(): int
    {
        if (!Schema::hasTable('repair_whatsapp_logs')) {
            return 0;
        }

        $activeStatuses = ['received', 'diagnosing', 'waiting_approval', 'repairing', 'ready_pickup'];

        $activeCount = (int) Repair::query()
            ->whereIn('status', $activeStatuses)
            ->count();

        $waSent = (int) Repair::query()
            ->whereIn('status', $activeStatuses)
            ->whereExists(function ($q) {
                $q->selectRaw('1')
                    ->from('repair_whatsapp_logs')
                    ->whereColumn('repair_whatsapp_logs.repair_id', 'repairs.id')
                    ->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
            })
            ->count();

        return max(0, $activeCount - $waSent);
    }
}


<?php

namespace App\Support;

use App\Models\Order;
use App\Models\Repair;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardReportBuilder
{
    /**
     * @return array{
     *   rangeDays:int,
     *   fromRange:\Illuminate\Support\Carbon,
     *   toRange:\Illuminate\Support\Carbon,
     *   rows:array<int, array<int, string>>,
     *   kpis:array<string, float|int|null>,
     *   topProducts:Collection<int, object>
     * }
     */
    public function build(int $requestedRangeDays = 30): array
    {
        $rangeDays = in_array($requestedRangeDays, [7, 30, 90], true) ? $requestedRangeDays : 30;

        $toRange = now();
        $fromRange = now()->copy()->subDays($rangeDays)->startOfDay();

        $prevTo = now()->copy()->subDays($rangeDays)->endOfDay();
        $prevFrom = now()->copy()->subDays($rangeDays * 2)->startOfDay();

        $pctChange = static function (float $current, float $previous): ?float {
            if ($previous <= 0) {
                return null;
            }

            return (($current - $previous) / $previous) * 100.0;
        };

        $orderRangeAgg = Order::query()
            ->selectRaw('SUM(CASE WHEN created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as orders_in_range', [$fromRange, $toRange])
            ->selectRaw('SUM(CASE WHEN created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as orders_prev_range', [$prevFrom, $prevTo])
            ->selectRaw("SUM(CASE WHEN status = 'entregado' AND created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as delivered_in_range", [$fromRange, $toRange])
            ->selectRaw("SUM(CASE WHEN status = 'entregado' AND created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as delivered_prev_range", [$prevFrom, $prevTo])
            ->selectRaw("SUM(CASE WHEN status = 'entregado' AND created_at BETWEEN ? AND ? THEN total ELSE 0 END) as sales_in_range", [$fromRange, $toRange])
            ->selectRaw("SUM(CASE WHEN status = 'entregado' AND created_at BETWEEN ? AND ? THEN total ELSE 0 END) as sales_prev_range", [$prevFrom, $prevTo])
            ->first();

        $ordersInRange = (int) ($orderRangeAgg->orders_in_range ?? 0);
        $ordersPrevRange = (int) ($orderRangeAgg->orders_prev_range ?? 0);
        $deliveredOrdersInRange = (int) ($orderRangeAgg->delivered_in_range ?? 0);
        $deliveredOrdersPrevRange = (int) ($orderRangeAgg->delivered_prev_range ?? 0);
        $ordersRangeDeltaPct = $pctChange((float) $ordersInRange, (float) $ordersPrevRange);

        $salesInRange = (float) ($orderRangeAgg->sales_in_range ?? 0);
        $salesPrevRange = (float) ($orderRangeAgg->sales_prev_range ?? 0);
        $salesRangeDeltaPct = $pctChange($salesInRange, $salesPrevRange);

        $avgTicketInRange = $deliveredOrdersInRange > 0 ? ($salesInRange / $deliveredOrdersInRange) : 0.0;
        $avgTicketPrevRange = $deliveredOrdersPrevRange > 0 ? ($salesPrevRange / $deliveredOrdersPrevRange) : 0.0;
        $avgTicketRangeDeltaPct = $pctChange($avgTicketInRange, $avgTicketPrevRange);

        $deliveryRateInRange = $ordersInRange > 0
            ? ($deliveredOrdersInRange / $ordersInRange) * 100.0
            : null;
        $deliveryRatePrevRange = $ordersPrevRange > 0
            ? ($deliveredOrdersPrevRange / $ordersPrevRange) * 100.0
            : null;
        $deliveryRateDeltaPoints = ($deliveryRateInRange !== null && $deliveryRatePrevRange !== null)
            ? ($deliveryRateInRange - $deliveryRatePrevRange)
            : null;

        $repairRangeAgg = Repair::query()
            ->selectRaw('SUM(CASE WHEN created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as repairs_in_range', [$fromRange, $toRange])
            ->selectRaw('SUM(CASE WHEN created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as repairs_prev_range', [$prevFrom, $prevTo])
            ->first();

        $repairsInRange = (int) ($repairRangeAgg->repairs_in_range ?? 0);
        $repairsPrevRange = (int) ($repairRangeAgg->repairs_prev_range ?? 0);
        $repairsRangeDeltaPct = $pctChange((float) $repairsInRange, (float) $repairsPrevRange);

        $turnaroundExpr = DB::connection()->getDriverName() === 'sqlite'
            ? '(julianday(delivered_at) - julianday(received_at)) * 24'
            : 'TIMESTAMPDIFF(HOUR, received_at, delivered_at)';

        $repairTurnaroundInRange = Repair::query()
            ->where('status', 'delivered')
            ->whereNotNull('received_at')
            ->whereNotNull('delivered_at')
            ->whereBetween('delivered_at', [$fromRange, $toRange])
            ->selectRaw("AVG({$turnaroundExpr}) as avg_turnaround_hours")
            ->value('avg_turnaround_hours');

        $repairTurnaroundPrevRange = Repair::query()
            ->where('status', 'delivered')
            ->whereNotNull('received_at')
            ->whereNotNull('delivered_at')
            ->whereBetween('delivered_at', [$prevFrom, $prevTo])
            ->selectRaw("AVG({$turnaroundExpr}) as avg_turnaround_hours")
            ->value('avg_turnaround_hours');

        $avgRepairTurnaroundHours = $repairTurnaroundInRange !== null ? (float) $repairTurnaroundInRange : null;
        $avgRepairTurnaroundPrevHours = $repairTurnaroundPrevRange !== null ? (float) $repairTurnaroundPrevRange : null;
        $avgRepairTurnaroundDeltaPct = ($avgRepairTurnaroundHours !== null && $avgRepairTurnaroundPrevHours !== null)
            ? $pctChange($avgRepairTurnaroundHours, $avgRepairTurnaroundPrevHours)
            : null;

        $waitingApprovalCount = (int) Repair::query()
            ->where('status', 'waiting_approval')
            ->count();

        $waitingApprovalOver48h = (int) Repair::query()
            ->where('status', 'waiting_approval')
            ->where('created_at', '<', now()->copy()->subHours(48))
            ->count();

        $topProducts = collect();
        if (Schema::hasTable('order_items') && Schema::hasTable('orders')) {
            $topProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', '!=', 'cancelado')
                ->whereBetween('orders.created_at', [$fromRange, $toRange])
                ->groupBy('order_items.product_id', 'order_items.product_name')
                ->selectRaw('order_items.product_id, order_items.product_name, SUM(order_items.quantity) as qty, SUM(order_items.subtotal) as revenue')
                ->orderByDesc('qty')
                ->limit(20)
                ->get();
        }

        $formatNumber = static function (?float $value, int $decimals = 2): string {
            if ($value === null) {
                return '';
            }

            return number_format($value, $decimals, '.', '');
        };

        $rows = [
            ['kpi', 'Rango analizado', (string) $rangeDays, 'dias', $fromRange->format('Y-m-d').' a '.$toRange->format('Y-m-d')],
            ['kpi', 'Pedidos en rango', (string) $ordersInRange, 'cantidad', ''],
            ['kpi', 'Pedidos delta vs rango previo', $formatNumber($ordersRangeDeltaPct, 2), 'porcentaje', ''],
            ['kpi', 'Ventas entregadas en rango', $formatNumber($salesInRange, 0), 'ARS', ''],
            ['kpi', 'Ventas delta vs rango previo', $formatNumber($salesRangeDeltaPct, 2), 'porcentaje', ''],
            ['kpi', 'Ticket promedio entregados', $formatNumber($avgTicketInRange, 2), 'ARS', ''],
            ['kpi', 'Ticket promedio delta vs rango previo', $formatNumber($avgTicketRangeDeltaPct, 2), 'porcentaje', ''],
            ['kpi', 'Tasa entrega', $formatNumber($deliveryRateInRange, 2), 'porcentaje', 'entregados/creados en rango'],
            ['kpi', 'Tasa entrega delta', $formatNumber($deliveryRateDeltaPoints, 2), 'puntos_porcentuales', ''],
            ['kpi', 'Reparaciones en rango', (string) $repairsInRange, 'cantidad', ''],
            ['kpi', 'Reparaciones delta vs rango previo', $formatNumber($repairsRangeDeltaPct, 2), 'porcentaje', ''],
            ['kpi', 'Turnaround reparaciones entregadas', $formatNumber($avgRepairTurnaroundHours, 2), 'horas', ''],
            ['kpi', 'Turnaround delta vs rango previo', $formatNumber($avgRepairTurnaroundDeltaPct, 2), 'porcentaje', ''],
            ['kpi', 'Presupuestos esperando aprobacion', (string) $waitingApprovalCount, 'cantidad', ''],
            ['kpi', 'Presupuestos waiting_approval >48h', (string) $waitingApprovalOver48h, 'cantidad', ''],
        ];

        $rank = 1;
        foreach ($topProducts as $product) {
            $rows[] = [
                'top_product',
                (string) $rank,
                (string) ((int) ($product->qty ?? 0)),
                'unidades',
                trim((string) ($product->product_name ?? '')).' | id='.(string) ($product->product_id ?? '').' | revenue='.(string) ((int) ($product->revenue ?? 0)),
            ];
            $rank++;
        }

        return [
            'rangeDays' => $rangeDays,
            'fromRange' => $fromRange,
            'toRange' => $toRange,
            'rows' => $rows,
            'kpis' => [
                'orders_in_range' => $ordersInRange,
                'orders_delta_pct' => $ordersRangeDeltaPct,
                'sales_in_range' => $salesInRange,
                'sales_delta_pct' => $salesRangeDeltaPct,
                'avg_ticket' => $avgTicketInRange,
                'avg_ticket_delta_pct' => $avgTicketRangeDeltaPct,
                'delivery_rate' => $deliveryRateInRange,
                'delivery_rate_delta_points' => $deliveryRateDeltaPoints,
                'repairs_in_range' => $repairsInRange,
                'repairs_delta_pct' => $repairsRangeDeltaPct,
                'avg_repair_turnaround_hours' => $avgRepairTurnaroundHours,
                'avg_repair_turnaround_delta_pct' => $avgRepairTurnaroundDeltaPct,
                'waiting_approval_count' => $waitingApprovalCount,
                'waiting_approval_over_48h' => $waitingApprovalOver48h,
            ],
            'topProducts' => $topProducts,
        ];
    }
}

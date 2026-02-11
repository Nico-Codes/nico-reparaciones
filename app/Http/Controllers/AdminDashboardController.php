<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Repair;
use App\Support\AdminDashboardReportBuilder;
use App\Support\MailHealthStatus;
use App\Support\SimpleXlsxWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $smtpHealth = MailHealthStatus::evaluate();

        $rangeDays = (int) $request->query('range', 30);
        if (! in_array($rangeDays, [7, 30, 90], true)) {
            $rangeDays = 30;
        }

        $toRange = now();
        $fromRange = now()->copy()->subDays($rangeDays)->startOfDay();

        $prevTo = now()->copy()->subDays($rangeDays)->endOfDay();
        $prevFrom = now()->copy()->subDays($rangeDays * 2)->startOfDay();

        $orderStatuses = defined(Order::class.'::STATUSES')
            ? Order::STATUSES
            : [
                'pendiente' => 'Pendiente',
                'confirmado' => 'Confirmado',
                'preparando' => 'Preparando',
                'listo_retirar' => 'Listo para retirar',
                'entregado' => 'Entregado',
                'cancelado' => 'Cancelado',
            ];

        $repairStatuses = defined(Repair::class.'::STATUSES')
            ? Repair::STATUSES
            : [
                'received' => 'Recibido',
                'diagnosing' => 'Diagnosticando',
                'waiting_approval' => 'Esperando aprobacion',
                'repairing' => 'En reparacion',
                'ready_pickup' => 'Listo para retirar',
                'delivered' => 'Entregado',
                'cancelled' => 'Cancelado',
            ];

        $activeOrderStatuses = array_values(array_diff(array_keys($orderStatuses), ['entregado', 'cancelado']));
        $finalRepairStatuses = ['delivered', 'cancelled'];

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

        $orderCounts = Order::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->map(static fn ($count) => (int) $count)
            ->toArray();

        $ordersTotal = (int) array_sum($orderCounts);
        $ordersPending = (int) ($orderCounts['pendiente'] ?? 0);
        $ordersActive = 0;
        foreach ($activeOrderStatuses as $status) {
            $ordersActive += (int) ($orderCounts[$status] ?? 0);
        }

        $repairCounts = Repair::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->map(static fn ($count) => (int) $count)
            ->toArray();

        $repairsTotal = (int) array_sum($repairCounts);
        $repairsActive = $repairsTotal;
        foreach ($finalRepairStatuses as $status) {
            $repairsActive -= (int) ($repairCounts[$status] ?? 0);
        }
        if ($repairsActive < 0) {
            $repairsActive = 0;
        }

        $lowStockThreshold = 3;
        $productAgg = Product::query()
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw('SUM(CASE WHEN stock <= ? THEN 1 ELSE 0 END) as low_stock_count', [$lowStockThreshold])
            ->first();

        $productsTotal = (int) ($productAgg->total_count ?? 0);
        $lowStockCount = (int) ($productAgg->low_stock_count ?? 0);

        $ordersWaPending = 0;
        $ordersWaSent = 0;
        if (Schema::hasTable('order_whatsapp_logs')) {
            $ordersWaSent = (int) Order::query()
                ->whereIn('status', $activeOrderStatuses)
                ->whereExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('order_whatsapp_logs')
                        ->whereColumn('order_whatsapp_logs.order_id', 'orders.id')
                        ->whereColumn('order_whatsapp_logs.notified_status', 'orders.status');
                })
                ->count();

            $ordersWaPending = max(0, $ordersActive - $ordersWaSent);
        }

        $repairsWaPending = 0;
        $repairsWaSent = 0;
        if (Schema::hasTable('repair_whatsapp_logs')) {
            $repairsWaSent = (int) Repair::query()
                ->whereNotIn('status', $finalRepairStatuses)
                ->whereExists(function ($q) {
                    $q->selectRaw('1')
                        ->from('repair_whatsapp_logs')
                        ->whereColumn('repair_whatsapp_logs.repair_id', 'repairs.id')
                        ->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
                })
                ->count();

            $repairsWaPending = max(0, $repairsActive - $repairsWaSent);
        }

        $labels = [];
        $monthKeys = [];
        $monthStart = now()->copy()->startOfMonth()->subMonthsNoOverflow(5);
        for ($i = 0; $i < 6; $i++) {
            $month = $monthStart->copy()->addMonthsNoOverflow($i);
            $labels[] = $month->format('M');
            $monthKeys[] = $month->format('Y-m');
        }

        $monthExpr = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        $ordersSeriesMap = Order::query()
            ->selectRaw("{$monthExpr} as ym, COUNT(*) as c")
            ->where('created_at', '>=', $monthStart)
            ->groupBy('ym')
            ->pluck('c', 'ym')
            ->map(static fn ($count) => (int) $count)
            ->toArray();

        $repairsSeriesMap = Repair::query()
            ->selectRaw("{$monthExpr} as ym, COUNT(*) as c")
            ->where('created_at', '>=', $monthStart)
            ->groupBy('ym')
            ->pluck('c', 'ym')
            ->map(static fn ($count) => (int) $count)
            ->toArray();

        $salesSeriesMap = Order::query()
            ->selectRaw("{$monthExpr} as ym, SUM(total) as s")
            ->where('status', 'entregado')
            ->where('created_at', '>=', $monthStart)
            ->groupBy('ym')
            ->pluck('s', 'ym')
            ->map(static fn ($total) => (int) $total)
            ->toArray();

        $ordersSeries = [];
        $repairsSeries = [];
        $salesSeries = [];
        foreach ($monthKeys as $key) {
            $ordersSeries[] = (int) ($ordersSeriesMap[$key] ?? 0);
            $repairsSeries[] = (int) ($repairsSeriesMap[$key] ?? 0);
            $salesSeries[] = (int) ($salesSeriesMap[$key] ?? 0);
        }

        $topProducts = collect();
        if (Schema::hasTable('order_items') && Schema::hasTable('orders')) {
            $topProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', '!=', 'cancelado')
                ->whereBetween('orders.created_at', [$fromRange, $toRange])
                ->groupBy('order_items.product_id', 'order_items.product_name')
                ->selectRaw('order_items.product_id, order_items.product_name, SUM(order_items.quantity) as qty, SUM(order_items.subtotal) as revenue')
                ->orderByDesc('qty')
                ->limit(8)
                ->get();
        }

        $latestOrders = Order::query()
            ->select(['id', 'user_id', 'status', 'pickup_name', 'total', 'created_at'])
            ->with('user:id,name')
            ->latest()
            ->take(8)
            ->get();

        $latestRepairs = Repair::query()
            ->select(['id', 'code', 'status', 'created_at', 'customer_name', 'device_brand', 'device_model'])
            ->latest()
            ->take(8)
            ->get();

        $lowStockProducts = Product::query()
            ->select(['id', 'name', 'stock'])
            ->where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock')
            ->take(10)
            ->get();

        return view('admin.dashboard', [
            'rangeDays' => $rangeDays,
            'fromRange' => $fromRange,
            'toRange' => $toRange,

            'orderStatuses' => $orderStatuses,
            'repairStatuses' => $repairStatuses,

            'ordersInRange' => $ordersInRange,
            'ordersRangeDeltaPct' => $ordersRangeDeltaPct,

            'salesInRange' => (int) $salesInRange,
            'salesRangeDeltaPct' => $salesRangeDeltaPct,
            'avgTicketInRange' => $avgTicketInRange,
            'avgTicketRangeDeltaPct' => $avgTicketRangeDeltaPct,
            'deliveryRateInRange' => $deliveryRateInRange,
            'deliveryRateDeltaPoints' => $deliveryRateDeltaPoints,

            'repairsInRange' => $repairsInRange,
            'repairsRangeDeltaPct' => $repairsRangeDeltaPct,
            'avgRepairTurnaroundHours' => $avgRepairTurnaroundHours,
            'avgRepairTurnaroundDeltaPct' => $avgRepairTurnaroundDeltaPct,
            'waitingApprovalCount' => $waitingApprovalCount,
            'waitingApprovalOver48h' => $waitingApprovalOver48h,

            'ordersTotal' => $ordersTotal,
            'ordersActive' => $ordersActive,
            'ordersPending' => $ordersPending,

            'repairsTotal' => $repairsTotal,
            'repairsActive' => $repairsActive,

            'productsTotal' => $productsTotal,
            'lowStockThreshold' => $lowStockThreshold,
            'lowStockCount' => $lowStockCount,

            'ordersWaPending' => $ordersWaPending,
            'ordersWaSent' => $ordersWaSent,
            'repairsWaPending' => $repairsWaPending,
            'repairsWaSent' => $repairsWaSent,

            'orderCounts' => $orderCounts,
            'repairCounts' => $repairCounts,

            'labels' => $labels,
            'ordersSeries' => $ordersSeries,
            'repairsSeries' => $repairsSeries,
            'salesSeries' => $salesSeries,

            'topProducts' => $topProducts,
            'latestOrders' => $latestOrders,
            'latestRepairs' => $latestRepairs,
            'lowStockProducts' => $lowStockProducts,
            'smtpHealth' => $smtpHealth,
        ]);
    }

    public function exportCsv(Request $request, AdminDashboardReportBuilder $reportBuilder): StreamedResponse
    {
        $report = $reportBuilder->build((int) $request->query('range', 30));
        $rows = $report['rows'];
        $rangeDays = (int) $report['rangeDays'];
        $filename = 'dashboard_kpis_'.$rangeDays.'d_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['seccion', 'metrica', 'valor', 'unidad', 'detalle']);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function exportXlsx(
        Request $request,
        AdminDashboardReportBuilder $reportBuilder,
        SimpleXlsxWriter $xlsxWriter
    ): Response {
        $report = $reportBuilder->build((int) $request->query('range', 30));
        $rangeDays = (int) $report['rangeDays'];
        $filename = 'dashboard_kpis_'.$rangeDays.'d_'.now()->format('Ymd_His').'.xlsx';
        $binary = $xlsxWriter->build($report['rows'], 'KPIs');

        return response($binary, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}

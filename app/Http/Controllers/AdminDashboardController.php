<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Repair;
use App\Models\OrderWhatsappLog;
use App\Models\RepairWhatsappLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        // =========================
        // Rango (7/30/90 días)
        // =========================
        $rangeDays = (int) $request->query('range', 30);
        if (!in_array($rangeDays, [7, 30, 90], true)) {
            $rangeDays = 30;
        }

        $toRange = now();
        $fromRange = now()->copy()->subDays($rangeDays)->startOfDay();

        $prevTo = now()->copy()->subDays($rangeDays)->endOfDay();
        $prevFrom = now()->copy()->subDays($rangeDays * 2)->startOfDay();

        // =========================
        // Estados (fallbacks seguros)
        // =========================
        $orderStatuses = defined(Order::class . '::STATUSES')
            ? Order::STATUSES
            : [
                'pendiente'     => 'Pendiente',
                'confirmado'    => 'Confirmado',
                'preparando'    => 'Preparando',
                'listo_retirar' => 'Listo para retirar',
                'entregado'     => 'Entregado',
                'cancelado'     => 'Cancelado',
            ];

        $repairStatuses = defined(Repair::class . '::STATUSES')
            ? Repair::STATUSES
            : [
                'received'         => 'Recibido',
                'diagnosing'       => 'Diagnosticando',
                'waiting_approval' => 'Esperando aprobación',
                'repairing'        => 'En reparación',
                'ready_pickup'     => 'Listo para retirar',
                'delivered'        => 'Entregado',
                'cancelled'        => 'Cancelado',
            ];

        $activeOrderStatuses = array_values(array_diff(array_keys($orderStatuses), ['entregado', 'cancelado']));
        $finalRepairStatuses = ['delivered', 'cancelled'];

        // =========================
        // Helpers
        // =========================
        $pctChange = function (float $current, float $previous): ?float {
            if ($previous <= 0) return null;
            return (($current - $previous) / $previous) * 100.0;
        };

        // =========================
        // KPIs (por rango)
        // =========================
        $ordersInRange = Order::query()
            ->whereBetween('created_at', [$fromRange, $toRange])
            ->count();

        $ordersPrevRange = Order::query()
            ->whereBetween('created_at', [$prevFrom, $prevTo])
            ->count();

        $ordersRangeDeltaPct = $pctChange((float)$ordersInRange, (float)$ordersPrevRange);

        $salesInRange = (float) Order::query()
            ->where('status', 'entregado')
            ->whereBetween('created_at', [$fromRange, $toRange])
            ->sum('total');

        $salesPrevRange = (float) Order::query()
            ->where('status', 'entregado')
            ->whereBetween('created_at', [$prevFrom, $prevTo])
            ->sum('total');

        $salesRangeDeltaPct = $pctChange($salesInRange, $salesPrevRange);

        $repairsInRange = Repair::query()
            ->whereBetween('created_at', [$fromRange, $toRange])
            ->count();

        $repairsPrevRange = Repair::query()
            ->whereBetween('created_at', [$prevFrom, $prevTo])
            ->count();

        $repairsRangeDeltaPct = $pctChange((float)$repairsInRange, (float)$repairsPrevRange);

        // =========================
        // KPIs (operativos)
        // =========================
        $ordersTotal = Order::query()->count();
        $ordersActive = Order::query()->whereIn('status', $activeOrderStatuses)->count();
        $ordersPending = Order::query()->where('status', 'pendiente')->count();

        $repairsTotal = Repair::query()->count();
        $repairsActive = Repair::query()->whereNotIn('status', $finalRepairStatuses)->count();

        $productsTotal = Product::query()->count();
        $lowStockThreshold = 3;
        $lowStockCount = Product::query()->where('stock', '<=', $lowStockThreshold)->count();

        // =========================
        // WhatsApp pendientes (estado actual)
        // =========================
        $ordersWaPending = 0;
        $ordersWaSent = 0;

        if (Schema::hasTable('order_whatsapp_logs')) {
            $ordersWaPending = Order::query()
                ->whereIn('status', $activeOrderStatuses)
                ->whereDoesntHave('whatsappLogs', function ($q) {
                    $q->whereColumn('order_whatsapp_logs.notified_status', 'orders.status');
                })
                ->count();

            $ordersWaSent = Order::query()
                ->whereIn('status', $activeOrderStatuses)
                ->whereHas('whatsappLogs', function ($q) {
                    $q->whereColumn('order_whatsapp_logs.notified_status', 'orders.status');
                })
                ->count();
        }

        $repairsWaPending = 0;
        $repairsWaSent = 0;

        if (Schema::hasTable('repair_whatsapp_logs')) {
            $repairsWaPending = Repair::query()
                ->whereNotIn('status', $finalRepairStatuses)
                ->whereDoesntHave('whatsappLogs', function ($q) {
                    $q->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
                })
                ->count();

            $repairsWaSent = Repair::query()
                ->whereNotIn('status', $finalRepairStatuses)
                ->whereHas('whatsappLogs', function ($q) {
                    $q->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
                })
                ->count();
        }

        // =========================
        // Conteos por estado
        // =========================
        $orderCounts = Order::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->toArray();

        $repairCounts = Repair::query()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->toArray();

        // =========================
        // Series (últimos 6 meses)
        // =========================
        $labels = [];
        $ordersSeries = [];
        $repairsSeries = [];
        $salesSeries = [];

        for ($i = 5; $i >= 0; $i--) {
            $start = now()->copy()->subMonthsNoOverflow($i)->startOfMonth();
            $end = now()->copy()->subMonthsNoOverflow($i)->endOfMonth();

            $labels[] = $start->format('M');

            $ordersSeries[] = (int) Order::query()
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $repairsSeries[] = (int) Repair::query()
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $salesSeries[] = (int) Order::query()
                ->where('status', 'entregado')
                ->whereBetween('created_at', [$start, $end])
                ->sum('total');
        }

        // =========================
        // Top productos (por rango)
        // =========================
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

        // =========================
        // Listas rápidas
        // =========================
        $latestOrders = Order::query()->with('user')->latest()->take(8)->get();
        $latestRepairs = Repair::query()->latest()->take(8)->get();

        $lowStockProducts = Product::query()
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

            'salesInRange' => (int)$salesInRange,
            'salesRangeDeltaPct' => $salesRangeDeltaPct,

            'repairsInRange' => $repairsInRange,
            'repairsRangeDeltaPct' => $repairsRangeDeltaPct,

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
        ]);
    }
}

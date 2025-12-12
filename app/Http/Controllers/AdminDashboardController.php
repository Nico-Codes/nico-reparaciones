<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Repair;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        // Pedidos “activos” (ajustable)
        $activeOrderStatuses = ['pendiente', 'confirmado', 'preparando', 'listo_retirar'];

        $ordersActiveCount = Order::query()
            ->whereIn('status', $activeOrderStatuses)
            ->count();

        $ordersTodayCount = Order::query()
            ->whereDate('created_at', now()->toDateString())
            ->count();

        $latestOrders = Order::query()
            ->latest()
            ->take(8)
            ->get();

        // Reparaciones activas (si tu sistema usa otros strings, igual no rompe)
        $finalRepairStatuses = ['entregado', 'cancelado'];

        $repairsActiveCount = Repair::query()
            ->whereNotIn('status', $finalRepairStatuses)
            ->count();

        $latestRepairs = Repair::query()
            ->latest()
            ->take(8)
            ->get();

        // Stock bajo (umbral simple)
        $lowStockThreshold = 3;

        $lowStockProducts = Product::query()
            ->where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock')
            ->take(10)
            ->get();

        return view('admin.dashboard', [
            'ordersActiveCount' => $ordersActiveCount,
            'ordersTodayCount' => $ordersTodayCount,
            'latestOrders' => $latestOrders,
            'repairsActiveCount' => $repairsActiveCount,
            'latestRepairs' => $latestRepairs,
            'lowStockProducts' => $lowStockProducts,
            'lowStockThreshold' => $lowStockThreshold,
        ]);
    }
}

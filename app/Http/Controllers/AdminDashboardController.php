<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Repair;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Pedidos "abiertos"
        $openOrderStatuses = ['pendiente', 'confirmado', 'preparando', 'listo_retirar'];
        $ordersOpenCount = Order::whereIn('status', $openOrderStatuses)->count();

        // Reparaciones "abiertas" (ajustá si tus statuses cambian)
        $closedRepairStatuses = ['entregado', 'cancelado'];
        $repairsOpenCount = Repair::whereNotIn('status', $closedRepairStatuses)->count();

        // Stock bajo
        $lowStockThreshold = 2;
        $lowStockProducts = Product::where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock', 'asc')
            ->limit(10)
            ->get();

        // Últimos movimientos
        $recentOrders = Order::orderByDesc('id')->limit(5)->get();
        $recentRepairs = Repair::orderByDesc('id')->limit(5)->get();

        return view('admin.dashboard', compact(
            'ordersOpenCount',
            'repairsOpenCount',
            'lowStockThreshold',
            'lowStockProducts',
            'recentOrders',
            'recentRepairs'
        ));
    }
}

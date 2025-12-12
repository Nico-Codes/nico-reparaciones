<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Pedidos
        $ordersTotal = DB::table('orders')->count();
        $ordersByStatus = DB::table('orders')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $latestOrders = DB::table('orders')
            ->orderByDesc('id')
            ->limit(8)
            ->get();

        // Reparaciones
        $repairsTotal = DB::table('repairs')->count();
        $repairsByStatus = DB::table('repairs')
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $latestRepairs = DB::table('repairs')
            ->orderByDesc('id')
            ->limit(8)
            ->get();

        // Stock bajo (si existe la tabla products y el campo stock)
        $lowStockProducts = collect();
        try {
            $lowStockProducts = DB::table('products')
                ->whereNotNull('stock')
                ->where('stock', '<=', 3)
                ->orderBy('stock')
                ->limit(10)
                ->get();
        } catch (\Throwable $e) {
            // Si todavía no existe tabla/campo, no rompemos el dashboard.
            $lowStockProducts = collect();
        }

        return view('admin.dashboard', [
            'ordersTotal' => $ordersTotal,
            'ordersByStatus' => $ordersByStatus,
            'latestOrders' => $latestOrders,

            'repairsTotal' => $repairsTotal,
            'repairsByStatus' => $repairsByStatus,
            'latestRepairs' => $latestRepairs,

            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}

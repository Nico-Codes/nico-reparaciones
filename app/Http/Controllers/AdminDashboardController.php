<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Repair;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Resúmenes por estado
        $ordersByStatus = Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $repairsByStatus = Repair::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $ordersTotal = array_sum($ordersByStatus);
        $repairsTotal = array_sum($repairsByStatus);

        // Atajos útiles (estado clave)
        $pendingOrdersCount = Order::where('status', 'pendiente')->count();
        $readyOrdersCount = Order::where('status', 'listo_retirar')->count();

        $activeRepairStatuses = ['recibido', 'en_diagnostico', 'esperando_repuesto', 'en_reparacion'];
        $activeRepairsCount = Repair::whereIn('status', $activeRepairStatuses)->count();
        $readyRepairsCount = Repair::where('status', 'listo_para_retirar')->count();

        // Stock bajo
        $lowStockThreshold = 3;

        $lowStockProducts = Product::query()
            ->whereNotNull('stock')
            ->where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock')
            ->limit(10)
            ->get();

        $lowStockCount = Product::query()
            ->whereNotNull('stock')
            ->where('stock', '<=', $lowStockThreshold)
            ->count();

        // Actividad reciente (sin depender de relaciones)
        $recentOrders = Order::query()
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $recentRepairs = Repair::query()
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return view('admin.dashboard', [
            'ordersByStatus' => $ordersByStatus,
            'repairsByStatus' => $repairsByStatus,
            'ordersTotal' => $ordersTotal,
            'repairsTotal' => $repairsTotal,

            'pendingOrdersCount' => $pendingOrdersCount,
            'readyOrdersCount' => $readyOrdersCount,
            'activeRepairsCount' => $activeRepairsCount,
            'readyRepairsCount' => $readyRepairsCount,

            'lowStockThreshold' => $lowStockThreshold,
            'lowStockProducts' => $lowStockProducts,
            'lowStockCount' => $lowStockCount,

            'recentOrders' => $recentOrders,
            'recentRepairs' => $recentRepairs,
        ]);
    }
}

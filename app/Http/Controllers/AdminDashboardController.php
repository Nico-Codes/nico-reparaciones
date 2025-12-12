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

        // Simple y fijo (sin mil configuraciones)
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

        return view('admin.dashboard', [
            'ordersByStatus' => $ordersByStatus,
            'repairsByStatus' => $repairsByStatus,
            'ordersTotal' => $ordersTotal,
            'repairsTotal' => $repairsTotal,
            'lowStockThreshold' => $lowStockThreshold,
            'lowStockProducts' => $lowStockProducts,
            'lowStockCount' => $lowStockCount,
        ]);
    }
}

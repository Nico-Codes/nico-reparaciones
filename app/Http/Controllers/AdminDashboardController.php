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
        // Pedidos: conteo por estado (no asumimos nombres exactos)
        $ordersByStatus = Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $lastOrders = Order::latest()->take(8)->get();

        // Reparaciones
        $repairsByStatus = Repair::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $activeRepairsCount = Repair::whereNotIn('status', ['delivered', 'cancelled'])->count();
        $lastRepairs = Repair::latest()->take(8)->get();

        // Stock bajo
        $lowStockThreshold = 3; // podés ajustar
        $lowStockProducts = Product::where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock')
            ->take(12)
            ->get();

        return view('admin.dashboard', [
            'ordersByStatus' => $ordersByStatus,
            'lastOrders' => $lastOrders,

            'repairsByStatus' => $repairsByStatus,
            'activeRepairsCount' => $activeRepairsCount,
            'lastRepairs' => $lastRepairs,
            'repairStatuses' => Repair::STATUSES,

            'lowStockThreshold' => $lowStockThreshold,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}

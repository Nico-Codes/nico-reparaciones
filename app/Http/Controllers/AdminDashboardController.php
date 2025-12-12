<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Pedidos
        $ordersTotal = Order::count();

        // Conteo por estado (para widgets rápidos)
        $orderStatusCounts = Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // "Pendientes" (ajustá si tus estados cambian)
        $pendingOrderStatuses = ['pendiente', 'confirmado', 'preparando', 'listo_retirar'];
        $ordersPending = Order::whereIn('status', $pendingOrderStatuses)->count();

        // Stock bajo (umbral simple)
        $lowStockThreshold = 3;
        $lowStockProducts = Product::where('stock', '<=', $lowStockThreshold)
            ->orderBy('stock')
            ->limit(12)
            ->get();

        // Reparaciones (si existe el modelo + tabla)
        $repairsEnabled = class_exists(\App\Models\Repair::class) && Schema::hasTable('repairs');

        $repairsTotal = 0;
        $repairsActive = 0;
        $repairStatusCounts = [];

        if ($repairsEnabled) {
            $repairModel = \App\Models\Repair::class;

            $repairsTotal = $repairModel::count();

            $repairStatusCounts = $repairModel::select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();

            // Activas = todo menos "entregado/cancelado" (si existen)
            $repairsActive = $repairModel::whereNotIn('status', ['entregado', 'cancelado'])->count();
        }

        return view('admin.dashboard', [
            'ordersTotal' => $ordersTotal,
            'ordersPending' => $ordersPending,
            'orderStatusCounts' => $orderStatusCounts,

            'repairsEnabled' => $repairsEnabled,
            'repairsTotal' => $repairsTotal,
            'repairsActive' => $repairsActive,
            'repairStatusCounts' => $repairStatusCounts,

            'lowStockThreshold' => $lowStockThreshold,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}

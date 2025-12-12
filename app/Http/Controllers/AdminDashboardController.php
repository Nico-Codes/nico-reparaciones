<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Repair;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Pedidos por estado
        $orderCounts = Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // Reparaciones por estado (si existe el modelo)
        $repairCounts = [];
        if (class_exists(Repair::class)) {
            $repairCounts = Repair::query()
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
                ->toArray();
        }

        $stats = [
            'orders_total'   => Order::count(),
            'orders_pending' => Order::where('status', 'pendiente')->count(),
            'repairs_total'  => class_exists(Repair::class) ? Repair::count() : 0,
            'products_total' => class_exists(Product::class) ? Product::count() : 0,
        ];

        return view('admin.dashboard', compact('stats', 'orderCounts', 'repairCounts'));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Order;

class AdminOrderPrintController extends Controller
{
    public function __invoke(Order $order)
    {
        $order->load(['user', 'items.product']);

        $settings = BusinessSetting::all()->pluck('value', 'key');

        return view('admin.orders.print', compact('order', 'settings'));
    }
}

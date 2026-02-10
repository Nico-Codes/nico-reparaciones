<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Order;

class AdminOrderTicketController extends Controller
{
    public function __invoke(Order $order)
    {
        $order->load(['user', 'items.product']);

        $settings = BusinessSetting::allValues();

        return view('admin.orders.ticket', compact('order', 'settings'));
    }
}

<?php

namespace App\Observers;

use App\Models\Order;
use App\Support\AdminCountersCache;

class OrderObserver
{
    public function created(Order $order): void
    {
        AdminCountersCache::bumpOrders();
    }

    public function updated(Order $order): void
    {
        AdminCountersCache::bumpOrders();
    }

    public function deleted(Order $order): void
    {
        AdminCountersCache::bumpOrders();
    }
}

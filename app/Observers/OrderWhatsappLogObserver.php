<?php

namespace App\Observers;

use App\Models\OrderWhatsappLog;
use App\Support\AdminCountersCache;

class OrderWhatsappLogObserver
{
    public function created(OrderWhatsappLog $log): void
    {
        AdminCountersCache::bumpOrders();
    }

    public function updated(OrderWhatsappLog $log): void
    {
        AdminCountersCache::bumpOrders();
    }

    public function deleted(OrderWhatsappLog $log): void
    {
        AdminCountersCache::bumpOrders();
    }
}

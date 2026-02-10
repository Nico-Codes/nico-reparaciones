<?php

namespace App\Observers;

use App\Models\RepairWhatsappLog;
use App\Support\AdminCountersCache;

class RepairWhatsappLogObserver
{
    public function created(RepairWhatsappLog $log): void
    {
        AdminCountersCache::bumpRepairs();
    }

    public function updated(RepairWhatsappLog $log): void
    {
        AdminCountersCache::bumpRepairs();
    }

    public function deleted(RepairWhatsappLog $log): void
    {
        AdminCountersCache::bumpRepairs();
    }
}

<?php

namespace App\Observers;

use App\Models\Repair;
use App\Support\AdminCountersCache;

class RepairObserver
{
    public function created(Repair $repair): void
    {
        AdminCountersCache::bumpRepairs();
    }

    public function updated(Repair $repair): void
    {
        AdminCountersCache::bumpRepairs();
    }

    public function deleted(Repair $repair): void
    {
        AdminCountersCache::bumpRepairs();
    }
}

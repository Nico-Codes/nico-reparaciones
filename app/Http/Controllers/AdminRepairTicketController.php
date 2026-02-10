<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Repair;

class AdminRepairTicketController extends Controller
{
    public function __invoke(Repair $repair)
    {
        $settings = BusinessSetting::allValues();

        return view('admin.repairs.ticket', compact('repair', 'settings'));
    }
}

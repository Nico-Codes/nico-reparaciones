<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Repair;

class AdminRepairTicketController extends Controller
{
    public function __invoke(Repair $repair)
    {
        $settings = BusinessSetting::all()->pluck('value', 'key');

        return view('admin.repairs.ticket', compact('repair', 'settings'));
    }
}

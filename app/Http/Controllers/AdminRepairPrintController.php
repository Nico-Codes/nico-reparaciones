<?php

namespace App\Http\Controllers;

use App\Models\Repair;

class AdminRepairPrintController extends Controller
{
    public function __invoke(Repair $repair)
    {
        return view('admin.repairs.print', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
        ]);
    }
}

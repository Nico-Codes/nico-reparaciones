<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use Illuminate\Http\Request;

class UserRepairController extends Controller
{
    public function index()
    {
        $repairs = Repair::where('user_id', auth()->id())
            ->latest()
            ->paginate(20);

        return view('repairs.index', [
            'repairs' => $repairs,
            'statuses' => Repair::STATUSES,
        ]);
    }

    public function show(Repair $repair)
    {
        // Seguridad: un usuario solo puede ver sus reparaciones
        if ((int) $repair->user_id !== (int) auth()->id()) {
            abort(404);
        }

        return view('repairs.show', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
        ]);
    }
}

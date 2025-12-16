<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use Illuminate\Http\Request;

class RepairLookupController extends Controller
{
    public function form()
    {
        return view('repairs.lookup');
    }

    public function lookup(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:50',
            'phone' => 'required|string|max:30',
        ]);

        $code = trim($data['code']);
        $phone = preg_replace('/\D+/', '', (string) $data['phone']);

        $repair = Repair::where('code', $code)
            ->where('customer_phone', $phone)
            ->first();

        if (!$repair) {
            return back()
                ->withErrors([
                    'code' => 'No encontramos una reparación con ese código y teléfono. Verificá los datos e intentá de nuevo.',
                ])
                ->withInput();
        }

        return view('repairs.lookup_result', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
        ]);
    }
}

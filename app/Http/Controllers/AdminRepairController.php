<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\RepairStatusHistory;
use Illuminate\Http\Request;

class AdminRepairController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->get('status');
        $q = trim((string) $request->get('q', ''));

        $query = Repair::query()->latest();

        if ($status) {
            $query->where('status', $status);
        }

        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q);

            $query->where(function ($sub) use ($q, $qDigits) {
                $sub->where('code', 'like', '%' . $q . '%')
                    ->orWhere('customer_name', 'like', '%' . $q . '%');

                if ($qDigits !== '') {
                    $sub->orWhere('customer_phone', 'like', '%' . $qDigits . '%');
                }
            });
        }

        $repairs = $query->paginate(20)->withQueryString();

        return view('admin.repairs.index', [
            'repairs' => $repairs,
            'statuses' => Repair::STATUSES,
            'status' => $status,
            'q' => $q,
        ]);
    }

    public function create()
    {
        return view('admin.repairs.create', [
            'statuses' => Repair::STATUSES,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:30',

            'device_brand' => 'nullable|string|max:255',
            'device_model' => 'nullable|string|max:255',

            'issue_reported' => 'required|string',
            'diagnosis' => 'nullable|string',

            'parts_cost' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
            'final_price' => 'nullable|numeric|min:0',

            'status' => 'required|string|in:' . implode(',', array_keys(Repair::STATUSES)),
            'warranty_days' => 'nullable|integer|min:0',

            'notes' => 'nullable|string',
        ]);

        $data['parts_cost'] = $data['parts_cost'] ?? 0;
        $data['labor_cost'] = $data['labor_cost'] ?? 0;
        $data['warranty_days'] = $data['warranty_days'] ?? 0;
        $data['received_at'] = now();

        if (($data['status'] ?? null) === 'delivered') {
            $data['delivered_at'] = now();
        }

        $repair = Repair::create($data);

        // Generar código: R-YYYYMMDD-00001
        $repair->code = 'R-' . now()->format('Ymd') . '-' . str_pad((string) $repair->id, 5, '0', STR_PAD_LEFT);
        $repair->save();

        RepairStatusHistory::create([
            'repair_id' => $repair->id,
            'from_status' => null,
            'to_status' => $repair->status,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
            'comment' => 'Creación de reparación',
        ]);

        return redirect()
            ->route('admin.repairs.show', $repair)
            ->with('success', 'Reparación creada.');
    }

    public function show(Repair $repair)
    {
        return view('admin.repairs.show', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
            'history' => $repair->statusHistory()->get(),
        ]);
    }

    public function updateStatus(Request $request, Repair $repair)
    {
        $request->validate([
            'status' => 'required|string|in:' . implode(',', array_keys(Repair::STATUSES)),
            'comment' => 'nullable|string|max:500',
        ]);

        $from = $repair->status;
        $to = $request->input('status');

        if ($from !== $to) {
            $repair->status = $to;

            if ($to === 'delivered' && !$repair->delivered_at) {
                $repair->delivered_at = now();
            }

            $repair->save();

            RepairStatusHistory::create([
                'repair_id' => $repair->id,
                'from_status' => $from,
                'to_status' => $to,
                'changed_by' => auth()->id(),
                'changed_at' => now(),
                'comment' => $request->input('comment'),
            ]);
        }

        return back()->with('success', 'Estado actualizado.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\RepairStatusHistory;
use App\Models\User;
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
            // NUEVO: opcional para vincular a un usuario existente
            'user_email' => 'nullable|email',

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

        // Resolver user_id si mandaron email
        $userId = null;
        if (!empty($data['user_email'])) {
            $user = User::where('email', $data['user_email'])->first();
            if (!$user) {
                return back()
                    ->withErrors(['user_email' => 'No existe un usuario con ese email.'])
                    ->withInput();
            }
            $userId = $user->id;
        }

        $data['parts_cost'] = $data['parts_cost'] ?? 0;
        $data['labor_cost'] = $data['labor_cost'] ?? 0;
        $data['warranty_days'] = $data['warranty_days'] ?? 0;
        $data['received_at'] = now();

        if (($data['status'] ?? null) === 'delivered') {
            $data['delivered_at'] = now();
        }

        $repair = Repair::create([
            'user_id' => $userId,

            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],

            'device_brand' => $data['device_brand'] ?? null,
            'device_model' => $data['device_model'] ?? null,

            'issue_reported' => $data['issue_reported'],
            'diagnosis' => $data['diagnosis'] ?? null,

            'parts_cost' => $data['parts_cost'],
            'labor_cost' => $data['labor_cost'],
            'final_price' => $data['final_price'] ?? null,

            'status' => $data['status'],
            'warranty_days' => $data['warranty_days'],

            'received_at' => $data['received_at'],
            'delivered_at' => $data['delivered_at'] ?? null,

            'notes' => $data['notes'] ?? null,
        ]);

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

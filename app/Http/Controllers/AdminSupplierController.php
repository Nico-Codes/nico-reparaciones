<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\Supplier;
use App\Models\WarrantyIncident;
use Illuminate\Http\Request;

class AdminSupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::query()
            ->withCount([
                'products',
                'warrantyIncidents',
                'warrantyIncidents as open_warranty_incidents_count' => fn ($q) => $q->where('status', 'open'),
            ])
            ->withSum('warrantyIncidents as warranty_loss_total', 'loss_amount')
            ->get()
            ->keyBy('id');

        $eligibleBySupplier = [];
        $successBySupplier = [];
        $failedBySupplier = [];

        $candidateRepairs = Repair::query()
            ->select(['id', 'supplier_id', 'delivered_at', 'warranty_days'])
            ->whereNotNull('supplier_id')
            ->whereNotNull('delivered_at')
            ->where('warranty_days', '>', 0)
            ->get();

        $candidateRepairIds = $candidateRepairs->pluck('id')->all();
        $incidentsByRepair = WarrantyIncident::query()
            ->select(['repair_id', 'happened_at'])
            ->whereNotNull('repair_id')
            ->whereIn('repair_id', $candidateRepairIds)
            ->get()
            ->groupBy('repair_id');

        foreach ($candidateRepairs as $repair) {
            $supplierId = (int) ($repair->supplier_id ?? 0);
            if ($supplierId <= 0) {
                continue;
            }

            $expiresAt = $repair->delivered_at?->copy()->addDays((int) $repair->warranty_days)->endOfDay();
            if (!$expiresAt || !$expiresAt->isPast()) {
                continue;
            }

            $eligibleBySupplier[$supplierId] = ($eligibleBySupplier[$supplierId] ?? 0) + 1;

            $hadIncidentInWindow = false;
            foreach (($incidentsByRepair[$repair->id] ?? collect()) as $incident) {
                $happenedAt = $incident->happened_at ?? null;
                if (!$happenedAt) {
                    continue;
                }

                if ($happenedAt->between($repair->delivered_at, $expiresAt, true)) {
                    $hadIncidentInWindow = true;
                    break;
                }
            }

            if ($hadIncidentInWindow) {
                $failedBySupplier[$supplierId] = ($failedBySupplier[$supplierId] ?? 0) + 1;
            } else {
                $successBySupplier[$supplierId] = ($successBySupplier[$supplierId] ?? 0) + 1;
            }
        }

        $suppliers = $suppliers
            ->map(function (Supplier $supplier) use ($eligibleBySupplier, $successBySupplier, $failedBySupplier): Supplier {
                $supplierId = (int) $supplier->id;
                $eligible = (int) ($eligibleBySupplier[$supplierId] ?? 0);
                $success = (int) ($successBySupplier[$supplierId] ?? 0);
                $failed = (int) ($failedBySupplier[$supplierId] ?? 0);
                $lossTotal = max(0, (int) ($supplier->warranty_loss_total ?? 0));
                $openIncidents = (int) ($supplier->open_warranty_incidents_count ?? 0);

                $successRate = $eligible > 0
                    ? (int) round(($success / max(1, $eligible)) * 100)
                    : null;

                $baseScore = $successRate ?? 80;
                $openPenalty = min(12, $openIncidents * 3);
                $lossPenalty = min(18, (int) round($lossTotal / 100000));
                $score = max(0, min(100, $baseScore - $openPenalty - $lossPenalty));

                if ($score >= 90) {
                    $tier = 'Excelente';
                } elseif ($score >= 75) {
                    $tier = 'Confiable';
                } elseif ($score >= 60) {
                    $tier = 'En seguimiento';
                } else {
                    $tier = 'Riesgo alto';
                }

                $supplier->warranty_eligible_count = $eligible;
                $supplier->warranty_success_count = $success;
                $supplier->warranty_failed_count = $failed;
                $supplier->warranty_success_rate = $successRate;
                $supplier->score = (int) $score;
                $supplier->score_tier = $tier;
                $supplier->warranty_loss_total = $lossTotal;

                return $supplier;
            })
            ->sortBy([
                ['active', 'desc'],
                ['score', 'desc'],
                ['name', 'asc'],
            ])
            ->values();

        return view('admin.suppliers.index', [
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:suppliers,name'],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:1500'],
        ]);

        Supplier::query()->create($data + ['active' => true]);

        return back()->with('success', 'Proveedor creado.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:suppliers,name,' . $supplier->id],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:1500'],
        ]);

        $supplier->update($data);

        return back()->with('success', 'Proveedor actualizado.');
    }

    public function toggle(Supplier $supplier)
    {
        $supplier->update(['active' => !$supplier->active]);
        return back()->with('success', $supplier->active ? 'Proveedor activado.' : 'Proveedor desactivado.');
    }
}

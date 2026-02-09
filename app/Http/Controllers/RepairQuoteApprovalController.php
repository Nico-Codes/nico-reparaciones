<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\RepairStatusHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class RepairQuoteApprovalController extends Controller
{
    public function show(Request $request, Repair $repair)
    {
        $canDecide = (string) ($repair->status ?? '') === 'waiting_approval';
        $expiresAt = $this->resolveSignedExpiry($request);

        $approveUrl = URL::temporarySignedRoute('repairs.quote.approve', $expiresAt, ['repair' => $repair->id]);
        $rejectUrl = URL::temporarySignedRoute('repairs.quote.reject', $expiresAt, ['repair' => $repair->id]);

        return view('repairs.quote_approval', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
            'canDecide' => $canDecide,
            'approveUrl' => $approveUrl,
            'rejectUrl' => $rejectUrl,
        ]);
    }

    public function approve(Request $request, Repair $repair): RedirectResponse
    {
        return $this->applyDecision(
            $request,
            $repair,
            'repairing',
            'Cliente aprobó el presupuesto desde enlace público.',
            'Presupuesto aprobado. Empezamos con la reparación.'
        );
    }

    public function reject(Request $request, Repair $repair): RedirectResponse
    {
        return $this->applyDecision(
            $request,
            $repair,
            'cancelled',
            'Cliente rechazó el presupuesto desde enlace público.',
            'Presupuesto rechazado. La reparación quedó cancelada.'
        );
    }

    private function applyDecision(Request $request, Repair $repair, string $toStatus, string $comment, string $successMessage): RedirectResponse
    {
        $result = DB::transaction(function () use ($repair, $toStatus, $comment) {
            $lockedRepair = Repair::query()
                ->whereKey($repair->id)
                ->lockForUpdate()
                ->firstOrFail();

            $fromStatus = (string) ($lockedRepair->status ?? '');

            if ($fromStatus !== 'waiting_approval') {
                return ['changed' => false, 'status' => $fromStatus];
            }

            if (!Repair::canTransition($fromStatus, $toStatus)) {
                return ['changed' => false, 'status' => $fromStatus];
            }

            $lockedRepair->status = $toStatus;
            $lockedRepair->save();

            RepairStatusHistory::create([
                'repair_id' => $lockedRepair->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'changed_by' => null,
                'changed_at' => now(),
                'comment' => $comment,
            ]);

            return ['changed' => true, 'status' => $toStatus];
        });

        $showUrl = URL::temporarySignedRoute(
            'repairs.quote.show',
            $this->resolveSignedExpiry($request),
            ['repair' => $repair->id]
        );

        if (($result['changed'] ?? false) === true) {
            return redirect($showUrl)->with('success', $successMessage);
        }

        return redirect($showUrl)->with('success', 'Esta reparación ya no está esperando aprobación.');
    }

    private function resolveSignedExpiry(Request $request): Carbon
    {
        $expires = (int) $request->query('expires', 0);
        if ($expires > now()->timestamp) {
            return Carbon::createFromTimestamp($expires);
        }

        return now()->addDays(7);
    }
}

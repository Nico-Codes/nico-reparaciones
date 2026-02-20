<?php

namespace App\Http\Controllers;

use App\Support\AdminAlertCenter;
use Illuminate\Http\Request;

class AdminAlertCenterController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $summary = (new AdminAlertCenter($user))->summary();

        return view('admin.alerts.index', [
            'alerts' => $summary['alerts'],
            'totalAlerts' => $summary['total_count'],
            'unseenAlerts' => $summary['unseen_count'],
        ]);
    }

    public function markSeen(Request $request, string $alertKey)
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        $ok = (new AdminAlertCenter($user))->markSeen($alertKey);
        if (!$ok) {
            return back()->withErrors(['alerts' => 'La alerta seleccionada ya no esta activa.']);
        }

        return back()->with('success', 'Alerta marcada como vista.');
    }

    public function markAllSeen(Request $request)
    {
        $user = $request->user();
        abort_unless($user !== null, 403);

        (new AdminAlertCenter($user))->markAllSeen();

        return back()->with('success', 'Alertas activas marcadas como vistas.');
    }
}


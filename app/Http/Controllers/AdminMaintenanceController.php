<?php

namespace App\Http\Controllers;

use App\Support\AdminSchemaHealth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;

class AdminMaintenanceController extends Controller
{
    public function migrate(): RedirectResponse
    {
        $allowed = app()->environment(['local', 'development'])
            || filter_var((string) env('APP_ALLOW_WEB_MIGRATE', 'false'), FILTER_VALIDATE_BOOL);

        if (! $allowed) {
            return back()->withErrors([
                'admin_maintenance' => 'La ejecucion web de migraciones esta deshabilitada en este entorno.',
            ]);
        }

        try {
            $before = AdminSchemaHealth::evaluate(true);

            Artisan::call('migrate', ['--force' => true]);
            $output = trim((string) Artisan::output());
            $after = AdminSchemaHealth::evaluate(true);

            $beforeIssues = collect($before['issues'] ?? [])->values();
            $afterIssues = collect($after['issues'] ?? [])->values();
            $resolved = $beforeIssues->diff($afterIssues)->values()->all();
            $remaining = $afterIssues->all();

            return back()
                ->with('success', $output !== ''
                    ? 'Migraciones ejecutadas correctamente.'
                    : 'Migraciones ejecutadas.'
                )
                ->with('admin_maintenance_resolved', $resolved)
                ->with('admin_maintenance_remaining', $remaining);
        } catch (\Throwable $e) {
            return back()->withErrors([
                'admin_maintenance' => 'Error al ejecutar migraciones: '.$e->getMessage(),
            ]);
        }
    }
}

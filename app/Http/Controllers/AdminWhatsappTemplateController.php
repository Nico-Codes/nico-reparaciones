<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\RepairWhatsappTemplate;
use Illuminate\Http\Request;

class AdminWhatsappTemplateController extends Controller
{
    public function index()
    {
        $dbTemplates = RepairWhatsappTemplate::all()->keyBy('status');

        $templates = [];
        foreach (Repair::STATUSES as $statusKey => $label) {
            $tpl = $dbTemplates[$statusKey]->template ?? $this->defaultTemplate($statusKey);
            $templates[$statusKey] = $tpl;
        }

        return view('admin.whatsapp_templates.index', [
            'statuses' => Repair::STATUSES,
            'templates' => $templates,
            'placeholders' => $this->placeholdersHelp(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'templates' => 'required|array',
        ]);

        $templates = $data['templates'] ?? [];

        foreach (Repair::STATUSES as $statusKey => $label) {
            $tpl = (string)($templates[$statusKey] ?? '');

            // Si está vacío, usamos default (y lo guardamos como default)
            if (trim($tpl) === '') {
                $tpl = $this->defaultTemplate($statusKey);
            }

            RepairWhatsappTemplate::updateOrCreate(
                ['status' => $statusKey],
                [
                    'template' => $tpl,
                    'updated_by' => auth()->id(),
                ]
            );
        }

        return back()->with('success', 'Plantillas WhatsApp guardadas ✅');
    }

    private function placeholdersHelp(): array
    {
        return [
            '{customer_name}' => 'Nombre del cliente',
            '{code}' => 'Código de reparación',
            '{status}' => 'Clave del estado (ej: ready_pickup)',
            '{status_label}' => 'Nombre lindo del estado (ej: Listo para retirar)',
            '{lookup_url}' => 'Link a la página /reparacion',
            '{phone}' => 'Teléfono del cliente',
            '{device_brand}' => 'Marca del equipo',
            '{device_model}' => 'Modelo del equipo',
            '{device}' => 'Marca + Modelo',
            '{final_price}' => 'Precio final (si existe)',
            '{warranty_days}' => 'Garantía en días',
        ];
    }

    private function defaultTemplate(string $status): string
    {
        // Defaults por estado (podés editarlos desde el panel)
        $base = "Hola {customer_name} 👋\n";
        $base .= "Tu reparación ({code}) está en estado: *{status_label}*.\n";

        if ($status === 'waiting_approval') {
            $base .= "Necesitamos tu aprobación para continuar.\n";
        } elseif ($status === 'ready_pickup') {
            $base .= "¡Ya está lista para retirar! ✅\n";
        } elseif ($status === 'delivered') {
            $base .= "¡Gracias por tu visita! 🙌\n";
        }

        $base .= "\nPodés consultar el estado en: {lookup_url}\n";
        $base .= "Código: {code}\n";
        $base .= "Equipo: {device}\n";
        $base .= "NicoReparaciones";

        return $base;
    }
}

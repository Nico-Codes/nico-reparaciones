<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\OrderWhatsappTemplate;
use Illuminate\Http\Request;

class AdminOrderWhatsappTemplateController extends Controller
{
    public function index()
    {
        $dbTemplates = OrderWhatsappTemplate::all()->keyBy('status');

        $templates = [];
        foreach (Order::STATUSES as $statusKey => $label) {
            $tpl = $dbTemplates[$statusKey]->template ?? $this->defaultTemplate($statusKey);
            $templates[$statusKey] = $tpl;
        }

        return view('admin.order_whatsapp_templates.index', [
            'statuses' => Order::STATUSES,
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

        foreach (Order::STATUSES as $statusKey => $label) {
            $tpl = (string)($templates[$statusKey] ?? '');

            if (trim($tpl) === '') {
                $tpl = $this->defaultTemplate($statusKey);
            }

            OrderWhatsappTemplate::updateOrCreate(
                ['status' => $statusKey],
                [
                    'template' => $tpl,
                    'updated_by' => auth()->id(),
                ]
            );
        }

        return back()->with('success', 'Plantillas WhatsApp (Pedidos) guardadas ✅');
    }

    private function placeholdersHelp(): array
    {
        return [
            '{customer_name}'   => 'Nombre del cliente',
            '{order_id}'        => 'ID del pedido',
            '{status}'          => 'Clave del estado (ej: preparando)',
            '{status_label}'    => 'Nombre lindo del estado (ej: Preparando)',
            '{total}'           => 'Total del pedido formateado',
            '{items_count}'     => 'Cantidad de ítems',
            '{items_summary}'   => 'Listado simple de ítems (líneas)',
            '{pickup_name}'     => 'Nombre de retiro',
            '{pickup_phone}'    => 'Teléfono de retiro',
            '{phone}'           => 'Teléfono (alias de pickup_phone)',
            '{notes}'           => 'Notas del cliente',
            '{my_orders_url}'   => 'Link a /mis-pedidos',
            '{store_url}'       => 'Link a /tienda',

            // settings
            '{shop_address}'    => 'Dirección del local (Admin > Configuración)',
            '{shop_hours}'      => 'Horarios (Admin > Configuración)',
        ];
    }

    private function defaultTemplate(string $status): string
    {
        $base = "Hola {customer_name} 👋\n";
        $base .= "Tu pedido *#{order_id}* está en estado: *{status_label}*.\n";
        $base .= "Total: {total}\n";
        $base .= "Ítems: {items_count}\n\n";
        $base .= "{items_summary}\n";

        if ($status === 'listo_retirar') {
            $base .= "\n📍 Dirección: {shop_address}\n";
            $base .= "🕒 Horarios: {shop_hours}\n";
            $base .= "Podés pasar a retirarlo cuando quieras dentro del horario. ✅\n";
        }

        if ($status === 'entregado') {
            $base .= "\n¡Gracias por tu compra! 🙌\n";
        }

        if ($status === 'cancelado') {
            $base .= "\nSi querés, lo revisamos por WhatsApp.\n";
        }

        $base .= "\nVer tus pedidos: {my_orders_url}\n";
        $base .= "Tienda: {store_url}\n";
        $base .= "NicoReparaciones";

        // Si no hay configuración, no rompe; queda vacío.
        $shopAddress = BusinessSetting::getValue('shop_address', '');
        $shopHours = BusinessSetting::getValue('shop_hours', '');
        $base = strtr($base, [
            '{shop_address}' => $shopAddress,
            '{shop_hours}'   => $shopHours,
        ]);

        return $base;
    }
}

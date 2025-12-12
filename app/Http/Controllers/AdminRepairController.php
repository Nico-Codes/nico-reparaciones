<?php

namespace App\Http\Controllers;

use App\Models\Repair;
use App\Models\RepairStatusHistory;
use App\Models\RepairWhatsappLog;
use App\Models\RepairWhatsappTemplate;
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
        $linkedUserEmail = null;

        if ($repair->user_id) {
            $linkedUserEmail = User::where('id', $repair->user_id)->value('email');
        }

        // WhatsApp (estado actual)
        $waPhone = $this->normalizeWhatsappPhone($repair->customer_phone);
        $waMessage = $this->buildWhatsappMessage($repair);
        $waUrl = $waPhone ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage)) : null;

        $waLogs = $repair->whatsappLogs()->with('sentBy')->get();

        return view('admin.repairs.show', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
            'history' => $repair->statusHistory()->get(),
            'linkedUserEmail' => $linkedUserEmail,

            'waPhone' => $waPhone,
            'waMessage' => $waMessage,
            'waUrl' => $waUrl,
            'waLogs' => $waLogs,
        ]);
    }

    public function update(Request $request, Repair $repair)
    {
        $data = $request->validate([
            'user_email' => 'nullable|email',
            'unlink_user' => 'nullable|boolean',

            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:30',

            'device_brand' => 'nullable|string|max:255',
            'device_model' => 'nullable|string|max:255',

            'issue_reported' => 'required|string',
            'diagnosis' => 'nullable|string',

            'parts_cost' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
            'final_price' => 'nullable|numeric|min:0',

            'warranty_days' => 'nullable|integer|min:0',

            'notes' => 'nullable|string',
        ]);

        $unlink = $request->boolean('unlink_user');

        $userId = $repair->user_id;

        if ($unlink) {
            $userId = null;
        } elseif (!empty($data['user_email'])) {
            $user = User::where('email', $data['user_email'])->first();

            if (!$user) {
                return back()
                    ->withErrors(['user_email' => 'No existe un usuario con ese email.'])
                    ->withInput();
            }

            $userId = $user->id;
        }

        $parts = $data['parts_cost'] ?? 0;
        $labor = $data['labor_cost'] ?? 0;
        $warranty = $data['warranty_days'] ?? 0;

        $repair->update([
            'user_id' => $userId,

            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],

            'device_brand' => $data['device_brand'] ?? null,
            'device_model' => $data['device_model'] ?? null,

            'issue_reported' => $data['issue_reported'],
            'diagnosis' => $data['diagnosis'] ?? null,

            'parts_cost' => $parts,
            'labor_cost' => $labor,
            'final_price' => $data['final_price'] ?? null,

            'warranty_days' => $warranty,

            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Datos de la reparación actualizados.');
    }

    public function updateStatus(Request $request, Repair $repair)
    {
        $request->validate([
            'status' => 'required|string|in:' . implode(',', array_keys(Repair::STATUSES)),
            'comment' => 'nullable|string|max:500',
        ]);

        $from = $repair->status;
        $to = $request->input('status');

        if ($from === $to) {
            return back()->with('success', 'El estado ya era ese.');
        }

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

        // Flash para “enviar WhatsApp ahora”
        $waPhone = $this->normalizeWhatsappPhone($repair->customer_phone);
        $waMessage = $this->buildWhatsappMessage($repair);
        $waUrl = $waPhone ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage)) : null;

        return redirect()
            ->route('admin.repairs.show', $repair)
            ->with('success', 'Estado actualizado.')
            ->with('wa_after', [
                'phone' => $waPhone,
                'message' => $waMessage,
                'url' => $waUrl,
            ]);
    }

    public function print(Repair $repair)
    {
        $linkedUserEmail = null;

        if ($repair->user_id) {
            $linkedUserEmail = User::where('id', $repair->user_id)->value('email');
        }

        return view('admin.repairs.print', [
            'repair' => $repair,
            'statuses' => Repair::STATUSES,
            'linkedUserEmail' => $linkedUserEmail,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Logs
    |--------------------------------------------------------------------------
    */

    public function logWhatsapp(Repair $repair)
    {
        $waPhone = $this->normalizeWhatsappPhone($repair->customer_phone);
        $waMessage = $this->buildWhatsappMessage($repair);

        if (!$waPhone) {
            return back()->withErrors(['customer_phone' => 'No se pudo armar el WhatsApp: revisá el teléfono del cliente.']);
        }

        $created = $this->createWhatsappLogIfNotDuplicate($repair, $waPhone, $waMessage);

        return back()->with('success', $created
            ? 'Envío de WhatsApp registrado en el historial.'
            : 'Ya estaba registrado un envío reciente para este mismo estado.'
        );
    }

    public function logWhatsappAjax(Request $request, Repair $repair)
    {
        $waPhone = $this->normalizeWhatsappPhone($repair->customer_phone);
        $waMessage = $this->buildWhatsappMessage($repair);

        if (!$waPhone) {
            return response()->json(['ok' => false, 'error' => 'invalid_phone'], 422);
        }

        $created = $this->createWhatsappLogIfNotDuplicate($repair, $waPhone, $waMessage);

        return response()->json([
            'ok' => true,
            'created' => $created,
        ]);
    }

    private function createWhatsappLogIfNotDuplicate(Repair $repair, string $waPhone, string $waMessage): bool
    {
        $last = RepairWhatsappLog::where('repair_id', $repair->id)
            ->where('notified_status', $repair->status)
            ->orderByDesc('sent_at')
            ->first();

        if ($last && $last->sent_at && $last->sent_at->diffInMinutes(now()) < 10) {
            return false;
        }

        RepairWhatsappLog::create([
            'repair_id' => $repair->id,
            'notified_status' => $repair->status,
            'phone' => $waPhone,
            'message' => $waMessage,
            'sent_by' => auth()->id(),
            'sent_at' => now(),
        ]);

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers WhatsApp
    |--------------------------------------------------------------------------
    */

    private function normalizeWhatsappPhone(string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', $raw);
        if (!$digits) return null;

        if (str_starts_with($digits, '54')) {
            return $digits;
        }

        if (str_starts_with($digits, '0')) {
            $digits = ltrim($digits, '0');
        }

        if (strlen($digits) >= 10 && strlen($digits) <= 12) {
            return '54' . $digits;
        }

        return $digits;
    }

    private function buildWhatsappMessage(Repair $repair): string
    {
        $statusLabel = Repair::STATUSES[$repair->status] ?? $repair->status;

        // ✅ Si hay plantilla en DB para ese status, la usamos; sino default
        $tpl = RepairWhatsappTemplate::where('status', $repair->status)->value('template');
        if (!$tpl || trim($tpl) === '') {
            $tpl = $this->defaultTemplate($repair->status);
        }

        $device = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
        $finalPrice = $repair->final_price !== null ? number_format((float)$repair->final_price, 0, ',', '.') : '';

        $replacements = [
            '{customer_name}' => (string) $repair->customer_name,
            '{code}' => (string) $repair->code,
            '{status}' => (string) $repair->status,
            '{status_label}' => (string) $statusLabel,
            '{lookup_url}' => url('/reparacion'),
            '{phone}' => (string) $repair->customer_phone,
            '{device_brand}' => (string) ($repair->device_brand ?? ''),
            '{device_model}' => (string) ($repair->device_model ?? ''),
            '{device}' => (string) $device,
            '{final_price}' => (string) $finalPrice,
            '{warranty_days}' => (string) ((int)($repair->warranty_days ?? 0)),
        ];

        return strtr($tpl, $replacements);
    }

    private function defaultTemplate(string $status): string
    {
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

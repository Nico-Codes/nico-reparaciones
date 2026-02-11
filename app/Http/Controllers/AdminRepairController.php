<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Repair;
use App\Models\RepairStatusHistory;
use App\Models\RepairWhatsappLog;
use App\Models\RepairWhatsappTemplate;
use App\Models\User;
use App\Models\DeviceType;
use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceIssueType;
use App\Support\AdminCountersCache;
use App\Support\AuditLogger;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;



class AdminRepairController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->get('status');
        $wa = $request->get('wa'); // pending | sent | null
        $q = trim((string) $request->get('q', ''));

        // ✅ Counts por estado (respeta q + wa, ignora filtro status)
        $countQuery = Repair::query();

        // Filtro WA (mismo criterio que el listado)
        if ($wa === 'no_phone') {
            $countQuery->where(function ($q) {
                $q->whereNull('customer_phone')->orWhere('customer_phone', '');
            });
        } elseif ($wa === 'pending') {
            $countQuery->where(function ($q) {
                $q->whereNotNull('customer_phone')->where('customer_phone', '!=', '');
            })->whereDoesntHave('whatsappLogs', function ($q) {
                $q->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
            });
        } elseif ($wa === 'sent') {
            $countQuery->where(function ($q) {
                $q->whereNotNull('customer_phone')->where('customer_phone', '!=', '');
            })->whereHas('whatsappLogs', function ($q) {
                $q->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
            });
        }

        // Búsqueda
        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q);
            $countQuery->where(function ($sub) use ($q, $qDigits) {
                $sub->where('code', 'like', '%' . $q . '%')
                    ->orWhere('customer_name', 'like', '%' . $q . '%');

                if ($qDigits !== '') {
                    $sub->orWhere('customer_phone', 'like', '%' . $qDigits . '%');
                }
            });
        }

        $statusCounts = AdminCountersCache::rememberRepairs(
            'status_counts',
            ['q' => $q, 'wa' => (string) $wa],
            function () use ($countQuery): array {
                return (clone $countQuery)
                    ->selectRaw('status, COUNT(*) as c')
                    ->groupBy('status')
                    ->pluck('c', 'status')
                    ->toArray();
            }
        );

        $totalCount = (int) array_sum($statusCounts);


        $query = Repair::query()
            ->select([
                'repairs.id',
                'repairs.code',
                'repairs.customer_name',
                'repairs.customer_phone',
                'repairs.device_brand',
                'repairs.device_model',
                'repairs.status',
                'repairs.final_price',
                'repairs.warranty_days',
                'repairs.received_at',
                'repairs.created_at',
            ])
            ->addSelect([
                'wa_notified_current' => RepairWhatsappLog::selectRaw('1')
                    ->whereColumn('repair_id', 'repairs.id')
                    ->whereColumn('notified_status', 'repairs.status')
                    ->limit(1),
            ])
            ->addSelect([
                'wa_notified_at' => RepairWhatsappLog::select('sent_at')
                    ->whereColumn('repair_id', 'repairs.id')
                    ->whereColumn('notified_status', 'repairs.status')
                    ->orderByDesc('sent_at')
                    ->limit(1),
            ]);


        if ($status) {
            $query->where('status', $status);
        }

        
        // Filtro WA
        if ($wa === 'no_phone') {
            $query->where(function ($q) {
                $q->whereNull('customer_phone')
                ->orWhere('customer_phone', '');
            });
        } elseif ($wa === 'pending') {
            $query->where(function ($q) {
                $q->whereNotNull('customer_phone')
                ->where('customer_phone', '!=', '');
            })->whereDoesntHave('whatsappLogs', function ($q) {
                $q->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
            });
        } elseif ($wa === 'sent') {
            $query->where(function ($q) {
                $q->whereNotNull('customer_phone')
                ->where('customer_phone', '!=', '');
            })->whereHas('whatsappLogs', function ($q) {
                $q->whereColumn('repair_whatsapp_logs.notified_status', 'repairs.status');
            });
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

        // ✅ Si estás filtrando por estado y NO es final, mostramos primero las más viejas
        if ($status && !in_array((string)$status, ['delivered', 'cancelled'], true)) {
            $query->orderBy('received_at', 'asc')->orderBy('created_at', 'asc');
        } else {
            $query->latest();
        }


        $repairs = $query->paginate(20)->withQueryString();

        // Generar WA URL + log_url para el botón rápido del listado
        $settings = BusinessSetting::allValues();
        $shopAddress = (string) ($settings->get('shop_address') ?? '');
        $shopHours = (string) ($settings->get('shop_hours') ?? '');

        $statusesInPage = $repairs->getCollection()->pluck('status')->unique()->values();
        $templates = RepairWhatsappTemplate::whereIn('status', $statusesInPage)->pluck('template', 'status');

        $repairs->setCollection(
            $repairs->getCollection()->map(function ($r) use ($templates, $shopAddress, $shopHours) {
                $r->wa_log_url = route('admin.repairs.whatsappLogAjax', $r);

                $waPhone = $this->normalizeWhatsappPhone((string) $r->customer_phone);
                $approvalUrl = $this->buildApprovalUrl($r);
                if (!$waPhone) {
                    $r->wa_url = null;
                    $r->wa_message = null;
                    return $r;
                }

                $statusLabel = Repair::STATUSES[$r->status] ?? $r->status;
                $tpl = (string) ($templates[$r->status] ?? '');
                if (trim($tpl) === '') {
                    $tpl = $this->defaultTemplate((string) $r->status);
                }

                $device = trim(((string) ($r->device_brand ?? '')) . ' ' . ((string) ($r->device_model ?? '')));
                $finalPrice = $r->final_price !== null ? number_format((float)$r->final_price, 0, ',', '.') : '';

                $replacements = [
                    '{customer_name}'  => (string) $r->customer_name,
                    '{code}'           => (string) $r->code,
                    '{status}'         => (string) $r->status,
                    '{status_label}'   => (string) $statusLabel,
                    '{lookup_url}'     => url('/reparacion'),
                    '{phone}'          => (string) $r->customer_phone,
                    '{device_brand}'   => (string) ($r->device_brand ?? ''),
                    '{device_model}'   => (string) ($r->device_model ?? ''),
                    '{device}'         => (string) $device,
                    '{final_price}'    => (string) $finalPrice,
                    '{warranty_days}'  => (string) ((int)($r->warranty_days ?? 0)),
                    '{approval_url}'   => (string) ($approvalUrl ?? ''),
                    '{shop_address}'   => (string) $shopAddress,
                    '{shop_hours}'     => (string) $shopHours,
                ];

                $message = strtr($tpl, $replacements);

                $r->wa_message = $message;
                $r->wa_url = 'https://wa.me/' . $waPhone . '?text=' . urlencode($message);

                return $r;
            })
        );

        return view('admin.repairs.index', [
            'repairs' => $repairs,
            'statuses' => Repair::STATUSES,
            'status' => $status,
            'wa' => $wa,
            'q' => $q,

            // ✅ NUEVO
            'statusCounts' => $statusCounts,
            'totalCount' => $totalCount,
            ]);

    }

    public function create()
    {
        $statuses = Repair::STATUSES;
        $paymentMethods = Repair::PAYMENT_METHODS;

        $deviceTypes = DeviceType::where('active', true)->orderBy('name')->get();
        $issueTypes  = DeviceIssueType::where('active', true)->orderBy('name')->get();
        $repairTypes = \App\Models\RepairType::where('active', true)->orderBy('name')->get();

        return view('admin.repairs.create', compact(
            'statuses',
            'paymentMethods',
            'deviceTypes',
            'issueTypes',
            'repairTypes',
        ));
    }


    public function store(Request $request)
    {
        $request->merge([
            'payment_method' => $this->normalizeNullableString($request->input('payment_method')),
        ]);

        $data = $request->validate([
            'user_email'      => 'nullable|email',
            'customer_name'   => 'required|string|max:255',
            'customer_phone'  => ['required', 'string', 'max:30', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],
            'device_type_id'  => 'required|exists:device_types,id',
            'device_brand_id' => 'required|exists:device_brands,id',
            'device_model_id' => 'required|exists:device_models,id',

            'device_issue_type_id' => ['required', 'integer', 'exists:device_issue_types,id'],
            'repair_type_id' => ['required', 'integer', 'exists:repair_types,id'],
            'issue_detail' => ['nullable', 'string', 'max:255'],


            'diagnosis'       => 'nullable|string',

            'parts_cost'      => 'nullable|numeric|min:0',
            'labor_cost'      => 'nullable|numeric|min:0',
            'final_price'     => 'nullable|numeric|min:0',

            // ✅ Pagos
            'paid_amount'     => 'nullable|numeric|min:0',
            'payment_method'  => 'nullable|string|in:' . implode(',', array_keys(Repair::PAYMENT_METHODS)),
            'payment_notes'   => 'nullable|string|max:500',

            'status'          => 'required|string|in:' . implode(',', array_keys(Repair::STATUSES)),
            'warranty_days'   => 'nullable|integer|min:0',
            'notes'           => 'nullable|string',
        ]);

        $userId = null;
        if (!empty($data['user_email'])) {
            $user = User::where('email', $data['user_email'])->first();
            if (!$user) {
                return back()->withErrors(['user_email' => 'No existe un usuario con ese email.'])->withInput();
            }
            $userId = $user->id;
        }

        $parts = (float) ($data['parts_cost'] ?? 0);
        $labor = (float) ($data['labor_cost'] ?? 0);
        $paid  = (float) ($data['paid_amount'] ?? 0);
        $diagnosis = trim((string) ($data['diagnosis'] ?? ''));
        $finalPrice = isset($data['final_price']) ? (float) $data['final_price'] : null;
        $paymentMethod = $this->normalizeNullableString($data['payment_method'] ?? null);
        $status = (string) ($data['status'] ?? 'received');
        $warranty = (int) ($data['warranty_days'] ?? 0);

        $consistencyError = $this->validateRepairBusinessConsistency(
            $status,
            $diagnosis,
            $finalPrice,
            $paid,
            $paymentMethod
        );
        if ($consistencyError !== null) {
            return back()->withErrors(['status' => $consistencyError])->withInput();
        }

        $receivedAt = now();
        $deliveredAt = null;
        if ($status === 'delivered') {
            $deliveredAt = now();
        }

        $type  = DeviceType::findOrFail((int)$data['device_type_id']);
        $brand = DeviceBrand::findOrFail((int)$data['device_brand_id']);
        $model = DeviceModel::findOrFail((int)$data['device_model_id']);

        if ($brand->device_type_id !== $type->id) {
        return back()->withErrors(['device_brand_id' => 'La marca no pertenece al tipo seleccionado.'])->withInput();
        }
        if ($model->device_brand_id !== $brand->id) {
        return back()->withErrors(['device_model_id' => 'El modelo no pertenece a la marca seleccionada.'])->withInput();
        }

        $issueType = DeviceIssueType::findOrFail((int) $data['device_issue_type_id']);
        if ($issueType->device_type_id !== $type->id) {
            return back()->withErrors(['device_issue_type_id' => 'La falla no corresponde al tipo de dispositivo seleccionado.'])->withInput();
        }

        $issueDetail = trim((string) ($data['issue_detail'] ?? ''));
        $issueReported = $issueType->name;
        if ($issueDetail !== '') {
            $issueReported .= ' — ' . $issueDetail;
        }


        $repair = Repair::create([
            'user_id'        => $userId,
            'customer_name'  => $data['customer_name'],
            'customer_phone' => $data['customer_phone'],
            'device_type_id'  => $type->id,
            'device_brand_id' => $brand->id,
            'device_model_id' => $model->id,

            // seguimos guardando strings para mostrar en el sistema como antes
            'device_brand' => $brand->name,
            'device_model' => $model->name,

            'device_issue_type_id' => $issueType->id,
            'repair_type_id'       => $data['repair_type_id'],
            'issue_detail'         => $issueDetail !== '' ? $issueDetail : null,

            
            'issue_reported' => $issueReported,
            'diagnosis'      => $diagnosis !== '' ? $diagnosis : null,

            'parts_cost'     => $parts,
            'labor_cost'     => $labor,
            'final_price'    => $finalPrice,

            'paid_amount'    => $paid,
            'payment_method' => $paymentMethod,
            'payment_notes'  => $data['payment_notes'] ?? null,

            'status'         => $status,
            'warranty_days'  => $warranty,
            'received_at'    => $receivedAt,
            'delivered_at'   => $deliveredAt,
            'notes'          => $data['notes'] ?? null,
        ]);

        $repair->code = 'R-' . now()->format('Ymd') . '-' . str_pad((string) $repair->id, 5, '0', STR_PAD_LEFT);
        $repair->save();

        RepairStatusHistory::create([
            'repair_id'    => $repair->id,
            'from_status'  => null,
            'to_status'    => $repair->status,
            'changed_by'   => auth()->id(),
            'changed_at'   => now(),
            'comment'      => 'Creación de reparación',
        ]);

        return redirect()->route('admin.repairs.show', $repair)->with('success', 'Reparación creada.');
    }

    public function show(Repair $repair)
    {
        $linkedUserEmail = null;
        if ($repair->user_id) {
            $linkedUserEmail = User::where('id', $repair->user_id)->value('email');
        }

        $waPhone = $this->normalizeWhatsappPhone((string)$repair->customer_phone);
        $waMessage = $this->buildWhatsappMessage($repair);
        $waUrl = $waPhone ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage)) : null;
        $approvalUrl = $this->buildApprovalUrl($repair);

        $waLogs = $repair->whatsappLogs()->with('sentBy')->get();

        $waNotifiedCurrent = RepairWhatsappLog::where('repair_id', $repair->id)
            ->where('notified_status', $repair->status)
            ->exists();

        $waNotifiedAt = RepairWhatsappLog::where('repair_id', $repair->id)
            ->where('notified_status', $repair->status)
            ->orderByDesc('sent_at')
            ->value('sent_at');

        return view('admin.repairs.show', [
            'repair'            => $repair,
            'statuses'          => Repair::STATUSES,
            'paymentMethods'    => Repair::PAYMENT_METHODS,
            'history'           => $repair->statusHistory()->get(),
            'deviceTypes' => DeviceType::orderBy('id')->get(),
            'linkedUserEmail'   => $linkedUserEmail,
            'waPhone'           => $waPhone,
            'waMessage'         => $waMessage,
            'waUrl'             => $waUrl,
            'approvalUrl'       => $approvalUrl,
            'waLogs'            => $waLogs,
            'waNotifiedCurrent' => $waNotifiedCurrent,
            'waNotifiedAt'      => $waNotifiedAt,
        ]);
    }

    public function update(Request $request, Repair $repair)
    {
        $request->merge([
            'payment_method' => $this->normalizeNullableString($request->input('payment_method')),
        ]);

        $data = $request->validate([
            'user_email'      => 'nullable|email',
            'unlink_user'     => 'nullable|boolean',

            'customer_name'   => 'required|string|max:255',
            'customer_phone'  => ['required', 'string', 'max:30', 'regex:/^(?=(?:\\D*\\d){8,15}\\D*$)[0-9+()\\s-]{8,30}$/'],

            'device_type_id'  => 'required|exists:device_types,id',
            'device_brand_id' => 'required|exists:device_brands,id',
            'device_model_id' => 'required|exists:device_models,id',

            'device_issue_type_id' => 'required|integer|exists:device_issue_types,id',
            'issue_detail'         => 'nullable|string|max:2000',

            'diagnosis'       => 'nullable|string',

            'parts_cost'      => 'nullable|numeric|min:0',
            'labor_cost'      => 'nullable|numeric|min:0',
            'final_price'     => 'nullable|numeric|min:0',

            'paid_amount'     => 'nullable|numeric|min:0',
            'payment_method'  => 'nullable|string|in:' . implode(',', array_keys(Repair::PAYMENT_METHODS)),
            'payment_notes'   => 'nullable|string|max:500',

            'warranty_days'   => 'nullable|integer|min:0',
            'notes'           => 'nullable|string',
        ]);

        // Vincular/desvincular usuario
        $unlink = $request->boolean('unlink_user');
        $userId = $repair->user_id;

        if ($unlink) {
            $userId = null;
        } else {
            $email = trim((string) ($data['user_email'] ?? ''));
            if ($email !== '') {
                $user = User::where('email', $email)->first();
                if (! $user) {
                    return back()->withErrors(['user_email' => 'No existe un usuario con ese email.'])->withInput();
                }
                $userId = $user->id;
            }
        }

        // Coherencia tipo/marca/modelo
        $type  = DeviceType::findOrFail((int) $data['device_type_id']);
        $brand = DeviceBrand::findOrFail((int) $data['device_brand_id']);
        if ($brand->device_type_id !== $type->id) {
            return back()->withErrors(['device_brand_id' => 'La marca no pertenece al tipo seleccionado.'])->withInput();
        }

        $model = DeviceModel::findOrFail((int) $data['device_model_id']);
        if ($model->device_brand_id !== $brand->id) {
            return back()->withErrors(['device_model_id' => 'El modelo no pertenece a la marca seleccionada.'])->withInput();
        }

        // Coherencia falla/tipo
        $issueType = DeviceIssueType::findOrFail((int) $data['device_issue_type_id']);
        if ($issueType->device_type_id !== $type->id) {
            return back()->withErrors(['device_issue_type_id' => 'La falla no corresponde al tipo de dispositivo seleccionado.'])->withInput();
        }

        $issueDetail   = trim((string) ($data['issue_detail'] ?? ''));
        $issueReported = $issueType->name . ($issueDetail !== '' ? (' — ' . $issueDetail) : '');

        $targetStatus = (string) ($repair->status ?? 'received');
        $diagnosis = trim((string) ($data['diagnosis'] ?? ''));
        $finalPrice = isset($data['final_price']) ? (float) $data['final_price'] : null;
        $paidAmount = (float) ($data['paid_amount'] ?? 0);
        $paymentMethod = $this->normalizeNullableString($data['payment_method'] ?? null);

        $consistencyError = $this->validateRepairBusinessConsistency(
            $targetStatus,
            $diagnosis,
            $finalPrice,
            $paidAmount,
            $paymentMethod
        );
        if ($consistencyError !== null) {
            return back()->withErrors(['repair' => $consistencyError])->withInput();
        }

        $deliveredAt = $repair->delivered_at;
        if ($targetStatus === 'delivered' && !$deliveredAt) {
            $deliveredAt = now();
        }

        $repair->update([
            'user_id'         => $userId,
            'customer_name'   => $data['customer_name'],
            'customer_phone'  => $data['customer_phone'],

            'device_type_id'  => $type->id,
            'device_brand_id' => $brand->id,
            'device_model_id' => $model->id,

            // seguimos guardando strings (como antes)
            'device_brand' => $brand->name,
            'device_model' => $model->name,

            'device_issue_type_id' => $issueType->id,
            'issue_detail'         => $issueDetail !== '' ? $issueDetail : null,
            'issue_reported'       => $issueReported,

            'diagnosis'       => $diagnosis !== '' ? $diagnosis : null,

            'parts_cost'      => (float) ($data['parts_cost'] ?? 0),
            'labor_cost'      => (float) ($data['labor_cost'] ?? 0),
            'final_price'     => $finalPrice,

            'paid_amount'     => $paidAmount,
            'payment_method'  => $paymentMethod,
            'payment_notes'   => $data['payment_notes'] ?? null,

            'warranty_days'   => (int) ($data['warranty_days'] ?? 0),
            'delivered_at'    => $deliveredAt,
            'notes'           => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Datos de la reparación actualizados.');
    }


    public function updateStatus(Request $request, Repair $repair)
    {
        $request->validate([
            'status'  => 'required|string|in:' . implode(',', array_keys(Repair::STATUSES)),
            'comment' => 'nullable|string|max:500',
        ]);

        $from = (string) $repair->status;
        $to   = (string) $request->input('status');

        $isAjax = $request->expectsJson()
            || $request->wantsJson()
            || $request->header('X-Requested-With') === 'XMLHttpRequest';

        if ($from === $to) {
            if ($isAjax) {
                return response()->json([
                    'ok' => true,
                    'changed' => false,
                    'message' => 'El estado ya era ese.',
                    'status' => $from,
                    'status_label' => Repair::STATUSES[$from] ?? $from,
                ]);
            }

            return back()->with('success', 'El estado ya era ese.');
        }

        if (!Repair::canTransition($from, $to)) {
            $msg = Repair::transitionErrorMessage($from);
            if ($isAjax) {
                return response()->json([
                    'ok' => false,
                    'changed' => false,
                    'message' => $msg,
                    'status' => $from,
                    'status_label' => Repair::STATUSES[$from] ?? $from,
                ], 422);
            }
            return back()->withErrors(['status' => $msg]);
        }

        $ruleError = $this->validateStatusBusinessRules($repair, $to);
        if ($ruleError !== null) {
            if ($isAjax) {
                return response()->json([
                    'ok' => false,
                    'changed' => false,
                    'message' => $ruleError,
                    'status' => $from,
                    'status_label' => Repair::STATUSES[$from] ?? $from,
                ], 422);
            }

            return back()->withErrors(['status' => $ruleError]);
        }

        DB::transaction(function () use ($request, $repair, $from, $to) {
            $repair->status = $to;

            if ($to === 'delivered' && !$repair->delivered_at) {
                $repair->delivered_at = now();
            }

            $repair->save();

            RepairStatusHistory::create([
                'repair_id'   => $repair->id,
                'from_status' => $from,
                'to_status'   => $to,
                'changed_by'  => auth()->id(),
                'changed_at'  => now(),
                'comment'     => $request->input('comment'),
            ]);
        });

        AuditLogger::log($request, 'admin.repair.status_changed', [
            'subject_type' => Repair::class,
            'subject_id' => $repair->id,
            'metadata' => [
                'from_status' => $from,
                'to_status' => $to,
                'comment' => $request->input('comment'),
            ],
        ]);

        $waPhone   = $this->normalizeWhatsappPhone((string) $repair->customer_phone);
        $waMessage = $this->buildWhatsappMessage($repair);
        $waUrl     = $waPhone ? ('https://wa.me/' . $waPhone . '?text=' . urlencode($waMessage)) : null;

        if ($isAjax) {
            return response()->json([
                'ok' => true,
                'changed' => true,
                'message' => 'Estado actualizado.',
                'from_status' => $from,
                'to_status' => $to,
                'status' => $to,
                'status_label' => Repair::STATUSES[$to] ?? $to,
                'wa' => [
                    'phone' => $waPhone,
                    'message' => $waMessage,
                    'url' => $waUrl,
                ],
            ]);
        }

        return redirect()
            ->route('admin.repairs.show', $repair)
            ->with('success', 'Estado actualizado.')
            ->with('wa_after', [
                'phone'   => $waPhone,
                'message' => $waMessage,
                'url'     => $waUrl,
            ]);
    }


    // ✅ Compat con rutas actuales
    private function validateStatusBusinessRules(Repair $repair, string $to): ?string
    {
        return $this->validateRepairBusinessConsistency(
            $to,
            trim((string) ($repair->diagnosis ?? '')),
            $repair->final_price !== null ? (float) $repair->final_price : null,
            (float) ($repair->paid_amount ?? 0),
            $this->normalizeNullableString($repair->payment_method ?? null)
        );
    }

    private function validateRepairBusinessConsistency(
        string $status,
        string $diagnosis,
        ?float $finalPrice,
        float $paidAmount,
        ?string $paymentMethod
    ): ?string {
        $requiresDiagnosisAndPrice = ['waiting_approval', 'ready_pickup', 'delivered'];
        if (in_array($status, $requiresDiagnosisAndPrice, true) && trim($diagnosis) === '') {
            return 'Completa el diagnostico antes de cambiar a ese estado.';
        }

        if (in_array($status, $requiresDiagnosisAndPrice, true) && $finalPrice === null) {
            return 'Define el precio final antes de cambiar a ese estado.';
        }

        if ($paidAmount > 0 && $paymentMethod === null) {
            return 'Completa el metodo de pago para registrar montos abonados.';
        }

        if ($finalPrice !== null && $paidAmount > $finalPrice) {
            return 'El monto pagado no puede superar el precio final.';
        }

        return null;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized !== '' ? $normalized : null;
    }

    public function whatsappLog(Repair $repair)
    {
        return $this->logWhatsapp($repair);
    }

    public function whatsappLogAjax(Request $request, Repair $repair)
    {
        return $this->logWhatsappAjax($request, $repair);
    }

    // WhatsApp Logs
    public function logWhatsapp(Repair $repair)
    {
        $waPhone = $this->normalizeWhatsappPhone((string)$repair->customer_phone);
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
        $waPhone = $this->normalizeWhatsappPhone((string)$repair->customer_phone);
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
            'repair_id'       => $repair->id,
            'notified_status' => $repair->status,
            'phone'           => $waPhone,
            'message'         => $waMessage,
            'sent_by'         => auth()->id(),
            'sent_at'         => now(),
        ]);

        return true;
    }

    // Helpers WhatsApp
    private function normalizeWhatsappPhone(string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', $raw);
        if (!$digits) return null;

        if (str_starts_with($digits, '54')) return $digits;

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
        $approvalUrl = $this->buildApprovalUrl($repair);

        $tpl = RepairWhatsappTemplate::where('status', $repair->status)->value('template');
        if (!$tpl || trim($tpl) === '') {
            $tpl = $this->defaultTemplate($repair->status);
        }

        $device = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
        $finalPrice = $repair->final_price !== null ? number_format((float)$repair->final_price, 0, ',', '.') : '';

        $settings = BusinessSetting::allValues();
        $shopAddress = (string) ($settings->get('shop_address') ?? '');
        $shopHours = (string) ($settings->get('shop_hours') ?? '');

        $replacements = [
            '{customer_name}' => (string) $repair->customer_name,
            '{code}'          => (string) $repair->code,
            '{status}'        => (string) $repair->status,
            '{status_label}'  => (string) $statusLabel,
            '{lookup_url}'    => url('/reparacion'),
            '{phone}'         => (string) $repair->customer_phone,
            '{device_brand}'  => (string) ($repair->device_brand ?? ''),
            '{device_model}'  => (string) ($repair->device_model ?? ''),
            '{device}'        => (string) $device,
            '{final_price}'   => (string) $finalPrice,
            '{warranty_days}' => (string) ((int)($repair->warranty_days ?? 0)),
            '{approval_url}'  => (string) ($approvalUrl ?? ''),
            '{shop_address}'  => (string) $shopAddress,
            '{shop_hours}'    => (string) $shopHours,
        ];

        return strtr($tpl, $replacements);
    }

    private function buildApprovalUrl(Repair $repair): ?string
    {
        if ((string) ($repair->status ?? '') !== 'waiting_approval') {
            return null;
        }

        return URL::temporarySignedRoute(
            'repairs.quote.show',
            now()->addDays(7),
            ['repair' => $repair->id]
        );
    }

    private function defaultTemplate(string $status): string
    {
        $base = "Hola {customer_name}\n";
        $base .= "Tu reparación ({code}) está en estado: *{status_label}*.\n";

        if ($status === 'waiting_approval') {
            $base .= "Necesitamos tu aprobación para continuar.\n";
            $base .= "Aprobá o rechazá acá: {approval_url}\n";
        } elseif ($status === 'ready_pickup') {
            $base .= "¡Ya está lista para retirar! ✅\n";
            $base .= "\nDirección: {shop_address}\n";
            $base .= "Horarios: {shop_hours}\n";
        } elseif ($status === 'delivered') {
            $base .= "¡Gracias por tu visita!\n";
        }

        $base .= "\nPodés consultar el estado en: {lookup_url}\n";
        $base .= "Código: {code}\n";
        $base .= "Equipo: {device}\n";
        $base .= "NicoReparaciones";

        return $base;
    }
}

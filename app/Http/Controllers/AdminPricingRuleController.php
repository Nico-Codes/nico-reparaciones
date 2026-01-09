<?php

namespace App\Http\Controllers;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceModelGroup;
use App\Models\DeviceType;
use App\Models\PricingRule;
use App\Models\RepairType;
use Illuminate\Http\Request;

class AdminPricingRuleController extends Controller
{
    public function index()
    {
        $rules = PricingRule::with(['deviceType','repairType','brand','modelGroup','model'])
            ->orderByDesc('active')
            ->orderBy('device_type_id')
            ->orderBy('repair_type_id')
            ->orderByDesc('priority')
            ->latest()
            ->get();

        return view('admin.pricing.index', compact('rules'));
    }

    public function create()
    {
        $deviceTypes = DeviceType::where('active', true)->orderBy('name')->get();
        $repairTypes = RepairType::where('active', true)->orderBy('name')->get();
        $brands = DeviceBrand::where('active', true)->orderBy('name')->get();
        $groups = DeviceModelGroup::orderBy('name')->get();
        $models = DeviceModel::orderBy('name')->get();

        return view('admin.pricing.create', compact('deviceTypes','repairTypes','brands','groups','models'));
    }

    public function store(Request $request)
    {
        $data = $this->validateRule($request);

        PricingRule::create($data);

        return redirect()->route('admin.pricing.index')->with('success', 'Regla creada.');
    }

    public function edit(PricingRule $rule)
    {
        $deviceTypes = DeviceType::where('active', true)->orderBy('name')->get();
        $repairTypes = RepairType::where('active', true)->orderBy('name')->get();
        $brands = DeviceBrand::where('active', true)->orderBy('name')->get();
        $groups = DeviceModelGroup::orderBy('name')->get();
        $models = DeviceModel::orderBy('name')->get();

        return view('admin.pricing.edit', compact('rule','deviceTypes','repairTypes','brands','groups','models'));
    }

    public function update(PricingRule $rule, Request $request)
    {
        $data = $this->validateRule($request);

        $rule->update($data);

        return redirect()->route('admin.pricing.index')->with('success', 'Regla actualizada.');
    }

    public function resolve(Request $request)
    {
        $data = $request->validate([
            'device_type_id' => ['required','integer','exists:device_types,id'],
            'device_brand_id' => ['nullable','integer','exists:device_brands,id'],
            'device_model_id' => ['nullable','integer','exists:device_models,id'],
            'repair_type_id' => ['required','integer','exists:repair_types,id'],
        ]);

        $typeId = (int) $data['device_type_id'];
        $brandId = !empty($data['device_brand_id']) ? (int)$data['device_brand_id'] : null;
        $modelId = !empty($data['device_model_id']) ? (int)$data['device_model_id'] : null;
        $repairTypeId = (int) $data['repair_type_id'];

        $groupId = null;
        if ($modelId) {
            $m = DeviceModel::find($modelId);
            $groupId = $m?->device_model_group_id ? (int)$m->device_model_group_id : null;
        }

        $candidates = PricingRule::with(['deviceType','repairType','brand','modelGroup','model'])
            ->where('active', true)
            ->where('device_type_id', $typeId)
            ->where('repair_type_id', $repairTypeId)
            ->when(true, function ($q) use ($brandId) {
                if ($brandId) {
                    $q->where(function ($qq) use ($brandId) {
                        $qq->whereNull('device_brand_id')->orWhere('device_brand_id', $brandId);
                    });
                } else {
                    $q->whereNull('device_brand_id');
                }
            })
            ->when(true, function ($q) use ($groupId) {
                if ($groupId) {
                    $q->where(function ($qq) use ($groupId) {
                        $qq->whereNull('device_model_group_id')->orWhere('device_model_group_id', $groupId);
                    });
                } else {
                    $q->whereNull('device_model_group_id');
                }
            })
            ->when(true, function ($q) use ($modelId) {
                if ($modelId) {
                    $q->where(function ($qq) use ($modelId) {
                        $qq->whereNull('device_model_id')->orWhere('device_model_id', $modelId);
                    });
                } else {
                    $q->whereNull('device_model_id');
                }
            })
            ->get();

        $best = null;
        $bestScore = -1;
        $bestPriority = -999999;

        foreach ($candidates as $r) {
            $score = 0;
            if (!empty($r->device_model_id)) $score += 8;
            if (!empty($r->device_model_group_id)) $score += 4;
            if (!empty($r->device_brand_id)) $score += 2;
            $score += 1;

            $priority = (int)($r->priority ?? 0);

            if ($score > $bestScore || ($score === $bestScore && $priority > $bestPriority)) {
                $best = $r;
                $bestScore = $score;
                $bestPriority = $priority;
            }
        }

        return response()->json([
            'ok' => true,
            'group_id' => $groupId,
            'rule' => $best ? [
                'id' => $best->id,
                'mode' => $best->mode,
                'multiplier' => $best->multiplier !== null ? (float)$best->multiplier : null,
                'min_profit' => $best->min_profit !== null ? (int)$best->min_profit : null,
                'fixed_total' => $best->fixed_total !== null ? (int)$best->fixed_total : null,
                'shipping_default' => (int)$best->shipping_default,
                'priority' => (int)$best->priority,
            ] : null,
        ]);
    }

    private function validateRule(Request $request): array
    {
        $data = $request->validate([
            'device_type_id' => ['required','exists:device_types,id'],
            'repair_type_id' => ['required','exists:repair_types,id'],

            'device_brand_id' => ['nullable','exists:device_brands,id'],
            'device_model_group_id' => ['nullable','exists:device_model_groups,id'],
            'device_model_id' => ['nullable','exists:device_models,id'],

            'mode' => ['required','in:margin,fixed'],
            'multiplier' => ['nullable','numeric','min:0'],
            'min_profit' => ['nullable','integer','min:0'],
            'fixed_total' => ['nullable','integer','min:0'],

            'shipping_default' => ['nullable','integer','min:0'],
            'priority' => ['nullable','integer'],
            'active' => ['nullable'],
        ]);

        $data['active'] = (bool)($data['active'] ?? false);
        $data['shipping_default'] = (int)($data['shipping_default'] ?? 0);
        $data['priority'] = (int)($data['priority'] ?? 0);

        // Limpieza según modo
        if ($data['mode'] === 'fixed') {
            $data['multiplier'] = null;
            $data['min_profit'] = null;
        } else {
            $data['fixed_total'] = null;
        }

        return $data;
    }
}

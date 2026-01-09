<?php

namespace App\Http\Controllers;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceModelGroup;
use App\Models\DeviceType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminModelGroupController extends Controller
{
    public function index(Request $request)
    {
        $deviceTypes = DeviceType::where('active', true)->orderBy('name')->get();

        $typeId = (int) $request->query('device_type_id', 0);
        $brandId = (int) $request->query('device_brand_id', 0);

        $brands = collect();
        $groups = collect();
        $models = collect();

        if ($typeId) {
            $brands = DeviceBrand::where('device_type_id', $typeId)->where('active', true)->orderBy('name')->get();
        }

        if ($brandId) {
            $groups = DeviceModelGroup::where('device_brand_id', $brandId)->orderBy('name')->get();
            $models = DeviceModel::where('device_brand_id', $brandId)->orderBy('name')->get();
        }

        return view('admin.model_groups.index', compact('deviceTypes', 'typeId', 'brands', 'brandId', 'groups', 'models'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'device_brand_id' => ['required','exists:device_brands,id'],
            'name' => ['required','string','max:100'],
            'active' => ['nullable'],
        ]);

        $slugBase = Str::slug($data['name']);
        $slug = $slugBase;
        $i = 2;

        while (DeviceModelGroup::where('device_brand_id', $data['device_brand_id'])->where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i++;
        }

        DeviceModelGroup::create([
            'device_brand_id' => $data['device_brand_id'],
            'name' => $data['name'],
            'slug' => $slug,
            'active' => (bool)($data['active'] ?? true),
        ]);

        return back()->with('success', 'Grupo creado.');
    }

    public function update(DeviceModelGroup $group, Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100'],
            'active' => ['nullable'],
        ]);

        $group->name = $data['name'];
        $group->active = (bool)($data['active'] ?? false);
        $group->save();

        return back()->with('success', 'Grupo actualizado.');
    }

    public function assignModel(DeviceModel $model, Request $request)
    {
        $data = $request->validate([
            'device_model_group_id' => ['nullable','exists:device_model_groups,id'],
        ]);

        // Seguridad: si mandan un grupo, debe ser del mismo brand
        if (!empty($data['device_model_group_id'])) {
            $g = DeviceModelGroup::find($data['device_model_group_id']);
            if ($g && (int)$g->device_brand_id !== (int)$model->device_brand_id) {
                return response()->json(['ok' => false, 'message' => 'Grupo inválido para esta marca'], 422);
            }
        }

        $model->device_model_group_id = $data['device_model_group_id'] ?? null;
        $model->save();

        return response()->json(['ok' => true]);
    }
}

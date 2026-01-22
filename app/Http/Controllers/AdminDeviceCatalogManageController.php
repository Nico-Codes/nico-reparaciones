<?php

namespace App\Http\Controllers;

use App\Models\DeviceBrand;
use App\Models\DeviceIssueType;
use App\Models\DeviceModel;
use App\Models\DeviceType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminDeviceCatalogManageController extends Controller
{
    public function index(Request $request)
    {
        $types = DeviceType::orderBy('name')->get(['id', 'name', 'active']);

        $typeId = (int) $request->query('type_id');
        if (!$typeId && $types->count()) {
            $typeId = optional($types->firstWhere('active', true))->id ?? $types->first()->id;
        }

        $brands = $typeId
            ? DeviceBrand::where('device_type_id', $typeId)->orderBy('name')->get()
            : collect();

        $brandId = (int) $request->query('brand_id');
        if (!$brandId && $brands->count()) {
            $brandId = $brands->first()->id;
        }

        if ($brandId && $brands->where('id', $brandId)->isEmpty()) {
            $brandId = $brands->first()->id ?? 0;
        }

        $models = $brandId
            ? DeviceModel::with('group')->where('device_brand_id', $brandId)->orderBy('name')->get()
            : collect();

        $issues = $typeId
            ? DeviceIssueType::where('device_type_id', $typeId)->orderBy('name')->get()
            : collect();

        return view('admin.device_catalog.index', [
            'types' => $types,
            'typeId' => $typeId,
            'brands' => $brands,
            'brandId' => $brandId,
            'models' => $models,
            'issues' => $issues,
        ]);
    }

    public function storeBrand(Request $request)
    {
        $data = $request->validate([
            'device_type_id' => ['required', 'integer', 'exists:device_types,id'],
            'name' => ['required', 'string', 'max:50'],
        ]);

        $name = trim($data['name']);
        $typeId = (int) $data['device_type_id'];

        $slugBase = Str::slug($name);
        $slug = $slugBase;
        $i = 2;

        while (DeviceBrand::where('device_type_id', $typeId)->where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i;
            $i++;
        }

        DeviceBrand::create([
            'device_type_id' => $typeId,
            'name' => $name,
            'slug' => $slug,
            'active' => true,
        ]);

        return back()->with('success', 'Marca creada.');
    }

    public function updateBrand(Request $request, DeviceBrand $brand)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        $brand->update([
            'name' => trim($data['name']),
        ]);

        return back()->with('success', 'Marca actualizada.');
    }

    public function toggleBrand(DeviceBrand $brand)
    {
        $brand->active = ! (bool) $brand->active;
        $brand->save();

        return back()->with('success', $brand->active ? 'Marca activada.' : 'Marca desactivada.');
    }

    public function storeModel(Request $request)
    {
        $data = $request->validate([
            'device_brand_id' => ['required', 'integer', 'exists:device_brands,id'],
            'name' => ['required', 'string', 'max:70'],
        ]);

        $brandId = (int) $data['device_brand_id'];
        $name = trim($data['name']);

        $slugBase = Str::slug($name);
        $slug = $slugBase;
        $i = 2;

        while (DeviceModel::where('device_brand_id', $brandId)->where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i;
            $i++;
        }

        DeviceModel::create([
            'device_brand_id' => $brandId,
            'name' => $name,
            'slug' => $slug,
            'active' => true,
        ]);

        return back()->with('success', 'Modelo creado.');
    }

    public function updateModel(Request $request, DeviceModel $model)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:70'],
        ]);

        $model->update([
            'name' => trim($data['name']),
        ]);

        return back()->with('success', 'Modelo actualizado.');
    }

    public function toggleModel(DeviceModel $model)
    {
        $model->active = ! (bool) $model->active;
        $model->save();

        return back()->with('success', $model->active ? 'Modelo activado.' : 'Modelo desactivado.');
    }

    public function storeIssue(Request $request)
    {
        $data = $request->validate([
            'device_type_id' => ['required', 'integer', 'exists:device_types,id'],
            'name' => ['required', 'string', 'max:70'],
        ]);

        $typeId = (int) $data['device_type_id'];
        $name = trim($data['name']);

        $slugBase = Str::slug($name);
        $slug = $slugBase;
        $i = 2;

        while (DeviceIssueType::where('device_type_id', $typeId)->where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i;
            $i++;
        }

        DeviceIssueType::create([
            'device_type_id' => $typeId,
            'name' => $name,
            'slug' => $slug,
            'active' => true,
        ]);

        return back()->with('success', 'Falla creada.');
    }

    public function updateIssue(Request $request, DeviceIssueType $issue)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:70'],
        ]);

        $issue->update([
            'name' => trim($data['name']),
        ]);

        return back()->with('success', 'Falla actualizada.');
    }

    public function toggleIssue(DeviceIssueType $issue)
    {
        $issue->active = ! (bool) $issue->active;
        $issue->save();

        return back()->with('success', $issue->active ? 'Falla activada.' : 'Falla desactivada.');
    }
}

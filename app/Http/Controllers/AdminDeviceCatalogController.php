<?php

namespace App\Http\Controllers;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\DeviceIssueType;


class AdminDeviceCatalogController extends Controller
{
    public function brands(Request $request)
    {
        $typeId = (int) $request->query('type_id');
        $mode = (string) $request->query('mode', 'create'); // create|edit
        $selectedBrandId = (int) $request->query('selected_brand_id', 0);

        if (!$typeId || !DeviceType::whereKey($typeId)->exists()) {
            return response()->json(['ok' => false, 'message' => 'Tipo inválido'], 422);
        }

        $typeIsActive = DeviceType::whereKey($typeId)->where('active', true)->exists();
        if (!$typeIsActive && $mode !== 'edit') {
            return response()->json(['ok' => true, 'brands' => []]);
        }

        if ($selectedBrandId > 0 && !DeviceBrand::whereKey($selectedBrandId)->where('device_type_id', $typeId)->exists()) {
            $selectedBrandId = 0;
        }

        $q = DeviceBrand::where('device_type_id', $typeId);

        if ($mode === 'edit' && $selectedBrandId > 0) {
            $q->where(function ($qq) use ($selectedBrandId) {
                $qq->where('active', true)->orWhere('id', $selectedBrandId);
            });
        } else {
            $q->where('active', true);
        }

        $brands = $q->orderBy('name')->get(['id', 'name']);

        return response()->json(['ok' => true, 'brands' => $brands]);
    }


    public function models(Request $request)
    {
        $brandId = (int) $request->query('brand_id');
        $mode = (string) $request->query('mode', 'create'); // create|edit
        $selectedModelId = (int) $request->query('selected_model_id', 0);

        if (!$brandId || !DeviceBrand::whereKey($brandId)->exists()) {
            return response()->json(['ok' => false, 'message' => 'Marca inválida'], 422);
        }

        $brandIsActive = DeviceBrand::whereKey($brandId)->where('active', true)->exists();
        if (!$brandIsActive && $mode !== 'edit') {
            return response()->json(['ok' => true, 'models' => []]);
        }

        if ($selectedModelId > 0 && !DeviceModel::whereKey($selectedModelId)->where('device_brand_id', $brandId)->exists()) {
            $selectedModelId = 0;
        }

        $q = DeviceModel::where('device_brand_id', $brandId);

        if ($mode === 'edit' && $selectedModelId > 0) {
            $q->where(function ($qq) use ($selectedModelId) {
                $qq->where('active', true)->orWhere('id', $selectedModelId);
            });
        } else {
            $q->where('active', true);
        }

        $models = $q->orderBy('name')->get(['id', 'name']);

        return response()->json(['ok' => true, 'models' => $models]);
    }


    public function storeBrand(Request $request)
    {
        $data = $request->validate([
            'device_type_id' => 'required|exists:device_types,id',
            'name' => 'required|string|max:255',
        ]);

        $typeId = (int) $data['device_type_id'];
        $name = trim($data['name']);

        $base = Str::slug($name) ?: 'marca';
        $slug = $base;
        $i = 2;

        while (DeviceBrand::where('device_type_id', $typeId)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $brand = DeviceBrand::create([
            'device_type_id' => $typeId,
            'name' => $name,
            'slug' => $slug,
        ]);

        return response()->json(['ok' => true, 'brand' => ['id' => $brand->id, 'name' => $brand->name]]);
    }

    public function storeModel(Request $request)
    {
        $data = $request->validate([
            'device_brand_id' => 'required|exists:device_brands,id',
            'name' => 'required|string|max:255',
        ]);

        $brandId = (int) $data['device_brand_id'];
        $name = trim($data['name']);

        $base = Str::slug($name) ?: 'modelo';
        $slug = $base;
        $i = 2;

        while (DeviceModel::where('device_brand_id', $brandId)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $model = DeviceModel::create([
            'device_brand_id' => $brandId,
            'name' => $name,
            'slug' => $slug,
        ]);

        return response()->json(['ok' => true, 'model' => ['id' => $model->id, 'name' => $model->name]]);
    }

    public function issues(Request $request)
    {
        $typeId = (int) $request->query('type_id', 0);
        $mode = (string) $request->query('mode', 'create'); // create|edit
        $selectedIssueId = (int) $request->query('selected_issue_id', 0);

        if ($typeId <= 0) {
            return response()->json(['ok' => true, 'issues' => []]);
        }

        $typeExists = DeviceType::whereKey($typeId)->exists();
        if (!$typeExists) {
            return response()->json(['ok' => false, 'message' => 'Tipo inválido'], 422);
        }

        $typeIsActive = DeviceType::whereKey($typeId)->where('active', true)->exists();
        if (!$typeIsActive && $mode !== 'edit') {
            return response()->json(['ok' => true, 'issues' => []]);
        }

        if ($selectedIssueId > 0 && !DeviceIssueType::whereKey($selectedIssueId)->where('device_type_id', $typeId)->exists()) {
            $selectedIssueId = 0;
        }

        $q = DeviceIssueType::where('device_type_id', $typeId);

        if ($mode === 'edit' && $selectedIssueId > 0) {
            $q->where(function ($qq) use ($selectedIssueId) {
                $qq->where('active', true)->orWhere('id', $selectedIssueId);
            });
        } else {
            $q->where('active', true);
        }

        $issues = $q->orderBy('name')->get(['id', 'name', 'slug']);

        return response()->json(['ok' => true, 'issues' => $issues]);
    }


    public function storeIssue(Request $request)
    {
        $data = $request->validate([
            'type_id' => 'required|integer|exists:device_types,id',
            'name'    => 'required|string|max:80',
        ]);

        $typeId = (int) $data['type_id'];
        $name   = trim($data['name']);

        $base = \Illuminate\Support\Str::slug($name);
        $slug = $base ?: ('issue-' . time());

        // asegurar unique por (type_id, slug)
        $i = 2;
        while (
            DeviceIssueType::where('device_type_id', $typeId)
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base . '-' . $i;
            $i++;
        }

        $issue = DeviceIssueType::create([
            'device_type_id' => $typeId,
            'name' => $name,
            'slug' => $slug,
        ]);

        return response()->json([
            'ok' => true,
            'issue' => [
                'id' => $issue->id,
                'name' => $issue->name,
                'slug' => $issue->slug,
            ],
        ]);
    }

}

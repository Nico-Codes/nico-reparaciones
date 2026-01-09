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
        if (!$typeId || !DeviceType::whereKey($typeId)->exists()) {
            return response()->json(['ok' => false, 'message' => 'Tipo inválido'], 422);
        }

        $brands = DeviceBrand::where('device_type_id', $typeId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['ok' => true, 'brands' => $brands]);
    }

    public function models(Request $request)
    {
        $brandId = (int) $request->query('brand_id');
        if (!$brandId || !DeviceBrand::whereKey($brandId)->exists()) {
            return response()->json(['ok' => false, 'message' => 'Marca inválida'], 422);
        }

        $models = DeviceModel::where('device_brand_id', $brandId)
            ->orderBy('name')
            ->get(['id', 'name']);

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

        if ($typeId <= 0) {
            return response()->json(['ok' => true, 'issues' => []]);
        }

        $issues = DeviceIssueType::query()
            ->where('device_type_id', $typeId)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

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

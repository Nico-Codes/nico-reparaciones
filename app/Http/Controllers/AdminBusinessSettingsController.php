<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Support\BrandAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class AdminBusinessSettingsController extends Controller
{
    public function index()
    {
        $shopAddress = BusinessSetting::getValue('shop_address', '');
        $shopHours = BusinessSetting::getValue('shop_hours', '');
        $shopPhone = BusinessSetting::getValue('shop_phone', '');

        return view('admin.settings.index', [
            'shopAddress' => $shopAddress,
            'shopHours' => $shopHours,
            'shopPhone' => $shopPhone,
        ]);
    }

    public function assets()
    {
        return view('admin.settings.assets', [
            'brandAssets' => BrandAssets::resolved(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'shop_address' => 'nullable|string|max:1000',
            'shop_hours' => 'nullable|string|max:1000',
            'shop_phone' => 'nullable|string|max:50',
        ]);

        BusinessSetting::updateOrCreate(
            ['key' => 'shop_address'],
            ['value' => $data['shop_address'] ?? null, 'updated_by' => auth()->id()]
        );

        BusinessSetting::updateOrCreate(
            ['key' => 'shop_hours'],
            ['value' => $data['shop_hours'] ?? null, 'updated_by' => auth()->id()]
        );

        BusinessSetting::updateOrCreate(
            ['key' => 'shop_phone'],
            ['value' => $data['shop_phone'] ?? null, 'updated_by' => auth()->id()]
        );

        return back()->with('success', 'Configuración guardada.');
    }

    public function updateAsset(Request $request, string $assetKey)
    {
        $definition = BrandAssets::definition($assetKey);
        if (!$definition) {
            abort(404);
        }

        $extensions = (array) ($definition['extensions'] ?? []);
        $maxKb = (int) ($definition['max_kb'] ?? 2048);

        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . $maxKb,
                'mimes:' . implode(',', $extensions),
            ],
        ]);

        $file = $data['file'];
        $ext = strtolower((string) ($file->extension() ?: $file->getClientOriginalExtension()));

        if ($ext === '' || !in_array($ext, $extensions, true)) {
            return back()->withErrors([
                'file' => 'Formato de archivo no permitido para este recurso visual.',
            ]);
        }

        $uploadDir = BrandAssets::uploadDir();
        $targetDir = public_path($uploadDir);
        File::ensureDirectoryExists($targetDir);

        $filename = $assetKey . '-' . now()->format('YmdHis') . '-' . Str::lower(Str::random(8)) . '.' . $ext;
        $file->move($targetDir, $filename);

        $newRelativePath = $uploadDir . '/' . $filename;
        $settingKey = BrandAssets::settingKey($assetKey);
        $oldRelativePath = (string) BusinessSetting::where('key', $settingKey)->value('value');

        BusinessSetting::updateOrCreate(
            ['key' => $settingKey],
            ['value' => $newRelativePath, 'updated_by' => auth()->id()]
        );

        $this->deleteManagedAssetFile($oldRelativePath);
        BrandAssets::clearRuntimeCache();

        return back()->with('success', 'Recurso visual actualizado: ' . ($definition['label'] ?? $assetKey));
    }

    public function resetAsset(Request $request, string $assetKey)
    {
        $definition = BrandAssets::definition($assetKey);
        if (!$definition) {
            abort(404);
        }

        $settingKey = BrandAssets::settingKey($assetKey);
        $oldRelativePath = (string) BusinessSetting::where('key', $settingKey)->value('value');

        BusinessSetting::where('key', $settingKey)->delete();

        $this->deleteManagedAssetFile($oldRelativePath);
        BrandAssets::clearRuntimeCache();

        return back()->with('success', 'Recurso visual restaurado al valor por defecto: ' . ($definition['label'] ?? $assetKey));
    }

    private function deleteManagedAssetFile(?string $relativePath): void
    {
        $normalized = BrandAssets::normalizeRelativePath((string) $relativePath);
        if (!$normalized || !BrandAssets::isManagedCustomPath($normalized)) {
            return;
        }

        $absolutePath = public_path($normalized);
        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }
    }
}

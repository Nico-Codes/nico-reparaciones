<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use Illuminate\Http\Request;

class AdminBusinessSettingsController extends Controller
{
    public function index()
    {
        $shopAddress = BusinessSetting::getValue('shop_address', '');
        $shopHours   = BusinessSetting::getValue('shop_hours', '');
        $shopPhone   = BusinessSetting::getValue('shop_phone', '');


        return view('admin.settings.index', [
            'shopAddress' => $shopAddress,
            'shopHours' => $shopHours,
            'shopPhone'   => $shopPhone,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'shop_address' => 'nullable|string|max:1000',
            'shop_hours' => 'nullable|string|max:1000',
            'shop_phone'   => 'nullable|string|max:50',
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


        return back()->with('success', 'Configuración guardada ✅');
    }
}

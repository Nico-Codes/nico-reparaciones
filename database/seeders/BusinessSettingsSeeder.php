<?php

namespace Database\Seeders;

use App\Models\BusinessSetting;
use Illuminate\Database\Seeder;

class BusinessSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'shop_phone'   => '',
            'shop_address' => '',
            'shop_hours'   => '',
            // opcional (lo usan tickets como fallback del nombre)
            'company_name' => config('app.name'),
        ];

        foreach ($defaults as $key => $value) {
            BusinessSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}

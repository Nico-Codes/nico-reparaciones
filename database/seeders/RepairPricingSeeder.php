<?php

namespace Database\Seeders;

use App\Models\DeviceBrand;
use App\Models\DeviceType;
use App\Models\PricingRule;
use App\Models\RepairType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RepairPricingSeeder extends Seeder
{
    public function run(): void
    {
        // Tipos de reparación base
        $types = [
            'Módulo',
            'Batería',
            'Pin de carga',
            'Mantenimiento',
        ];

        foreach ($types as $name) {
            RepairType::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'active' => true]
            );
        }

        // Ejemplo de reglas iPhone (Celular + Apple)
        $celular = DeviceType::where('slug', 'celular')->first();
        $apple = DeviceBrand::where('slug', 'apple')->first();

        if ($celular && $apple) {
            $modulo = RepairType::where('slug', Str::slug('Módulo'))->first();
            $bateria = RepairType::where('slug', Str::slug('Batería'))->first();

            // iPhone - Módulo: ganancia = max(repuesto * 0.25, 24000)
            PricingRule::updateOrCreate(
                [
                    'device_type_id' => $celular->id,
                    'device_brand_id' => $apple->id,
                    'repair_type_id' => $modulo->id,
                    'device_model_group_id' => null,
                    'device_model_id' => null,
                ],
                [
                    'mode' => 'margin',
                    'multiplier' => 0.25,
                    'min_profit' => 24000,
                    'shipping_default' => 10000,
                    'priority' => 0,
                    'active' => true,
                ]
            );

            // iPhone - Batería: ganancia = max(repuesto * 1.00, 20000)
            PricingRule::updateOrCreate(
                [
                    'device_type_id' => $celular->id,
                    'device_brand_id' => $apple->id,
                    'repair_type_id' => $bateria->id,
                    'device_model_group_id' => null,
                    'device_model_id' => null,
                ],
                [
                    'mode' => 'margin',
                    'multiplier' => 1.00,
                    'min_profit' => 20000,
                    'shipping_default' => 10000,
                    'priority' => 0,
                    'active' => true,
                ]
            );
        }
    }
}

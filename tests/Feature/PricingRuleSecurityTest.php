<?php

namespace Tests\Feature;

use App\Models\DeviceBrand;
use App\Models\DeviceModel;
use App\Models\DeviceType;
use App\Models\RepairType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingRuleSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_store_rule_with_brand_from_other_type(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $phoneType = DeviceType::create(['name' => 'Phone', 'slug' => 'phone', 'active' => true]);
        $tabletType = DeviceType::create(['name' => 'Tablet', 'slug' => 'tablet', 'active' => true]);
        $tabletBrand = DeviceBrand::create([
            'device_type_id' => $tabletType->id,
            'name' => 'TabCo',
            'slug' => 'tabco',
            'active' => true,
        ]);
        $repairType = RepairType::create(['name' => 'Pantalla', 'slug' => 'pantalla', 'active' => true]);

        $response = $this->actingAs($admin)
            ->from('/admin/precios/crear')
            ->post('/admin/precios', [
                'device_type_id' => $phoneType->id,
                'repair_type_id' => $repairType->id,
                'device_brand_id' => $tabletBrand->id,
                'mode' => 'fixed',
                'fixed_total' => 50000,
                'active' => '1',
            ]);

        $response->assertRedirect('/admin/precios/crear');
        $response->assertSessionHasErrors('device_brand_id');
        $this->assertDatabaseCount('pricing_rules', 0);
    }

    public function test_cannot_store_rule_with_model_without_brand(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $type = DeviceType::create(['name' => 'Notebook', 'slug' => 'notebook', 'active' => true]);
        $brand = DeviceBrand::create([
            'device_type_id' => $type->id,
            'name' => 'CompX',
            'slug' => 'compx',
            'active' => true,
        ]);
        $model = DeviceModel::create([
            'device_brand_id' => $brand->id,
            'name' => 'CompX 14',
            'slug' => 'compx-14',
            'active' => true,
        ]);
        $repairType = RepairType::create(['name' => 'Bateria', 'slug' => 'bateria', 'active' => true]);

        $response = $this->actingAs($admin)
            ->from('/admin/precios/crear')
            ->post('/admin/precios', [
                'device_type_id' => $type->id,
                'repair_type_id' => $repairType->id,
                'device_model_id' => $model->id,
                'mode' => 'fixed',
                'fixed_total' => 35000,
                'active' => '1',
            ]);

        $response->assertRedirect('/admin/precios/crear');
        $response->assertSessionHasErrors('device_brand_id');
        $this->assertDatabaseCount('pricing_rules', 0);
    }

    public function test_resolve_rejects_model_and_brand_mismatch(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $type = DeviceType::create(['name' => 'Consola', 'slug' => 'consola', 'active' => true]);
        $brandA = DeviceBrand::create([
            'device_type_id' => $type->id,
            'name' => 'BrandA',
            'slug' => 'branda',
            'active' => true,
        ]);
        $brandB = DeviceBrand::create([
            'device_type_id' => $type->id,
            'name' => 'BrandB',
            'slug' => 'brandb',
            'active' => true,
        ]);
        $modelB = DeviceModel::create([
            'device_brand_id' => $brandB->id,
            'name' => 'Model B1',
            'slug' => 'model-b1',
            'active' => true,
        ]);
        $repairType = RepairType::create(['name' => 'Limpieza', 'slug' => 'limpieza', 'active' => true]);

        $response = $this->actingAs($admin)->getJson('/admin/precios/resolve?' . http_build_query([
            'device_type_id' => $type->id,
            'device_brand_id' => $brandA->id,
            'device_model_id' => $modelB->id,
            'repair_type_id' => $repairType->id,
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('device_model_id');
    }
}

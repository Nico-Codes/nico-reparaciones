<?php

namespace Tests\Feature;

use App\Models\DeviceBrand;
use App\Models\DeviceIssueType;
use App\Models\DeviceModel;
use App\Models\DeviceType;
use App\Models\Repair;
use App\Models\RepairType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminRepairValidationConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_create_advanced_status_repair_without_required_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $catalog = $this->createCatalog();

        $response = $this->actingAs($admin)
            ->post(route('admin.repairs.store'), [
                'customer_name' => 'Cliente QA',
                'customer_phone' => '11 3333 2222',
                'device_type_id' => $catalog['type']->id,
                'device_brand_id' => $catalog['brand']->id,
                'device_model_id' => $catalog['model']->id,
                'device_issue_type_id' => $catalog['issue']->id,
                'repair_type_id' => $catalog['repairType']->id,
                'status' => 'ready_pickup',
                'diagnosis' => '',
                'final_price' => null,
            ]);

        $response->assertSessionHasErrors('status');
        $this->assertDatabaseCount('repairs', 0);
    }

    public function test_admin_cannot_create_repair_when_paid_amount_exceeds_final_price(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $catalog = $this->createCatalog();

        $response = $this->actingAs($admin)
            ->post(route('admin.repairs.store'), [
                'customer_name' => 'Cliente QA',
                'customer_phone' => '11 3333 2222',
                'device_type_id' => $catalog['type']->id,
                'device_brand_id' => $catalog['brand']->id,
                'device_model_id' => $catalog['model']->id,
                'device_issue_type_id' => $catalog['issue']->id,
                'repair_type_id' => $catalog['repairType']->id,
                'status' => 'diagnosing',
                'diagnosis' => 'Se detecta daño en pin de carga',
                'final_price' => 10000,
                'paid_amount' => 12000,
                'payment_method' => 'cash',
            ]);

        $response->assertSessionHasErrors('status');
        $this->assertDatabaseCount('repairs', 0);
    }

    public function test_admin_cannot_update_ready_pickup_repair_clearing_diagnosis(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $catalog = $this->createCatalog();

        $repair = $this->createRepairFixture($catalog, [
            'status' => 'ready_pickup',
            'diagnosis' => 'Cambio de modulo',
            'final_price' => 18000,
        ]);

        $response = $this->actingAs($admin)
            ->put(route('admin.repairs.update', $repair), [
                'customer_name' => 'Cliente QA',
                'customer_phone' => '11 3333 2222',
                'device_type_id' => $catalog['type']->id,
                'device_brand_id' => $catalog['brand']->id,
                'device_model_id' => $catalog['model']->id,
                'device_issue_type_id' => $catalog['issue']->id,
                'issue_detail' => '',
                'diagnosis' => '',
                'parts_cost' => 1000,
                'labor_cost' => 2000,
                'final_price' => 18000,
                'paid_amount' => 0,
                'payment_method' => null,
                'payment_notes' => '',
                'warranty_days' => 30,
                'notes' => 'Nota de prueba',
            ]);

        $response->assertSessionHasErrors('repair');

        $repair->refresh();
        $this->assertSame('Cambio de modulo', (string) $repair->diagnosis);
        $this->assertSame('ready_pickup', (string) $repair->status);
    }

    public function test_admin_cannot_update_repair_with_paid_amount_without_payment_method(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $catalog = $this->createCatalog();

        $repair = $this->createRepairFixture($catalog, [
            'status' => 'repairing',
            'diagnosis' => 'Pendiente de repuesto',
            'final_price' => 20000,
        ]);

        $response = $this->actingAs($admin)
            ->put(route('admin.repairs.update', $repair), [
                'customer_name' => 'Cliente QA',
                'customer_phone' => '11 3333 2222',
                'device_type_id' => $catalog['type']->id,
                'device_brand_id' => $catalog['brand']->id,
                'device_model_id' => $catalog['model']->id,
                'device_issue_type_id' => $catalog['issue']->id,
                'issue_detail' => '',
                'diagnosis' => 'Pendiente de repuesto',
                'parts_cost' => 1000,
                'labor_cost' => 2000,
                'final_price' => 20000,
                'paid_amount' => 5000,
                'payment_method' => null,
                'payment_notes' => '',
                'warranty_days' => 0,
                'notes' => 'Nota de prueba',
            ]);

        $response->assertSessionHasErrors('repair');

        $repair->refresh();
        $this->assertSame(0.0, (float) $repair->paid_amount);
    }

    /**
     * @return array{type:DeviceType,brand:DeviceBrand,model:DeviceModel,issue:DeviceIssueType,repairType:RepairType}
     */
    private function createCatalog(): array
    {
        $suffix = Str::lower(Str::random(6));

        $type = DeviceType::create([
            'name' => 'Celulares '.$suffix,
            'slug' => 'cel-'.$suffix,
            'active' => 1,
        ]);

        $brand = DeviceBrand::create([
            'device_type_id' => $type->id,
            'name' => 'Marca '.$suffix,
            'slug' => 'marca-'.$suffix,
            'active' => 1,
        ]);

        $model = DeviceModel::create([
            'device_brand_id' => $brand->id,
            'name' => 'Modelo '.$suffix,
            'slug' => 'modelo-'.$suffix,
            'active' => 1,
        ]);

        $issue = DeviceIssueType::create([
            'device_type_id' => $type->id,
            'name' => 'Pantalla '.$suffix,
            'slug' => 'pantalla-'.$suffix,
            'active' => 1,
        ]);

        $repairType = RepairType::create([
            'name' => 'Servicio '.$suffix,
            'slug' => 'servicio-'.$suffix,
            'active' => 1,
        ]);

        return compact('type', 'brand', 'model', 'issue', 'repairType');
    }

    /**
     * @param  array{type:DeviceType,brand:DeviceBrand,model:DeviceModel,issue:DeviceIssueType,repairType:RepairType}  $catalog
     * @param  array<string,mixed>  $overrides
     */
    private function createRepairFixture(array $catalog, array $overrides = []): Repair
    {
        return Repair::create(array_merge([
            'code' => 'R-TST-' . Str::upper(Str::random(8)),
            'customer_name' => 'Cliente QA',
            'customer_phone' => '11 3333 2222',
            'device_type_id' => $catalog['type']->id,
            'device_brand_id' => $catalog['brand']->id,
            'device_model_id' => $catalog['model']->id,
            'device_brand' => $catalog['brand']->name,
            'device_model' => $catalog['model']->name,
            'device_issue_type_id' => $catalog['issue']->id,
            'repair_type_id' => $catalog['repairType']->id,
            'issue_reported' => $catalog['issue']->name,
            'diagnosis' => null,
            'parts_cost' => 0,
            'labor_cost' => 0,
            'final_price' => null,
            'paid_amount' => 0,
            'payment_method' => null,
            'payment_notes' => null,
            'status' => 'received',
            'warranty_days' => 0,
            'received_at' => now(),
            'notes' => null,
        ], $overrides));
    }
}

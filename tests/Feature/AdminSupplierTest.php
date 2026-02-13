<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\WarrantyIncident;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_suppliers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $create = $this->actingAs($admin)->post(route('admin.suppliers.store'), [
            'name' => 'Proveedor Centro',
            'phone' => '3511234567',
            'notes' => 'Entrega los martes',
        ]);

        $create->assertRedirect();
        $supplier = Supplier::query()->first();
        $this->assertNotNull($supplier);
        $this->assertSame('Proveedor Centro', $supplier->name);

        $update = $this->actingAs($admin)->put(route('admin.suppliers.update', $supplier), [
            'name' => 'Proveedor Centro SRL',
            'phone' => '351000000',
            'notes' => 'Actualizado',
        ]);
        $update->assertRedirect();

        $supplier->refresh();
        $this->assertSame('Proveedor Centro SRL', $supplier->name);
        $this->assertTrue($supplier->active);

        $toggle = $this->actingAs($admin)->post(route('admin.suppliers.toggle', $supplier));
        $toggle->assertRedirect();
        $supplier->refresh();
        $this->assertFalse($supplier->active);
    }

    public function test_supplier_score_uses_expired_warranty_success_rate(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::query()->create([
            'name' => 'Proveedor Test Score',
            'active' => true,
        ]);

        $successRepair = Repair::query()->create([
            'code' => 'R-SUP-OK',
            'supplier_id' => $supplier->id,
            'customer_name' => 'Cliente Uno',
            'customer_phone' => '3511111111',
            'issue_reported' => 'Pantalla rota',
            'status' => 'delivered',
            'delivered_at' => now()->subDays(120),
            'warranty_days' => 100,
        ]);

        $failedRepair = Repair::query()->create([
            'code' => 'R-SUP-FAIL',
            'supplier_id' => $supplier->id,
            'customer_name' => 'Cliente Dos',
            'customer_phone' => '3512222222',
            'issue_reported' => 'Bateria',
            'status' => 'delivered',
            'delivered_at' => now()->subDays(120),
            'warranty_days' => 100,
        ]);

        WarrantyIncident::query()->create([
            'source_type' => 'repair',
            'status' => 'closed',
            'title' => 'Falla en garantia',
            'repair_id' => $failedRepair->id,
            'supplier_id' => $supplier->id,
            'quantity' => 1,
            'unit_cost' => 10000,
            'extra_cost' => 0,
            'recovered_amount' => 0,
            'loss_amount' => 10000,
            'happened_at' => $failedRepair->delivered_at->copy()->addDays(20),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.index'));

        $response->assertOk();
        $response->assertSee('1/2');
        $response->assertSee('50% exito');
        $this->assertNotNull($successRepair->id);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\WarrantyIncident;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
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

    public function test_admin_can_import_default_suppliers_catalog(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.suppliers.import_defaults'));
        $response->assertRedirect();

        $this->assertDatabaseHas('suppliers', [
            'name' => 'PuntoCell',
            'search_enabled' => 1,
            'search_mode' => 'html',
            'active' => 1,
        ]);

        $this->assertDatabaseHas('suppliers', [
            'name' => 'Tienda Movil Rosario',
            'search_enabled' => 1,
            'search_mode' => 'html',
            'active' => 1,
        ]);
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

    public function test_admin_can_probe_supplier_search_from_list(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::query()->create([
            'name' => 'Proveedor Probe',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'html',
            'search_endpoint' => 'https://probe-supplier.test/?s={query}&post_type=product',
            'search_config' => [
                'candidate_paths' => ['/producto/'],
            ],
        ]);

        Http::fake([
            'probe-supplier.test/*' => Http::response('
                <div class="item">
                    <a href="https://probe-supplier.test/producto/modulo-a30/">Modulo A30</a>
                    <span class="price">$ 12345</span>
                </div>
            ', 200),
        ]);

        $response = $this->actingAs($admin)->post(route('admin.suppliers.probe', $supplier), [
            'q' => 'modulo a30',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('supplier_probe', function ($probe) use ($supplier) {
            return is_array($probe)
                && (int) ($probe['supplier_id'] ?? 0) === (int) $supplier->id
                && (int) ($probe['count'] ?? 0) === 1;
        });

        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'last_probe_status' => 'ok',
            'last_probe_query' => 'modulo a30',
            'last_probe_count' => 1,
        ]);
    }

    public function test_admin_can_reorder_supplier_search_priority(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $a = Supplier::query()->create(['name' => 'A', 'active' => true, 'search_priority' => 100]);
        $b = Supplier::query()->create(['name' => 'B', 'active' => true, 'search_priority' => 200]);
        $c = Supplier::query()->create(['name' => 'C', 'active' => true, 'search_priority' => 300]);

        $response = $this->actingAs($admin)->post(route('admin.suppliers.reorder'), [
            'ordered_ids' => json_encode([$c->id, $a->id, $b->id]),
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('suppliers', ['id' => $c->id, 'search_priority' => 10]);
        $this->assertDatabaseHas('suppliers', ['id' => $a->id, 'search_priority' => 20]);
        $this->assertDatabaseHas('suppliers', ['id' => $b->id, 'search_priority' => 30]);
    }
}

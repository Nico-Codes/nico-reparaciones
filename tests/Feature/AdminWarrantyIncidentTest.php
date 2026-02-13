<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Repair;
use App\Models\User;
use App\Models\WarrantyIncident;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminWarrantyIncidentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_warranty_incident_and_close_it(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $repair = Repair::query()->create([
            'code' => 'R-100',
            'customer_name' => 'Cliente Test',
            'customer_phone' => '1122334455',
            'issue_reported' => 'Pantalla con fallas',
            'status' => 'received',
        ]);

        $response = $this->actingAs($admin)->post(route('admin.warranty_incidents.store'), [
            'source_type' => 'repair',
            'title' => 'Cambio en garantia',
            'reason' => 'Defecto de modulo',
            'repair_id' => $repair->id,
            'quantity' => 2,
            'unit_cost' => 12000,
            'extra_cost' => 3000,
            'recovered_amount' => 5000,
            'notes' => 'Se reemplazaron dos modulos',
        ]);

        $response->assertRedirect(route('admin.warranty_incidents.index'));

        $incident = WarrantyIncident::query()->first();
        $this->assertNotNull($incident);
        $this->assertSame(22000, (int) $incident->loss_amount);
        $this->assertSame('open', (string) $incident->status);

        $closeResponse = $this->actingAs($admin)->post(route('admin.warranty_incidents.close', $incident));
        $closeResponse->assertRedirect();

        $incident->refresh();
        $this->assertSame('closed', (string) $incident->status);
        $this->assertNotNull($incident->resolved_at);
    }

    public function test_product_source_requires_product_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $categoryId = \DB::table('categories')->insertGetId([
            'name' => 'Cables',
            'slug' => 'cables-' . Str::random(6),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Product::query()->create([
            'category_id' => $categoryId,
            'name' => 'Cable test',
            'slug' => 'cable-test-' . Str::random(6),
            'sku' => 'CAB-01',
            'price' => 1000,
            'cost_price' => 800,
            'stock' => 10,
        ]);

        $response = $this->actingAs($admin)
            ->from(route('admin.warranty_incidents.create'))
            ->post(route('admin.warranty_incidents.store'), [
                'source_type' => 'product',
                'title' => 'Garantia sin producto',
                'quantity' => 1,
                'unit_cost' => 1000,
            ]);

        $response->assertRedirect(route('admin.warranty_incidents.create'));
        $response->assertSessionHasErrors('product_id');
    }

    public function test_unit_cost_is_resolved_automatically_from_repair_parts_cost(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $repair = Repair::query()->create([
            'code' => 'R-AUTO-01',
            'customer_name' => 'Cliente Auto',
            'customer_phone' => '1133445566',
            'issue_reported' => 'Modulo dañado',
            'status' => 'delivered',
            'parts_cost' => 15300,
            'warranty_days' => 90,
            'delivered_at' => now()->subDays(10),
        ]);

        $response = $this->actingAs($admin)->post(route('admin.warranty_incidents.store'), [
            'source_type' => 'repair',
            'title' => 'Garantia sin costo manual',
            'repair_id' => $repair->id,
            'quantity' => 1,
            'extra_cost' => 0,
            'recovered_amount' => 0,
        ]);

        $response->assertRedirect(route('admin.warranty_incidents.index'));

        $incident = WarrantyIncident::query()->latest('id')->first();
        $this->assertNotNull($incident);
        $this->assertSame(15300, (int) $incident->unit_cost);
        $this->assertSame(15300, (int) $incident->loss_amount);
    }
}

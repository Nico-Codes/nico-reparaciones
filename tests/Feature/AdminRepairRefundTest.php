<?php

namespace Tests\Feature;

use App\Models\Repair;
use App\Models\Supplier;
use App\Models\User;
use App\Models\WarrantyIncident;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRepairRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_register_total_refund_and_auto_create_warranty_loss(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supplier = Supplier::query()->create([
            'name' => 'Proveedor Reembolsos',
            'active' => true,
        ]);

        $repair = Repair::query()->create([
            'code' => 'R-REFUND-01',
            'supplier_id' => $supplier->id,
            'customer_name' => 'Pepito',
            'customer_phone' => '3511231234',
            'issue_reported' => 'Modulo roto',
            'status' => 'delivered',
            'final_price' => 48000,
            'paid_amount' => 48000,
            'warranty_days' => 90,
            'delivered_at' => now()->subDays(5),
        ]);

        $response = $this->actingAs($admin)->post(route('admin.repairs.refundTotal', $repair), [
            'refund_reason' => 'No se consigue el modulo de reemplazo',
            'refunded_amount' => 48000,
            'notes' => 'Se devuelve total al cliente.',
        ]);

        $response->assertRedirect();

        $repair->refresh();
        $this->assertTrue((bool) $repair->refunded_total);
        $this->assertSame(48000, (int) $repair->refunded_amount);
        $this->assertSame('No se consigue el modulo de reemplazo', (string) $repair->refund_reason);
        $this->assertNotNull($repair->refunded_at);

        $incident = WarrantyIncident::query()->where('repair_id', $repair->id)->latest('id')->first();
        $this->assertNotNull($incident);
        $this->assertSame('closed', (string) $incident->status);
        $this->assertSame('Reembolso total por garantia', (string) $incident->title);
        $this->assertSame(48000, (int) $incident->unit_cost);
        $this->assertSame(48000, (int) $incident->loss_amount);
        $this->assertSame('manual', (string) $incident->cost_origin);

        $this->assertDatabaseHas('ledger_entries', [
            'event_key' => 'repair_refund_total:' . $repair->id,
            'direction' => 'outflow',
            'category' => 'repair_refund_total',
            'amount' => 48000,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminLedgerIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_ledger_with_totals_and_filters(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        LedgerEntry::query()->create([
            'happened_at' => now()->subDays(1),
            'direction' => 'inflow',
            'amount' => 15000,
            'category' => 'quick_sale',
            'description' => 'Venta mostrador',
            'event_key' => 'test:inflow:1',
            'created_by' => $admin->id,
        ]);

        LedgerEntry::query()->create([
            'happened_at' => now()->subDays(1),
            'direction' => 'outflow',
            'amount' => 4000,
            'category' => 'warranty_loss',
            'description' => 'Garantia modulo',
            'event_key' => 'test:outflow:1',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.ledger.index', [
            'from' => now()->subDays(3)->format('Y-m-d'),
            'to' => now()->format('Y-m-d'),
        ]));

        $response->assertOk();
        $response->assertSee('Contabilidad');
        $response->assertSee('Resultado por categoría');
        $response->assertSee('quick_sale');
        $response->assertSee('warranty_loss');
        $response->assertSee('$ 15.000');
        $response->assertSee('$ 4.000');
        $response->assertSee('$ 11.000');

        $filtered = $this->actingAs($admin)->get(route('admin.ledger.index', [
            'direction' => 'outflow',
            'from' => now()->subDays(3)->format('Y-m-d'),
            'to' => now()->format('Y-m-d'),
        ]));
        $filtered->assertOk();
        $filtered->assertSee('warranty_loss');
        $filtered->assertSee('$ 4.000');
        $filtered->assertDontSee('$ 15.000');
    }
}

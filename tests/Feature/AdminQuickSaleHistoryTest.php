<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminQuickSaleHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_quick_sale_history_and_export(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'user']);

        Order::query()->create([
            'user_id' => $customer->id,
            'status' => 'entregado',
            'payment_method' => 'local',
            'total' => 10000,
            'pickup_name' => 'Mostrador',
            'pickup_phone' => '3415550000',
            'is_quick_sale' => true,
            'quick_sale_admin_id' => $admin->id,
        ]);

        Order::query()->create([
            'user_id' => $customer->id,
            'status' => 'entregado',
            'payment_method' => 'local',
            'total' => 5000,
            'pickup_name' => 'Web',
            'pickup_phone' => '3415551111',
            'is_quick_sale' => false,
        ]);

        $history = $this->actingAs($admin)->get(route('admin.quick_sales.history', [
            'from' => now()->format('Y-m-d'),
            'to' => now()->format('Y-m-d'),
        ]));

        $history
            ->assertOk()
            ->assertSee('Historial de ventas rapidas')
            ->assertSee('#1')
            ->assertDontSee('#2');

        $csv = $this->actingAs($admin)->get(route('admin.quick_sales.export_csv', [
            'from' => now()->format('Y-m-d'),
            'to' => now()->format('Y-m-d'),
        ]));

        $csv
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $xlsx = $this->actingAs($admin)->get(route('admin.quick_sales.export_xlsx', [
            'from' => now()->format('Y-m-d'),
            'to' => now()->format('Y-m-d'),
        ]));

        $xlsx
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}

<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdminDashboardOperationalAlertsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_operational_alert_thresholds_from_business_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.update'), [
            'ops_alert_order_stale_hours' => 36,
            'ops_alert_repair_stale_days' => 5,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_alert_order_stale_hours',
            'value' => '36',
        ]);

        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_alert_repair_stale_days',
            'value' => '5',
        ]);
    }

    public function test_dashboard_calculates_operational_stale_alerts_using_thresholds(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create();

            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);
            BusinessSetting::updateOrCreate(['key' => 'ops_alert_repair_stale_days'], ['value' => '3']);

            $oldOrder = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 1500,
                'pickup_name' => 'Cliente alerta pedido',
                'pickup_phone' => '3415551000',
            ]);
            $oldOrder->forceFill([
                'created_at' => now()->copy()->subHours(30),
                'updated_at' => now()->copy()->subHours(30),
            ])->saveQuietly();

            $recentOrder = Order::create([
                'user_id' => $customer->id,
                'status' => 'confirmado',
                'payment_method' => 'local',
                'total' => 1800,
                'pickup_name' => 'Cliente reciente',
                'pickup_phone' => '3415551001',
            ]);
            $recentOrder->forceFill([
                'created_at' => now()->copy()->subHours(6),
                'updated_at' => now()->copy()->subHours(6),
            ])->saveQuietly();

            $oldRepair = Repair::create([
                'code' => 'R-ALERT-001',
                'user_id' => $customer->id,
                'customer_name' => 'Cliente alerta reparacion',
                'customer_phone' => '3415552000',
                'issue_reported' => 'Pantalla',
                'status' => 'diagnosing',
                'received_at' => now()->copy()->subDays(5),
            ]);
            $oldRepair->forceFill([
                'created_at' => now()->copy()->subDays(5),
                'updated_at' => now()->copy()->subDays(5),
            ])->saveQuietly();

            $recentRepair = Repair::create([
                'code' => 'R-ALERT-002',
                'user_id' => $customer->id,
                'customer_name' => 'Cliente reciente reparacion',
                'customer_phone' => '3415552001',
                'issue_reported' => 'Bateria',
                'status' => 'repairing',
                'received_at' => now()->copy()->subDays(1),
            ]);
            $recentRepair->forceFill([
                'created_at' => now()->copy()->subDays(1),
                'updated_at' => now()->copy()->subDays(1),
            ])->saveQuietly();

            $response = $this->actingAs($admin)->get(route('admin.dashboard'));
            $response->assertOk();

            $this->assertSame(24, (int) $response->viewData('orderStaleHours'));
            $this->assertSame(3, (int) $response->viewData('repairStaleDays'));
            $this->assertSame(1, (int) $response->viewData('ordersStaleCount'));
            $this->assertSame(1, (int) $response->viewData('repairsStaleCount'));

            $ordersStaleList = $response->viewData('ordersStaleList');
            $repairsStaleList = $response->viewData('repairsStaleList');

            $this->assertSame($oldOrder->id, (int) $ordersStaleList->first()->id);
            $this->assertSame($oldRepair->id, (int) $repairsStaleList->first()->id);
        } finally {
            Carbon::setTestNow();
        }
    }
}


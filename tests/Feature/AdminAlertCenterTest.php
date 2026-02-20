<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdminAlertCenterTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_alert_center_with_active_alerts(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create();

            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);

            $order = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 2200,
                'pickup_name' => 'Cliente alert center',
                'pickup_phone' => '3415556611',
            ]);
            $order->forceFill([
                'created_at' => now()->copy()->subHours(30),
                'updated_at' => now()->copy()->subHours(30),
            ])->saveQuietly();

            $response = $this->actingAs($admin)->get(route('admin.alerts.index'));
            $response->assertOk();
            $response->assertSee('Centro de alertas');
            $response->assertSee('Pedidos demorados');
            $response->assertSee('Nueva');
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_admin_can_mark_single_alert_as_seen(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create();

            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);

            $order = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 2200,
                'pickup_name' => 'Cliente alert center',
                'pickup_phone' => '3415556611',
            ]);
            $order->forceFill([
                'created_at' => now()->copy()->subHours(30),
                'updated_at' => now()->copy()->subHours(30),
            ])->saveQuietly();

            $response = $this->actingAs($admin)->post(route('admin.alerts.mark_seen', ['alertKey' => 'orders_stale']));
            $response->assertRedirect();
            $response->assertSessionHas('success');

            $settingKey = 'admin_alert_center_seen_user_' . $admin->id;
            $this->assertDatabaseHas('business_settings', ['key' => $settingKey]);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_non_admin_cannot_access_alert_center(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $index = $this->actingAs($user)->get(route('admin.alerts.index'));
        $index->assertForbidden();

        $markSeen = $this->actingAs($user)->post(route('admin.alerts.mark_seen', ['alertKey' => 'orders_stale']));
        $markSeen->assertForbidden();

        $markAll = $this->actingAs($user)->post(route('admin.alerts.mark_all_seen'));
        $markAll->assertForbidden();
    }
}


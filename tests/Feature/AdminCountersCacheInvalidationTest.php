<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderWhatsappLog;
use App\Models\Repair;
use App\Models\RepairWhatsappLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AdminCountersCacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_orders_counters_are_invalidated_after_whatsapp_log_create(): void
    {
        Cache::flush();

        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['phone' => '11 2222 3333']);

        $order = Order::create([
            'user_id' => $customer->id,
            'status' => 'confirmado',
            'payment_method' => 'local',
            'total' => 1500,
            'pickup_name' => 'Cliente Uno',
            'pickup_phone' => '11 2222 3333',
        ]);

        $first = $this->actingAs($admin)->get(route('admin.orders.index', ['status' => 'confirmado']));
        $first->assertOk();

        $firstWaCounts = $first->viewData('waCounts');
        $this->assertSame(1, (int) ($firstWaCounts['pending'] ?? 0));
        $this->assertSame(0, (int) ($firstWaCounts['sent'] ?? 0));

        OrderWhatsappLog::create([
            'order_id' => $order->id,
            'notified_status' => 'confirmado',
            'phone' => '5491122223333',
            'message' => 'Enviado',
            'sent_by' => $admin->id,
            'sent_at' => now(),
        ]);

        $second = $this->actingAs($admin)->get(route('admin.orders.index', ['status' => 'confirmado']));
        $second->assertOk();

        $secondWaCounts = $second->viewData('waCounts');
        $this->assertSame(0, (int) ($secondWaCounts['pending'] ?? 0));
        $this->assertSame(1, (int) ($secondWaCounts['sent'] ?? 0));
    }

    public function test_repairs_counters_are_invalidated_after_whatsapp_log_create(): void
    {
        Cache::flush();

        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'customer_name' => 'Cliente Dos',
            'customer_phone' => '11 9999 0000',
            'issue_reported' => 'No enciende',
            'status' => 'received',
            'received_at' => now(),
        ]);

        $first = $this->actingAs($admin)->get(route('admin.repairs.index', ['wa' => 'pending']));
        $first->assertOk();

        $firstStatusCounts = $first->viewData('statusCounts');
        $this->assertSame(1, (int) ($firstStatusCounts['received'] ?? 0));

        RepairWhatsappLog::create([
            'repair_id' => $repair->id,
            'notified_status' => 'received',
            'phone' => '5491199990000',
            'message' => 'Enviado',
            'sent_by' => $admin->id,
            'sent_at' => now(),
        ]);

        $second = $this->actingAs($admin)->get(route('admin.repairs.index', ['wa' => 'pending']));
        $second->assertOk();

        $secondStatusCounts = $second->viewData('statusCounts');
        $this->assertSame(0, (int) ($secondStatusCounts['received'] ?? 0));
    }
}

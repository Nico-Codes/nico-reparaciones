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

class StatusWhatsappConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_status_change_requires_new_whatsapp_log_for_current_status_and_blocks_rollback(): void
    {
        Cache::flush();

        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['phone' => '11 2222 3333']);

        $order = Order::create([
            'user_id' => $customer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1200,
            'pickup_name' => 'Cliente Estado',
            'pickup_phone' => '11 2222 3333',
        ]);

        OrderWhatsappLog::create([
            'order_id' => $order->id,
            'notified_status' => 'pendiente',
            'phone' => '5491122223333',
            'message' => 'Aviso pendiente',
            'sent_by' => $admin->id,
            'sent_at' => now(),
        ]);

        $before = $this->actingAs($admin)->get(route('admin.orders.index', [
            'status' => 'pendiente',
        ]));
        $before->assertOk();

        $beforeWaCounts = $before->viewData('waCounts');
        $this->assertSame(0, (int) ($beforeWaCounts['pending'] ?? 0));
        $this->assertSame(1, (int) ($beforeWaCounts['sent'] ?? 0));

        $beforeRow = $before->viewData('orders')->getCollection()->firstWhere('id', $order->id);
        $this->assertNotNull($beforeRow);
        $this->assertSame(1, (int) ($beforeRow->wa_notified_current ?? 0));

        $update = $this->actingAs($admin)->postJson(
            route('admin.orders.updateStatus', $order),
            ['status' => 'confirmado']
        );

        $update->assertOk()->assertJson([
            'ok' => true,
            'changed' => true,
            'from_status' => 'pendiente',
            'to_status' => 'confirmado',
            'status' => 'confirmado',
        ]);

        $after = $this->actingAs($admin)->get(route('admin.orders.index', [
            'status' => 'confirmado',
        ]));
        $after->assertOk();

        $afterWaCounts = $after->viewData('waCounts');
        $this->assertSame(1, (int) ($afterWaCounts['pending'] ?? 0));
        $this->assertSame(0, (int) ($afterWaCounts['sent'] ?? 0));

        $afterRow = $after->viewData('orders')->getCollection()->firstWhere('id', $order->id);
        $this->assertNotNull($afterRow);
        $this->assertSame(0, (int) ($afterRow->wa_notified_current ?? 0));

        $rollback = $this->actingAs($admin)->postJson(
            route('admin.orders.updateStatus', $order),
            ['status' => 'pendiente']
        );

        $rollback->assertStatus(422)->assertJson([
            'ok' => false,
            'changed' => false,
            'status' => 'confirmado',
        ]);

        $order->refresh();
        $this->assertSame('confirmado', $order->status);
        $this->assertDatabaseMissing('order_whatsapp_logs', [
            'order_id' => $order->id,
            'notified_status' => 'confirmado',
        ]);
    }

    public function test_repair_status_change_requires_new_whatsapp_log_for_current_status_and_blocks_rollback(): void
    {
        Cache::flush();

        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'customer_name' => 'Cliente Repair',
            'customer_phone' => '11 9999 0000',
            'issue_reported' => 'No enciende',
            'status' => 'received',
            'received_at' => now(),
        ]);

        RepairWhatsappLog::create([
            'repair_id' => $repair->id,
            'notified_status' => 'received',
            'phone' => '5491199990000',
            'message' => 'Aviso recibido',
            'sent_by' => $admin->id,
            'sent_at' => now(),
        ]);

        $before = $this->actingAs($admin)->get(route('admin.repairs.index', [
            'status' => 'received',
            'wa' => 'sent',
        ]));
        $before->assertOk();

        $beforeStatusCounts = $before->viewData('statusCounts');
        $this->assertSame(1, (int) ($beforeStatusCounts['received'] ?? 0));

        $beforeRow = $before->viewData('repairs')->getCollection()->firstWhere('id', $repair->id);
        $this->assertNotNull($beforeRow);
        $this->assertSame(1, (int) ($beforeRow->wa_notified_current ?? 0));

        $update = $this->actingAs($admin)->postJson(
            route('admin.repairs.updateStatus', $repair),
            ['status' => 'diagnosing']
        );

        $update->assertOk()->assertJson([
            'ok' => true,
            'changed' => true,
            'from_status' => 'received',
            'to_status' => 'diagnosing',
            'status' => 'diagnosing',
        ]);

        $after = $this->actingAs($admin)->get(route('admin.repairs.index', [
            'status' => 'diagnosing',
            'wa' => 'pending',
        ]));
        $after->assertOk();

        $afterStatusCounts = $after->viewData('statusCounts');
        $this->assertSame(1, (int) ($afterStatusCounts['diagnosing'] ?? 0));

        $afterRow = $after->viewData('repairs')->getCollection()->firstWhere('id', $repair->id);
        $this->assertNotNull($afterRow);
        $this->assertSame(0, (int) ($afterRow->wa_notified_current ?? 0));

        $rollback = $this->actingAs($admin)->postJson(
            route('admin.repairs.updateStatus', $repair),
            ['status' => 'received']
        );

        $rollback->assertStatus(422)->assertJson([
            'ok' => false,
            'changed' => false,
            'status' => 'diagnosing',
        ]);

        $repair->refresh();
        $this->assertSame('diagnosing', $repair->status);
        $this->assertDatabaseMissing('repair_whatsapp_logs', [
            'repair_id' => $repair->id,
            'notified_status' => 'diagnosing',
        ]);
    }
}


<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderWhatsappLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrderCountersTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_counts_respect_active_whatsapp_filter(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $userWithPhone = User::factory()->create(['phone' => '11 1111 1111']);
        $userNoPhone = User::factory()->create(['phone' => null]);

        Order::create([
            'user_id' => $userWithPhone->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1000,
            'pickup_name' => 'Pedido Pendiente',
            'pickup_phone' => '11 2222 3333',
        ]);

        $sentOrder = Order::create([
            'user_id' => $userWithPhone->id,
            'status' => 'confirmado',
            'payment_method' => 'local',
            'total' => 2000,
            'pickup_name' => 'Pedido Confirmado',
            'pickup_phone' => '11 4444 5555',
        ]);

        Order::create([
            'user_id' => $userNoPhone->id,
            'status' => 'confirmado',
            'payment_method' => 'local',
            'total' => 3000,
            'pickup_name' => 'Pedido Sin Telefono',
            'pickup_phone' => '',
        ]);

        OrderWhatsappLog::create([
            'order_id' => $sentOrder->id,
            'notified_status' => 'confirmado',
            'phone' => '5491144445555',
            'message' => 'Enviado',
            'sent_by' => $admin->id,
            'sent_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.orders.index', ['wa' => 'sent']));

        $response->assertOk();

        $statusCounts = $response->viewData('statusCounts');
        $totalCount = (int) $response->viewData('totalCount');

        $this->assertSame(1, (int) ($statusCounts['confirmado'] ?? 0));
        $this->assertSame(1, $totalCount);
    }

    public function test_whatsapp_counts_respect_active_status_filter_and_flag_current_notification(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $userWithPhone = User::factory()->create(['phone' => '11 1111 1111']);
        $userNoPhone = User::factory()->create(['phone' => null]);

        $sentOrder = Order::create([
            'user_id' => $userWithPhone->id,
            'status' => 'confirmado',
            'payment_method' => 'local',
            'total' => 2000,
            'pickup_name' => 'Pedido Confirmado',
            'pickup_phone' => '11 4444 5555',
        ]);

        $noPhoneOrder = Order::create([
            'user_id' => $userNoPhone->id,
            'status' => 'confirmado',
            'payment_method' => 'local',
            'total' => 3000,
            'pickup_name' => 'Pedido Sin Telefono',
            'pickup_phone' => '',
        ]);

        // Fuera de status=confirmado, no debe impactar waCounts para ese filtro.
        Order::create([
            'user_id' => $userWithPhone->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1500,
            'pickup_name' => 'Pedido Pendiente',
            'pickup_phone' => '11 2222 3333',
        ]);

        OrderWhatsappLog::create([
            'order_id' => $sentOrder->id,
            'notified_status' => 'confirmado',
            'phone' => '5491144445555',
            'message' => 'Enviado',
            'sent_by' => $admin->id,
            'sent_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.orders.index', ['status' => 'confirmado']));

        $response->assertOk();

        $waCounts = $response->viewData('waCounts');
        $orders = $response->viewData('orders');

        $this->assertSame(2, (int) ($waCounts['all'] ?? 0));
        $this->assertSame(0, (int) ($waCounts['pending'] ?? 0));
        $this->assertSame(1, (int) ($waCounts['sent'] ?? 0));
        $this->assertSame(1, (int) ($waCounts['no_phone'] ?? 0));

        $sentRow = $orders->getCollection()->firstWhere('id', $sentOrder->id);
        $noPhoneRow = $orders->getCollection()->firstWhere('id', $noPhoneOrder->id);

        $this->assertNotNull($sentRow);
        $this->assertNotNull($noPhoneRow);
        $this->assertSame(1, (int) ($sentRow->wa_notified_current ?? 0));
        $this->assertSame(0, (int) ($noPhoneRow->wa_notified_current ?? 0));
    }
}


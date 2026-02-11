<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatusTransitionRulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_order_rejects_invalid_transition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create();

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1500,
            'pickup_name' => 'Cliente',
            'pickup_phone' => '11 4444 5555',
        ]);

        $response = $this->actingAs($admin)->postJson(
            route('admin.orders.updateStatus', $order),
            ['status' => 'entregado']
        );

        $response->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'changed' => false,
                'status' => 'pendiente',
            ]);

        $this->assertStringContainsString('Cambio de estado inválido', (string) $response->json('message'));
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'pendiente',
        ]);
    }

    public function test_admin_order_allows_valid_transition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create();

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1500,
            'pickup_name' => 'Cliente',
            'pickup_phone' => '11 4444 5555',
        ]);

        $response = $this->actingAs($admin)->postJson(
            route('admin.orders.updateStatus', $order),
            ['status' => 'confirmado']
        );

        $response->assertOk()
            ->assertJson([
                'ok' => true,
                'changed' => true,
                'from_status' => 'pendiente',
                'to_status' => 'confirmado',
                'status' => 'confirmado',
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'confirmado',
        ]);
    }

    public function test_admin_repair_rejects_invalid_transition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 2222',
            'issue_reported' => 'No enciende',
            'status' => 'received',
        ]);

        $response = $this->actingAs($admin)->postJson(
            route('admin.repairs.updateStatus', $repair),
            ['status' => 'delivered']
        );

        $response->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'changed' => false,
                'status' => 'received',
            ]);

        $this->assertStringContainsString('Cambio de estado inválido', (string) $response->json('message'));
        $this->assertDatabaseHas('repairs', [
            'id' => $repair->id,
            'status' => 'received',
        ]);
    }

    public function test_admin_repair_allows_valid_transition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 2222',
            'issue_reported' => 'No enciende',
            'status' => 'ready_pickup',
            'diagnosis' => 'Cambio de modulo de carga',
            'final_price' => 25000,
        ]);

        $response = $this->actingAs($admin)->postJson(
            route('admin.repairs.updateStatus', $repair),
            ['status' => 'delivered']
        );

        $response->assertOk()
            ->assertJson([
                'ok' => true,
                'changed' => true,
                'from_status' => 'ready_pickup',
                'to_status' => 'delivered',
                'status' => 'delivered',
            ]);

        $this->assertDatabaseHas('repairs', [
            'id' => $repair->id,
            'status' => 'delivered',
        ]);
    }

    public function test_admin_repair_rejects_waiting_approval_without_final_price_or_diagnosis(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 2222',
            'issue_reported' => 'No enciende',
            'status' => 'diagnosing',
        ]);

        $response = $this->actingAs($admin)->postJson(
            route('admin.repairs.updateStatus', $repair),
            ['status' => 'waiting_approval']
        );

        $response->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'changed' => false,
                'status' => 'diagnosing',
            ]);

        $this->assertStringContainsString('diagnostico', (string) $response->json('message'));
    }

    public function test_admin_repair_rejects_delivered_when_paid_amount_has_no_method(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 2222',
            'issue_reported' => 'No enciende',
            'status' => 'ready_pickup',
            'diagnosis' => 'Reemplazo de bateria',
            'final_price' => 30000,
            'paid_amount' => 5000,
            'payment_method' => null,
        ]);

        $response = $this->actingAs($admin)->postJson(
            route('admin.repairs.updateStatus', $repair),
            ['status' => 'delivered']
        );

        $response->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'changed' => false,
                'status' => 'ready_pickup',
            ]);

        $this->assertStringContainsString('metodo de pago', (string) $response->json('message'));

        $this->assertDatabaseHas('repairs', [
            'id' => $repair->id,
            'status' => 'ready_pickup',
        ]);
    }
}

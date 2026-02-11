<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdminDashboardBusinessKpiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_exposes_business_kpis_for_selected_range(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 11, 12, 0, 0));

        try {
            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create(['phone' => '3415559999']);

            $createOrder = function (array $attributes, int $daysAgo): void {
                $order = Order::create($attributes);
                $stamp = now()->copy()->subDays($daysAgo);
                $order->forceFill(['created_at' => $stamp, 'updated_at' => $stamp])->saveQuietly();
            };

            $createRepair = function (
                array $attributes,
                int $createdDaysAgo,
                ?int $updatedDaysAgo = null
            ): void {
                $repair = Repair::create($attributes);
                $createdAt = now()->copy()->subDays($createdDaysAgo);
                $updatedAt = now()->copy()->subDays($updatedDaysAgo ?? $createdDaysAgo);
                $repair->forceFill(['created_at' => $createdAt, 'updated_at' => $updatedAt])->saveQuietly();
            };

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'entregado',
                'payment_method' => 'local',
                'total' => 1000,
                'pickup_name' => 'Cliente A',
                'pickup_phone' => '3415550001',
            ], 5);

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'entregado',
                'payment_method' => 'local',
                'total' => 2000,
                'pickup_name' => 'Cliente B',
                'pickup_phone' => '3415550002',
            ], 3);

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 1500,
                'pickup_name' => 'Cliente C',
                'pickup_phone' => '3415550003',
            ], 2);

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'entregado',
                'payment_method' => 'local',
                'total' => 1000,
                'pickup_name' => 'Cliente D',
                'pickup_phone' => '3415550004',
            ], 35);

            $createOrder([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 500,
                'pickup_name' => 'Cliente E',
                'pickup_phone' => '3415550005',
            ], 40);

            $createRepair([
                'code' => 'R-KPI-001',
                'user_id' => $customer->id,
                'customer_name' => 'Repair 1',
                'customer_phone' => '3415550101',
                'issue_reported' => 'Pantalla',
                'status' => 'delivered',
                'received_at' => now()->copy()->subDays(5),
                'delivered_at' => now()->copy()->subDays(4),
            ], 5, 4);

            $createRepair([
                'code' => 'R-KPI-002',
                'user_id' => $customer->id,
                'customer_name' => 'Repair 2',
                'customer_phone' => '3415550102',
                'issue_reported' => 'Bateria',
                'status' => 'delivered',
                'received_at' => now()->copy()->subDays(3),
                'delivered_at' => now()->copy()->subDays(1),
            ], 3, 1);

            $createRepair([
                'code' => 'R-KPI-003',
                'user_id' => $customer->id,
                'customer_name' => 'Repair 3',
                'customer_phone' => '3415550103',
                'issue_reported' => 'Pin carga',
                'status' => 'delivered',
                'received_at' => now()->copy()->subDays(40),
                'delivered_at' => now()->copy()->subDays(39),
            ], 40, 39);

            $createRepair([
                'code' => 'R-KPI-004',
                'user_id' => $customer->id,
                'customer_name' => 'Repair 4',
                'customer_phone' => '3415550104',
                'issue_reported' => 'Diagnostico',
                'status' => 'waiting_approval',
                'received_at' => now()->copy()->subDays(1),
            ], 1);

            $createRepair([
                'code' => 'R-KPI-005',
                'user_id' => $customer->id,
                'customer_name' => 'Repair 5',
                'customer_phone' => '3415550105',
                'issue_reported' => 'Placa',
                'status' => 'waiting_approval',
                'received_at' => now()->copy()->subDays(4),
            ], 4);

            $response = $this->actingAs($admin)->get(route('admin.dashboard', ['range' => 30]));
            $response->assertOk();

            $this->assertSame(1500.0, (float) $response->viewData('avgTicketInRange'));
            $this->assertEqualsWithDelta(50.0, (float) $response->viewData('avgTicketRangeDeltaPct'), 0.01);

            $this->assertEqualsWithDelta(66.6667, (float) $response->viewData('deliveryRateInRange'), 0.01);
            $this->assertEqualsWithDelta(16.6667, (float) $response->viewData('deliveryRateDeltaPoints'), 0.01);

            $this->assertEqualsWithDelta(36.0, (float) $response->viewData('avgRepairTurnaroundHours'), 0.01);
            $this->assertEqualsWithDelta(50.0, (float) $response->viewData('avgRepairTurnaroundDeltaPct'), 0.01);

            $this->assertSame(2, (int) $response->viewData('waitingApprovalCount'));
            $this->assertSame(1, (int) $response->viewData('waitingApprovalOver48h'));
        } finally {
            Carbon::setTestNow();
        }
    }
}

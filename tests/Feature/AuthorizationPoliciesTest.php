<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthorizationPoliciesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_view_other_users_order_pages(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $order = $this->createOrderForUser($owner);

        $this->actingAs($intruder)
            ->get(route('orders.show', $order))
            ->assertForbidden();

        $this->actingAs($intruder)
            ->get(route('orders.thankyou', $order))
            ->assertForbidden();
    }

    public function test_user_can_view_own_order_pages(): void
    {
        $owner = User::factory()->create();
        $order = $this->createOrderForUser($owner);

        $this->actingAs($owner)
            ->get(route('orders.show', $order))
            ->assertOk();

        $this->actingAs($owner)
            ->get(route('orders.thankyou', $order))
            ->assertOk();
    }

    public function test_user_cannot_view_other_users_repair_detail(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $repair = $this->createRepairForUser($owner);

        $this->actingAs($intruder)
            ->get(route('repairs.my.show', $repair))
            ->assertNotFound();
    }

    public function test_user_can_view_own_repair_detail(): void
    {
        $owner = User::factory()->create();
        $repair = $this->createRepairForUser($owner);

        $this->actingAs($owner)
            ->get(route('repairs.my.show', $repair))
            ->assertOk();
    }

    private function createOrderForUser(User $user): Order
    {
        return Order::create([
            'user_id' => $user->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 12000,
            'pickup_name' => 'Cliente',
            'pickup_phone' => '11 2222 3333',
        ]);
    }

    private function createRepairForUser(User $user): Repair
    {
        return Repair::create([
            'code' => 'R-POL-' . Str::upper(Str::random(8)),
            'user_id' => $user->id,
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 4444',
            'issue_reported' => 'No enciende',
            'status' => 'received',
        ]);
    }
}

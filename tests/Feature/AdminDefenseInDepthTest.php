<?php

namespace Tests\Feature;

use App\Http\Middleware\IsAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDefenseInDepthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_still_block_non_admin_if_is_admin_middleware_is_removed(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->withoutMiddleware(IsAdmin::class)
            ->actingAs($user)
            ->get(route('admin.dashboard'));

        $response->assertForbidden();
    }

    public function test_admin_routes_allow_admin_when_is_admin_middleware_is_removed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withoutMiddleware(IsAdmin::class)
            ->actingAs($admin)
            ->get(route('admin.dashboard'));

        $response->assertOk();
    }
}

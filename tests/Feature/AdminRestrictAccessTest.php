<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRestrictAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_is_blocked_when_email_is_not_allowlisted(): void
    {
        config()->set('security.admin.allowed_emails', 'allowlist@example.com');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.require_reauth_minutes', 0);

        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertForbidden();
    }

    public function test_admin_is_allowed_when_email_is_allowlisted(): void
    {
        config()->set('security.admin.allowed_emails', 'admin@example.com');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.require_reauth_minutes', 0);

        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
    }

    public function test_admin_is_blocked_when_ip_is_not_allowlisted(): void
    {
        config()->set('security.admin.allowed_emails', '');
        config()->set('security.admin.allowed_ips', '203.0.113.10');
        config()->set('security.admin.require_reauth_minutes', 0);

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->actingAs($admin)
            ->get(route('admin.dashboard'));

        $response->assertForbidden();
    }

    public function test_admin_must_reauthenticate_when_session_is_stale(): void
    {
        config()->set('security.admin.allowed_emails', '');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.require_reauth_minutes', 1);

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this
            ->actingAs($admin)
            ->withSession(['auth_time' => time() - 7200])
            ->get(route('admin.dashboard'));

        $response->assertRedirect(route('login'));
        $response->assertSessionHasErrors('email');
    }
}

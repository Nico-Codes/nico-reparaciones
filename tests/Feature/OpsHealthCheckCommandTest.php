<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpsHealthCheckCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_runs_in_default_mode(): void
    {
        $this->artisan('ops:health-check')
            ->assertExitCode(0);
    }

    public function test_health_check_strict_mode_fails_when_warnings_exist(): void
    {
        $this->artisan('ops:health-check --strict')
            ->assertExitCode(1);
    }

    public function test_health_check_fails_in_production_when_two_factor_window_is_zero(): void
    {
        $this->app->instance('env', 'production');
        $this->assertTrue(app()->environment('production'));

        config()->set('app.debug', false);
        config()->set('app.url', 'https://example.com');
        config()->set('session.secure', true);
        config()->set('security.admin.allowed_emails', 'admin@example.com');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.enforce_allowlist_in_production', true);
        config()->set('security.admin.two_factor_session_minutes', 0);

        $this->artisan('ops:health-check')
            ->expectsOutputToContain('ADMIN_2FA_SESSION_MINUTES')
            ->assertExitCode(1);
    }

    public function test_health_check_assume_production_applies_production_rules(): void
    {
        $this->app->instance('env', 'local');
        $this->assertTrue(app()->environment('local'));

        config()->set('app.debug', true);
        config()->set('app.url', 'http://localhost');
        config()->set('session.secure', false);
        config()->set('security.admin.allowed_emails', '');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.enforce_allowlist_in_production', true);
        config()->set('security.admin.two_factor_session_minutes', 0);
        config()->set('monitoring.sentry.dsn', 'https://example.com/123');
        config()->set('ops.reports.dashboard_weekly_recipients', 'ops@example.com');

        $this->artisan('ops:health-check --assume-production')
            ->expectsOutputToContain('APP_DEBUG')
            ->assertExitCode(1);
    }
}

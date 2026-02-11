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

    public function test_health_check_fails_in_production_when_smtp_is_not_ready_for_real_delivery(): void
    {
        $this->app->instance('env', 'local');

        config()->set('app.debug', false);
        config()->set('app.url', 'https://example.com');
        config()->set('session.secure', true);
        config()->set('security.admin.allowed_emails', 'admin@example.com');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.enforce_allowlist_in_production', true);
        config()->set('security.admin.two_factor_session_minutes', 10);
        config()->set('monitoring.enabled', true);
        config()->set('monitoring.sentry.dsn', 'https://example.com/123');
        config()->set('monitoring.alerts.enabled', true);
        config()->set('monitoring.alerts.channel', 'stack');
        config()->set('mail.default', 'log');
        config()->set('mail.from.address', 'no-reply@example.com');

        $this->artisan('ops:health-check --assume-production')
            ->expectsOutputToContain('SMTP mail')
            ->assertExitCode(1);
    }

    public function test_health_check_fails_when_async_mail_is_enabled_but_queue_driver_is_sync_in_production(): void
    {
        $this->app->instance('env', 'local');

        config()->set('app.debug', false);
        config()->set('app.url', 'https://example.com');
        config()->set('session.secure', true);
        config()->set('security.admin.allowed_emails', 'admin@example.com');
        config()->set('security.admin.allowed_ips', '');
        config()->set('security.admin.enforce_allowlist_in_production', true);
        config()->set('security.admin.two_factor_session_minutes', 10);
        config()->set('monitoring.enabled', true);
        config()->set('monitoring.sentry.dsn', 'https://example.com/123');
        config()->set('monitoring.alerts.enabled', true);
        config()->set('monitoring.alerts.channel', 'stack');
        config()->set('mail.default', 'smtp');
        config()->set('mail.from.address', 'no-reply@example.com');
        config()->set('mail.mailers.smtp.host', 'smtp.example.com');
        config()->set('mail.mailers.smtp.port', 587);
        config()->set('ops.mail.async_enabled', true);
        config()->set('queue.default', 'sync');

        $this->artisan('ops:health-check --assume-production')
            ->expectsOutputToContain('Mail async dispatch')
            ->assertExitCode(1);
    }
}

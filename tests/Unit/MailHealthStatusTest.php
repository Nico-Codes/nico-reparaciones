<?php

namespace Tests\Unit;

use App\Support\MailHealthStatus;
use Tests\TestCase;

class MailHealthStatusTest extends TestCase
{
    public function test_mail_health_is_ready_when_smtp_and_from_are_configured(): void
    {
        config()->set('mail.default', 'smtp');
        config()->set('mail.from.address', 'no-reply@example.com');
        config()->set('mail.mailers.smtp.host', 'smtp.example.com');
        config()->set('mail.mailers.smtp.port', 587);

        $health = MailHealthStatus::evaluate();

        $this->assertSame('ok', $health['status']);
        $this->assertTrue((bool) $health['ready_for_real_delivery']);
        $this->assertSame([], $health['issues']);
    }

    public function test_mail_health_reports_local_mode_for_log_mailer(): void
    {
        config()->set('mail.default', 'log');
        config()->set('mail.from.address', 'no-reply@example.com');

        $health = MailHealthStatus::evaluate();

        $this->assertSame('local', $health['status']);
        $this->assertFalse((bool) $health['ready_for_real_delivery']);
        $this->assertNotEmpty($health['issues']);
    }

    public function test_mail_health_reports_warning_when_missing_required_values(): void
    {
        config()->set('mail.default', 'smtp');
        config()->set('mail.from.address', '');
        config()->set('mail.mailers.smtp.host', '');
        config()->set('mail.mailers.smtp.port', '');

        $health = MailHealthStatus::evaluate();

        $this->assertSame('warning', $health['status']);
        $this->assertFalse((bool) $health['ready_for_real_delivery']);
        $this->assertNotEmpty($health['issues']);
    }

    public function test_mail_health_failover_is_ready_when_contains_real_mailer_with_fallback(): void
    {
        config()->set('mail.default', 'failover');
        config()->set('mail.from.address', 'no-reply@example.com');
        config()->set('mail.mailers.failover.transport', 'failover');
        config()->set('mail.mailers.failover.mailers', ['smtp', 'log']);
        config()->set('mail.mailers.smtp.host', 'smtp.example.com');
        config()->set('mail.mailers.smtp.port', 587);

        $health = MailHealthStatus::evaluate();

        $this->assertSame('ok', $health['status']);
        $this->assertTrue((bool) $health['ready_for_real_delivery']);
        $this->assertSame([], $health['issues']);
    }

    public function test_mail_health_failover_stays_local_when_only_local_mailers_are_configured(): void
    {
        config()->set('mail.default', 'failover');
        config()->set('mail.from.address', 'no-reply@example.com');
        config()->set('mail.mailers.failover.transport', 'failover');
        config()->set('mail.mailers.failover.mailers', ['log', 'array']);

        $health = MailHealthStatus::evaluate();

        $this->assertSame('local', $health['status']);
        $this->assertFalse((bool) $health['ready_for_real_delivery']);
        $this->assertNotEmpty($health['issues']);
    }
}

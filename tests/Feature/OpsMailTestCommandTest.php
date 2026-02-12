<?php

namespace Tests\Feature;

use App\Mail\AdminSmtpTestMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OpsMailTestCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_mail_test_command_sends_mail_in_sync_mode(): void
    {
        Mail::fake();
        config()->set('ops.mail.async_enabled', false);

        $this->artisan('ops:mail-test --to=ops@example.com')
            ->expectsOutputToContain('Mail test sent to')
            ->assertExitCode(0);

        Mail::assertSent(AdminSmtpTestMail::class, function (AdminSmtpTestMail $mail): bool {
            return $mail->hasTo('ops@example.com');
        });
    }

    public function test_mail_test_command_queues_mail_when_async_mode_is_enabled(): void
    {
        Mail::fake();
        config()->set('ops.mail.async_enabled', true);
        config()->set('ops.mail.queue', 'mail');

        $this->artisan('ops:mail-test --to=ops@example.com')
            ->expectsOutputToContain('Mail test queued to')
            ->assertExitCode(0);

        Mail::assertQueued(AdminSmtpTestMail::class, function (AdminSmtpTestMail $mail): bool {
            return $mail->hasTo('ops@example.com') && $mail->queue === 'mail';
        });
    }

    public function test_mail_test_command_can_force_sync_even_when_async_is_enabled(): void
    {
        Mail::fake();
        config()->set('ops.mail.async_enabled', true);

        $this->artisan('ops:mail-test --to=ops@example.com --force-sync')
            ->expectsOutputToContain('Mail test sent (sync) to')
            ->assertExitCode(0);

        Mail::assertSent(AdminSmtpTestMail::class, function (AdminSmtpTestMail $mail): bool {
            return $mail->hasTo('ops@example.com');
        });
    }

    public function test_mail_test_command_fails_for_invalid_destination_email(): void
    {
        Mail::fake();

        $this->artisan('ops:mail-test --to=invalid-email')
            ->expectsOutputToContain('Invalid destination email.')
            ->assertExitCode(1);

        Mail::assertNothingSent();
    }
}


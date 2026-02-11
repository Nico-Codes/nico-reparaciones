<?php

namespace Tests\Feature;

use App\Mail\AdminSmtpTestMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminSettingsSmtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_page_shows_smtp_ready_status_when_configuration_is_complete(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        config()->set('mail.default', 'smtp');
        config()->set('mail.from.address', 'no-reply@example.com');
        config()->set('mail.mailers.smtp.host', 'smtp.example.com');
        config()->set('mail.mailers.smtp.port', 587);

        $response = $this->actingAs($admin)->get(route('admin.settings.index'));

        $response->assertOk();
        $response->assertSee('Estado SMTP');
        $response->assertSee('Listo para envio de correos.');
        $response->assertSee('no-reply@example.com');
    }

    public function test_settings_page_shows_local_mode_when_mailer_is_not_real_delivery(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        config()->set('mail.default', 'log');
        config()->set('mail.from.address', 'no-reply@example.com');

        $response = $this->actingAs($admin)->get(route('admin.settings.index'));

        $response->assertOk();
        $response->assertSee('Estado SMTP');
        $response->assertSee('Modo local (no envia correos reales).');
    }

    public function test_admin_can_send_smtp_test_email_from_settings(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.smtp_test.send'), [
            'test_email' => 'ops@example.com',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Mail::assertSent(AdminSmtpTestMail::class, function (AdminSmtpTestMail $mail): bool {
            return $mail->hasTo('ops@example.com');
        });
    }

    public function test_invalid_smtp_test_email_is_rejected(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.smtp_test.send'), [
            'test_email' => 'email-invalido',
        ]);

        $response->assertSessionHasErrors('test_email');
        Mail::assertNothingSent();
    }

    public function test_non_admin_cannot_send_smtp_test_email(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->post(route('admin.settings.smtp_test.send'), [
            'test_email' => 'ops@example.com',
        ]);

        $response->assertForbidden();
        Mail::assertNothingSent();
    }
}

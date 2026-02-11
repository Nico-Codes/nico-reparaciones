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


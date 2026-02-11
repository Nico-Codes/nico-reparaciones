<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardSmtpAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_shows_smtp_alert_when_mail_setup_is_not_ready(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        config()->set('mail.default', 'log');
        config()->set('mail.from.address', 'no-reply@example.com');

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertSee('Atencion: correo no listo para produccion');
        $response->assertSee('Revisar configuracion SMTP');
        $response->assertSee('Modo local (no envia correos reales).');
    }

    public function test_dashboard_hides_smtp_alert_when_mail_setup_is_ready(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        config()->set('mail.default', 'smtp');
        config()->set('mail.from.address', 'no-reply@example.com');
        config()->set('mail.mailers.smtp.host', 'smtp.example.com');
        config()->set('mail.mailers.smtp.port', 587);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertDontSee('Atencion: correo no listo para produccion');
        $response->assertDontSee('Revisar configuracion SMTP');
    }
}

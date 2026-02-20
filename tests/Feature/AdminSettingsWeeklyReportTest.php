<?php

namespace Tests\Feature;

use App\Mail\AdminDashboardWeeklyReportMail;
use App\Mail\AdminOperationalAlertsMail;
use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminSettingsWeeklyReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_weekly_report_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.reports.update'), [
            'weekly_report_emails' => ' ops@example.com, owner@example.com , ops@example.com ',
            'weekly_report_day' => 'wednesday',
            'weekly_report_time' => '09:30',
            'weekly_report_range_days' => 30,
            'operational_alerts_emails' => 'alerts@example.com, alerts@example.com',
            'operational_alerts_dedupe_minutes' => 240,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_weekly_report_emails',
            'value' => 'ops@example.com, owner@example.com',
        ]);
        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_weekly_report_day',
            'value' => 'wednesday',
        ]);
        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_weekly_report_time',
            'value' => '09:30',
        ]);
        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_weekly_report_range_days',
            'value' => '30',
        ]);
        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_operational_alerts_emails',
            'value' => 'alerts@example.com',
        ]);
        $this->assertDatabaseHas('business_settings', [
            'key' => 'ops_operational_alerts_dedupe_minutes',
            'value' => '240',
        ]);
    }

    public function test_invalid_weekly_report_email_list_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.reports.update'), [
            'weekly_report_emails' => 'ops@example.com, invalid-email',
            'weekly_report_day' => 'monday',
            'weekly_report_time' => '08:00',
            'weekly_report_range_days' => 7,
            'operational_alerts_emails' => '',
            'operational_alerts_dedupe_minutes' => 360,
        ]);

        $response->assertSessionHasErrors('weekly_report_emails');

        $this->assertDatabaseMissing('business_settings', [
            'key' => 'ops_weekly_report_emails',
        ]);
    }

    public function test_admin_can_send_weekly_report_now_from_settings_screen(): void
    {
        Mail::fake();
        config()->set('ops.mail.async_enabled', false);

        $admin = User::factory()->create(['role' => 'admin']);

        BusinessSetting::updateOrCreate(
            ['key' => 'ops_weekly_report_emails'],
            ['value' => 'ops@example.com']
        );

        $response = $this->actingAs($admin)->post(route('admin.settings.reports.send'), [
            'weekly_report_range_days' => 30,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Mail::assertSent(AdminDashboardWeeklyReportMail::class, function (AdminDashboardWeeklyReportMail $mail): bool {
            return $mail->rangeDays === 30;
        });
    }

    public function test_non_admin_cannot_update_or_send_weekly_report_settings(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $updateResponse = $this->actingAs($user)->post(route('admin.settings.reports.update'), [
            'weekly_report_day' => 'monday',
            'weekly_report_time' => '08:00',
            'weekly_report_range_days' => 30,
            'operational_alerts_dedupe_minutes' => 360,
        ]);
        $updateResponse->assertForbidden();

        $sendResponse = $this->actingAs($user)->post(route('admin.settings.reports.send'));
        $sendResponse->assertForbidden();

        $sendOperationalResponse = $this->actingAs($user)->post(route('admin.settings.reports.operational_alerts.send'));
        $sendOperationalResponse->assertForbidden();

        $clearOperationalResponse = $this->actingAs($user)->post(route('admin.settings.reports.operational_alerts.clear'));
        $clearOperationalResponse->assertForbidden();
    }

    public function test_admin_can_send_operational_alerts_now_from_settings_screen(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            config()->set('ops.mail.async_enabled', false);
            config()->set('ops.alerts.operational_email_recipients', 'ops@example.com');

            $admin = User::factory()->create(['role' => 'admin']);
            $customer = User::factory()->create();

            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);

            $order = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 2500,
                'pickup_name' => 'Cliente alerta',
                'pickup_phone' => '3415551234',
            ]);
            $order->forceFill([
                'created_at' => now()->copy()->subHours(30),
                'updated_at' => now()->copy()->subHours(30),
            ])->saveQuietly();

            $response = $this->actingAs($admin)->post(route('admin.settings.reports.operational_alerts.send'));

            $response->assertRedirect();
            $response->assertSessionHas('success');

            Mail::assertSent(AdminOperationalAlertsMail::class);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_reports_settings_view_shows_operational_alerts_last_execution_summary(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_status'], ['value' => 'sent']);
        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_run_at'], ['value' => '2026-02-20 11:15:00']);
        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_recipients'], ['value' => 'ops@example.com']);
        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_summary'], ['value' => json_encode(['orders' => 2, 'repairs' => 1])]);

        $response = $this->actingAs($admin)->get(route('admin.settings.reports.index'));
        $response->assertOk();
        $response->assertSee('Última ejecución de alertas operativas');
        $response->assertSee('ops@example.com');
        $response->assertSee('Pedidos alertados');
        $response->assertSee('Reparaciones alertadas');
    }

    public function test_admin_can_clear_operational_alerts_history(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_status'], ['value' => 'sent']);
        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_run_at'], ['value' => '2026-02-20 11:15:00']);
        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_recipients'], ['value' => 'ops@example.com']);
        BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_last_summary'], ['value' => json_encode(['orders' => 2, 'repairs' => 1])]);

        $response = $this->actingAs($admin)->post(route('admin.settings.reports.operational_alerts.clear'));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('business_settings', ['key' => 'ops_operational_alerts_last_status']);
        $this->assertDatabaseMissing('business_settings', ['key' => 'ops_operational_alerts_last_run_at']);
        $this->assertDatabaseMissing('business_settings', ['key' => 'ops_operational_alerts_last_recipients']);
        $this->assertDatabaseMissing('business_settings', ['key' => 'ops_operational_alerts_last_summary']);
    }
}

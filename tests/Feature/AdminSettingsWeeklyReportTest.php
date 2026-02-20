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
    }

    public function test_invalid_weekly_report_email_list_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.settings.reports.update'), [
            'weekly_report_emails' => 'ops@example.com, invalid-email',
            'weekly_report_day' => 'monday',
            'weekly_report_time' => '08:00',
            'weekly_report_range_days' => 7,
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
        ]);
        $updateResponse->assertForbidden();

        $sendResponse = $this->actingAs($user)->post(route('admin.settings.reports.send'));
        $sendResponse->assertForbidden();

        $sendOperationalResponse = $this->actingAs($user)->post(route('admin.settings.reports.operational_alerts.send'));
        $sendOperationalResponse->assertForbidden();
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
}

<?php

namespace Tests\Feature;

use App\Mail\AdminDashboardWeeklyReportMail;
use App\Models\BusinessSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
    }
}

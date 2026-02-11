<?php

namespace Tests\Feature;

use App\Mail\AdminDashboardWeeklyReportMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OpsDashboardReportEmailCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_report_command_sends_email_when_recipients_are_configured(): void
    {
        Mail::fake();

        config()->set('ops.reports.dashboard_weekly_recipients', 'ops@example.com, owner@example.com');

        $this->artisan('ops:dashboard-report-email --range=30')
            ->assertExitCode(0);

        Mail::assertSent(AdminDashboardWeeklyReportMail::class, function (AdminDashboardWeeklyReportMail $mail): bool {
            $addresses = array_map(
                static function ($address): string {
                    if (is_array($address)) {
                        return (string) ($address['address'] ?? '');
                    }

                    return (string) ($address->address ?? '');
                },
                $mail->to ?? []
            );

            $attachments = $mail->attachments();

            return in_array('ops@example.com', $addresses, true)
                && in_array('owner@example.com', $addresses, true)
                && count($attachments) === 1
                && $mail->rangeDays === 30;
        });
    }

    public function test_dashboard_report_command_fails_without_recipients(): void
    {
        Mail::fake();
        config()->set('ops.reports.dashboard_weekly_recipients', '');

        $this->artisan('ops:dashboard-report-email --range=30')
            ->assertExitCode(1);

        Mail::assertNothingSent();
    }
}

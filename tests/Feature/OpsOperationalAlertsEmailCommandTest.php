<?php

namespace Tests\Feature;

use App\Mail\AdminOperationalAlertsMail;
use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OpsOperationalAlertsEmailCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_operational_alerts_command_sends_email_for_stale_items(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            config()->set('ops.alerts.operational_email_recipients', '');
            config()->set('ops.alerts.operational_dedupe_minutes', 360);
            config()->set('ops.mail.async_enabled', false);

            $admin = User::factory()->create(['role' => 'admin', 'email' => 'admin-alerts@example.com']);
            $customer = User::factory()->create();

            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);
            BusinessSetting::updateOrCreate(['key' => 'ops_alert_repair_stale_days'], ['value' => '3']);

            $order = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 2000,
                'pickup_name' => 'Cliente stale',
                'pickup_phone' => '3415555000',
            ]);
            $order->forceFill([
                'created_at' => now()->copy()->subHours(30),
                'updated_at' => now()->copy()->subHours(30),
            ])->saveQuietly();

            $repair = Repair::create([
                'code' => 'R-OPS-001',
                'user_id' => $customer->id,
                'customer_name' => 'Cliente reparacion stale',
                'customer_phone' => '3415555001',
                'issue_reported' => 'Display',
                'status' => 'diagnosing',
                'received_at' => now()->copy()->subDays(5),
            ]);
            $repair->forceFill([
                'created_at' => now()->copy()->subDays(5),
                'updated_at' => now()->copy()->subDays(5),
            ])->saveQuietly();

            $this->artisan('ops:operational-alerts-email')
                ->assertExitCode(0);

            Mail::assertSent(AdminOperationalAlertsMail::class, function (AdminOperationalAlertsMail $mail) use ($admin): bool {
                return $mail->hasTo($admin->email)
                    && $mail->ordersCount === 1
                    && $mail->repairsCount === 1;
            });

            $this->assertDatabaseHas('business_settings', [
                'key' => 'ops_operational_alerts_last_signature',
            ]);
            $this->assertDatabaseHas('business_settings', [
                'key' => 'ops_operational_alerts_last_sent_at',
            ]);
            $this->assertDatabaseHas('business_settings', [
                'key' => 'ops_operational_alerts_last_status',
                'value' => 'sent',
            ]);
            $this->assertDatabaseHas('business_settings', [
                'key' => 'ops_operational_alerts_last_recipients',
                'value' => 'admin-alerts@example.com',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_operational_alerts_command_dedupes_when_signature_did_not_change(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            config()->set('ops.alerts.operational_email_recipients', 'ops@example.com');
            config()->set('ops.alerts.operational_dedupe_minutes', 360);
            config()->set('ops.mail.async_enabled', false);

            $customer = User::factory()->create();

            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);

            $order = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 1800,
                'pickup_name' => 'Cliente dedupe',
                'pickup_phone' => '3415555010',
            ]);
            $order->forceFill([
                'created_at' => now()->copy()->subHours(28),
                'updated_at' => now()->copy()->subHours(28),
            ])->saveQuietly();

            $this->artisan('ops:operational-alerts-email')
                ->assertExitCode(0);
            $this->artisan('ops:operational-alerts-email')
                ->assertExitCode(0);

            Mail::assertSent(AdminOperationalAlertsMail::class, 1);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_operational_alerts_command_uses_business_settings_recipients_and_dedupe(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::create(2026, 2, 20, 12, 0, 0));

        try {
            config()->set('ops.alerts.operational_email_recipients', '');
            config()->set('ops.alerts.operational_dedupe_minutes', 360);
            config()->set('ops.mail.async_enabled', false);

            BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_emails'], ['value' => 'custom-alerts@example.com']);
            BusinessSetting::updateOrCreate(['key' => 'ops_operational_alerts_dedupe_minutes'], ['value' => '5']);
            BusinessSetting::updateOrCreate(['key' => 'ops_alert_order_stale_hours'], ['value' => '24']);

            $customer = User::factory()->create();
            $order = Order::create([
                'user_id' => $customer->id,
                'status' => 'pendiente',
                'payment_method' => 'local',
                'total' => 1800,
                'pickup_name' => 'Cliente settings',
                'pickup_phone' => '3415555011',
            ]);
            $order->forceFill([
                'created_at' => now()->copy()->subHours(28),
                'updated_at' => now()->copy()->subHours(28),
            ])->saveQuietly();

            $this->artisan('ops:operational-alerts-email')
                ->assertExitCode(0);

            Mail::assertSent(AdminOperationalAlertsMail::class, function (AdminOperationalAlertsMail $mail): bool {
                return $mail->hasTo('custom-alerts@example.com');
            });

            $this->assertDatabaseHas('business_settings', [
                'key' => 'ops_operational_alerts_last_status',
                'value' => 'sent',
            ]);
            $this->assertDatabaseHas('business_settings', [
                'key' => 'ops_operational_alerts_last_recipients',
                'value' => 'custom-alerts@example.com',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }
}

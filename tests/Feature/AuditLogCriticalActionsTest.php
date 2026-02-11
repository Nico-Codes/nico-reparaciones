<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\BusinessSetting;
use App\Models\Order;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuditLogCriticalActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_role_change_creates_audit_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'user']);

        $this->actingAs($admin)
            ->post(route('admin.users.updateRole', $target), ['role' => 'admin'])
            ->assertRedirect(route('admin.users.show', $target));

        $log = AuditLog::query()
            ->where('event', 'admin.user.role_changed')
            ->where('subject_type', User::class)
            ->where('subject_id', $target->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame('user', (string) ($log->metadata['from_role'] ?? ''));
        $this->assertSame('admin', (string) ($log->metadata['to_role'] ?? ''));
    }

    public function test_admin_order_status_change_creates_audit_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create();

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 7000,
            'pickup_name' => 'Cliente',
            'pickup_phone' => '11 2222 3333',
        ]);

        $this->actingAs($admin)
            ->postJson(route('admin.orders.updateStatus', $order), [
                'status' => 'confirmado',
                'comment' => 'Auditoria QA',
            ])
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'changed' => true,
                'from_status' => 'pendiente',
                'to_status' => 'confirmado',
            ]);

        $log = AuditLog::query()
            ->where('event', 'admin.order.status_changed')
            ->where('subject_type', Order::class)
            ->where('subject_id', $order->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame('pendiente', (string) ($log->metadata['from_status'] ?? ''));
        $this->assertSame('confirmado', (string) ($log->metadata['to_status'] ?? ''));
        $this->assertSame('Auditoria QA', (string) ($log->metadata['comment'] ?? ''));
    }

    public function test_admin_repair_status_change_creates_audit_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $repair = Repair::create([
            'code' => 'R-AL-' . Str::upper(Str::random(8)),
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 4444',
            'issue_reported' => 'No enciende',
            'status' => 'ready_pickup',
            'diagnosis' => 'Placa reparada',
            'final_price' => 18000,
        ]);

        $this->actingAs($admin)
            ->postJson(route('admin.repairs.updateStatus', $repair), [
                'status' => 'delivered',
                'comment' => 'Entrega QA',
            ])
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'changed' => true,
                'from_status' => 'ready_pickup',
                'to_status' => 'delivered',
            ]);

        $log = AuditLog::query()
            ->where('event', 'admin.repair.status_changed')
            ->where('subject_type', Repair::class)
            ->where('subject_id', $repair->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame('ready_pickup', (string) ($log->metadata['from_status'] ?? ''));
        $this->assertSame('delivered', (string) ($log->metadata['to_status'] ?? ''));
        $this->assertSame('Entrega QA', (string) ($log->metadata['comment'] ?? ''));
    }

    public function test_public_quote_decision_creates_audit_log_without_actor(): void
    {
        $repair = Repair::create([
            'code' => 'R-AL-' . Str::upper(Str::random(8)),
            'customer_name' => 'Cliente',
            'customer_phone' => '11 3333 4444',
            'issue_reported' => 'No enciende',
            'status' => 'waiting_approval',
        ]);

        $approveUrl = URL::temporarySignedRoute(
            'repairs.quote.approve',
            now()->addMinutes(30),
            ['repair' => $repair->id]
        );

        $this->post($approveUrl)->assertRedirect();

        $log = AuditLog::query()
            ->where('event', 'public.repair.quote_decision')
            ->where('subject_type', Repair::class)
            ->where('subject_id', $repair->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertNull($log->actor_id);
        $this->assertSame('repairing', (string) ($log->metadata['to_status'] ?? ''));
        $this->assertNotSame('', (string) ($log->ip_address ?? ''));
    }

    public function test_admin_weekly_report_settings_update_creates_audit_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.settings.reports.update'), [
                'weekly_report_emails' => 'ops@example.com, owner@example.com',
                'weekly_report_day' => 'friday',
                'weekly_report_time' => '10:15',
                'weekly_report_range_days' => 90,
            ])
            ->assertRedirect();

        $log = AuditLog::query()
            ->where('event', 'admin.settings.weekly_report.updated')
            ->where('subject_type', BusinessSetting::class)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame('ops@example.com, owner@example.com', (string) ($log->metadata['after']['emails'] ?? ''));
        $this->assertSame('friday', (string) ($log->metadata['after']['day'] ?? ''));
        $this->assertSame('10:15', (string) ($log->metadata['after']['time'] ?? ''));
        $this->assertSame(90, (int) ($log->metadata['after']['range_days'] ?? 0));
        $this->assertSame(2, (int) ($log->metadata['recipients_count'] ?? 0));
    }

    public function test_admin_weekly_report_manual_send_creates_audit_log(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        BusinessSetting::updateOrCreate(
            ['key' => 'ops_weekly_report_emails'],
            ['value' => 'ops@example.com']
        );

        $this->actingAs($admin)
            ->post(route('admin.settings.reports.send'), [
                'weekly_report_range_days' => 30,
            ])
            ->assertRedirect();

        $log = AuditLog::query()
            ->where('event', 'admin.settings.weekly_report.sent')
            ->where('subject_type', BusinessSetting::class)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame(30, (int) ($log->metadata['range_days'] ?? 0));
        $this->assertSame(1, (int) ($log->metadata['recipients_count'] ?? 0));
    }

    public function test_admin_weekly_report_manual_send_failure_creates_audit_log(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.settings.reports.send'), [
                'weekly_report_range_days' => 30,
            ])
            ->assertRedirect();

        $log = AuditLog::query()
            ->where('event', 'admin.settings.weekly_report.send_failed')
            ->where('subject_type', BusinessSetting::class)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, (int) $log->actor_id);
        $this->assertSame(30, (int) ($log->metadata['range_days'] ?? 0));
        $this->assertSame(0, (int) ($log->metadata['recipients_count'] ?? -1));
    }
}

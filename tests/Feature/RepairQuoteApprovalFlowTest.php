<?php

namespace Tests\Feature;

use App\Models\Repair;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class RepairQuoteApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_quote_routes_require_valid_signature(): void
    {
        $repair = $this->createRepair('waiting_approval');

        $this->get(route('repairs.quote.show', ['repair' => $repair->id]))->assertForbidden();
        $this->post(route('repairs.quote.approve', ['repair' => $repair->id]))->assertForbidden();
        $this->post(route('repairs.quote.reject', ['repair' => $repair->id]))->assertForbidden();
    }

    public function test_signed_show_page_displays_quote_actions_when_waiting_approval(): void
    {
        $repair = $this->createRepair('waiting_approval');

        $showUrl = URL::temporarySignedRoute(
            'repairs.quote.show',
            now()->addMinutes(30),
            ['repair' => $repair->id]
        );

        $this->get($showUrl)
            ->assertOk()
            ->assertSee('Presupuesto')
            ->assertSee('Aprobar presupuesto')
            ->assertSee('Rechazar presupuesto');
    }

    public function test_approve_from_signed_url_updates_status_and_keeps_original_expiration(): void
    {
        $repair = $this->createRepair('waiting_approval');
        $expiresAt = now()->addMinutes(45)->startOfMinute();

        $approveUrl = URL::temporarySignedRoute(
            'repairs.quote.approve',
            $expiresAt,
            ['repair' => $repair->id]
        );

        $response = $this->post($approveUrl);

        $response->assertRedirect();

        $repair->refresh();
        $this->assertSame('repairing', (string) $repair->status);

        $this->assertDatabaseHas('repair_status_histories', [
            'repair_id' => $repair->id,
            'from_status' => 'waiting_approval',
            'to_status' => 'repairing',
            'changed_by' => null,
        ]);

        $redirectUrl = (string) $response->headers->get('Location');
        $this->assertStringContainsString('/reparacion/' . $repair->id . '/presupuesto', $redirectUrl);

        parse_str((string) parse_url($redirectUrl, PHP_URL_QUERY), $query);
        $this->assertSame((string) $expiresAt->timestamp, (string) ($query['expires'] ?? ''));
    }

    public function test_second_decision_after_resolution_does_not_change_status_again(): void
    {
        $repair = $this->createRepair('waiting_approval');
        $expiresAt = now()->addHour()->startOfMinute();

        $approveUrl = URL::temporarySignedRoute(
            'repairs.quote.approve',
            $expiresAt,
            ['repair' => $repair->id]
        );
        $rejectUrl = URL::temporarySignedRoute(
            'repairs.quote.reject',
            $expiresAt,
            ['repair' => $repair->id]
        );

        $this->post($approveUrl)->assertRedirect();
        $this->post($rejectUrl)->assertRedirect();

        $repair->refresh();
        $this->assertSame('repairing', (string) $repair->status);

        $this->assertDatabaseCount('repair_status_histories', 1);
        $this->assertDatabaseHas('repair_status_histories', [
            'repair_id' => $repair->id,
            'from_status' => 'waiting_approval',
            'to_status' => 'repairing',
            'changed_by' => null,
        ]);
    }

    private function createRepair(string $status): Repair
    {
        return Repair::create([
            'code' => 'R-QA-' . Str::upper(Str::random(8)),
            'customer_name' => 'Cliente QA',
            'customer_phone' => '11 2222 3333',
            'issue_reported' => 'No enciende',
            'final_price' => 25000,
            'status' => $status,
        ]);
    }
}

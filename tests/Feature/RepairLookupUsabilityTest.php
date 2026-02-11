<?php

namespace Tests\Feature;

use App\Models\Repair;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RepairLookupUsabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_lookup_accepts_code_in_lowercase_and_returns_result(): void
    {
        Repair::create([
            'code' => 'R-20260101-00001',
            'customer_name' => 'Cliente Prueba',
            'customer_phone' => '11 3456 7890',
            'issue_reported' => 'No enciende',
            'status' => 'received',
        ]);

        $response = $this->post('/reparacion', [
            'code' => 'r-20260101-00001',
            'phone' => '11-3456-7890',
        ]);

        $response->assertOk();
        $response->assertSee('Resultado');
        $response->assertSee('R-20260101-00001');
    }
}


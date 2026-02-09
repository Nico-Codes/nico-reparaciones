<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RepairLookupSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_lookup_rejects_invalid_phone_format(): void
    {
        $response = $this->from('/reparacion')->post('/reparacion', [
            'code' => 'R-20260101-00001',
            'phone' => '----++++',
        ]);

        $response->assertRedirect('/reparacion');
        $response->assertSessionHasErrors('phone');
    }

    public function test_lookup_is_rate_limited_after_eight_attempts_per_minute(): void
    {
        $server = ['REMOTE_ADDR' => '203.0.113.50'];

        for ($i = 0; $i < 8; $i++) {
            $response = $this->withServerVariables($server)
                ->from('/reparacion')
                ->post('/reparacion', [
                    'code' => 'R-20260101-00001',
                    'phone' => '11 3456 7890',
                ]);

            $response->assertStatus(302);
        }

        $blocked = $this->withServerVariables($server)->post('/reparacion', [
            'code' => 'R-20260101-00001',
            'phone' => '11 3456 7890',
        ]);

        $blocked->assertStatus(429);
    }
}

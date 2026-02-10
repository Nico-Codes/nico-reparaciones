<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpsHealthCheckCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_runs_in_default_mode(): void
    {
        $this->artisan('ops:health-check')
            ->assertExitCode(0);
    }

    public function test_health_check_strict_mode_fails_when_warnings_exist(): void
    {
        $this->artisan('ops:health-check --strict')
            ->assertExitCode(1);
    }
}

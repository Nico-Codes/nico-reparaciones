<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageRouteSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_storage_local_route_is_blocked_outside_local_environment_by_default(): void
    {
        if (app()->environment(['local', 'development'])) {
            $this->markTestSkipped('La ruta /storage/* está habilitada en entorno local por diseño.');
        }

        $explicitlyAllowed = filter_var((string) env('APP_ALLOW_STORAGE_LOCAL_ROUTE', 'false'), FILTER_VALIDATE_BOOL);
        if ($explicitlyAllowed) {
            $this->markTestSkipped('APP_ALLOW_STORAGE_LOCAL_ROUTE=true habilita la ruta explícitamente.');
        }

        Storage::disk('public')->put('security-test.txt', 'ok');

        $response = $this->get('/storage/security-test.txt');

        $this->assertContains($response->status(), [403, 404]);
    }
}

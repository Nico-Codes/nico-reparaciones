<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersMiddlewareTest extends TestCase
{
    public function test_security_headers_are_added_when_enabled(): void
    {
        config()->set('security.headers.enabled', true);
        config()->set('security.headers.csp_enabled', true);

        $response = $this->get(route('login'));

        $response->assertOk();
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Content-Security-Policy');
    }

    public function test_security_headers_can_be_disabled(): void
    {
        config()->set('security.headers.enabled', false);

        $response = $this->get(route('login'));

        $response->assertOk();
        $response->assertHeaderMissing('X-Frame-Options');
        $response->assertHeaderMissing('X-Content-Type-Options');
    }
}

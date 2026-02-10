<?php

namespace Tests\Unit;

use App\Support\Totp;
use PHPUnit\Framework\TestCase;

class TotpTest extends TestCase
{
    public function test_generate_secret_has_expected_length(): void
    {
        $secret = Totp::generateSecret(32);

        $this->assertSame(32, strlen($secret));
        $this->assertMatchesRegularExpression('/^[A-Z2-7]+$/', $secret);
    }

    public function test_current_code_is_verified(): void
    {
        $secret = Totp::generateSecret(32);
        $code = Totp::currentCode($secret);

        $this->assertTrue(Totp::verifyCode($secret, $code));
    }

    public function test_build_otpauth_uri_contains_expected_data(): void
    {
        $secret = Totp::generateSecret(32);
        $uri = Totp::buildOtpAuthUri('NicoReparaciones', 'admin@example.com', $secret);

        $this->assertStringStartsWith('otpauth://totp/', $uri);
        $this->assertStringContainsString('secret='.$secret, $uri);
        $this->assertStringContainsString('issuer=NicoReparaciones', $uri);
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Totp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminTwoFactorFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_with_enabled_two_factor_is_redirected_to_challenge(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertRedirect(route('admin.two_factor.challenge'));
    }

    public function test_admin_can_pass_challenge_with_valid_code(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $code = Totp::currentCode($secret);

        $response = $this->actingAs($admin)->post(route('admin.two_factor.challenge.verify'), [
            'code' => $code,
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $response->assertSessionHas('admin_2fa_passed_at');

        $this->actingAs($admin)
            ->withSession(['admin_2fa_passed_at' => time()])
            ->get(route('admin.dashboard'))
            ->assertOk();
    }

    public function test_admin_can_pass_challenge_with_recovery_code_only_once(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $recoveryCodes = $admin->generateAdminTwoFactorRecoveryCodes(2);
        $admin->save();

        $firstRecoveryCode = $recoveryCodes[0];

        $this->actingAs($admin)
            ->post(route('admin.two_factor.challenge.verify'), [
                'code' => $firstRecoveryCode,
            ])
            ->assertRedirect(route('admin.dashboard'));

        $admin->refresh();
        $this->assertSame(1, $admin->getAdminTwoFactorRecoveryCodesRemainingCount());

        $secondTry = $this->from(route('admin.two_factor.challenge'))
            ->withSession(['admin_2fa_passed_at' => 0])
            ->actingAs($admin)
            ->post(route('admin.two_factor.challenge.verify'), [
                'code' => $firstRecoveryCode,
            ]);

        $secondTry->assertRedirect(route('admin.two_factor.challenge'));
        $secondTry->assertSessionHasErrors('code');
    }

    public function test_admin_with_invalid_code_stays_blocked(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $response = $this->from(route('admin.two_factor.challenge'))
            ->actingAs($admin)
            ->post(route('admin.two_factor.challenge.verify'), [
                'code' => '000000',
            ]);

        $response->assertRedirect(route('admin.two_factor.challenge'));
        $response->assertSessionHasErrors('code');

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertRedirect(route('admin.two_factor.challenge'));
    }

    public function test_admin_can_enable_and_disable_two_factor_from_settings(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('password'),
            'admin_two_factor_secret' => null,
            'admin_two_factor_enabled_at' => null,
            'admin_two_factor_recovery_codes' => null,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.two_factor.regenerate'))
            ->assertRedirect(route('admin.two_factor.settings'));

        $pendingSecret = (string) session('admin_2fa_pending_secret');
        $this->assertNotSame('', $pendingSecret);

        $enableCode = Totp::currentCode($pendingSecret);

        $enableResponse = $this->actingAs($admin)
            ->post(route('admin.two_factor.enable'), [
                'current_password' => 'password',
                'code' => $enableCode,
            ]);

        $enableResponse->assertRedirect(route('admin.two_factor.settings'));
        $enableResponse->assertSessionHas('admin_2fa_recovery_export');

        $admin->refresh();
        $this->assertTrue($admin->hasAdminTwoFactorEnabled());
        $this->assertGreaterThan(0, $admin->getAdminTwoFactorRecoveryCodesRemainingCount());

        $storedSecret = $admin->getAdminTwoFactorSecret();
        $this->assertNotNull($storedSecret);

        $disableCode = Totp::currentCode((string) $storedSecret);

        $this->actingAs($admin)
            ->withSession(['admin_2fa_passed_at' => time()])
            ->post(route('admin.two_factor.disable'), [
                'current_password' => 'password',
                'code' => $disableCode,
            ])
            ->assertRedirect(route('admin.two_factor.settings'));

        $admin->refresh();
        $this->assertFalse($admin->hasAdminTwoFactorEnabled());
        $this->assertSame(0, $admin->getAdminTwoFactorRecoveryCodesRemainingCount());
    }

    public function test_admin_can_regenerate_recovery_codes(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('password'),
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $oldCodes = $admin->generateAdminTwoFactorRecoveryCodes(2);
        $admin->save();

        $regenResponse = $this->actingAs($admin)
            ->withSession(['admin_2fa_passed_at' => time()])
            ->post(route('admin.two_factor.recovery.regenerate'), [
                'current_password' => 'password',
                'code' => Totp::currentCode($secret),
            ]);

        $regenResponse->assertRedirect(route('admin.two_factor.settings'));
        $regenResponse->assertSessionHas('admin_2fa_recovery_export');

        $newCodes = (array) data_get(session('admin_2fa_recovery_export'), 'codes', []);
        $this->assertNotSame([], $newCodes);
        $this->assertNotSame($oldCodes, $newCodes);

        $admin->refresh();
        $this->assertGreaterThan(0, $admin->getAdminTwoFactorRecoveryCodesRemainingCount());
    }

    public function test_admin_can_download_and_print_fresh_recovery_codes_with_token(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $payload = [
            'token' => 'token-demo-123',
            'codes' => ['ABCD-EFGH-IJKL', 'MNOP-QRST-UVWX'],
            'created_at' => time(),
        ];

        $download = $this->actingAs($admin)
            ->withSession([
                'admin_2fa_passed_at' => time(),
                'admin_2fa_recovery_export' => $payload,
            ])
            ->get(route('admin.two_factor.recovery.download', ['token' => $payload['token']]));

        $download->assertOk();
        $download->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $download->assertSee('ABCD-EFGH-IJKL', false);

        $print = $this->actingAs($admin)
            ->withSession([
                'admin_2fa_passed_at' => time(),
                'admin_2fa_recovery_export' => $payload,
            ])
            ->get(route('admin.two_factor.recovery.print', ['token' => $payload['token']]));

        $print->assertOk();
        $print->assertSee('MNOP-QRST-UVWX', false);
    }

    public function test_admin_cannot_export_recovery_codes_with_invalid_token(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $payload = [
            'token' => 'token-correcto',
            'codes' => ['ABCD-EFGH-IJKL'],
            'created_at' => time(),
        ];

        $this->actingAs($admin)
            ->withSession([
                'admin_2fa_passed_at' => time(),
                'admin_2fa_recovery_export' => $payload,
            ])
            ->get(route('admin.two_factor.recovery.download', ['token' => 'token-invalido']))
            ->assertNotFound();

        $this->actingAs($admin)
            ->withSession([
                'admin_2fa_passed_at' => time(),
                'admin_2fa_recovery_export' => $payload,
            ])
            ->get(route('admin.two_factor.recovery.print', ['token' => 'token-invalido']))
            ->assertNotFound();
    }

    public function test_admin_can_clear_visible_recovery_export_payload(): void
    {
        $secret = Totp::generateSecret();
        $admin = User::factory()->create([
            'role' => 'admin',
            'admin_two_factor_secret' => Crypt::encryptString($secret),
            'admin_two_factor_enabled_at' => now(),
        ]);

        $payload = [
            'token' => 'token-visible',
            'codes' => ['ABCD-EFGH-IJKL'],
            'created_at' => time(),
        ];

        $response = $this->actingAs($admin)
            ->withSession([
                'admin_2fa_passed_at' => time(),
                'admin_2fa_recovery_export' => $payload,
            ])
            ->post(route('admin.two_factor.recovery.clear'));

        $response->assertRedirect(route('admin.two_factor.settings'));
        $response->assertSessionHas('success');
        $response->assertSessionMissing('admin_2fa_recovery_export');
    }
}

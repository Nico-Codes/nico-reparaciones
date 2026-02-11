<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthEmailFlowsTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_sends_verification_email_and_redirects_to_notice(): void
    {
        Notification::fake();

        $response = $this->post(route('register.post'), [
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '3415550101',
            'email' => 'nuevo-verificacion@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $user = User::query()->where('email', 'nuevo-verificacion@example.com')->first();

        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('verification.notice'));

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_unverified_user_is_redirected_to_verification_notice_on_checkout(): void
    {
        $user = User::factory()->unverified()->create([
            'last_name' => 'Tester',
            'phone' => '3415550102',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('checkout'));

        $response->assertRedirect(route('verification.notice'));
        $response->assertSessionHas('verification_required_for', 'checkout');
        $response->assertSessionHas('post_verification_redirect', route('checkout'));
    }

    public function test_user_can_verify_email_with_signed_link(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        $response->assertRedirect(route('home'));
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_user_is_redirected_back_to_checkout_after_successful_verification_when_it_was_blocked(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->actingAs($user)
            ->withSession([
                'verification_required_for' => 'checkout',
                'post_verification_redirect' => route('checkout'),
            ])
            ->get($verificationUrl);

        $response->assertRedirect(route('checkout'));
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_verification_notice_shows_checkout_context_message(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)
            ->withSession([
                'verification_required_for' => 'checkout',
                'post_verification_redirect' => route('checkout'),
            ])
            ->get(route('verification.notice'));

        $response->assertOk();
        $response->assertSee('Para finalizar tu compra necesitas verificar tu correo primero.');
        $response->assertSee('te llevaremos automaticamente al checkout');
    }

    public function test_forgot_password_sends_reset_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'recuperar@example.com',
        ]);

        $response = $this->post(route('password.email'), [
            'email' => $user->email,
        ]);

        $response->assertSessionHas('status');
        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-token@example.com',
            'password' => Hash::make('Vieja12345'),
        ]);

        $token = Password::createToken($user);
        $newPassword = 'Nueva12345';

        $response = $this->post(route('password.update'), [
            'token' => $token,
            'email' => $user->email,
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);

        $response->assertRedirect(route('login'));

        $freshUser = $user->fresh();
        $this->assertNotNull($freshUser);
        $this->assertTrue(Hash::check($newPassword, (string) $freshUser->password));
    }

    public function test_login_with_unverified_account_redirects_to_verification_notice(): void
    {
        Notification::fake();

        $password = 'Password123';
        $user = User::factory()->unverified()->create([
            'email' => 'sin-verificar@example.com',
            'password' => Hash::make($password),
        ]);

        $response = $this->post(route('login.post'), [
            'email' => $user->email,
            'password' => $password,
        ]);

        $response->assertRedirect(route('verification.notice'));
        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }
}

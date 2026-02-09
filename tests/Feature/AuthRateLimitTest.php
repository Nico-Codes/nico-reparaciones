<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_temporarily_blocked_after_too_many_failed_attempts(): void
    {
        $user = User::factory()->create([
            'email' => 'ratelimit-login@example.com',
            'password' => Hash::make('CorrectPass123'),
        ]);

        $throttleKey = 'login:' . Str::transliterate(Str::lower($user->email)) . '|127.0.0.1';
        RateLimiter::clear($throttleKey);

        for ($i = 0; $i < 5; $i++) {
            $response = $this->from(route('login'))->post(route('login.post'), [
                'email' => $user->email,
                'password' => 'password-incorrecta',
            ]);

            $response->assertRedirect(route('login'));
            $response->assertSessionHasErrors('email');
        }

        $blocked = $this->from(route('login'))->post(route('login.post'), [
            'email' => $user->email,
            'password' => 'password-incorrecta',
        ]);

        $blocked->assertRedirect(route('login'));
        $blocked->assertSessionHasErrors('email');

        $error = (string) session('errors')->first('email');
        $this->assertStringContainsString('Demasiados intentos', $error);
    }

    public function test_register_is_rate_limited_by_ip_after_repeated_attempts(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $response = $this->from(route('register'))->post(route('register.post'), [
                'name' => 'Nico',
                'last_name' => 'Tester',
                'phone' => '11 2222 3333',
                'email' => "ratelimit-register-{$i}@example.com",
                'password' => '1234567',
                'password_confirmation' => '1234567',
            ]);

            $response->assertRedirect(route('register'));
            $response->assertSessionHasErrors('password');
        }

        $blocked = $this->from(route('register'))->post(route('register.post'), [
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '11 2222 3333',
            'email' => 'ratelimit-register-final@example.com',
            'password' => '1234567',
            'password_confirmation' => '1234567',
        ]);

        $blocked->assertRedirect(route('register'));
        $blocked->assertSessionHasErrors('email');

        $error = (string) session('errors')->first('email');
        $this->assertStringContainsString('Demasiados intentos de registro', $error);
    }
}

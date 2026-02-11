<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AccountEmailVerificationStateTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_email_resets_verification_and_sends_new_verification_email(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '3415552233',
            'email' => 'original@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->put(route('account.update'), [
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '3415552233',
            'email' => 'nuevo@example.com',
        ]);

        $response->assertRedirect(route('verification.notice'));

        $fresh = $user->fresh();
        $this->assertNotNull($fresh);
        $this->assertSame('nuevo@example.com', $fresh->email);
        $this->assertNull($fresh->email_verified_at);

        Notification::assertSentTo($fresh, VerifyEmailNotification::class);
    }

    public function test_account_page_shows_unverified_email_state_and_resend_action(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'pendiente@example.com',
        ]);

        $response = $this->actingAs($user)->get(route('account.edit'));

        $response->assertOk();
        $response->assertSee('Estado del correo');
        $response->assertSee('aun no esta verificado');
        $response->assertSee('Reenviar correo de verificacion');
    }
}


<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LayoutEmailVerificationIndicatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_user_sees_email_verification_indicator_in_header(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get(route('store.index'));

        $response->assertOk();
        $response->assertSee('Correo sin verificar');
        $response->assertSee('Email pendiente de verificacion');
        $response->assertSee(route('verification.notice'), false);
    }

    public function test_verified_user_does_not_see_email_verification_indicator_in_header(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('store.index'));

        $response->assertOk();
        $response->assertDontSee('Correo sin verificar');
        $response->assertSee('Email verificado');
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartAddedToastViewRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_layout_toast_renders_product_name_when_cart_added_uses_name_key(): void
    {
        $response = $this
            ->withSession([
                'cart_added' => [
                    'name' => 'Cable USB-C',
                    'quantity' => 1,
                ],
            ])
            ->get(route('store.index'));

        $response->assertOk();
        $response->assertSee('id="cartAddedName"', false);
        $response->assertSee('Cable USB-C');
    }

    public function test_layout_toast_keeps_legacy_product_name_key_compatibility(): void
    {
        $response = $this
            ->withSession([
                'cart_added' => [
                    'product_name' => 'Cargador 20W',
                    'quantity' => 1,
                ],
            ])
            ->get(route('store.index'));

        $response->assertOk();
        $response->assertSee('Cargador 20W');
    }
}


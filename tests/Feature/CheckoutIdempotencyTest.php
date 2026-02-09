<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckoutIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_checkout_submission_with_same_token_does_not_create_duplicate_order(): void
    {
        $user = User::factory()->create([
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '11 5555 6666',
        ]);

        $category = Category::create([
            'name' => 'Cables',
            'slug' => 'cables',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable USB-C',
            'slug' => 'cable-usbc-idempotency',
            'price' => 3000,
            'stock' => 10,
            'featured' => false,
        ]);

        $token = (string) Str::uuid();

        $this->actingAs($user);

        $first = $this->withSession([
            'cart' => [
                $product->id => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (int) $product->price,
                    'quantity' => 2,
                    'slug' => $product->slug,
                    'stock' => (int) $product->stock,
                ],
            ],
            'checkout_token' => $token,
        ])->post(route('checkout.confirm'), [
            'payment_method' => 'local',
            'checkout_token' => $token,
        ]);

        $order = Order::query()->latest('id')->first();
        $this->assertNotNull($order);
        $first->assertRedirect(route('orders.thankyou', $order));

        // Simula reintento/doble submit del mismo formulario.
        $second = $this->post(route('checkout.confirm'), [
            'payment_method' => 'local',
            'checkout_token' => $token,
        ]);

        $second->assertRedirect(route('orders.thankyou', $order));

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 1);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);
    }

    public function test_checkout_rejects_when_token_does_not_match_current_session_token(): void
    {
        $user = User::factory()->create([
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '11 5555 6666',
        ]);

        $category = Category::create([
            'name' => 'Cargadores',
            'slug' => 'cargadores',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cargador 20W',
            'slug' => 'cargador-20w-idempotency',
            'price' => 6500,
            'stock' => 5,
            'featured' => false,
        ]);

        $this->actingAs($user);

        $response = $this->withSession([
            'cart' => [
                $product->id => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (int) $product->price,
                    'quantity' => 1,
                    'slug' => $product->slug,
                    'stock' => (int) $product->stock,
                ],
            ],
            'checkout_token' => 'token-valido-en-session',
        ])->post(route('checkout.confirm'), [
            'payment_method' => 'local',
            'checkout_token' => 'token-distinto',
        ]);

        $response->assertRedirect(route('checkout'));
        $response->assertSessionHasErrors('cart');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 5,
        ]);
    }
}


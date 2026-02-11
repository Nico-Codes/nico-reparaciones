<?php

namespace Tests\Feature;

use App\Mail\OrderCustomerConfirmationMail;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderConfirmationMailTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_sends_customer_confirmation_email(): void
    {
        Mail::fake();
        config()->set('ops.mail.async_enabled', false);

        $user = User::factory()->create([
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '3415551122',
            'email' => 'pedido-mail@example.com',
        ]);

        $category = Category::create([
            'name' => 'Accesorios correo',
            'slug' => 'accesorios-correo',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable QA mail',
            'slug' => 'cable-qa-mail',
            'price' => 4200,
            'stock' => 4,
            'featured' => false,
        ]);

        $token = (string) Str::uuid();

        $response = $this->actingAs($user)->withSession([
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
            'checkout_token' => $token,
        ])->post(route('checkout.confirm'), [
            'payment_method' => 'local',
            'checkout_token' => $token,
        ]);

        $order = Order::query()->latest('id')->first();
        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.thankyou', $order));

        Mail::assertSent(OrderCustomerConfirmationMail::class, function (OrderCustomerConfirmationMail $mail) use ($user, $order): bool {
            return $mail->hasTo($user->email) && (int) $mail->order->id === (int) $order->id;
        });
    }

    public function test_checkout_queues_customer_confirmation_email_when_async_mail_is_enabled(): void
    {
        Mail::fake();
        config()->set('ops.mail.async_enabled', true);
        config()->set('ops.mail.queue', 'mail');

        $user = User::factory()->create([
            'name' => 'Nico',
            'last_name' => 'Tester',
            'phone' => '3415551133',
            'email' => 'pedido-mail-queue@example.com',
        ]);

        $category = Category::create([
            'name' => 'Accesorios cola',
            'slug' => 'accesorios-cola',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable QA queue',
            'slug' => 'cable-qa-queue',
            'price' => 4200,
            'stock' => 4,
            'featured' => false,
        ]);

        $token = (string) Str::uuid();

        $response = $this->actingAs($user)->withSession([
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
            'checkout_token' => $token,
        ])->post(route('checkout.confirm'), [
            'payment_method' => 'local',
            'checkout_token' => $token,
        ]);

        $order = Order::query()->latest('id')->first();
        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.thankyou', $order));

        Mail::assertQueued(OrderCustomerConfirmationMail::class, function (OrderCustomerConfirmationMail $mail) use ($user, $order): bool {
            return $mail->hasTo($user->email)
                && (int) $mail->order->id === (int) $order->id
                && $mail->queue === 'mail';
        });
    }
}

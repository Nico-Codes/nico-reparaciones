<?php

namespace Tests\Feature;

use App\Models\BusinessSetting;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderWhatsappLog;
use App\Models\OrderWhatsappTemplate;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCriticalGuardsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_order_whatsapp_log_replaces_supported_placeholders(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create([
            'name' => 'Juan',
            'last_name' => 'Perez',
            'phone' => '11 3333 4444',
        ]);

        BusinessSetting::updateOrCreate(['key' => 'shop_phone'], ['value' => '+54 9 11 1111 2222']);
        BusinessSetting::updateOrCreate(['key' => 'shop_address'], ['value' => 'Av. Siempre Viva 123']);
        BusinessSetting::updateOrCreate(['key' => 'shop_hours'], ['value' => 'Lun a Vie 9-18']);
        BusinessSetting::updateOrCreate(['key' => 'company_name'], ['value' => 'NicoReparaciones']);

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 12345,
            'pickup_name' => 'Juan Perez',
            'pickup_phone' => '11 7654 3210',
            'notes' => 'Llamar antes de entregar',
        ]);

        $category = Category::create([
            'name' => 'Accesorios',
            'slug' => 'accesorios',
        ]);

        $productA = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable USB-C',
            'slug' => 'cable-usbc-log',
            'price' => 3000,
            'stock' => 20,
            'featured' => false,
        ]);

        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Cargador 20W',
            'slug' => 'cargador-20w-log',
            'price' => 6345,
            'stock' => 20,
            'featured' => false,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $productA->id,
            'product_name' => 'Cable USB-C',
            'price' => 3000,
            'quantity' => 2,
            'subtotal' => 6000,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $productB->id,
            'product_name' => 'Cargador 20W',
            'price' => 6345,
            'quantity' => 1,
            'subtotal' => 6345,
        ]);

        OrderWhatsappTemplate::updateOrCreate(
            ['status' => 'pendiente'],
            [
                'template' => implode("\n", [
                    'Pedido {order_id}',
                    'Cliente {customer_name}',
                    'Estado {status_label} ({status})',
                    'Total {total} / {total_raw}',
                    'Items {items_count}',
                    '{items_summary}',
                    'Retira {pickup_name} - {pickup_phone} - {phone}',
                    'Notas {notes}',
                    'Links {my_orders_url} | {store_url}',
                    'Local {shop_name} {shop_phone} {shop_address} {shop_hours}',
                ]),
            ]
        );

        $response = $this->actingAs($admin)->postJson(route('admin.orders.whatsappLogAjax', $order));

        $response->assertOk()->assertJson(['ok' => true]);

        $log = OrderWhatsappLog::query()
            ->where('order_id', $order->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $message = (string) $log->message;

        $this->assertStringContainsString('Pedido ' . $order->id, $message);
        $this->assertStringContainsString('Cliente Juan Perez', $message);
        $this->assertStringContainsString('Estado Pendiente (pendiente)', $message);
        $this->assertStringContainsString('$ 12.345', $message);
        $this->assertStringContainsString('Items 3', $message);
        $this->assertStringContainsString('2x Cable USB-C', $message);
        $this->assertStringContainsString('1x Cargador 20W', $message);
        $this->assertStringContainsString('Retira Juan Perez - 1176543210 - 1176543210', $message);
        $this->assertStringContainsString('Notas Llamar antes de entregar', $message);
        $this->assertStringContainsString(url('/mis-pedidos'), $message);
        $this->assertStringContainsString(url('/tienda'), $message);
        $this->assertStringContainsString('NicoReparaciones', $message);
        $this->assertStringContainsString('Av. Siempre Viva 123', $message);
        $this->assertStringContainsString('Lun a Vie 9-18', $message);
        $this->assertStringNotContainsString('{', $message);
    }

    public function test_admin_order_whatsapp_log_ajax_fails_without_valid_phone(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create(['phone' => null]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 1000,
            'pickup_name' => 'Sin Telefono',
            'pickup_phone' => '',
        ]);

        $response = $this->actingAs($admin)->postJson(route('admin.orders.whatsappLogAjax', $order));

        $response->assertStatus(422)
            ->assertJson([
                'ok' => false,
                'error' => 'invalid_phone',
            ]);
    }

    public function test_admin_cannot_delete_category_with_products_already_sold(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create();

        $category = Category::create([
            'name' => 'Cables',
            'slug' => 'cables',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable USB-C',
            'slug' => 'cable-usbc',
            'price' => 3000,
            'stock' => 10,
            'featured' => false,
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 3000,
            'pickup_name' => 'Comprador',
            'pickup_phone' => '11 4444 5555',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'price' => 3000,
            'quantity' => 1,
            'subtotal' => 3000,
        ]);

        $response = $this->actingAs($admin)->delete(route('admin.categories.destroy', $category));

        $response->assertRedirect(route('admin.categories.index'));
        $response->assertSessionHasErrors('delete');
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_admin_cannot_delete_product_with_existing_order_items(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create();

        $category = Category::create([
            'name' => 'Cargadores',
            'slug' => 'cargadores',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cargador 20W',
            'slug' => 'cargador-20w',
            'price' => 6500,
            'stock' => 8,
            'featured' => false,
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 6500,
            'pickup_name' => 'Comprador',
            'pickup_phone' => '11 4444 5555',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'price' => 6500,
            'quantity' => 1,
            'subtotal' => 6500,
        ]);

        $response = $this->actingAs($admin)->delete(route('admin.products.destroy', $product));

        $response->assertRedirect(route('admin.products.index'));
        $response->assertSessionHasErrors('delete');
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}

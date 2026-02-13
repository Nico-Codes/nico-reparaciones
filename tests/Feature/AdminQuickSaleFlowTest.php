<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminQuickSaleFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_products_by_sku_and_confirm_quick_sale(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $category = Category::create([
            'name' => 'Mostrador',
            'slug' => 'mostrador',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable USB-C Mostrador',
            'slug' => 'cable-usbc-mostrador',
            'sku' => 'CAB-USB-C-001',
            'barcode' => '7791234567001',
            'price' => 5000,
            'stock' => 6,
            'active' => true,
        ]);

        $add = $this->post(route('admin.quick_sales.add'), [
            'code' => 'CAB-USB-C-001',
            'quantity' => 2,
        ]);

        $add->assertRedirect();
        $add->assertSessionHasNoErrors();
        $this->assertNotEmpty(session('admin_quick_sale_cart'));

        $confirm = $this->post(route('admin.quick_sales.confirm'), [
            'customer_name' => 'Venta Mostrador',
            'customer_phone' => '3415550000',
            'payment_method' => 'local',
            'notes' => 'Ticket de prueba',
        ]);
        $confirm->assertSessionHasNoErrors();

        $order = Order::query()->latest('id')->first();
        $this->assertNotNull($order);

        $confirm->assertRedirect(route('admin.orders.show', $order));

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'entregado',
            'total' => 10000,
            'pickup_name' => 'Venta Mostrador',
            'payment_method' => 'local',
        ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'subtotal' => 10000,
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 4,
        ]);

        $this->assertDatabaseHas('ledger_entries', [
            'event_key' => 'quick_sale:' . $order->id,
            'direction' => 'inflow',
            'category' => 'quick_sale',
            'amount' => 10000,
        ]);
    }
}

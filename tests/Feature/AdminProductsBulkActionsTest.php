<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProductsBulkActionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_bulk_deactivate_and_set_stock(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $category = Category::create([
            'name' => 'Bulk Test',
            'slug' => 'bulk-test',
        ]);

        $productA = Product::create([
            'category_id' => $category->id,
            'name' => 'Bulk Producto A',
            'slug' => 'bulk-producto-a',
            'price' => 1000,
            'stock' => 4,
            'active' => true,
            'featured' => false,
        ]);

        $productB = Product::create([
            'category_id' => $category->id,
            'name' => 'Bulk Producto B',
            'slug' => 'bulk-producto-b',
            'price' => 1200,
            'stock' => 6,
            'active' => true,
            'featured' => false,
        ]);

        $deactivate = $this->actingAs($admin)->postJson(route('admin.products.bulk'), [
            'ids' => [$productA->id, $productB->id],
            'action' => 'deactivate',
        ]);

        $deactivate->assertOk()->assertJson([
            'ok' => true,
            'affected' => 2,
        ]);

        $this->assertDatabaseHas('products', ['id' => $productA->id, 'active' => 0]);
        $this->assertDatabaseHas('products', ['id' => $productB->id, 'active' => 0]);

        $setStock = $this->actingAs($admin)->postJson(route('admin.products.bulk'), [
            'ids' => [$productA->id, $productB->id],
            'action' => 'set_stock',
            'stock' => 21,
        ]);

        $setStock->assertOk()->assertJson([
            'ok' => true,
            'affected' => 2,
        ]);

        $this->assertDatabaseHas('products', ['id' => $productA->id, 'stock' => 21]);
        $this->assertDatabaseHas('products', ['id' => $productB->id, 'stock' => 21]);
    }

    public function test_bulk_delete_skips_products_with_order_items(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $buyer = User::factory()->create();

        $category = Category::create([
            'name' => 'Bulk Delete',
            'slug' => 'bulk-delete',
        ]);

        $lockedProduct = Product::create([
            'category_id' => $category->id,
            'name' => 'Producto Bloqueado',
            'slug' => 'producto-bloqueado',
            'price' => 5000,
            'stock' => 3,
            'active' => true,
            'featured' => false,
        ]);

        $freeProduct = Product::create([
            'category_id' => $category->id,
            'name' => 'Producto Libre',
            'slug' => 'producto-libre',
            'price' => 3000,
            'stock' => 7,
            'active' => true,
            'featured' => false,
        ]);

        $order = Order::create([
            'user_id' => $buyer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => 5000,
            'pickup_name' => 'Comprador',
            'pickup_phone' => '3415558888',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $lockedProduct->id,
            'product_name' => $lockedProduct->name,
            'price' => 5000,
            'quantity' => 1,
            'subtotal' => 5000,
        ]);

        $response = $this->actingAs($admin)->postJson(route('admin.products.bulk'), [
            'ids' => [$lockedProduct->id, $freeProduct->id],
            'action' => 'delete',
        ]);

        $response->assertOk()->assertJson([
            'ok' => true,
            'affected' => 1,
            'skipped' => 1,
        ]);

        $this->assertDatabaseHas('products', ['id' => $lockedProduct->id]);
        $this->assertDatabaseMissing('products', ['id' => $freeProduct->id]);
    }
}

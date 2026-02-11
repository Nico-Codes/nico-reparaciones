<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderWhatsappLog;
use App\Models\Product;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2eSmokeSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::firstOrCreate(
            ['email' => 'e2e.customer@nico.local'],
            [
                'name' => 'E2E',
                'last_name' => 'Cliente',
                'phone' => '3415550011',
                'password' => Hash::make('e2e12345'),
                'role' => 'user',
            ]
        );

        $customerNoPhone = User::firstOrCreate(
            ['email' => 'e2e.nophone@nico.local'],
            [
                'name' => 'E2E',
                'last_name' => 'NoPhone',
                'phone' => null,
                'password' => Hash::make('e2e12345'),
                'role' => 'user',
            ]
        );

        $admin = User::query()
            ->where('role', 'admin')
            ->orderBy('id')
            ->first();

        $product = Product::query()
            ->where('active', true)
            ->where('stock', '>', 0)
            ->orderBy('id')
            ->first();

        if (!$product) {
            return;
        }

        $transitionOrder = Order::create([
            'user_id' => $customer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => (int) $product->price,
            'pickup_name' => 'E2E Transition',
            'pickup_phone' => '3415550099',
            'notes' => 'seed e2e transition order',
        ]);

        $waPendingOrder = Order::create([
            'user_id' => $customer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => (int) $product->price,
            'pickup_name' => 'E2E WA Pending',
            'pickup_phone' => '3415550101',
            'notes' => 'seed e2e wa pending',
        ]);

        $waSentOrder = Order::create([
            'user_id' => $customer->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => (int) $product->price,
            'pickup_name' => 'E2E WA Sent',
            'pickup_phone' => '3415550102',
            'notes' => 'seed e2e wa sent',
        ]);

        $waNoPhoneOrder = Order::create([
            'user_id' => $customerNoPhone->id,
            'status' => 'pendiente',
            'payment_method' => 'local',
            'total' => (int) $product->price,
            'pickup_name' => 'E2E WA NoPhone',
            'pickup_phone' => null,
            'notes' => 'seed e2e wa no phone',
        ]);

        foreach ([$transitionOrder, $waPendingOrder, $waSentOrder, $waNoPhoneOrder] as $order) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'price' => (int) $product->price,
                'quantity' => 1,
                'subtotal' => (int) $product->price,
            ]);
        }

        OrderWhatsappLog::create([
            'order_id' => $waSentOrder->id,
            'notified_status' => 'pendiente',
            'phone' => '5493415550102',
            'message' => 'seed e2e wa sent',
            'sent_by' => $admin?->id,
            'sent_at' => now(),
        ]);

        $activeCategory = Category::firstOrCreate(
            ['slug' => 'e2e-store-active'],
            [
                'name' => 'E2E Store Active',
                'description' => 'Categoria activa para pruebas E2E de tienda',
            ]
        );
        $activeCategory->active = true;
        $activeCategory->save();

        $inactiveCategory = Category::firstOrCreate(
            ['slug' => 'e2e-store-inactive'],
            [
                'name' => 'E2E Store Inactive',
                'description' => 'Categoria inactiva para pruebas E2E de tienda',
            ]
        );
        $inactiveCategory->active = false;
        $inactiveCategory->save();

        $noStockProduct = Product::firstOrCreate(
            ['slug' => 'e2e-store-no-stock-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Store No Stock Product',
                'price' => 9999,
                'stock' => 0,
                'description' => 'Producto activo sin stock para validar UI de detalle.',
                'featured' => false,
            ]
        );
        $noStockProduct->category_id = $activeCategory->id;
        $noStockProduct->stock = 0;
        $noStockProduct->active = true;
        $noStockProduct->save();

        $inactiveProduct = Product::firstOrCreate(
            ['slug' => 'e2e-store-inactive-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Store Inactive Product',
                'price' => 10999,
                'stock' => 4,
                'description' => 'Producto inactivo para validar guardas de acceso.',
                'featured' => false,
            ]
        );
        $inactiveProduct->category_id = $activeCategory->id;
        $inactiveProduct->active = false;
        $inactiveProduct->stock = max(1, (int) $inactiveProduct->stock);
        $inactiveProduct->save();

        $inactiveCategoryProduct = Product::firstOrCreate(
            ['slug' => 'e2e-store-inactive-category-product'],
            [
                'category_id' => $inactiveCategory->id,
                'name' => 'E2E Store Inactive Category Product',
                'price' => 11999,
                'stock' => 5,
                'description' => 'Producto en categoria inactiva para validar 404.',
                'featured' => false,
            ]
        );
        $inactiveCategoryProduct->category_id = $inactiveCategory->id;
        $inactiveCategoryProduct->active = true;
        $inactiveCategoryProduct->stock = max(1, (int) $inactiveCategoryProduct->stock);
        $inactiveCategoryProduct->save();

        $stockSyncProduct = Product::firstOrCreate(
            ['slug' => 'e2e-stock-sync-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Stock Sync Product',
                'price' => 13999,
                'stock' => 5,
                'description' => 'Producto para validar sincronizacion de stock entre admin y checkout.',
                'featured' => false,
            ]
        );
        $stockSyncProduct->category_id = $activeCategory->id;
        $stockSyncProduct->active = true;
        $stockSyncProduct->stock = 5;
        $stockSyncProduct->save();

        $stockClampProduct = Product::firstOrCreate(
            ['slug' => 'e2e-stock-clamp-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Stock Clamp Product',
                'price' => 12999,
                'stock' => 5,
                'description' => 'Producto para validar clamp de cantidad cuando baja el stock.',
                'featured' => false,
            ]
        );
        $stockClampProduct->category_id = $activeCategory->id;
        $stockClampProduct->active = true;
        $stockClampProduct->stock = 5;
        $stockClampProduct->save();

        $stockIncreaseProduct = Product::firstOrCreate(
            ['slug' => 'e2e-stock-increase-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Stock Increase Product',
                'price' => 14999,
                'stock' => 5,
                'description' => 'Producto para validar aumento de stock desde admin.',
                'featured' => false,
            ]
        );
        $stockIncreaseProduct->category_id = $activeCategory->id;
        $stockIncreaseProduct->active = true;
        $stockIncreaseProduct->stock = 5;
        $stockIncreaseProduct->save();

        $priceSyncProduct = Product::firstOrCreate(
            ['slug' => 'e2e-price-sync-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Price Sync Product',
                'price' => 10000,
                'stock' => 5,
                'description' => 'Producto para validar sincronizacion de precios en carrito.',
                'featured' => false,
            ]
        );
        $priceSyncProduct->category_id = $activeCategory->id;
        $priceSyncProduct->active = true;
        $priceSyncProduct->stock = 5;
        $priceSyncProduct->price = 10000;
        $priceSyncProduct->save();

        $inactiveSyncProduct = Product::firstOrCreate(
            ['slug' => 'e2e-inactive-sync-product'],
            [
                'category_id' => $activeCategory->id,
                'name' => 'E2E Inactive Sync Product',
                'price' => 11000,
                'stock' => 5,
                'description' => 'Producto para validar remocion del carrito cuando queda inactivo.',
                'featured' => false,
            ]
        );
        $inactiveSyncProduct->category_id = $activeCategory->id;
        $inactiveSyncProduct->active = true;
        $inactiveSyncProduct->stock = 5;
        $inactiveSyncProduct->save();

        $categorySyncActive = Category::firstOrCreate(
            ['slug' => 'e2e-category-sync-active'],
            [
                'name' => 'E2E Category Sync Active',
                'description' => 'Categoria para validar remocion por inactivacion desde admin.',
            ]
        );
        $categorySyncActive->active = true;
        $categorySyncActive->save();

        $categoryInactiveSyncProduct = Product::firstOrCreate(
            ['slug' => 'e2e-category-inactive-sync-product'],
            [
                'category_id' => $categorySyncActive->id,
                'name' => 'E2E Category Inactive Sync Product',
                'price' => 11500,
                'stock' => 5,
                'description' => 'Producto para validar sincronizacion al inactivar su categoria.',
                'featured' => false,
            ]
        );
        $categoryInactiveSyncProduct->category_id = $categorySyncActive->id;
        $categoryInactiveSyncProduct->active = true;
        $categoryInactiveSyncProduct->stock = 5;
        $categoryInactiveSyncProduct->save();

        Repair::create([
            'code' => 'R-E2E-OK-0001',
            'user_id' => $customer->id,
            'customer_name' => 'E2E Lookup',
            'customer_phone' => '3415550111',
            'device_brand' => 'E2EBrand',
            'device_model' => 'E2EModel',
            'issue_reported' => 'Pantalla rota',
            'diagnosis' => 'Cambio de modulo',
            'status' => 'repairing',
            'received_at' => now()->subDay(),
        ]);

    }
}

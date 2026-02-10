<?php

namespace Database\Seeders;

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

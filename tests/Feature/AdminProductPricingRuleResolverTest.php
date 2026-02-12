<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPricingRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProductPricingRuleResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_resolve_recommended_product_price_by_rule(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $category = Category::create([
            'name' => 'Cables',
            'slug' => 'cables',
            'active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cable USB C',
            'slug' => 'cable-usb-c',
            'sku' => 'CAB-USB-C-777',
            'barcode' => '7790000000777',
            'cost_price' => 4000,
            'price' => 6000,
            'stock' => 20,
            'active' => true,
        ]);

        ProductPricingRule::create([
            'name' => 'Cables baratos +50',
            'category_id' => $category->id,
            'product_id' => null,
            'cost_min' => 0,
            'cost_max' => 5000,
            'margin_percent' => 50,
            'priority' => 10,
            'active' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.product_pricing_rules.resolve', [
            'category_id' => $category->id,
            'product_id' => $product->id,
            'cost_price' => 4000,
        ]));

        $response
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'recommended_price' => 6000,
                'margin_percent' => 50.0,
            ]);
    }
}

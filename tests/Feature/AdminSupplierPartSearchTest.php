<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminSupplierPartSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_search_parts_across_enabled_suppliers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Supplier::query()->create([
            'name' => 'Proveedor API 1',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-one.test/search?q={query}',
            'search_config' => [
                'items_path' => 'items',
                'name_field' => 'title',
                'price_field' => 'price',
                'stock_field' => 'stock',
                'url_field' => 'url',
            ],
        ]);

        Supplier::query()->create([
            'name' => 'Proveedor API 2',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-two.test/search?q={query}',
            'search_config' => [
                'items_path' => 'data.items',
                'name_field' => 'name',
                'price_field' => 'price',
                'stock_field' => 'availability',
                'url_field' => 'link',
            ],
        ]);

        Http::fake([
            'provider-one.test/*' => Http::response([
                'items' => [
                    ['title' => 'Modulo A30 original', 'price' => '45000', 'stock' => '3', 'url' => 'https://provider-one.test/a30'],
                ],
            ], 200),
            'provider-two.test/*' => Http::response([
                'data' => [
                    'items' => [
                        ['name' => 'Modulo A30 genérico', 'price' => 39000, 'availability' => '5', 'link' => 'https://provider-two.test/a30'],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search', ['q' => 'modulo a30']));
        $response->assertOk();
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('count', 2);
        $response->assertJsonPath('avg_price', 42000);
        $response->assertJsonPath('best_price', 39000);
        $response->assertJsonPath('results.0.price', 39000);
        $response->assertJsonPath('results.1.price', 45000);
        $response->assertJsonPath('results.0.saving_vs_avg', 3000);
        $response->assertJsonPath('results.0.is_best_price', true);
    }

    public function test_admin_can_search_parts_from_html_suppliers_with_link_parser(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Supplier::query()->create([
            'name' => 'Proveedor HTML',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'html',
            'search_endpoint' => 'https://provider-html.test/search?q={query}',
            'search_config' => [
                'candidate_paths' => ['/producto/'],
                'exclude_paths' => ['/categoria-producto/', 'add-to-cart='],
            ],
        ]);

        Http::fake([
            'provider-html.test/*' => Http::response('
                <div class="product-grid-item">
                    <a href="https://provider-html.test/producto/modulo-samsung-a30-incell/">Ver</a>
                    <h3><a href="https://provider-html.test/producto/modulo-samsung-a30-incell/">Modulo Samsung A30 Incell</a></h3>
                    <span class="price">$ 19000</span>
                </div>
                <div class="product-grid-item">
                    <a href="https://provider-html.test/producto/modulo-samsung-a30-oled/">Ver</a>
                    <h3><a href="https://provider-html.test/producto/modulo-samsung-a30-oled/">Modulo Samsung A30 OLED</a></h3>
                    <span class="price">$ 26000</span>
                </div>
            ', 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search', ['q' => 'modulo a30']));
        $response->assertOk();
        $response->assertJsonPath('ok', true);
        $response->assertJsonPath('count', 2);
        $response->assertJsonPath('best_price', 19000);
        $response->assertJsonPath('results.0.part_name', 'Modulo Samsung A30 Incell');
        $response->assertJsonPath('results.0.price', 19000);
        $response->assertJsonPath('results.0.is_best_price', true);
        $response->assertJsonPath('results.1.price', 26000);
    }

    public function test_results_are_sorted_by_relevance_before_price(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Supplier::query()->create([
            'name' => 'Proveedor Relevancia',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-relevance.test/search?q={query}',
            'search_config' => [
                'items_path' => 'items',
                'name_field' => 'title',
                'price_field' => 'price',
                'stock_field' => 'stock',
                'url_field' => 'url',
            ],
        ]);

        Http::fake([
            'provider-relevance.test/*' => Http::response([
                'items' => [
                    ['title' => 'Samsung A30 modulo generico', 'price' => 12000, 'stock' => '3', 'url' => 'https://provider-relevance.test/a'],
                    ['title' => 'Modulo Samsung A30 Incell', 'price' => 19000, 'stock' => '2', 'url' => 'https://provider-relevance.test/b'],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search', ['q' => 'modulo samsung a30']));

        $response->assertOk();
        $response->assertJsonPath('results.0.part_name', 'Modulo Samsung A30 Incell');
        $response->assertJsonPath('results.0.price', 19000);
        $response->assertJsonPath('results.1.part_name', 'Samsung A30 modulo generico');
        $response->assertJsonPath('results.1.price', 12000);
    }

    public function test_search_requires_all_query_words_in_result_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Supplier::query()->create([
            'name' => 'Proveedor Estricto',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-strict.test/search?q={query}',
            'search_config' => [
                'items_path' => 'items',
                'name_field' => 'title',
                'price_field' => 'price',
                'stock_field' => 'stock',
                'url_field' => 'url',
            ],
        ]);

        Http::fake([
            'provider-strict.test/*' => Http::response([
                'items' => [
                    ['title' => 'Modulo Samsung A10', 'price' => 15000, 'stock' => '2', 'url' => 'https://provider-strict.test/a10'],
                    ['title' => 'Modulo Samsung A20', 'price' => 12000, 'stock' => '2', 'url' => 'https://provider-strict.test/a20'],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search', ['q' => 'samsung a10']));

        $response->assertOk();
        $response->assertJsonPath('count', 1);
        $response->assertJsonPath('results.0.part_name', 'Modulo Samsung A10');
    }

    public function test_strict_search_is_case_and_accent_insensitive(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Supplier::query()->create([
            'name' => 'Proveedor Accent',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-accent.test/search?q={query}',
            'search_config' => [
                'items_path' => 'items',
                'name_field' => 'title',
                'price_field' => 'price',
                'stock_field' => 'stock',
                'url_field' => 'url',
            ],
        ]);

        Http::fake([
            'provider-accent.test/*' => Http::response([
                'items' => [
                    ['title' => 'Módulo SAMSUNG A10', 'price' => 15000, 'stock' => '2', 'url' => 'https://provider-accent.test/a10'],
                    ['title' => 'Modulo Samsung A20', 'price' => 12000, 'stock' => '2', 'url' => 'https://provider-accent.test/a20'],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search', ['q' => 'modulo samsung a10']));

        $response->assertOk();
        $response->assertJsonPath('count', 1);
        $response->assertJsonPath('results.0.part_name', 'Módulo SAMSUNG A10');
    }

    public function test_search_uses_fallback_query_variants_when_full_query_has_no_results(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Supplier::query()->create([
            'name' => 'Proveedor Fallback',
            'active' => true,
            'search_enabled' => true,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-fallback.test/search?q={query}',
            'search_config' => [
                'items_path' => 'items',
                'name_field' => 'title',
                'price_field' => 'price',
                'stock_field' => 'stock',
                'url_field' => 'url',
            ],
        ]);

        Http::fake([
            'provider-fallback.test/search?q=modulo+samsung+a30' => Http::response(['items' => []], 200),
            'provider-fallback.test/search?q=modulo+samsung' => Http::response(['items' => []], 200),
            'provider-fallback.test/search?q=samsung+a30' => Http::response(['items' => []], 200),
            'provider-fallback.test/search?q=modulo' => Http::response([
                'items' => [
                    ['title' => 'Modulo Samsung A30 Incell', 'price' => 17000, 'stock' => '4', 'url' => 'https://provider-fallback.test/a30'],
                ],
            ], 200),
            'provider-fallback.test/*' => Http::response(['items' => []], 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search', ['q' => 'modulo samsung a30']));

        $response->assertOk();
        $response->assertJsonPath('count', 1);
        $response->assertJsonPath('results.0.part_name', 'Modulo Samsung A30 Incell');
        $response->assertJsonPath('results.0.price', 17000);
    }

    public function test_admin_can_search_single_supplier_endpoint(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $supplier = Supplier::query()->create([
            'name' => 'Proveedor Uno',
            'active' => true,
            'search_enabled' => true,
            'search_priority' => 15,
            'search_mode' => 'json',
            'search_endpoint' => 'https://provider-one-single.test/search?q={query}',
            'search_config' => [
                'items_path' => 'items',
                'name_field' => 'title',
                'price_field' => 'price',
                'stock_field' => 'stock',
                'url_field' => 'url',
            ],
        ]);

        Http::fake([
            'provider-one-single.test/*' => Http::response([
                'items' => [
                    ['title' => 'Modulo A30', 'price' => 19000, 'stock' => '2', 'url' => 'https://provider-one-single.test/a30'],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.suppliers.parts.search_by_supplier', [
            'supplier' => $supplier->id,
            'q' => 'modulo a30',
        ]));

        $response->assertOk();
        $response->assertJsonPath('supplier.id', $supplier->id);
        $response->assertJsonPath('supplier.priority', 15);
        $response->assertJsonPath('count', 1);
        $response->assertJsonPath('results.0.part_name', 'Modulo A30');
    }
}

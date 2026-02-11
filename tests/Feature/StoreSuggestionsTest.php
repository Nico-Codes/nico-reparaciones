<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_suggestions_returns_empty_for_short_queries(): void
    {
        $response = $this->getJson('/tienda/sugerencias?q=a');

        $response->assertOk();
        $response->assertExactJson([
            'items' => [],
        ]);
    }

    public function test_suggestions_return_only_active_products_with_active_categories(): void
    {
        $activeCategory = Category::create([
            'name' => 'Cables',
            'slug' => 'cables',
            'active' => true,
        ]);

        $inactiveCategory = Category::create([
            'name' => 'Viejo',
            'slug' => 'viejo',
        ]);
        $inactiveCategory->forceFill(['active' => false])->save();

        Product::create([
            'category_id' => $activeCategory->id,
            'name' => 'Cable USB-C',
            'slug' => 'cable-usbc-ok',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 9000,
            'stock' => 10,
            'active' => true,
        ]);

        $inactiveProduct = Product::create([
            'category_id' => $activeCategory->id,
            'name' => 'Cable USB-C Inactivo',
            'slug' => 'cable-usbc-inactivo',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 8000,
            'stock' => 10,
        ]);
        $inactiveProduct->forceFill(['active' => false])->save();

        Product::create([
            'category_id' => $inactiveCategory->id,
            'name' => 'Cable USB-C Categoria Inactiva',
            'slug' => 'cable-usbc-cat-inactiva',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 7000,
            'stock' => 10,
            'active' => true,
        ]);

        $response = $this->getJson('/tienda/sugerencias?q=usb');

        $response->assertOk();
        $response->assertJsonCount(1, 'items');
        $response->assertJsonPath('items.0.name', 'Cable USB-C');
    }

    public function test_suggestions_respect_category_filter(): void
    {
        $cables = Category::create([
            'name' => 'Cables',
            'slug' => 'cables',
            'active' => true,
        ]);

        $chargers = Category::create([
            'name' => 'Cargadores',
            'slug' => 'cargadores',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $cables->id,
            'name' => 'USB-C Trenzado',
            'slug' => 'usb-c-trenzado',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 6000,
            'stock' => 10,
            'active' => true,
        ]);

        Product::create([
            'category_id' => $chargers->id,
            'name' => 'Cargador USB-C 20W',
            'slug' => 'cargador-usbc-20w-sugg',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 14000,
            'stock' => 10,
            'active' => true,
        ]);

        $response = $this->getJson('/tienda/sugerencias?q=usb&category=cables');

        $response->assertOk();
        $response->assertJsonCount(1, 'items');
        $response->assertJsonPath('items.0.name', 'USB-C Trenzado');
        $response->assertJsonPath('items.0.category', 'Cables');
    }

    public function test_suggestions_are_accent_and_dash_tolerant(): void
    {
        $category = Category::create([
            'name' => 'Baterias',
            'slug' => 'baterias',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Batería USB-C para iPhone',
            'slug' => 'bateria-usbc-iphone',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 25000,
            'stock' => 5,
            'active' => true,
        ]);

        $response = $this->getJson('/tienda/sugerencias?q=bateria usb c');

        $response->assertOk();
        $response->assertJsonCount(1, 'items');
        $response->assertJsonPath('items.0.name', 'Batería USB-C para iPhone');
    }
}

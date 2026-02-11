<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreSearchCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_search_matches_product_brand(): void
    {
        $category = Category::create([
            'name' => 'Cargadores',
            'slug' => 'cargadores',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Cargador USB-C 20W',
            'slug' => 'cargador-usbc-20w',
            'brand' => 'Anker',
            'quality' => 'premium',
            'price' => 15000,
            'stock' => 5,
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Cable Lightning',
            'slug' => 'cable-lightning',
            'brand' => 'Gen',
            'quality' => 'generico',
            'price' => 5000,
            'stock' => 5,
            'active' => true,
        ]);

        $response = $this->get('/tienda?q=anker');

        $response->assertOk();
        $response->assertSee('Cargador USB-C 20W');
        $response->assertDontSee('Cable Lightning');
    }

    public function test_store_category_search_matches_short_description(): void
    {
        $category = Category::create([
            'name' => 'Fundas',
            'slug' => 'fundas',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Funda TPU Transparente',
            'slug' => 'funda-tpu-transparente',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 9000,
            'stock' => 10,
            'short_description' => 'Proteccion antigolpes con bordes reforzados',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Funda Silicona Negra',
            'slug' => 'funda-silicona-negra',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 9500,
            'stock' => 8,
            'short_description' => 'Acabado suave',
            'active' => true,
        ]);

        $response = $this->get('/tienda/categoria/fundas?q=antigolpes');

        $response->assertOk();
        $response->assertSee('Funda TPU Transparente');
        $response->assertDontSee('Funda Silicona Negra');
    }

    public function test_store_search_is_accent_tolerant(): void
    {
        $category = Category::create([
            'name' => 'Baterias',
            'slug' => 'baterias',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Batería iPhone XR',
            'slug' => 'bateria-iphone-xr',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 30000,
            'stock' => 6,
            'active' => true,
        ]);

        $response = $this->get('/tienda?q=bateria');

        $response->assertOk();
        $response->assertSee('Batería iPhone XR');
    }

    public function test_store_search_is_spacing_and_dash_tolerant(): void
    {
        $category = Category::create([
            'name' => 'Cargadores',
            'slug' => 'cargadores',
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Cargador USB-C 20W',
            'slug' => 'cargador-usbc-20w-dash',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 17000,
            'stock' => 6,
            'active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Cargador Lightning 20W',
            'slug' => 'cargador-lightning-20w-dash',
            'brand' => 'Nico',
            'quality' => 'premium',
            'price' => 16000,
            'stock' => 6,
            'active' => true,
        ]);

        $response = $this->get('/tienda?q=usb%20%20%20c');

        $response->assertOk();
        $response->assertSee('Cargador USB-C 20W');
        $response->assertDontSee('Cargador Lightning 20W');
    }
}

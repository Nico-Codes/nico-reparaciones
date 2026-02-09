<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FilterSelectionPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_orders_whatsapp_filter_remains_selected_in_view(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/pedidos?wa=sent');

        $response->assertOk();
        $response->assertSee('name="wa"', false);
        $response->assertSee('<option value="sent" selected>WA enviado</option>', false);
    }

    public function test_admin_repairs_whatsapp_filter_remains_selected_in_view(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/reparaciones?wa=pending');

        $response->assertOk();
        $response->assertSee('name="wa"', false);
        $response->assertSee('<option value="pending" selected>Pendiente</option>', false);
    }

    public function test_admin_products_filters_remain_selected_in_view(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/productos?active=0&featured=1&stock=low');

        $response->assertOk();
        $response->assertSee('<option value="0" selected>Inactivos</option>', false);
        $response->assertSee('<option value="1" selected>Destacados</option>', false);
        $response->assertSee('<option value="low" selected>Stock bajo', false);
    }

    public function test_admin_users_role_filter_remains_selected_in_view(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get('/admin/usuarios?role=admin');

        $response->assertOk();
        $response->assertSee('<option value="admin" selected>Admin</option>', false);
    }

    public function test_store_sort_filter_remains_selected_in_view(): void
    {
        $response = $this->get('/tienda?sort=price_desc');

        $response->assertOk();
        $response->assertSee('<option value="price_desc" selected>Mayor precio</option>', false);
    }

    public function test_store_category_tab_marks_selected_category_as_active(): void
    {
        Category::create([
            'name' => 'Cables',
            'slug' => 'cables',
        ]);

        Category::create([
            'name' => 'Cargadores',
            'slug' => 'cargadores',
        ]);

        $response = $this->get('/tienda/categoria/cables');

        $response->assertOk();
        $response->assertSee('href="' . route('store.category', ['category' => 'cables']) . '"', false);
        $response->assertSee('class="nav-pill shrink-0 whitespace-nowrap nav-pill-active"', false);
    }
}

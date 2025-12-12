<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    /**
     * Página principal de tienda:
     * - Muestra categorías
     * - Muestra algunos productos destacados
     */
    public function index()
    {
        // Traemos todas las categorías con sus productos (limite de productos por categoría opcional)
        $categories = Category::with(['products' => function ($q) {
            $q->orderBy('featured', 'desc')
              ->orderBy('name');
        }])->orderBy('name')->get();

        // También podríamos mostrar productos destacados sueltos
        $featuredProducts = Product::where('featured', true)
            ->orderBy('name')
            ->take(8)
            ->get();

        return view('tienda.index', [
            'categories'       => $categories,
            'featuredProducts' => $featuredProducts,
        ]);
    }

    /**
     * Listar productos de una categoría por slug.
     */
    public function category(string $slug)
    {
        $category = Category::where('slug', $slug)
            ->with(['products' => function ($q) {
                $q->orderBy('name');
            }])
            ->firstOrFail();

        return view('tienda.index', [
            'categories'       => collect([$category]), // reusamos la vista de index
            'featuredProducts' => collect(),            // vacío en este caso
            'currentCategory'  => $category,
        ]);
    }

    /**
     * Detalle de un producto por slug.
     */
    public function product(string $slug)
    {
        $product = Product::where('slug', $slug)
            ->with('category')
            ->firstOrFail();

        return view('tienda.producto', [
            'product' => $product,
        ]);
    }
}

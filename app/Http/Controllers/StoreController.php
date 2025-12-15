<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $categories = Category::query()
            ->orderBy('name')
            ->get();

        $productsQuery = Product::query()
            ->with('category')
            ->orderByDesc('id');

        if ($q !== '') {
            $productsQuery->where('name', 'like', "%{$q}%");
        }

        $products = $productsQuery->paginate(18)->withQueryString();

        $featuredProducts = Product::query()
            ->with('category')
            ->where('featured', true)
            ->orderByDesc('id')
            ->take(8)
            ->get();

        return view('tienda.index', [
            'categories'       => $categories,
            'products'         => $products,
            'featuredProducts' => $featuredProducts,
            'category'         => null,
            'q'                => $q,
        ]);
    }

    public function category(Request $request, string $slug)
    {
        $q = trim((string) $request->query('q', ''));

        $category = Category::query()
            ->where('slug', $slug)
            ->firstOrFail();

        $categories = Category::query()
            ->orderBy('name')
            ->get();

        $productsQuery = Product::query()
            ->with('category')
            ->where('category_id', $category->id)
            ->orderByDesc('id');

        if ($q !== '') {
            $productsQuery->where('name', 'like', "%{$q}%");
        }

        $products = $productsQuery->paginate(18)->withQueryString();

        return view('tienda.index', [
            'categories'       => $categories,
            'products'         => $products,
            'category'         => $category,
            'q'                => $q,
            'featuredProducts' => collect(),
        ]);
    }

    public function product(string $slug)
    {
        $product = Product::query()
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        return view('tienda.producto', compact('product'));
    }
}

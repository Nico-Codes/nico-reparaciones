<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    private function normalizeSort(?string $sort): string
    {
        $sort = trim((string) $sort);

        $allowed = [
            'relevance',
            'newest',
            'price_asc',
            'price_desc',
            'name_asc',
            'name_desc',
            'stock_desc',
        ];

        return in_array($sort, $allowed, true) ? $sort : 'relevance';
    }

    private function applySort($query, string $sort)
    {
        switch ($sort) {
            case 'newest':
                return $query->orderByDesc('id');

            case 'price_asc':
                return $query->orderBy('price')->orderByDesc('id');

            case 'price_desc':
                return $query->orderByDesc('price')->orderByDesc('id');

            case 'name_asc':
                return $query->orderBy('name')->orderByDesc('id');

            case 'name_desc':
                return $query->orderByDesc('name')->orderByDesc('id');

            case 'stock_desc':
                return $query->orderByDesc('stock')->orderByDesc('id');

            case 'relevance':
            default:
                return $query->orderByDesc('featured')->orderByDesc('id');
        }
    }

    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $sort = $this->normalizeSort($request->query('sort', 'relevance'));

        $categories = Category::where('active', 1)->orderBy('name')->get();

        $showFeatured = ($q === '' && $sort === 'relevance');

        $featuredProducts = collect();
        if ($showFeatured) {
            $featuredProducts = Product::where('active', 1)
                ->where('featured', 1)
                ->whereHas('category', fn($q) => $q->where('active', 1))
                ->with(['category:id,name,slug'])
                ->orderByDesc('id')
                ->take(12)
                ->get();
        }

        $productsQ = Product::query()
            ->where('active', 1)
            ->whereHas('category', fn($q) => $q->where('active', 1))
            ->with(['category:id,name,slug']);

        if ($q !== '') {
            $productsQ->where('name', 'like', '%' . $q . '%');
        }

        $products = $this->applySort($productsQ, $sort)->paginate(12)->withQueryString();

        return view('tienda.index', [
            'categories' => $categories,
            'featuredProducts' => $featuredProducts,
            'products' => $products,
            'filters' => ['q' => $q, 'sort' => $sort],
            'category' => null,
        ]);
    }

    public function category(Category $category, Request $request)
    {
        if ((int) ($category->active ?? 1) !== 1) {
            abort(404);
        }

        $q = trim((string) $request->query('q', ''));
        $sort = $this->normalizeSort($request->query('sort', 'relevance'));

        $categories = Category::where('active', 1)->orderBy('name')->get();

        $showFeatured = ($q === '' && $sort === 'relevance');

        $featuredProducts = collect();
        if ($showFeatured) {
            $featuredProducts = Product::where('active', 1)
                ->where('featured', 1)
                ->where('category_id', $category->id)
                ->whereHas('category', fn($q) => $q->where('active', 1))
                ->with(['category:id,name,slug'])
                ->orderByDesc('id')
                ->take(12)
                ->get();
        }

        $productsQ = Product::query()
            ->where('active', 1)
            ->where('category_id', $category->id)
            ->whereHas('category', fn($q) => $q->where('active', 1))
            ->with(['category:id,name,slug']);

        if ($q !== '') {
            $productsQ->where('name', 'like', '%' . $q . '%');
        }

        $products = $this->applySort($productsQ, $sort)->paginate(12)->withQueryString();

        return view('tienda.index', [
            'categories' => $categories,
            'featuredProducts' => $featuredProducts,
            'products' => $products,
            'filters' => ['q' => $q, 'sort' => $sort],
            'category' => $category,
        ]);
    }

    public function product(string $slug)
    {
        $product = Product::query()
            ->with(['category:id,name,slug,active'])
            ->where('active', 1)
            ->where('slug', $slug)
            ->whereHas('category', fn($q) => $q->where('active', 1))
            ->firstOrFail();

        return view('tienda.producto', compact('product'));
    }
}

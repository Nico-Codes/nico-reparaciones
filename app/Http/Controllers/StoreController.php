<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class StoreController extends Controller
{
private function normalizeSort(?string $sort): string
{
  $sort = trim((string)$sort);

  $allowed = [
    'relevance',   // default (destacados arriba + más nuevo)
    'newest',      // más nuevos
    'price_asc',   // menor precio
    'price_desc',  // mayor precio
    'name_asc',    // A-Z
    'name_desc',   // Z-A
    'stock_desc',  // más stock
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
    $q = trim((string)$request->query('q', ''));
    $sort = $this->normalizeSort($request->query('sort', 'relevance'));

    $categories = Category::where('active', 1)->orderBy('name')->get();

    $featuredProducts = Product::where('active', 1)
        ->where('featured', 1)
        ->orderByDesc('id')
        ->take(12)
        ->get();

    $productsQ = Product::query()->where('active', 1);

    if ($q !== '') {
        $productsQ->where('name', 'like', '%' . $q . '%');
    }

    $products = $this->applySort($productsQ, $sort)->paginate(12);

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
    $q = trim((string)$request->query('q', ''));
    $sort = $this->normalizeSort($request->query('sort', 'relevance'));

    $categories = Category::where('active', 1)->orderBy('name')->get();

    $featuredProducts = Product::where('active', 1)
        ->where('featured', 1)
        ->orderByDesc('id')
        ->take(12)
        ->get();

    $productsQ = Product::query()
        ->where('active', 1)
        ->where('category_id', $category->id);

    if ($q !== '') {
        $productsQ->where('name', 'like', '%' . $q . '%');
    }

    $products = $this->applySort($productsQ, $sort)->paginate(12);

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
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        return view('tienda.producto', compact('product'));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\BusinessSetting;
use App\Models\Category;
use App\Models\Product;
use App\Support\BrandAssets;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StoreController extends Controller
{
    private function storeHeroConfig(): array
    {
        $settings = BusinessSetting::allValues();

        $title = trim((string) ($settings->get('store_home_hero_title') ?? ''));
        $subtitle = trim((string) ($settings->get('store_home_hero_subtitle') ?? ''));

        $desktopColorRgb = $this->hexToRgbTriplet((string) ($settings->get('store_home_hero_desktop_color') ?? '')) ?? '14, 165, 233';
        $mobileColorRgb = $this->hexToRgbTriplet((string) ($settings->get('store_home_hero_mobile_color') ?? '')) ?? $desktopColorRgb;
        $fadeIntensity = (int) ($settings->get('store_home_hero_fade_intensity') ?? 42);
        $fadeSize = (int) ($settings->get('store_home_hero_fade_size') ?? 96);

        $fadeIntensity = max(0, min(100, $fadeIntensity));
        $fadeSize = max(24, min(260, $fadeSize));

        return [
            'imageDesktop' => BrandAssets::url('store_home_hero_desktop'),
            'imageMobile' => BrandAssets::url('store_home_hero_mobile'),
            'title' => $title !== '' ? $title : 'Novedades y ofertas en accesorios',
            'subtitle' => $subtitle !== '' ? $subtitle : 'Descubre ingresos recientes y productos destacados con stock real.',
            'fadeRgbDesktop' => $desktopColorRgb,
            'fadeRgbMobile' => $mobileColorRgb,
            'fadeIntensity' => $fadeIntensity,
            'fadeSize' => $fadeSize,
        ];
    }

    private function hexToRgbTriplet(string $hex): ?string
    {
        $hex = strtoupper(trim($hex));
        if (!preg_match('/^#([A-F0-9]{6})$/', $hex, $matches)) {
            return null;
        }

        $value = $matches[1];
        $r = hexdec(substr($value, 0, 2));
        $g = hexdec(substr($value, 2, 2));
        $b = hexdec(substr($value, 4, 2));

        return $r . ', ' . $g . ', ' . $b;
    }

    private function normalizeSearchTerm(string $value): string
    {
        $value = mb_strtolower(trim($value), 'UTF-8');
        $value = preg_replace('/[^\pL\pN]+/u', ' ', $value) ?? $value;

        $value = strtr($value, [
            'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a',
            'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e',
            'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o',
            'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u',
            'ñ' => 'n',
        ]);

        return preg_replace('/\s+/', ' ', $value) ?? $value;
    }

    private function normalizedSqlColumn(string $column): string
    {
        $expr = "lower(coalesce($column, ''))";

        foreach ([
            'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ñ' => 'n',
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n',
        ] as $from => $to) {
            $expr = "replace($expr, '$from', '$to')";
        }
        return $expr;
    }

    private function applySearch($query, string $q)
    {
        $normalized = $this->normalizeSearchTerm($q);
        if ($normalized === '') {
            return $query;
        }

        $tokens = array_values(array_filter(explode(' ', $normalized), static fn($token) => $token !== ''));
        $longTokens = array_values(array_filter($tokens, static fn($token) => mb_strlen($token, 'UTF-8') >= 2));
        if ($longTokens !== []) {
            $tokens = $longTokens;
        }
        if ($tokens === []) {
            return $query;
        }

        $nameSql = $this->normalizedSqlColumn('name');
        $brandSql = $this->normalizedSqlColumn('brand');
        $shortDescriptionSql = $this->normalizedSqlColumn('short_description');

        return $query->where(function ($outer) use ($tokens, $nameSql, $brandSql, $shortDescriptionSql) {
            foreach ($tokens as $token) {
                $term = '%' . $token . '%';

                $outer->where(function ($sub) use ($term, $nameSql, $brandSql, $shortDescriptionSql) {
                    $sub->whereRaw("$nameSql like ?", [$term])
                        ->orWhereRaw("$brandSql like ?", [$term])
                        ->orWhereRaw("$shortDescriptionSql like ?", [$term]);
                });
            }
        });
    }

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

        $this->applySearch($productsQ, $q);

        $products = $this->applySort($productsQ, $sort)->paginate(12)->withQueryString();

        return view('tienda.index', [
            'categories' => $categories,
            'featuredProducts' => $featuredProducts,
            'products' => $products,
            'filters' => ['q' => $q, 'sort' => $sort],
            'category' => null,
            'storeHero' => $this->storeHeroConfig(),
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

        $this->applySearch($productsQ, $q);

        $products = $this->applySort($productsQ, $sort)->paginate(12)->withQueryString();

        return view('tienda.index', [
            'categories' => $categories,
            'featuredProducts' => $featuredProducts,
            'products' => $products,
            'filters' => ['q' => $q, 'sort' => $sort],
            'category' => $category,
            'storeHero' => $this->storeHeroConfig(),
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $q = mb_substr(trim((string) $request->query('q', '')), 0, 80, 'UTF-8');
        if (mb_strlen($q, 'UTF-8') < 2) {
            return response()->json(['items' => []]);
        }

        $categorySlug = trim((string) $request->query('category', ''));

        $productsQ = Product::query()
            ->where('active', 1)
            ->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('active', 1);

                if ($categorySlug !== '') {
                    $q->where('slug', $categorySlug);
                }
            })
            ->with(['category:id,name,slug']);

        $this->applySearch($productsQ, $q);

        $items = $productsQ
            ->orderByDesc('featured')
            ->orderByDesc('stock')
            ->orderBy('name')
            ->limit(5)
            ->get(['id', 'category_id', 'name', 'slug', 'brand', 'price', 'stock']);

        return response()->json([
            'items' => $items->map(fn(Product $product) => [
                'name' => (string) $product->name,
                'brand' => $product->brand ? (string) $product->brand : null,
                'category' => $product->category?->name ? (string) $product->category->name : null,
                'price' => (int) ($product->price ?? 0),
                'stock' => (int) ($product->stock ?? 0),
                'url' => route('store.product', $product->slug),
            ])->values(),
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

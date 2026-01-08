<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;


class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string)$request->query('q', ''));
        $stockFilter = (string)$request->query('stock', ''); // '', 'out', 'low'
        $categoryId = (string)$request->query('category_id', ''); // '' o id
        $active = (string)$request->query('active', ''); // '', '1', '0'
        $featured = (string)$request->query('featured', ''); // '', '1', '0'

        $categories = Category::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();

        $query = Product::with('category')->orderByDesc('id');

        if ($q !== '') {
            $query->where(function($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        if ($categoryId !== '') {
            $query->where('category_id', (int)$categoryId);
        }

        if ($active !== '') {
            $query->where('active', (int)$active);
        }

        if ($featured !== '') {
            $query->where('featured', (int)$featured);
        }

        if ($stockFilter === 'out') {
            $query->where('stock', '<=', 0)->orderBy('stock', 'asc');
        } elseif ($stockFilter === 'low') {
            $query->where('stock', '>', 0)->where('stock', '<=', 5)->orderBy('stock', 'asc');
        }

        $products = $query->orderByDesc('id')->paginate(20)->withQueryString();

        return view('admin.products.index', [
            'products' => $products,
            'categories' => $categories,

            'q' => $q,
            'stock' => $stockFilter,
            'category_id' => $categoryId,
            'active' => $active,
            'featured' => $featured,
        ]);
    }


    public function create()
    {
        $categories = Category::orderBy('name')->get();
        return view('admin.products.create', compact('categories'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],

            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $seed = trim((string) ($data['slug'] ?? ''));
        if ($seed === '') $seed = $data['name'];

        $data['slug'] = $this->uniqueSlug($seed);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        Product::create($data);

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Producto creado.');
    }

    public function edit(Product $product)
    {
        $categories = Category::orderBy('name')->get();
        return view('admin.products.edit', compact('product', 'categories'));
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],

            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
        ]);

        // Slug editable (si lo dejan vacío, deriva del nombre)
        $seed = trim((string) ($data['slug'] ?? ''));
        if ($seed === '') $seed = $data['name'];

        $data['slug'] = $this->uniqueSlug($seed, $product->id);

        // Quitar imagen actual
        if ($request->boolean('remove_image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = null;
        }

        // Subir nueva imagen (reemplaza la anterior)
        if ($request->hasFile('image')) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $data['image_path'] = $request->file('image')->store('products', 'public');
        } else {
            // Si no subió nueva y no pidió eliminar, mantenemos la actual
            if (!array_key_exists('image_path', $data)) {
                $data['image_path'] = $product->image_path;
            }
        }

        $product->update($data);

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Producto actualizado.');
    }

    public function destroy(Product $product)
    {
        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Producto eliminado.');
    }

    public function toggleActive(Request $request, Product $product)
    {
        $product->active = !(bool) $product->active;
        $product->save();

        $payload = [
            'ok' => true,
            'active' => (bool) $product->active,
            'message' => $product->active ? 'Producto activado ✅' : 'Producto desactivado ✅',
        ];

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json($payload);
        }

        return back()->with('success', $payload['message']);
    }


    public function toggleFeatured(Request $request, Product $product)
    {
        $product->featured = !(bool) $product->featured;
        $product->save();

        $payload = [
            'ok' => true,
            'featured' => (bool) $product->featured,
            'message' => $product->featured ? 'Marcado como destacado ✅' : 'Quitado de destacados ✅',
        ];

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json($payload);
        }

        return back()->with('success', $payload['message']);
    }


    public function updateStock(Request $request, Product $product)
    {
        $data = $request->validate([
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $product->stock = (int) $data['stock'];
        $product->save();

        $payload = [
            'ok' => true,
            'stock' => (int) $product->stock,
            'message' => 'Stock actualizado ✅',
        ];

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json($payload);
        }

        return back()->with('success', $payload['message']);
    }

    public function bulk(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:products,id'],
            'action' => ['required', 'string', 'in:activate,deactivate,feature,unfeature,stock_zero,set_stock,delete'],
            'stock' => ['nullable', 'integer', 'min:0'],
        ]);

        $ids = array_map('intval', $data['ids']);
        $action = $data['action'];

        // Validación extra para set_stock
        if ($action === 'set_stock' && $data['stock'] === null) {
            return response()->json(['ok' => false, 'message' => 'Falta el stock para aplicar.'], 422);
        }

        $affected = 0;
        $skipped = 0;
        $message = 'Acción aplicada ✅';

        if ($action === 'delete') {
            // No se pueden borrar productos que ya estén en pedidos (FK restrict)
            $lockedIds = OrderItem::whereIn('product_id', $ids)->pluck('product_id')->map(fn ($v) => (int)$v)->all();
            $deleteIds = array_values(array_diff($ids, $lockedIds));
            $skipped = count($lockedIds);

            if (count($deleteIds) === 0) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No se pudo eliminar: todos los productos seleccionados tienen pedidos asociados.',
                ], 422);
            }

            // Borrar imágenes (si tienen) y luego borrar productos
            $products = Product::whereIn('id', $deleteIds)->get(['id', 'image_path']);
            foreach ($products as $p) {
                if ($p->image_path) {
                    Storage::disk('public')->delete($p->image_path);
                }
            }

            $affected = Product::whereIn('id', $deleteIds)->delete();
            $message = "Eliminados: {$affected}. Omitidos: {$skipped} (tienen pedidos).";
        } else {
            $query = Product::whereIn('id', $ids);

            switch ($action) {
                case 'activate':
                    $affected = $query->update(['active' => 1]);
                    $message = "Activados: {$affected} ✅";
                    break;

                case 'deactivate':
                    $affected = $query->update(['active' => 0]);
                    $message = "Desactivados: {$affected} ✅";
                    break;

                case 'feature':
                    $affected = $query->update(['featured' => 1]);
                    $message = "Marcados como destacados: {$affected} ✅";
                    break;

                case 'unfeature':
                    $affected = $query->update(['featured' => 0]);
                    $message = "Destacado quitado: {$affected} ✅";
                    break;

                case 'stock_zero':
                    $affected = $query->update(['stock' => 0]);
                    $message = "Stock en 0 para: {$affected} ✅";
                    break;

                case 'set_stock':
                    $affected = $query->update(['stock' => (int)$data['stock']]);
                    $message = "Stock seteado para: {$affected} ✅";
                    break;
            }
        }

        return response()->json([
            'ok' => true,
            'affected' => $affected,
            'skipped' => $skipped,
            'message' => $message,
        ]);
    }



    private function uniqueSlug(string $seed, ?int $ignoreId = null): string
    {

        $base = Str::slug($seed);
        if ($base === '') $base = 'producto';

        $slug = $base;
        $i = 2;

        while (true) {
            $q = Product::where('slug', $slug);
            if ($ignoreId) $q->where('id', '!=', $ignoreId);

            if (!$q->exists()) return $slug;

            $slug = $base . '-' . $i;
            $i++;
        }
    }



}

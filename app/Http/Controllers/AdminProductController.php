<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        $query = Product::with('category')
            ->orderByDesc('id');

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('name', 'like', "%{$q}%")
                   ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        $products = $query->paginate(20)->appends([
            'q' => $q,
        ]);

        return view('admin.products.index', [
            'products' => $products,
            'q' => $q,
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

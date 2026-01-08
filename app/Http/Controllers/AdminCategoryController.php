<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index()
    {
        $categories = Category::withCount('products')
            ->orderBy('name')
            ->get();

        return view('admin.categories.index', compact('categories'));
    }

    public function create()
    {
        return view('admin.categories.create');
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['slug'] = $this->makeUniqueSlug($data['slug'] ?? '', $data['name']);

        $category = Category::create($data);

        return redirect()
            ->route('admin.categories.edit', $category)
            ->with('success', 'Categoría creada.');
    }

    public function edit(Category $category)
    {
        return view('admin.categories.edit', compact('category'));
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request, $category->id);

        $data['slug'] = $this->makeUniqueSlug($data['slug'] ?? '', $data['name'], $category->id);

        $category->update($data);

        return back()->with('success', 'Categoría actualizada.');
    }

    public function destroy(Category $category)
    {
        $category->delete(); // cascade products por migration

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Categoría eliminada.');
    }

    public function toggleActive(Request $request, Category $category)
    {
        $category->active = !(bool) $category->active;
        $category->save();

        $payload = [
            'ok' => true,
            'active' => (bool) $category->active,
            'message' => $category->active ? 'Categoría activada ✅' : 'Categoría desactivada ✅',
        ];

        if ($request->expectsJson() || $request->ajax()) {
            return response()->json($payload);
        }

        return back()->with('success', $payload['message']);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
        ]);
    }

    private function makeUniqueSlug(string $slug, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug !== '' ? $slug : $name);
        if ($base === '') $base = 'categoria';

        $candidate = $base;
        $i = 2;

        while (
            Category::where('slug', $candidate)
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $base . '-' . $i;
            $i++;
        }

        return $candidate;
    }
}

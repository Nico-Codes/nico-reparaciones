@extends('layouts.app')

@section('title', 'Admin — Editar producto')

@section('content')
<div class="mx-auto w-full max-w-4xl px-4 py-6">
  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-xl font-black tracking-tight">Editar producto</h1>
      <p class="mt-1 text-sm text-zinc-600">Actualizá precio, stock, categoría e imagen.</p>
    </div>

    <a href="{{ route('admin.products.index') }}"
       class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
      Volver
    </a>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if ($errors->any())
    <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-bold">Revisá estos errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('admin.products.update', $product) }}" enctype="multipart/form-data" class="mt-5 space-y-4">
    @csrf
    @method('PUT')

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Nombre *</label>
          <input name="name" required value="{{ old('name', $product->name) }}"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Slug (opcional)</label>
          <input name="slug" value="{{ old('slug', $product->slug) }}"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
          <p class="mt-1 text-xs text-zinc-500">Si lo dejás vacío, se genera desde el nombre.</p>
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Categoría *</label>
          <select name="category_id" required
                  class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            @foreach($categories as $c)
              <option value="{{ $c->id }}" @selected((string)old('category_id', $product->category_id) === (string)$c->id)>{{ $c->name }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Precio *</label>
          <input name="price" required value="{{ old('price', $product->price) }}" inputmode="decimal"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Stock *</label>
          <input name="stock" required value="{{ old('stock', $product->stock) }}" inputmode="numeric"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Descripción</label>
          <textarea name="description" rows="4"
                    class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('description', $product->description) }}</textarea>
        </div>

        <div class="sm:col-span-2">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1">
              <label class="text-xs font-semibold text-zinc-700">Imagen (opcional)</label>
              <input name="image" type="file" accept="image/*"
                     class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
              <p class="mt-1 text-xs text-zinc-500">Si subís una nueva, reemplaza la actual.</p>

              <label class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <input type="checkbox" name="remove_image" value="1"
                       class="h-4 w-4 rounded border-zinc-300">
                Quitar imagen actual
              </label>
            </div>

            <div class="w-full sm:w-52">
              <div class="text-xs font-semibold text-zinc-700">Vista previa</div>
              <div class="mt-1 h-28 w-28 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                @if($product->image_url)
                  <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
                @else
                  <div class="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400">Sin imagen</div>
                @endif
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <form method="POST" action="{{ route('admin.products.destroy', $product) }}"
            onsubmit="return confirm('¿Eliminar producto?');">
        @csrf
        @method('DELETE')
        <button class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          Eliminar producto
        </button>
      </form>

      <button class="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
        Guardar cambios
      </button>
    </div>
  </form>
</div>
@endsection

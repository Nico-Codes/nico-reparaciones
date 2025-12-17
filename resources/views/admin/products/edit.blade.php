@extends('layouts.app')

@section('title', 'Admin — Editar producto')

@section('content')
@php
  $hasImage = !empty($product->image_url);
@endphp

<div class="mx-auto w-full max-w-4xl">
  <div class="flex items-start justify-between gap-3 mb-5">
    <div class="page-head mb-0">
      <div class="page-title">Editar producto</div>
      <div class="page-subtitle">Actualizá precio, stock, categoría e imagen.</div>
    </div>

    <a href="{{ route('admin.products.index') }}" class="btn-outline">Volver</a>
  </div>

  <form id="productForm" method="POST" action="{{ route('admin.products.update', $product) }}" enctype="multipart/form-data" class="space-y-4">
    @csrf
    @method('PUT')

    <div class="card">
      <div class="card-head">
        <div class="font-black">Datos del producto</div>
        <span class="badge-zinc">ID #{{ $product->id }}</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" required value="{{ old('name', $product->name) }}" />
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" value="{{ old('slug', $product->slug) }}" />
            <div class="text-xs text-zinc-500">Si lo dejás vacío, se genera desde el nombre.</div>
          </div>

          <div class="space-y-1">
            <label>Categoría *</label>
            <select name="category_id" required>
              @foreach($categories as $c)
                <option value="{{ $c->id }}" @selected((string)old('category_id', $product->category_id) === (string)$c->id)>{{ $c->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="space-y-1">
            <label>Precio *</label>
            <input name="price" required value="{{ old('price', $product->price) }}" inputmode="decimal" placeholder="0" />
          </div>

          <div class="space-y-1">
            <label>Stock *</label>
            <input name="stock" required value="{{ old('stock', $product->stock) }}" inputmode="numeric" placeholder="0" />
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripción (opcional)</label>
            <textarea name="description" rows="4" placeholder="Detalles, compatibilidad, color, etc.">{{ old('description', $product->description) }}</textarea>
          </div>

          <div class="sm:col-span-2">
            <div class="grid gap-4 sm:grid-cols-[1fr_220px]">
              <div class="space-y-1">
                <label>Imagen (opcional)</label>
                <input name="image" type="file" accept="image/*" />
                <div class="text-xs text-zinc-500">Si subís una nueva, reemplaza la actual.</div>

                @if($hasImage)
                  <label class="mt-3 inline-flex items-center gap-2 text-sm font-black text-zinc-800">
                    <input type="checkbox" name="remove_image" value="1" class="h-4 w-4 rounded border-zinc-300">
                    Quitar imagen actual
                  </label>
                @endif
              </div>

              <div>
                <div class="text-sm font-black text-zinc-800">Vista previa</div>
                <div class="mt-2 h-28 w-28 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                  @if($hasImage)
                    <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
                  @else
                    <div class="flex h-full w-full items-center justify-center text-xs font-black text-zinc-400">Sin imagen</div>
                  @endif
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
    <form method="POST" action="{{ route('admin.products.destroy', $product) }}" onsubmit="return confirm('¿Eliminar producto?');">
      @csrf
      @method('DELETE')
      <button class="btn-danger" type="submit">Eliminar producto</button>
    </form>

    <button class="btn-primary" form="productForm" type="submit">Guardar cambios</button>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Editar producto')

@section('content')
@php
  $img = $product->image_url ?? null;
  if(!$img && !empty($product->image_path)) $img = route('storage.local', $product->image_path);
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="page-title">Editar producto</h1>
      <p class="page-subtitle">Actualizá precio, stock, descripción o imagen.</p>
    </div>
    <a href="{{ route('admin.products.index') }}" class="btn-outline">← Volver</a>
  </div>

  @if($errors->any())
    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Revisá estos errores:</div>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
        method="POST"
        action="{{ route('admin.products.update', $product) }}"
        enctype="multipart/form-data">
    @csrf
    @method('PUT')

    <div class="lg:col-span-2 space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Datos</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Nombre *</label>
            <input class="input" name="name" value="{{ old('name', $product->name) }}" required>
          </div>

          <div>
            <label class="label">Categoría *</label>
            <select class="select" name="category_id" required>
              <option value="">— Seleccionar —</option>
              @foreach($categories as $c)
                <option value="{{ $c->id }}" @selected(old('category_id', $product->category_id) == $c->id)>{{ $c->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Precio *</label>
              <input class="input" type="number" step="0.01" min="0" name="price" value="{{ old('price', $product->price) }}" required>
            </div>
            <div>
              <label class="label">Stock *</label>
              <input class="input" type="number" min="0" name="stock" value="{{ old('stock', $product->stock) }}" required>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="label">Descripción</label>
            <textarea class="textarea" rows="4" name="description">{{ old('description', $product->description) }}</textarea>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Imagen</div>
          <div class="text-xs text-zinc-500">Subí una nueva o quitá la actual.</div>
        </div>

        <div class="card-body space-y-3">
          @if($img)
            <div class="rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden">
              <img src="{{ $img }}" alt="{{ $product->name }}" class="w-full object-cover">
            </div>
          @endif

          <div>
            <label class="label">Nueva imagen</label>
            <input class="input" type="file" name="image" accept="image/*">
            <p class="helper">JPG/PNG/WEBP (máx 4MB)</p>
          </div>

          <label class="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="remove_image" value="1" {{ old('remove_image') ? 'checked' : '' }}>
            Quitar imagen
          </label>

          <button class="btn-primary w-full" type="submit">Guardar cambios</button>
          <a class="btn-outline w-full text-center" href="{{ route('admin.products.index') }}">Cancelar</a>
        </div>
      </div>
    </div>
  </form>
</div>
@endsection

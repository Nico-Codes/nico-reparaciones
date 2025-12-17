@extends('layouts.app')

@section('title', 'Admin — Nuevo producto')

@section('content')
<div class="mx-auto w-full max-w-4xl">
  <div class="flex items-start justify-between gap-3 mb-5">
    <div class="page-head mb-0">
      <div class="page-title">Nuevo producto</div>
      <div class="page-subtitle">Creá un producto con nombre, precio, stock, categoría e imagen.</div>
    </div>

    <a href="{{ route('admin.products.index') }}" class="btn-outline">Volver</a>
  </div>

  <form method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data" class="space-y-4">
    @csrf

    <div class="card">
      <div class="card-head">
        <div class="font-black">Datos del producto</div>
        <span class="badge-zinc">Catálogo</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" required value="{{ old('name') }}" placeholder="Ej: Funda iPhone 13" />
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" value="{{ old('slug') }}" placeholder="Se genera si lo dejás vacío" />
            <div class="text-xs text-zinc-500">Útil para URLs lindas. Si lo dejás vacío, se genera desde el nombre.</div>
          </div>

          <div class="space-y-1">
            <label>Categoría *</label>
            <select name="category_id" required>
              <option value="">Seleccionar…</option>
              @foreach($categories as $c)
                <option value="{{ $c->id }}" @selected((string)old('category_id') === (string)$c->id)>{{ $c->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="space-y-1">
            <label>Precio *</label>
            <input name="price" required value="{{ old('price') }}" inputmode="decimal" placeholder="0" />
          </div>

          <div class="space-y-1">
            <label>Stock *</label>
            <input name="stock" required value="{{ old('stock', 0) }}" inputmode="numeric" placeholder="0" />
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripción (opcional)</label>
            <textarea name="description" rows="4" placeholder="Detalles, compatibilidad, color, etc.">{{ old('description') }}</textarea>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Imagen (opcional)</label>
            <input name="image" type="file" accept="image/*" />
            <div class="text-xs text-zinc-500">Recomendado: cuadrada, buena luz, JPG/PNG/WEBP.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="btn-primary" type="submit">Crear producto</button>
    </div>
  </form>
</div>
@endsection

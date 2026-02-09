@extends('layouts.app')

@section('title', 'Admin — Nuevo producto')

@section('content')
<div class="mx-auto w-full max-w-4xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Nuevo producto</div>
      <div class="page-subtitle">Creá un producto con nombre, precio, stock, categoría e imagen.</div>
    </div>

    <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:h-auto sm:w-auto">Volver</a>
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
            <input name="name" class="h-11" required value="{{ old('name') }}" placeholder="Ej: Funda iPhone 13" />
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" class="h-11" value="{{ old('slug') }}" placeholder="Se genera si lo dejás vacío" />
            <div class="text-xs text-zinc-500">Útil para URLs lindas. Si lo dejás vacío, se genera desde el nombre.</div>
          </div>

          <div class="space-y-1">
            <label>Categoría *</label>
            <select name="category_id" class="h-11" required>
              <option value="">Seleccionar…</option>
              @foreach($categories as $c)
                <option value="{{ $c->id }}" @selected((string)old('category_id') === (string)$c->id)>{{ $c->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="space-y-1">
            <label>Precio *</label>
            <input name="price" class="h-11" required value="{{ old('price') }}" inputmode="decimal" placeholder="0" />
          </div>

          <div class="space-y-1">
            <label>Stock *</label>
            <input name="stock" class="h-11" required value="{{ old('stock', 0) }}" inputmode="numeric" placeholder="0" />
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripción (opcional)</label>
            <textarea name="description" rows="4" placeholder="Detalles, compatibilidad, color, etc.">{{ old('description') }}</textarea>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Imagen (opcional)</label>
            <input name="image" type="file" class="h-11" accept="image/*" />
            <div class="text-xs text-zinc-500">Recomendado: cuadrada, buena luz, JPG/PNG/WEBP.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Cancelar</a>
      <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Crear producto</button>
    </div>
  </form>
</div>
@endsection

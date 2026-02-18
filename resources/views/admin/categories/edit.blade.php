@extends('layouts.app')

@section('title', 'Admin — Editar categoría')

@section('content')
<div class="store-shell mx-auto w-full max-w-3xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Editar categoría</div>
      <div class="page-subtitle">Actualizá nombre, slug, icono y descripción.</div>
    </div>

    <a href="{{ route('admin.categories.index') }}" class="btn-outline h-11 w-full justify-center sm:h-auto sm:w-auto">Volver</a>
  </div>

  <form id="categoryForm" method="POST" action="{{ route('admin.categories.update', $category) }}" class="space-y-4">
    @csrf
    @method('PUT')

    <div class="card reveal-item">
      <div class="card-head">
        <div class="font-black">Datos de la categoría</div>
        <span class="badge-zinc">ID #{{ $category->id }}</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" class="h-11" required value="{{ old('name', $category->name) }}" />
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" class="h-11" value="{{ old('slug', $category->slug) }}" />
            <div class="text-xs text-zinc-500">Si lo dejás vacío, se genera desde el nombre.</div>
          </div>

          <div class="space-y-1">
            <label>Icono (opcional)</label>
            <input name="icon" class="h-11" value="{{ old('icon', $category->icon) }}" placeholder="Ej: 📱" />
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripción (opcional)</label>
            <input name="description" class="h-11" value="{{ old('description', $category->description) }}" />
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
    <form method="POST" action="{{ route('admin.categories.destroy', $category) }}"
          onsubmit="return confirm('¿Eliminar categoría? Esto puede afectar el catálogo.');">
      @csrf
      @method('DELETE')
      <button class="btn-danger h-11 w-full justify-center sm:w-auto" type="submit">Eliminar categoría</button>
    </form>

    <button class="btn-primary h-11 w-full justify-center sm:w-auto" form="categoryForm" type="submit">Guardar cambios</button>
  </div>
</div>
@endsection


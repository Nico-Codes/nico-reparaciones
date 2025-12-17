@extends('layouts.app')

@section('title', 'Admin — Nueva categoría')

@section('content')
<div class="mx-auto w-full max-w-3xl">
  <div class="flex items-start justify-between gap-3 mb-5">
    <div class="page-head mb-0">
      <div class="page-title">Nueva categoría</div>
      <div class="page-subtitle">Creá una categoría para ordenar el catálogo.</div>
    </div>

    <a href="{{ route('admin.categories.index') }}" class="btn-outline">Volver</a>
  </div>

  <form method="POST" action="{{ route('admin.categories.store') }}" class="space-y-4">
    @csrf

    <div class="card">
      <div class="card-head">
        <div class="font-black">Datos de la categoría</div>
        <span class="badge-zinc">Catálogo</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" required value="{{ old('name') }}" placeholder="Ej: Fundas" />
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" value="{{ old('slug') }}" placeholder="Ej: fundas-iphone" />
            <div class="text-xs text-zinc-500">Si lo dejás vacío, se genera automáticamente.</div>
          </div>

          <div class="space-y-1">
            <label>Icono (opcional)</label>
            <input name="icon" value="{{ old('icon') }}" placeholder="Ej: 📱" />
            <div class="text-xs text-zinc-500">Opcional, solo para darle personalidad (emoji o texto corto).</div>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripción (opcional)</label>
            <input name="description" value="{{ old('description') }}" placeholder="Ej: Fundas, templados, cargadores…" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="btn-primary" type="submit">Crear categoría</button>
    </div>
  </form>
</div>
@endsection

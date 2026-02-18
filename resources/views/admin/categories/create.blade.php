@extends('layouts.app')

@section('title', 'Admin — Nueva categoría')

@section('content')
<div class="store-shell mx-auto w-full max-w-3xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Nueva categoría</div>
      <div class="page-subtitle">Creá una categoría para ordenar el catálogo.</div>
    </div>

    <a href="{{ route('admin.categories.index') }}" class="btn-outline h-11 w-full justify-center sm:h-auto sm:w-auto">Volver</a>
  </div>

  <form method="POST" action="{{ route('admin.categories.store') }}" class="space-y-4">
    @csrf

    <div class="card reveal-item">
      <div class="card-head">
        <div class="font-black">Datos de la categoría</div>
        <span class="badge-zinc">Catálogo</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" class="h-11" required value="{{ old('name') }}" placeholder="Ej: Fundas" />
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" class="h-11" value="{{ old('slug') }}" placeholder="Ej: fundas-iphone" />
            <div class="text-xs text-zinc-500">Si lo dejás vacío, se genera automáticamente.</div>
          </div>

          <div class="space-y-1">
            <label>Icono (opcional)</label>
            <input name="icon" class="h-11" value="{{ old('icon') }}" placeholder="Ej: 📱" />
            <div class="text-xs text-zinc-500">Opcional, solo para darle personalidad (emoji o texto corto).</div>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripción (opcional)</label>
            <input name="description" class="h-11" value="{{ old('description') }}" placeholder="Ej: Fundas, templados, cargadores…" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a href="{{ route('admin.categories.index') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Cancelar</a>
      <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Crear categoría</button>
    </div>
  </form>
</div>
@endsection


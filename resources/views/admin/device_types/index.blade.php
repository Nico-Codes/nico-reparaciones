@extends('layouts.app')

@section('title', 'Admin — Tipos de dispositivo')

@section('content')
<div class="container-page">
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <h1 class="h1">Tipos de dispositivo</h1>
      <p class="text-muted mt-1">Categorías base del catálogo (Celular, Notebook, Consola, etc.).</p>
    </div>

    <div class="flex gap-2">
     <a class="btn btn-ghost" href="{{ route('admin.pricing.index') }}">← Precios</a>
     <a class="btn btn-ghost" href="{{ route('admin.deviceCatalog.index') }}">Catálogo</a>
    </div>

  </div>

  <div class="grid gap-4 mt-6">
    <div class="card p-4">
      <h2 class="h2 mb-3">Crear tipo</h2>

      <form method="POST" action="{{ route('admin.deviceTypes.store') }}" class="grid md:grid-cols-3 gap-3 items-end">
        @csrf

        <div>
          <label class="label">Nombre</label>
          <input class="input" name="name" placeholder="Ej: Celular" required>
        </div>

        <label class="inline-flex items-center gap-2 select-none">
          <input type="checkbox" name="active" value="1" checked>
          <span class="text-sm">Activo</span>
        </label>

        <button class="btn btn-primary">Crear</button>
      </form>
    </div>

    <div class="card p-4">
      <h2 class="h2 mb-3">Listado</h2>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Activo</th>
              <th class="text-right">Slug</th>
              <th class="text-right">Acción</th>
            </tr>
          </thead>

          <tbody>
            @forelse($deviceTypes as $t)
              <tr>
                <td class="min-w-[260px]">
                  <form method="POST" action="{{ route('admin.deviceTypes.update', $t) }}" class="flex items-center gap-2">
                    @csrf
                    @method('PUT')
                    <input class="input" name="name" value="{{ $t->name }}" required>
                </td>

                <td class="text-center">
                  <input type="checkbox" name="active" value="1" @checked($t->active)>
                </td>

                <td class="text-right text-sm text-muted">
                  {{ $t->slug }}
                </td>

                <td class="text-right">
                    <button class="btn btn-ghost btn-sm">Guardar</button>
                  </form>
                </td>
              </tr>
            @empty
              <tr>
                <td colspan="4" class="text-muted">No hay tipos cargados.</td>
              </tr>
            @endforelse
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
@endsection

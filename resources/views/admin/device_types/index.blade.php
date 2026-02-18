@extends('layouts.app')

@section('title', 'Admin - Tipos de dispositivo')

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Tipos de dispositivo</div>
        <div class="page-subtitle">Categorias base del catalogo (Celular, Notebook, Consola, etc.).</div>
      </div>

      <div class="flex w-full gap-2 flex-wrap sm:w-auto">
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">Precios</a>
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.deviceCatalog.index') }}">Catalogo</a>
      </div>
    </div>
  </div>

  <div class="reveal-item grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
    <div class="card">
      <div class="card-head"><div class="font-black">Crear tipo</div></div>
      <div class="card-body">
        <form method="POST" action="{{ route('admin.deviceTypes.store') }}" class="space-y-3">
          @csrf
          <div class="space-y-1">
            <label class="text-sm font-semibold text-zinc-800">Nombre</label>
            <input class="h-11" name="name" placeholder="Ej: Celular" required>
          </div>
          <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <input class="h-4 w-4 rounded border-zinc-300" type="checkbox" name="active" value="1" checked>
            <span>Activo</span>
          </label>
          <button class="btn-primary h-11 w-full justify-center">Crear</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-black">Listado</div>
        <span class="badge-zinc">{{ $deviceTypes->count() }}</span>
      </div>

      <div class="card-body p-0">
        <div class="grid gap-3 p-4 md:hidden">
          @forelse($deviceTypes as $t)
            <form method="POST" action="{{ route('admin.deviceTypes.update', $t) }}" class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm space-y-3">
              @csrf
              @method('PUT')
              <div class="space-y-1">
                <label class="text-xs font-black uppercase text-zinc-500">Tipo</label>
                <input class="h-11" name="name" value="{{ $t->name }}" required>
              </div>
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 text-xs text-zinc-500">Slug: <span class="font-semibold text-zinc-700">{{ $t->slug }}</span></div>
                <label class="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-zinc-700">
                  <input class="h-4 w-4 rounded border-zinc-300" type="checkbox" name="active" value="1" @checked($t->active)>
                  <span>Activo</span>
                </label>
              </div>
              <button class="btn-outline h-10 w-full justify-center">Guardar</button>
            </form>
          @empty
            <div class="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">No hay tipos cargados.</div>
          @endforelse
        </div>

        <div class="hidden md:block">
          <div class="table-wrap">
            <table class="table min-w-[760px]">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Activo</th>
                  <th>Slug</th>
                  <th class="text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                @forelse($deviceTypes as $t)
                  @php($formId = 'device-type-'.$t->id)
                  <tr>
                    <td class="min-w-[320px]">
                      <form id="{{ $formId }}" method="POST" action="{{ route('admin.deviceTypes.update', $t) }}">
                        @csrf
                        @method('PUT')
                        <input class="h-10" name="name" value="{{ $t->name }}" required>
                      </form>
                    </td>
                    <td>
                      <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                        <input class="h-4 w-4 rounded border-zinc-300" form="{{ $formId }}" type="checkbox" name="active" value="1" @checked($t->active)>
                        <span>Activo</span>
                      </label>
                    </td>
                    <td class="text-sm text-zinc-500">{{ $t->slug }}</td>
                    <td class="text-right"><button class="btn-outline btn-sm h-10" form="{{ $formId }}">Guardar</button></td>
                  </tr>
                @empty
                  <tr><td colspan="4" class="text-sm text-zinc-600">No hay tipos cargados.</td></tr>
                @endforelse
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

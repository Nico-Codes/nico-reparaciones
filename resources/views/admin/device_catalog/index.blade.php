@extends('layouts.app')

@section('title', 'Admin — Catálogo de dispositivos')

@section('content')
<div class="container-page">
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight">Catálogo de dispositivos</h1>
      <p class="text-zinc-600 mt-1">
        Gestioná <b>marcas</b>, <b>modelos</b> y <b>fallas</b> por tipo. En lugar de borrar, desactivá.
      </p>
    </div>

    <div class="flex gap-2">
      <a class="btn btn-ghost" href="{{ route('admin.deviceTypes.index') }}">Tipos</a>
      <a class="btn btn-ghost" href="{{ route('admin.pricing.index') }}">Precios</a>
    </div>
  </div>

  <form method="GET" class="card p-4 mt-6 grid gap-3 md:grid-cols-3 items-end">
    <div>
      <label class="block text-sm font-semibold text-zinc-800">Tipo</label>
      <select name="type_id" class="mt-1 w-full" onchange="this.form.submit()">
        <option value="">— Elegí —</option>
        @foreach($types as $t)
          <option value="{{ $t->id }}" @selected($typeId == $t->id)>
            {{ $t->name }} @if(!$t->active) (inactivo) @endif
          </option>
        @endforeach
      </select>
      <p class="text-xs text-zinc-500 mt-1">Esto filtra Marcas y Fallas.</p>
    </div>

    <div>
      <label class="block text-sm font-semibold text-zinc-800">Marca (para modelos)</label>
      <select name="brand_id" class="mt-1 w-full" onchange="this.form.submit()" @disabled(!$typeId)>
        <option value="">— Elegí —</option>
        @foreach($brands as $b)
          <option value="{{ $b->id }}" @selected($brandId == $b->id)>
            {{ $b->name }} @if(!$b->active) (inactiva) @endif
          </option>
        @endforeach
      </select>
      <p class="text-xs text-zinc-500 mt-1">Esto filtra Modelos.</p>
    </div>

    <div class="text-xs text-zinc-500">
      Tip: En “Nueva reparación” solo se muestran ítems <b>activos</b>.
    </div>
  </form>

  <div class="grid gap-4 mt-4 lg:grid-cols-3">
    {{-- MARCAS --}}
    <div class="card p-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-extrabold">Marcas</h2>
        <span class="badge">{{ $brands->count() }}</span>
      </div>

      <form method="POST" action="{{ route('admin.deviceCatalog.brands.store') }}" class="mt-3 flex gap-2">
        @csrf
        <input type="hidden" name="device_type_id" value="{{ $typeId }}">
        <input name="name" class="w-full" placeholder="Ej: Samsung" @disabled(!$typeId) required>
        <button class="btn btn-primary btn-sm" @disabled(!$typeId)>Agregar</button>
      </form>

      <div class="mt-4">
        @if(!$typeId)
          <p class="text-sm text-zinc-600">Elegí un tipo para ver/crear marcas.</p>
        @elseif($brands->isEmpty())
          <p class="text-sm text-zinc-600">No hay marcas para este tipo.</p>
        @else
          <table class="w-full text-sm">
            <thead class="text-left text-zinc-500">
              <tr>
                <th class="py-2">Nombre</th>
                <th class="py-2">Estado</th>
                <th class="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              @foreach($brands as $b)
                <tr>
                  <td class="py-2">
                    <div class="font-medium text-zinc-900">{{ $b->name }}</div>
                    <details class="mt-1">
                      <summary class="text-xs text-sky-700 cursor-pointer select-none">Renombrar</summary>
                      <form method="POST" action="{{ route('admin.deviceCatalog.brands.update', $b) }}" class="mt-2 flex gap-2">
                        @csrf
                        @method('PUT')
                        <input name="name" class="w-full" value="{{ $b->name }}" required>
                        <button class="btn btn-primary btn-sm">Guardar</button>
                      </form>
                    </details>
                  </td>
                  <td class="py-2">
                    @if($b->active)
                      <span class="badge badge-emerald">Activa</span>
                    @else
                      <span class="badge badge-zinc">Inactiva</span>
                    @endif
                  </td>
                  <td class="py-2 text-right">
                    <form method="POST" action="{{ route('admin.deviceCatalog.brands.toggle', $b) }}">
                      @csrf
                      <button class="btn btn-ghost btn-sm">
                        {{ $b->active ? 'Desactivar' : 'Activar' }}
                      </button>
                    </form>
                  </td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif
      </div>
    </div>

    {{-- MODELOS --}}
    <div class="card p-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-extrabold">Modelos</h2>
        <span class="badge">{{ $models->count() }}</span>
      </div>

      <form method="POST" action="{{ route('admin.deviceCatalog.models.store') }}" class="mt-3 flex gap-2">
        @csrf
        <input type="hidden" name="device_brand_id" value="{{ $brandId }}">
        <input name="name" class="w-full" placeholder="Ej: A52 / iPhone 12" @disabled(!$brandId) required>
        <button class="btn btn-primary btn-sm" @disabled(!$brandId)>Agregar</button>
      </form>

      <div class="mt-4">
        @if(!$typeId)
          <p class="text-sm text-zinc-600">Elegí un tipo primero.</p>
        @elseif(!$brandId)
          <p class="text-sm text-zinc-600">Elegí una marca para ver/crear modelos.</p>
        @elseif($models->isEmpty())
          <p class="text-sm text-zinc-600">No hay modelos para esta marca.</p>
        @else
          <table class="w-full text-sm">
            <thead class="text-left text-zinc-500">
              <tr>
                <th class="py-2">Nombre</th>
                <th class="py-2">Estado</th>
                <th class="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              @foreach($models as $m)
                <tr>
                  <td class="py-2">
                    <div class="font-medium text-zinc-900">{{ $m->name }}</div>
                    <div class="text-xs text-zinc-500">
                      Grupo: {{ $m->group?->name ?? '—' }}
                    </div>
                    <details class="mt-1">
                      <summary class="text-xs text-sky-700 cursor-pointer select-none">Renombrar</summary>
                      <form method="POST" action="{{ route('admin.deviceCatalog.models.update', $m) }}" class="mt-2 flex gap-2">
                        @csrf
                        @method('PUT')
                        <input name="name" class="w-full" value="{{ $m->name }}" required>
                        <button class="btn btn-primary btn-sm">Guardar</button>
                      </form>
                    </details>
                  </td>
                  <td class="py-2">
                    @if($m->active)
                      <span class="badge badge-emerald">Activo</span>
                    @else
                      <span class="badge badge-zinc">Inactivo</span>
                    @endif
                  </td>
                  <td class="py-2 text-right">
                    <form method="POST" action="{{ route('admin.deviceCatalog.models.toggle', $m) }}">
                      @csrf
                      <button class="btn btn-ghost btn-sm">
                        {{ $m->active ? 'Desactivar' : 'Activar' }}
                      </button>
                    </form>
                  </td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif
      </div>

      <div class="mt-3">
        <a class="text-xs text-sky-700" href="{{ route('admin.modelGroups.index') }}">Administrar grupos de modelos →</a>
      </div>
    </div>

    {{-- FALLAS --}}
    <div class="card p-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-extrabold">Fallas</h2>
        <span class="badge">{{ $issues->count() }}</span>
      </div>

      <form method="POST" action="{{ route('admin.deviceCatalog.issues.store') }}" class="mt-3 flex gap-2">
        @csrf
        <input type="hidden" name="device_type_id" value="{{ $typeId }}">
        <input name="name" class="w-full" placeholder="Ej: No carga / Pantalla" @disabled(!$typeId) required>
        <button class="btn btn-primary btn-sm" @disabled(!$typeId)>Agregar</button>
      </form>

      <div class="mt-4">
        @if(!$typeId)
          <p class="text-sm text-zinc-600">Elegí un tipo para ver/crear fallas.</p>
        @elseif($issues->isEmpty())
          <p class="text-sm text-zinc-600">No hay fallas para este tipo.</p>
        @else
          <table class="w-full text-sm">
            <thead class="text-left text-zinc-500">
              <tr>
                <th class="py-2">Nombre</th>
                <th class="py-2">Estado</th>
                <th class="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              @foreach($issues as $i)
                <tr>
                  <td class="py-2">
                    <div class="font-medium text-zinc-900">{{ $i->name }}</div>
                    <div class="text-xs text-zinc-500">slug: {{ $i->slug }}</div>
                    <details class="mt-1">
                      <summary class="text-xs text-sky-700 cursor-pointer select-none">Renombrar</summary>
                      <form method="POST" action="{{ route('admin.deviceCatalog.issues.update', $i) }}" class="mt-2 flex gap-2">
                        @csrf
                        @method('PUT')
                        <input name="name" class="w-full" value="{{ $i->name }}" required>
                        <button class="btn btn-primary btn-sm">Guardar</button>
                      </form>
                    </details>
                  </td>
                  <td class="py-2">
                    @if($i->active)
                      <span class="badge badge-emerald">Activa</span>
                    @else
                      <span class="badge badge-zinc">Inactiva</span>
                    @endif
                  </td>
                  <td class="py-2 text-right">
                    <form method="POST" action="{{ route('admin.deviceCatalog.issues.toggle', $i) }}">
                      @csrf
                      <button class="btn btn-ghost btn-sm">
                        {{ $i->active ? 'Desactivar' : 'Activar' }}
                      </button>
                    </form>
                  </td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif
      </div>
    </div>
  </div>
</div>
@endsection

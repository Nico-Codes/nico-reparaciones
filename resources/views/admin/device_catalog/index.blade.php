@extends('layouts.app')

@section('title', 'Admin — Catálogo de dispositivos')

@section('content')
<div class="space-y-4">
  <div class="page-head">
    <div>
      <div class="page-title">Catálogo de dispositivos</div>
      <div class="page-subtitle">
        Gestioná marcas, modelos y fallas por tipo. En lugar de borrar, desactivá.
      </div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.deviceTypes.index') }}">Tipos</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">Precios</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Filtro de catálogo</div>
        <div class="text-xs text-zinc-500">Seleccioná tipo y marca para administrar cada bloque.</div>
      </div>
    </div>

    <div class="card-body">
      <form method="GET" class="grid gap-3 md:grid-cols-3 items-end">
        <div>
          <label class="block text-sm font-semibold text-zinc-800">Tipo</label>
          <select name="type_id" class="mt-1 h-11 w-full" onchange="this.form.submit()">
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
          <select name="brand_id" class="mt-1 h-11 w-full" onchange="this.form.submit()" @disabled(!$typeId)>
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
          Tip: en “Nueva reparación” solo se muestran ítems activos.
        </div>
      </form>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- MARCAS --}}
    <div class="card">
      <div class="card-head">
        <h2 class="text-lg font-extrabold">Marcas</h2>
        <span class="badge-zinc">{{ $brands->count() }}</span>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('admin.deviceCatalog.brands.store') }}" class="flex flex-col gap-2 sm:flex-row">
          @csrf
          <input type="hidden" name="device_type_id" value="{{ $typeId }}">
          <input name="name" class="h-11 w-full" placeholder="Ej: Samsung" @disabled(!$typeId) required>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" @disabled(!$typeId)>Agregar</button>
        </form>

        <div class="mt-4">
          @if(!$typeId)
            <p class="text-sm text-zinc-600">Elegí un tipo para ver/crear marcas.</p>
          @elseif($brands->isEmpty())
            <p class="text-sm text-zinc-600">No hay marcas para este tipo.</p>
          @else
            <div class="space-y-2 md:hidden">
              @foreach($brands as $b)
                <div class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="font-medium text-zinc-900">{{ $b->name }}</div>
                    @if($b->active)
                      <span class="badge badge-emerald">Activa</span>
                    @else
                      <span class="badge badge-zinc">Inactiva</span>
                    @endif
                  </div>

                  <details class="mt-2">
                    <summary class="text-xs text-sky-700 cursor-pointer select-none">Renombrar</summary>
                    <form method="POST" action="{{ route('admin.deviceCatalog.brands.update', $b) }}" class="mt-2 space-y-2">
                      @csrf
                      @method('PUT')
                      <input name="name" class="h-11 w-full" value="{{ $b->name }}" required>
                      <button class="btn-outline h-10 w-full justify-center">Guardar</button>
                    </form>
                  </details>

                  <form method="POST" action="{{ route('admin.deviceCatalog.brands.toggle', $b) }}" class="mt-2">
                    @csrf
                    <button class="btn-ghost h-10 w-full justify-center">
                      {{ $b->active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </form>
                </div>
              @endforeach
            </div>

            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-[560px] w-full text-sm">
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
                          <form method="POST" action="{{ route('admin.deviceCatalog.brands.update', $b) }}" class="mt-2 flex flex-col gap-2 sm:flex-row">
                            @csrf
                            @method('PUT')
                            <input name="name" class="h-10 w-full" value="{{ $b->name }}" required>
                            <button class="btn-primary btn-sm h-10 w-full justify-center sm:w-auto">Guardar</button>
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
                          <button class="btn-ghost btn-sm h-10">
                            {{ $b->active ? 'Desactivar' : 'Activar' }}
                          </button>
                        </form>
                      </td>
                    </tr>
                  @endforeach
                </tbody>
              </table>
            </div>
          @endif
        </div>
      </div>
    </div>

    {{-- MODELOS --}}
    <div class="card">
      <div class="card-head">
        <h2 class="text-lg font-extrabold">Modelos</h2>
        <span class="badge-zinc">{{ $models->count() }}</span>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('admin.deviceCatalog.models.store') }}" class="flex flex-col gap-2 sm:flex-row">
          @csrf
          <input type="hidden" name="device_brand_id" value="{{ $brandId }}">
          <input name="name" class="h-11 w-full" placeholder="Ej: A52 / iPhone 12" @disabled(!$brandId) required>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" @disabled(!$brandId)>Agregar</button>
        </form>

        <div class="mt-4">
          @if(!$typeId)
            <p class="text-sm text-zinc-600">Elegí un tipo primero.</p>
          @elseif(!$brandId)
            <p class="text-sm text-zinc-600">Elegí una marca para ver/crear modelos.</p>
          @elseif($models->isEmpty())
            <p class="text-sm text-zinc-600">No hay modelos para esta marca.</p>
          @else
            <div class="space-y-2 md:hidden">
              @foreach($models as $m)
                <div class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="font-medium text-zinc-900">{{ $m->name }}</div>
                      <div class="text-xs text-zinc-500 truncate">Grupo: {{ $m->group?->name ?? '—' }}</div>
                    </div>
                    @if($m->active)
                      <span class="badge badge-emerald">Activo</span>
                    @else
                      <span class="badge badge-zinc">Inactivo</span>
                    @endif
                  </div>

                  <details class="mt-2">
                    <summary class="text-xs text-sky-700 cursor-pointer select-none">Renombrar</summary>
                    <form method="POST" action="{{ route('admin.deviceCatalog.models.update', $m) }}" class="mt-2 space-y-2">
                      @csrf
                      @method('PUT')
                      <input name="name" class="h-11 w-full" value="{{ $m->name }}" required>
                      <button class="btn-outline h-10 w-full justify-center">Guardar</button>
                    </form>
                  </details>

                  <form method="POST" action="{{ route('admin.deviceCatalog.models.toggle', $m) }}" class="mt-2">
                    @csrf
                    <button class="btn-ghost h-10 w-full justify-center">
                      {{ $m->active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </form>
                </div>
              @endforeach
            </div>

            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-[560px] w-full text-sm">
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
                          <form method="POST" action="{{ route('admin.deviceCatalog.models.update', $m) }}" class="mt-2 flex flex-col gap-2 sm:flex-row">
                            @csrf
                            @method('PUT')
                            <input name="name" class="h-10 w-full" value="{{ $m->name }}" required>
                            <button class="btn-primary btn-sm h-10 w-full justify-center sm:w-auto">Guardar</button>
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
                          <button class="btn-ghost btn-sm h-10">
                            {{ $m->active ? 'Desactivar' : 'Activar' }}
                          </button>
                        </form>
                      </td>
                    </tr>
                  @endforeach
                </tbody>
              </table>
            </div>
          @endif
        </div>

        <div class="mt-3">
          <a class="btn-outline h-10 w-full justify-center sm:w-auto" href="{{ route('admin.modelGroups.index') }}">Administrar grupos de modelos</a>
        </div>
      </div>
    </div>

    {{-- FALLAS --}}
    <div class="card">
      <div class="card-head">
        <h2 class="text-lg font-extrabold">Fallas</h2>
        <span class="badge-zinc">{{ $issues->count() }}</span>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('admin.deviceCatalog.issues.store') }}" class="flex flex-col gap-2 sm:flex-row">
          @csrf
          <input type="hidden" name="device_type_id" value="{{ $typeId }}">
          <input name="name" class="h-11 w-full" placeholder="Ej: No carga / Pantalla" @disabled(!$typeId) required>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" @disabled(!$typeId)>Agregar</button>
        </form>

        <div class="mt-4">
          @if(!$typeId)
            <p class="text-sm text-zinc-600">Elegí un tipo para ver/crear fallas.</p>
          @elseif($issues->isEmpty())
            <p class="text-sm text-zinc-600">No hay fallas para este tipo.</p>
          @else
            <div class="space-y-2 md:hidden">
              @foreach($issues as $i)
                <div class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="font-medium text-zinc-900">{{ $i->name }}</div>
                      <div class="text-xs text-zinc-500">slug: {{ $i->slug }}</div>
                    </div>
                    @if($i->active)
                      <span class="badge badge-emerald">Activa</span>
                    @else
                      <span class="badge badge-zinc">Inactiva</span>
                    @endif
                  </div>

                  <details class="mt-2">
                    <summary class="text-xs text-sky-700 cursor-pointer select-none">Renombrar</summary>
                    <form method="POST" action="{{ route('admin.deviceCatalog.issues.update', $i) }}" class="mt-2 space-y-2">
                      @csrf
                      @method('PUT')
                      <input name="name" class="h-11 w-full" value="{{ $i->name }}" required>
                      <button class="btn-outline h-10 w-full justify-center">Guardar</button>
                    </form>
                  </details>

                  <form method="POST" action="{{ route('admin.deviceCatalog.issues.toggle', $i) }}" class="mt-2">
                    @csrf
                    <button class="btn-ghost h-10 w-full justify-center">
                      {{ $i->active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </form>
                </div>
              @endforeach
            </div>

            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-[560px] w-full text-sm">
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
                          <form method="POST" action="{{ route('admin.deviceCatalog.issues.update', $i) }}" class="mt-2 flex flex-col gap-2 sm:flex-row">
                            @csrf
                            @method('PUT')
                            <input name="name" class="h-10 w-full" value="{{ $i->name }}" required>
                            <button class="btn-primary btn-sm h-10 w-full justify-center sm:w-auto">Guardar</button>
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
                          <button class="btn-ghost btn-sm h-10">
                            {{ $i->active ? 'Desactivar' : 'Activar' }}
                          </button>
                        </form>
                      </td>
                    </tr>
                  @endforeach
                </tbody>
              </table>
            </div>
          @endif
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

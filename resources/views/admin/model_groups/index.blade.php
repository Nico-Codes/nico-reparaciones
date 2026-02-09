@extends('layouts.app')
@section('title', 'Admin — Grupos de modelos')

@section('content')
<div class="space-y-4">
  <div class="page-head">
    <div>
      <div class="page-title">Grupos de modelos</div>
      <div class="page-subtitle">Sirve para separar PS4 vs PS5, Samsung Serie A vs Serie S, etc.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">← Precios</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Filtro de catálogo</div>
        <div class="text-xs text-zinc-500">Elegí tipo y marca para crear/editar grupos.</div>
      </div>
    </div>

    <div class="card-body">
      <form method="GET" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end">
        <div class="space-y-1">
          <label class="text-sm font-semibold text-zinc-800">Tipo dispositivo</label>
          <select class="h-11" name="device_type_id" onchange="this.form.submit()">
            <option value="">Elegí…</option>
            @foreach($deviceTypes as $t)
              <option value="{{ $t->id }}" @selected($typeId == $t->id)>{{ $t->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold text-zinc-800">Marca</label>
          <select class="h-11" name="device_brand_id" onchange="this.form.submit()">
            <option value="">Elegí…</option>
            @foreach($brands as $b)
              <option value="{{ $b->id }}" @selected($brandId == $b->id)>{{ $b->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button class="btn-outline h-11 w-full justify-center sm:w-auto">Filtrar</button>
          @if($typeId || $brandId)
            <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.modelGroups.index') }}">Limpiar</a>
          @endif
        </div>
      </form>
    </div>
  </div>

  @if(!$brandId)
    <div class="card">
      <div class="card-body text-sm text-zinc-600">
        Elegí un tipo y una marca para administrar los grupos y asignar modelos.
      </div>
    </div>
  @else
    <div class="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Crear grupo</div>
          <span class="badge-zinc">{{ $groups->count() }}</span>
        </div>

        <div class="card-body">
          <form method="POST" action="{{ route('admin.modelGroups.store') }}" class="space-y-3">
            @csrf
            <input type="hidden" name="device_brand_id" value="{{ $brandId }}">

            <div class="space-y-1">
              <label class="text-sm font-semibold text-zinc-800">Nombre</label>
              <input class="h-11" name="name" placeholder="Ej: PS4 / PS5 / Serie A..." required>
            </div>

            <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <input class="h-4 w-4 rounded border-zinc-300" type="checkbox" name="active" value="1" checked>
              <span>Activo</span>
            </label>

            <button class="btn-primary h-11 w-full justify-center">Crear</button>
          </form>
        </div>

        <div class="card-body border-t border-zinc-100">
          <div class="font-black mb-3">Grupos existentes</div>
          <div class="space-y-2">
            @forelse($groups as $g)
              <form method="POST" action="{{ route('admin.modelGroups.update', $g) }}" class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm space-y-3">
                @csrf
                @method('PUT')

                <div class="grid gap-3 sm:grid-cols-3 items-end">
                  <div class="space-y-1 sm:col-span-2">
                    <label class="text-xs font-black uppercase text-zinc-500">Nombre</label>
                    <input class="h-11" name="name" value="{{ $g->name }}">
                  </div>

                  <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <input class="h-4 w-4 rounded border-zinc-300" type="checkbox" name="active" value="1" @checked($g->active)>
                    <span>Activo</span>
                  </label>
                </div>

                <button class="btn-outline h-10 w-full justify-center sm:w-auto">Guardar</button>
              </form>
            @empty
              <div class="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                No hay grupos cargados para esta marca.
              </div>
            @endforelse
          </div>
        </div>
      </div>

      <div class="card" data-admin-model-groups>
        <div class="card-head">
          <div>
            <div class="font-black">Asignar modelos a grupos</div>
            <div class="text-xs text-zinc-500">Al cambiar el select, se guarda solo.</div>
          </div>
          <span class="badge-zinc">{{ $models->count() }}</span>
        </div>

        <div class="card-body">
          <div class="space-y-2">
            @forelse($models as $m)
              <div class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="min-w-0">
                    <div class="font-semibold text-zinc-900 truncate">{{ $m->name }}</div>
                    <div class="text-xs text-zinc-500">ID: {{ $m->id }}</div>
                  </div>

                  <div class="w-full sm:w-56">
                    <label class="mb-1 block text-xs font-black uppercase text-zinc-500 sm:hidden">Grupo</label>
                    <select class="h-11 w-full" data-model-id="{{ $m->id }}">
                      <option value="">— sin grupo —</option>
                      @foreach($groups as $g)
                        <option value="{{ $g->id }}" @selected($m->device_model_group_id == $g->id)>{{ $g->name }}</option>
                      @endforeach
                    </select>
                  </div>
                </div>
              </div>
            @empty
              <div class="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                No hay modelos para esta marca.
              </div>
            @endforelse
          </div>
        </div>
      </div>
    </div>
  @endif
</div>
@endsection

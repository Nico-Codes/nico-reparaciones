@extends('layouts.app')
@section('title', 'Admin — Grupos de modelos')

@section('content')
<div class="page-head">
  <div>
    <div class="page-title">Grupos de modelos</div>
    <div class="page-subtitle">Sirve para separar PS4 vs PS5, Samsung Serie A vs Serie S, etc.</div>
  </div>
  <div class="flex gap-2">
    <a class="btn btn-ghost" href="{{ route('admin.pricing.index') }}">← Precios</a>
  </div>
</div>

<div class="card p-4 mb-4">
  <form method="GET" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
    <div class="space-y-1">
      <label class="text-sm font-semibold">Tipo dispositivo</label>
      <select name="device_type_id" onchange="this.form.submit()">
        <option value="">Elegí…</option>
        @foreach($deviceTypes as $t)
          <option value="{{ $t->id }}" @selected($typeId == $t->id)>{{ $t->name }}</option>
        @endforeach
      </select>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-semibold">Marca</label>
      <select name="device_brand_id" onchange="this.form.submit()">
        <option value="">Elegí…</option>
        @foreach($brands as $b)
          <option value="{{ $b->id }}" @selected($brandId == $b->id)>{{ $b->name }}</option>
        @endforeach
      </select>
    </div>

    <div>
      <button class="btn btn-ghost">Filtrar</button>
    </div>
  </form>
</div>

@if($brandId)
<div class="grid gap-4 lg:grid-cols-2">
  <div class="card p-4">
    <div class="font-black mb-3">Crear grupo</div>
    <form method="POST" action="{{ route('admin.modelGroups.store') }}" class="space-y-3">
      @csrf
      <input type="hidden" name="device_brand_id" value="{{ $brandId }}" />
      <div class="space-y-1">
        <label class="text-sm font-semibold">Nombre</label>
        <input name="name" placeholder="Ej: PS4 / PS5 / Serie A..." required />
      </div>
      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" value="1" checked />
        <span>Activo</span>
      </label>
      <button class="btn btn-primary">Crear</button>
    </form>

    <div class="mt-6">
      <div class="font-black mb-2">Grupos existentes</div>
      <div class="space-y-2">
        @foreach($groups as $g)
          <form method="POST" action="{{ route('admin.modelGroups.update', $g) }}" class="card p-3">
            @csrf
            @method('PUT')
            <div class="grid gap-3 sm:grid-cols-3 items-end">
              <div class="sm:col-span-2 space-y-1">
                <label class="text-xs text-zinc-500">Nombre</label>
                <input name="name" value="{{ $g->name }}" />
              </div>
              <label class="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" value="1" @checked($g->active) />
                <span>Activo</span>
              </label>
            </div>
            <div class="mt-3">
              <button class="btn btn-ghost">Guardar</button>
            </div>
          </form>
        @endforeach
      </div>
    </div>
  </div>

  <div class="card p-4" data-admin-model-groups>
    <div class="font-black mb-3">Asignar modelos a grupos</div>
    <div class="text-xs text-zinc-500 mb-3">Al cambiar el select, se guarda solo.</div>

    <div class="space-y-2">
      @foreach($models as $m)
        <div class="card p-3 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold truncate">{{ $m->name }}</div>
            <div class="text-xs text-zinc-500">ID: {{ $m->id }}</div>
          </div>

          <select class="w-56"
            data-model-id="{{ $m->id }}">
            <option value="">— sin grupo —</option>
            @foreach($groups as $g)
              <option value="{{ $g->id }}" @selected($m->device_model_group_id == $g->id)>{{ $g->name }}</option>
            @endforeach
          </select>
        </div>
      @endforeach
    </div>
  </div>
</div>
@endif
@endsection

@extends('layouts.app')
@section('title', 'Admin — Tipos de reparación')

@section('content')
<div class="page-head">
  <div>
    <div class="page-title">Tipos de reparación</div>
    <div class="page-subtitle">Estos son los “módulo / batería / mantenimiento …” que se usan en el cálculo automático.</div>
  </div>
  <div class="flex gap-2">
    <a class="btn btn-ghost" href="{{ route('admin.pricing.index') }}">← Precios</a>
  </div>
</div>

<div class="grid gap-4 lg:grid-cols-2">
  <div class="card p-4">
    <div class="font-black mb-3">Crear tipo</div>
    <form method="POST" action="{{ route('admin.repairTypes.store') }}" class="space-y-3">
      @csrf
      <div class="space-y-1">
        <label class="text-sm font-semibold">Nombre</label>
        <input name="name" value="" placeholder="Ej: Módulo" required />
      </div>
      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" value="1" checked />
        <span>Activo</span>
      </label>
      <button class="btn btn-primary">Crear</button>
    </form>
  </div>

  <div class="card p-4">
    <div class="font-black mb-3">Listado</div>
    <div class="space-y-2">
      @foreach($repairTypes as $rt)
        <form method="POST" action="{{ route('admin.repairTypes.update', $rt) }}" class="card p-3">
          @csrf
          @method('PUT')
          <div class="grid gap-3 sm:grid-cols-3 items-end">
            <div class="sm:col-span-2 space-y-1">
              <label class="text-xs text-zinc-500">Nombre</label>
              <input name="name" value="{{ $rt->name }}" />
            </div>
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" value="1" @checked($rt->active) />
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
@endsection

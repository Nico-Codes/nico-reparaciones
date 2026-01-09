@extends('layouts.app')
@section('title', 'Admin — Crear regla')

@section('content')
<div class="page-head">
  <div>
    <div class="page-title">Crear regla</div>
    <div class="page-subtitle">Mientras más específico (modelo > grupo > marca), más prioridad real tiene.</div>
  </div>
  <div class="flex gap-2">
    <a class="btn btn-ghost" href="{{ route('admin.pricing.index') }}">← Volver</a>
  </div>
</div>

<div class="card p-4 max-w-3xl">
  <form method="POST" action="{{ route('admin.pricing.store') }}" class="space-y-4">
    @csrf

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-sm font-semibold">Tipo dispositivo *</label>
        <select name="device_type_id" required>
          <option value="">Elegí…</option>
          @foreach($deviceTypes as $t)
            <option value="{{ $t->id }}">{{ $t->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Reparación final *</label>
        <select name="repair_type_id" required>
          <option value="">Elegí…</option>
          @foreach($repairTypes as $rt)
            <option value="{{ $rt->id }}">{{ $rt->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Marca (opcional)</label>
        <select name="device_brand_id">
          <option value="">—</option>
          @foreach($brands as $b)
            <option value="{{ $b->id }}">{{ $b->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Grupo (opcional)</label>
        <select name="device_model_group_id">
          <option value="">—</option>
          @foreach($groups as $g)
            <option value="{{ $g->id }}">{{ $g->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="text-sm font-semibold">Modelo (opcional)</label>
        <select name="device_model_id">
          <option value="">—</option>
          @foreach($models as $m)
            <option value="{{ $m->id }}">{{ $m->name }}</option>
          @endforeach
        </select>
        <div class="text-xs text-zinc-500">Si elegís modelo, pisa marca/grupo.</div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-sm font-semibold">Modo *</label>
        <select name="mode" required>
          <option value="margin">Margen (porcentaje + mínimo)</option>
          <option value="fixed">Fijo</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Envío sugerido</label>
        <input name="shipping_default" inputmode="numeric" value="10000" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Multiplier (ej 0.25)</label>
        <input name="multiplier" inputmode="decimal" value="" placeholder="0.25" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Mínimo ganancia</label>
        <input name="min_profit" inputmode="numeric" value="" placeholder="24000" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Total fijo</label>
        <input name="fixed_total" inputmode="numeric" value="" placeholder="45000" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Prioridad</label>
        <input name="priority" inputmode="numeric" value="0" />
      </div>
    </div>

    <label class="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name="active" value="1" checked />
      <span>Activa</span>
    </label>

    <div class="pt-2">
      <button class="btn btn-primary">Guardar</button>
    </div>
  </form>
</div>
@endsection

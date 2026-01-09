@extends('layouts.app')
@section('title', 'Admin — Editar regla')

@section('content')
<div class="page-head">
  <div>
    <div class="page-title">Editar regla</div>
    <div class="page-subtitle">Ajustá porcentaje, mínimos, fijo, envío y prioridad.</div>
  </div>
  <div class="flex gap-2">
    <a class="btn btn-ghost" href="{{ route('admin.pricing.index') }}">← Volver</a>
  </div>
</div>

<div class="card p-4 max-w-3xl">
  <form method="POST" action="{{ route('admin.pricing.update', $rule) }}" class="space-y-4">
    @csrf
    @method('PUT')

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-sm font-semibold">Tipo dispositivo *</label>
        <select name="device_type_id" required>
          @foreach($deviceTypes as $t)
            <option value="{{ $t->id }}" @selected($rule->device_type_id == $t->id)>{{ $t->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Reparación final *</label>
        <select name="repair_type_id" required>
          @foreach($repairTypes as $rt)
            <option value="{{ $rt->id }}" @selected($rule->repair_type_id == $rt->id)>{{ $rt->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Marca (opcional)</label>
        <select name="device_brand_id">
          <option value="">—</option>
          @foreach($brands as $b)
            <option value="{{ $b->id }}" @selected($rule->device_brand_id == $b->id)>{{ $b->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Grupo (opcional)</label>
        <select name="device_model_group_id">
          <option value="">—</option>
          @foreach($groups as $g)
            <option value="{{ $g->id }}" @selected($rule->device_model_group_id == $g->id)>{{ $g->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="text-sm font-semibold">Modelo (opcional)</label>
        <select name="device_model_id">
          <option value="">—</option>
          @foreach($models as $m)
            <option value="{{ $m->id }}" @selected($rule->device_model_id == $m->id)>{{ $m->name }}</option>
          @endforeach
        </select>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-sm font-semibold">Modo *</label>
        <select name="mode" required>
          <option value="margin" @selected($rule->mode === 'margin')>Margen (porcentaje + mínimo)</option>
          <option value="fixed" @selected($rule->mode === 'fixed')>Fijo</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Envío sugerido</label>
        <input name="shipping_default" inputmode="numeric" value="{{ (int)$rule->shipping_default }}" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Multiplier (ej 0.25)</label>
        <input name="multiplier" inputmode="decimal" value="{{ $rule->multiplier !== null ? (float)$rule->multiplier : '' }}" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Mínimo ganancia</label>
        <input name="min_profit" inputmode="numeric" value="{{ $rule->min_profit !== null ? (int)$rule->min_profit : '' }}" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Total fijo</label>
        <input name="fixed_total" inputmode="numeric" value="{{ $rule->fixed_total !== null ? (int)$rule->fixed_total : '' }}" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Prioridad</label>
        <input name="priority" inputmode="numeric" value="{{ (int)$rule->priority }}" />
      </div>
    </div>

    <label class="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name="active" value="1" @checked($rule->active) />
      <span>Activa</span>
    </label>

    <div class="pt-2">
      <button class="btn btn-primary">Guardar cambios</button>
    </div>
  </form>
</div>
@endsection

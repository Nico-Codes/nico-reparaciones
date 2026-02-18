@extends('layouts.app')
@section('title', 'Admin - Editar regla')

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Editar regla</div>
        <div class="page-subtitle">Ajusta porcentaje, minimos, fijo, envio y prioridad.</div>
      </div>
      <div class="flex w-full gap-2 sm:w-auto">
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">Volver</a>
      </div>
    </div>
  </div>

  <div class="reveal-item card p-4 max-w-3xl">
    <form method="POST" action="{{ route('admin.pricing.update', $rule) }}" class="space-y-4">
      @csrf
      @method('PUT')

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <label class="text-sm font-semibold">Tipo dispositivo *</label>
          <select name="device_type_id" class="h-11" required>
            @foreach($deviceTypes as $t)
              <option value="{{ $t->id }}" @selected($rule->device_type_id == $t->id)>{{ $t->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Reparacion final *</label>
          <select name="repair_type_id" class="h-11" required>
            @foreach($repairTypes as $rt)
              <option value="{{ $rt->id }}" @selected($rule->repair_type_id == $rt->id)>{{ $rt->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Marca (opcional)</label>
          <select name="device_brand_id" class="h-11">
            <option value="">-</option>
            @foreach($brands as $b)
              <option value="{{ $b->id }}" @selected($rule->device_brand_id == $b->id)>{{ $b->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Grupo (opcional)</label>
          <select name="device_model_group_id" class="h-11">
            <option value="">-</option>
            @foreach($groups as $g)
              <option value="{{ $g->id }}" @selected($rule->device_model_group_id == $g->id)>{{ $g->name }}</option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1 sm:col-span-2">
          <label class="text-sm font-semibold">Modelo (opcional)</label>
          <select name="device_model_id" class="h-11">
            <option value="">-</option>
            @foreach($models as $m)
              <option value="{{ $m->id }}" @selected($rule->device_model_id == $m->id)>{{ $m->name }}</option>
            @endforeach
          </select>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <label class="text-sm font-semibold">Modo *</label>
          <select name="mode" class="h-11" required>
            <option value="margin" @selected($rule->mode === 'margin')>Margen (porcentaje + minimo)</option>
            <option value="fixed" @selected($rule->mode === 'fixed')>Fijo</option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Envio sugerido</label>
          <input name="shipping_default" class="h-11" inputmode="numeric" value="{{ (int)$rule->shipping_default }}" />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Multiplier (ej 0.25)</label>
          <input name="multiplier" class="h-11" inputmode="decimal" value="{{ $rule->multiplier !== null ? (float)$rule->multiplier : '' }}" />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Minimo ganancia</label>
          <input name="min_profit" class="h-11" inputmode="numeric" value="{{ $rule->min_profit !== null ? (int)$rule->min_profit : '' }}" />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Total fijo</label>
          <input name="fixed_total" class="h-11" inputmode="numeric" value="{{ $rule->fixed_total !== null ? (int)$rule->fixed_total : '' }}" />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-semibold">Prioridad</label>
          <input name="priority" class="h-11" inputmode="numeric" value="{{ (int)$rule->priority }}" />
        </div>
      </div>

      <label class="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" value="1" @checked($rule->active) />
        <span>Activa</span>
      </label>

      <div class="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">Cancelar</a>
        <button class="btn-primary h-11 w-full justify-center sm:w-auto">Guardar cambios</button>
      </div>
    </form>
  </div>
</div>
@endsection

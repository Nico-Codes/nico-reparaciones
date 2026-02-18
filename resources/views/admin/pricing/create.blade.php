@extends('layouts.app')
@section('title', 'Admin — Crear regla')

@section('content')
<div class="page-head">
  <div>
    <div class="page-title">Crear regla</div>
    <div class="page-subtitle">Más específico = más prioridad (Modelo > Grupo > Marca > Genérico).</div>
  </div>
  <div class="flex w-full gap-2 sm:w-auto">
    <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">← Volver</a>
  </div>
</div>

<div class="card p-4 max-w-3xl">
  <form method="POST" action="{{ route('admin.pricing.store') }}" class="space-y-4" data-pricing-create-form>
    @csrf

    @php
      // ✅ Funciona aunque el controller NO pase $prefill
      $prefill = $prefill ?? [];

      $val = function(string $key, $default = '') use ($prefill) {
        return old($key, $prefill[$key] ?? $default);
      };

      $sel = function(string $key, $id) use ($val) {
        return (string)$val($key, '') === (string)$id;
      };

      $mode = (string) $val('mode', 'margin');
    @endphp

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-sm font-semibold">Tipo de dispositivo *</label>
        <select name="device_type_id" class="h-11" required>
          <option value="">Elegí…</option>
          @foreach($deviceTypes as $t)
            <option value="{{ $t->id }}" @selected($sel('device_type_id', $t->id))>{{ $t->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Reparación final *</label>
        <select name="repair_type_id" class="h-11" required>
          <option value="">Elegí…</option>
          @foreach($repairTypes as $rt)
            <option value="{{ $rt->id }}" @selected($sel('repair_type_id', $rt->id))>{{ $rt->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Marca (opcional)</label>
        <select name="device_brand_id" class="h-11">
          <option value="">—</option>
          @foreach($brands as $b)
            <option value="{{ $b->id }}" @selected($sel('device_brand_id', $b->id))>{{ $b->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Grupo (opcional)</label>
        <select name="device_model_group_id" class="h-11">
          <option value="">—</option>
          @foreach($groups as $g)
            <option value="{{ $g->id }}" @selected($sel('device_model_group_id', $g->id))>{{ $g->name }}</option>
          @endforeach
        </select>
      </div>

      <div class="space-y-1 sm:col-span-2">
        <label class="text-sm font-semibold">Modelo (opcional)</label>
        <select name="device_model_id" class="h-11">
          <option value="">—</option>
          @foreach($models as $m)
            <option value="{{ $m->id }}" @selected($sel('device_model_id', $m->id))>{{ $m->name }}</option>
          @endforeach
        </select>
        <div class="text-xs text-zinc-500">Si elegís modelo, pisa marca/grupo.</div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-sm font-semibold">Modo *</label>
        <select name="mode" class="h-11" required data-pricing-mode-select>
          <option value="margin" @selected($mode === 'margin')>Margen (porcentaje + mínimo)</option>
          <option value="fixed" @selected($mode === 'fixed')>Fijo</option>
        </select>
        <div class="text-xs text-zinc-500" data-pricing-mode-hint></div>
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Envío sugerido</label>
        <input name="shipping_default" class="h-11" inputmode="numeric" value="{{ $val('shipping_default', 10000) }}" />
        <div class="text-xs text-zinc-500">Si no hay envío, poné 0.</div>
      </div>

      {{-- Campos modo "margin" --}}
      <div class="space-y-1" data-pricing-mode="margin">
        <label class="text-sm font-semibold">Porcentaje de ganancia (ej 0.25 = 25%)</label>
        <input name="multiplier" class="h-11" inputmode="decimal" value="{{ $val('multiplier', '') }}" placeholder="0.25" />
      </div>

      <div class="space-y-1" data-pricing-mode="margin">
        <label class="text-sm font-semibold">Mínimo de ganancia</label>
        <input name="min_profit" class="h-11" inputmode="numeric" value="{{ $val('min_profit', '') }}" placeholder="24000" />
      </div>

      {{-- Campo modo "fixed" --}}
      <div class="space-y-1" data-pricing-mode="fixed">
        <label class="text-sm font-semibold">Total fijo (incluye mano de obra)</label>
        <input name="fixed_total" class="h-11" inputmode="numeric" value="{{ $val('fixed_total', '') }}" placeholder="45000" />
      </div>

      <div class="space-y-1">
        <label class="text-sm font-semibold">Prioridad (avanzado)</label>
        <input name="priority" class="h-11" inputmode="numeric" value="{{ $val('priority', 0) }}" />
        <div class="text-xs text-zinc-500">Si hay empate de especificidad, gana la mayor prioridad.</div>
      </div>
    </div>

    <label class="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name="active" value="1" @checked((bool)$val('active', true)) />
      <span>Activa</span>
    </label>

    <div class="pt-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">Cancelar</a>
      <button class="btn-primary h-11 w-full justify-center sm:w-auto">Guardar</button>
    </div>
  </form>
</div>

<div data-react-pricing-rule-create-mode data-selector="[data-pricing-create-form]"></div>
@endsection

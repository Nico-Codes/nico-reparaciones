@extends('layouts.app')
@section('title', 'Admin — Precios')

@section('content')
<div class="page-head">
  <div>
    <div class="page-title">Reglas de precios (auto)</div>
    <div class="page-subtitle">Configurá porcentaje, mínimos y precios fijos por tipo/marca/grupo/modelo.</div>
  </div>
  <div class="flex gap-2">
    <a class="btn btn-ghost" href="{{ route('admin.deviceTypes.index') }}">Dispositivos</a>
    <a class="btn btn-ghost" href="{{ route('admin.modelGroups.index') }}">Grupos</a>
    <a class="btn btn-ghost" href="{{ route('admin.repairTypes.index') }}">Tipos</a>
  </div>

</div>

<div class="card p-4 overflow-x-auto">
  <table class="min-w-[1100px] w-full text-sm">
    <thead class="text-left text-zinc-500">
      <tr>
        <th class="py-2">Activo</th>
        <th>Tipo</th>
        <th>Marca</th>
        <th>Grupo</th>
        <th>Modelo</th>
        <th>Reparación</th>
        <th>Modo</th>
        <th>%</th>
        <th>Mín</th>
        <th>Fijo</th>
        <th>Envío</th>
        <th>Prioridad</th>
        <th></th>
      </tr>
    </thead>
    <tbody class="align-top">
      @foreach($rules as $r)
        <tr class="border-t border-zinc-200/70">
          <td class="py-2">{{ $r->active ? '✅' : '—' }}</td>
          <td>{{ $r->deviceType?->name ?? '—' }}</td>
          <td>{{ $r->brand?->name ?? '—' }}</td>
          <td>{{ $r->modelGroup?->name ?? '—' }}</td>
          <td>{{ $r->model?->name ?? '—' }}</td>
          <td class="font-semibold">{{ $r->repairType?->name ?? '—' }}</td>
          <td>{{ $r->mode === 'fixed' ? 'Fijo' : 'Margen' }}</td>
          <td>{{ $r->multiplier !== null ? (float)$r->multiplier : '—' }}</td>
          <td>{{ $r->min_profit !== null ? (int)$r->min_profit : '—' }}</td>
          <td>{{ $r->fixed_total !== null ? (int)$r->fixed_total : '—' }}</td>
          <td>{{ (int)$r->shipping_default }}</td>
          <td>{{ (int)$r->priority }}</td>
          <td class="text-right">
            <a class="btn btn-ghost" href="{{ route('admin.pricing.edit', $r) }}">Editar</a>
          </td>
        </tr>
      @endforeach
    </tbody>
  </table>
</div>
@endsection

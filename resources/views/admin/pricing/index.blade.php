@extends('layouts.app')
@section('title', 'Admin — Precios')

@section('content')
<div class="space-y-4">
  <div class="page-head">
    <div>
      <div class="page-title">Reglas de precios (auto)</div>
      <div class="page-subtitle">Configurá porcentaje, mínimos y precios fijos por tipo/marca/grupo/modelo.</div>
    </div>
    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.deviceTypes.index') }}">Dispositivos</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.deviceCatalog.index') }}">Catálogo</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.modelGroups.index') }}">Grupos</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.repairTypes.index') }}">Tipos</a>
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.create') }}">+ Nueva regla</a>
    </div>
  </div>

  <div class="grid gap-3 md:hidden">
    @forelse($rules as $r)
      <div class="card">
        <div class="card-body space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="font-black text-zinc-900">{{ $r->repairType?->name ?? '—' }}</div>
            @if($r->active)
              <span class="badge-emerald">Activa</span>
            @else
              <span class="badge-zinc">Inactiva</span>
            @endif
          </div>

          <div class="text-sm text-zinc-600">
            {{ $r->deviceType?->name ?? '—' }}
            <span class="text-zinc-400">·</span>
            {{ $r->brand?->name ?? 'Marca —' }}
            <span class="text-zinc-400">·</span>
            {{ $r->model?->name ?? ($r->modelGroup?->name ?? 'Sin modelo/grupo') }}
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div class="font-black text-zinc-500 uppercase">Modo</div>
              <div class="mt-0.5 font-semibold text-zinc-900">{{ $r->mode === 'fixed' ? 'Fijo' : 'Margen' }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div class="font-black text-zinc-500 uppercase">%</div>
              <div class="mt-0.5 font-semibold text-zinc-900">{{ $r->multiplier !== null ? (float)$r->multiplier : '—' }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div class="font-black text-zinc-500 uppercase">Mín</div>
              <div class="mt-0.5 font-semibold text-zinc-900">{{ $r->min_profit !== null ? (int)$r->min_profit : '—' }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div class="font-black text-zinc-500 uppercase">Fijo</div>
              <div class="mt-0.5 font-semibold text-zinc-900">{{ $r->fixed_total !== null ? (int)$r->fixed_total : '—' }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div class="font-black text-zinc-500 uppercase">Envío</div>
              <div class="mt-0.5 font-semibold text-zinc-900">{{ (int)$r->shipping_default }}</div>
            </div>
            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div class="font-black text-zinc-500 uppercase">Prioridad</div>
              <div class="mt-0.5 font-semibold text-zinc-900">{{ (int)$r->priority }}</div>
            </div>
          </div>

          <a class="btn-outline btn-sm h-10 w-full justify-center" href="{{ route('admin.pricing.edit', $r) }}">Editar</a>
        </div>
      </div>
    @empty
      <div class="card">
        <div class="card-body text-sm text-zinc-600">No hay reglas cargadas todavía.</div>
      </div>
    @endforelse
  </div>

  <div class="card hidden md:block">
    <div class="table-wrap">
      <table class="table min-w-[1100px]">
        <thead>
          <tr>
            <th>Activo</th>
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
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @foreach($rules as $r)
            <tr>
              <td>{{ $r->active ? '✅' : '—' }}</td>
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
                <a class="btn-outline btn-sm" href="{{ route('admin.pricing.edit', $r) }}">Editar</a>
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

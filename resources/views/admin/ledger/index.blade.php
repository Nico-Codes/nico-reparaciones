@extends('layouts.app')

@section('title', 'Admin - Contabilidad')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $directionBadge = fn($d) => $d === 'inflow' ? 'badge-emerald' : 'badge-rose';
@endphp

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Contabilidad</div>
        <div class="page-subtitle">Libro unificado de ingresos y egresos.</div>
      </div>
      <a href="{{ route('admin.dashboard') }}" class="btn-outline h-11 w-full sm:w-auto justify-center">Panel</a>
    </div>
  </div>

  <div class="reveal-item grid gap-3 sm:grid-cols-3">
    <div class="card"><div class="card-body"><div class="text-xs font-black uppercase text-zinc-500">Ingresos</div><div class="text-3xl font-black mt-1 text-emerald-700">{{ $money($inflowTotal) }}</div></div></div>
    <div class="card"><div class="card-body"><div class="text-xs font-black uppercase text-zinc-500">Egresos</div><div class="text-3xl font-black mt-1 text-rose-700">{{ $money($outflowTotal) }}</div></div></div>
    <div class="card"><div class="card-body"><div class="text-xs font-black uppercase text-zinc-500">Neto</div><div class="text-3xl font-black mt-1 {{ $netTotal >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">{{ $money($netTotal) }}</div><div class="text-xs text-zinc-500 mt-1">Asientos: {{ (int)$entriesCount }}</div></div></div>
  </div>

  <div class="reveal-item card">
    <div class="card-head">
      <div>
        <div class="font-black">Resultado por categoría</div>
        <div class="text-xs text-zinc-500">Comparativo de ingresos y egresos por tipo de movimiento.</div>
      </div>
    </div>
    <div class="card-body">
      @if(($categorySummary ?? collect())->isEmpty())
        <div class="text-sm text-zinc-600">No hay datos para el rango seleccionado.</div>
      @else
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          @foreach($categorySummary as $row)
            <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
              <div class="font-semibold text-zinc-900">{{ $row['category'] }}</div>
              <div class="mt-1 text-xs text-zinc-500">Asientos: {{ (int)$row['entries_count'] }}</div>
              <div class="mt-2 text-xs text-zinc-600">Ingreso: <span class="font-black text-emerald-700">{{ $money((int)$row['inflow_total']) }}</span></div>
              <div class="mt-1 text-xs text-zinc-600">Egreso: <span class="font-black text-rose-700">{{ $money((int)$row['outflow_total']) }}</span></div>
              <div class="mt-2 text-sm font-black {{ (int)$row['net_total'] >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">Neto: {{ $money((int)$row['net_total']) }}</div>
            </div>
          @endforeach
        </div>
      @endif
    </div>
  </div>

  <div class="reveal-item card">
    <div class="card-body">
      <form method="GET" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" value="{{ $q }}" placeholder="Buscar descripcion, evento o tipo..." class="h-11 lg:col-span-2">

        <select name="direction" class="h-11">
          <option value="">Direccion: Todas</option>
          @foreach($directions as $key => $label)
            <option value="{{ $key }}" @selected($direction === $key)>{{ $label }}</option>
          @endforeach
        </select>

        <select name="category" class="h-11">
          <option value="">Categoria: Todas</option>
          @foreach($categories as $cat)
            <option value="{{ $cat }}" @selected($category === $cat)>{{ $cat }}</option>
          @endforeach
        </select>

        <input type="date" name="from" value="{{ $from }}" class="h-11">
        <input type="date" name="to" value="{{ $to }}" class="h-11">

        <div class="flex gap-2 lg:col-span-6">
          <button class="btn-outline h-11 justify-center w-full sm:w-auto" type="submit">Filtrar</button>
          <a href="{{ route('admin.ledger.index') }}" class="btn-ghost h-11 justify-center w-full sm:w-auto">Limpiar</a>
        </div>
      </form>
    </div>
  </div>

  <div class="reveal-item card">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Direccion</th>
            <th>Categoria</th>
            <th>Descripcion</th>
            <th>Evento</th>
            <th class="text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          @forelse($entries as $entry)
            <tr>
              <td class="text-sm">{{ optional($entry->happened_at)->format('d/m/Y H:i') ?: '-' }}</td>
              <td><span class="{{ $directionBadge($entry->direction) }}">{{ $directions[$entry->direction] ?? $entry->direction }}</span></td>
              <td class="text-sm font-semibold text-zinc-700">{{ $entry->category }}</td>
              <td>
                <div class="font-semibold text-zinc-900">{{ $entry->description ?: '-' }}</div>
                @if($entry->source_type || $entry->source_id)
                  <div class="text-xs text-zinc-500 mt-1">{{ $entry->source_type ?: '-' }} #{{ (int)($entry->source_id ?? 0) }}</div>
                @endif
              </td>
              <td class="text-xs text-zinc-500">{{ $entry->event_key ?: '-' }}</td>
              <td class="text-right font-black {{ $entry->direction === 'inflow' ? 'text-emerald-700' : 'text-rose-700' }}">{{ $money((int)$entry->amount) }}</td>
            </tr>
          @empty
            <tr><td colspan="6" class="text-center py-8 text-zinc-500">No hay asientos para los filtros seleccionados.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div>{{ $entries->links() }}</div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin - Garantias y perdidas')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $statusBadge = fn($status) => $status === 'closed' ? 'badge-zinc' : 'badge-amber';
  $costOriginBadge = function ($origin) {
    return match ((string) $origin) {
      'repair' => 'badge-sky',
      'product' => 'badge-emerald',
      default => 'badge-zinc',
    };
  };
@endphp

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Garantias y perdidas</div>
        <div class="page-subtitle">Registro de costos por garantias en reparaciones y productos.</div>
      </div>

      <div class="flex gap-2 w-full sm:w-auto">
        <a href="{{ route('admin.dashboard') }}" class="btn-outline h-11 w-full sm:w-auto justify-center">Panel</a>
        <a href="{{ route('admin.warranty_incidents.create') }}" class="btn-primary h-11 w-full sm:w-auto justify-center">+ Nuevo incidente</a>
      </div>
    </div>
  </div>

  @if(session('success'))
    <div class="reveal-item alert-success">{{ session('success') }}</div>
  @endif

  <div class="reveal-item grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div class="card"><div class="card-body"><div class="text-xs text-zinc-500 uppercase font-black">Total incidentes</div><div class="text-3xl font-black mt-1">{{ (int)($summary['total_count'] ?? 0) }}</div></div></div>
    <div class="card"><div class="card-body"><div class="text-xs text-zinc-500 uppercase font-black">Abiertos</div><div class="text-3xl font-black mt-1 text-amber-700">{{ (int)($summary['open_count'] ?? 0) }}</div></div></div>
    <div class="card"><div class="card-body"><div class="text-xs text-zinc-500 uppercase font-black">Cerrados</div><div class="text-3xl font-black mt-1 text-zinc-700">{{ (int)($summary['closed_count'] ?? 0) }}</div></div></div>
    <div class="card"><div class="card-body"><div class="text-xs text-zinc-500 uppercase font-black">Perdida acumulada</div><div class="text-3xl font-black mt-1 text-rose-700">{{ $money((int)($summary['total_loss'] ?? 0)) }}</div></div></div>
  </div>

  <div class="reveal-item card">
    <div class="card-head">
      <div>
        <div class="font-black">Proveedores con mas perdida</div>
        <div class="text-xs text-zinc-500">Top por monto acumulado en incidentes de garantia.</div>
      </div>
    </div>
    <div class="card-body">
      @if(($supplierStats ?? collect())->isEmpty())
        <div class="text-sm text-zinc-600">Aun no hay incidentes asociados a proveedores.</div>
      @else
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          @foreach($supplierStats as $row)
            <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
              <div class="font-semibold text-zinc-900 truncate">{{ $row->supplier?->name ?? 'Proveedor eliminado' }}</div>
              <div class="mt-1 text-xs text-zinc-600">Incidentes: <span class="font-black">{{ (int)$row->incidents_count }}</span></div>
              <div class="mt-1 text-sm font-black text-rose-700">{{ $money((int)$row->total_loss) }}</div>
            </div>
          @endforeach
        </div>
      @endif
    </div>
  </div>

  <div class="reveal-item card">
    <div class="card-body">
      <form method="GET" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" value="{{ $q }}" placeholder="Buscar titulo, motivo o nota..." class="h-11 lg:col-span-2">

        <select name="source_type" class="h-11">
          <option value="">Origen: Todos</option>
          @foreach($sourceTypes as $key => $label)
            <option value="{{ $key }}" @selected($sourceType === $key)>{{ $label }}</option>
          @endforeach
        </select>

        <select name="status" class="h-11">
          <option value="">Estado: Todos</option>
          @foreach($statuses as $key => $label)
            <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
          @endforeach
        </select>

        <input type="date" name="from" value="{{ $from }}" class="h-11" />
        <input type="date" name="to" value="{{ $to }}" class="h-11" />

        <div class="flex gap-2 lg:col-span-6">
          <button class="btn-outline h-11 justify-center w-full sm:w-auto" type="submit">Filtrar</button>
          <a href="{{ route('admin.warranty_incidents.index') }}" class="btn-ghost h-11 justify-center w-full sm:w-auto">Limpiar</a>
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
            <th>Origen</th>
            <th>Detalle</th>
            <th>Proveedor</th>
            <th>Origen costo</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Recuperado</th>
            <th class="text-right">Perdida</th>
            <th>Estado</th>
            <th class="text-right">Accion</th>
          </tr>
        </thead>
        <tbody>
          @forelse($incidents as $incident)
            <tr>
              <td class="text-sm">{{ optional($incident->happened_at)->format('d/m/Y H:i') ?: '-' }}</td>
              <td><span class="badge-zinc">{{ $sourceTypes[$incident->source_type] ?? $incident->source_type }}</span></td>
              <td>
                <div class="font-semibold text-zinc-900">{{ $incident->title }}</div>
                @if($incident->source_type === 'repair' && $incident->repair)
                  <div class="text-xs text-zinc-500">Reparacion: {{ $incident->repair->code ?: ('#'.$incident->repair->id) }} - {{ $incident->repair->customer_name }}</div>
                @endif
                @if($incident->source_type === 'product' && $incident->product)
                  <div class="text-xs text-zinc-500">Producto: {{ $incident->product->name }} ({{ $incident->product->sku ?: 'sin SKU' }})</div>
                @endif
                @if($incident->reason)
                  <div class="text-xs text-zinc-500 mt-1">{{ $incident->reason }}</div>
                @endif
              </td>
              <td><span class="text-sm {{ $incident->supplier?->name ? 'text-zinc-800 font-semibold' : 'text-zinc-400' }}">{{ $incident->supplier?->name ?? '-' }}</span></td>
              <td>
                @php $costOrigin = (string)($incident->cost_origin ?? 'manual'); @endphp
                <span class="{{ $costOriginBadge($costOrigin) }}">{{ \App\Models\WarrantyIncident::COST_ORIGINS[$costOrigin] ?? 'Manual' }}</span>
              </td>
              <td class="text-right font-semibold">{{ $money(($incident->quantity * $incident->unit_cost) + $incident->extra_cost) }}</td>
              <td class="text-right font-semibold text-emerald-700">{{ $money($incident->recovered_amount) }}</td>
              <td class="text-right font-black {{ $incident->loss_amount > 0 ? 'text-rose-700' : 'text-zinc-700' }}">{{ $money($incident->loss_amount) }}</td>
              <td><span class="{{ $statusBadge($incident->status) }}">{{ $statuses[$incident->status] ?? $incident->status }}</span></td>
              <td class="text-right">
                @if($incident->status === 'open')
                  <form method="POST" action="{{ route('admin.warranty_incidents.close', $incident) }}" data-disable-on-submit>
                    @csrf
                    <button class="btn-outline btn-sm" type="submit">Cerrar</button>
                  </form>
                @else
                  <span class="text-xs text-zinc-500">-</span>
                @endif
              </td>
            </tr>
          @empty
            <tr><td colspan="10" class="text-center py-8 text-zinc-500">No hay incidentes registrados.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div>{{ $incidents->links() }}</div>
</div>
@endsection

@extends('layouts.app')
@section('title', 'Admin - Dashboard')

@section('content')
  <div class="space-y-4">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h1 class="page-title">Panel Admin</h1>
        <p class="text-sm text-zinc-600 mt-1">Resumen rápido del negocio.</p>
      </div>
      <a class="btn-secondary" href="{{ route('store.index') }}">Ver tienda</a>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div class="card"><div class="card-body">
        <div class="text-sm text-zinc-600">Pedidos (total)</div>
        <div class="text-3xl font-extrabold mt-1">{{ $stats['orders_total'] ?? 0 }}</div>
        <div class="text-sm text-zinc-600 mt-2">Pendientes: <span class="font-bold">{{ $stats['orders_pending'] ?? 0 }}</span></div>
      </div></div>

      <div class="card"><div class="card-body">
        <div class="text-sm text-zinc-600">Reparaciones (total)</div>
        <div class="text-3xl font-extrabold mt-1">{{ $stats['repairs_total'] ?? 0 }}</div>
        <div class="text-sm text-zinc-600 mt-2">Por estado: abajo</div>
      </div></div>

      <div class="card"><div class="card-body">
        <div class="text-sm text-zinc-600">Productos (total)</div>
        <div class="text-3xl font-extrabold mt-1">{{ $stats['products_total'] ?? 0 }}</div>
        <div class="text-sm text-zinc-600 mt-2">Gestión desde “Productos”.</div>
      </div></div>
    </div>

    <div class="grid gap-3 lg:grid-cols-2">
      <div class="card">
        <div class="card-header"><div class="font-extrabold">Pedidos por estado</div></div>
        <div class="card-body">
          @if(empty($orderCounts))
            <div class="text-sm text-zinc-600">No hay datos todavía.</div>
          @else
            <div class="space-y-2">
              @foreach($orderCounts as $st => $cnt)
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold text-zinc-800">{{ $st }}</div>
                  <div class="badge-zinc">{{ $cnt }}</div>
                </div>
              @endforeach
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="font-extrabold">Reparaciones por estado</div></div>
        <div class="card-body">
          @if(empty($repairCounts))
            <div class="text-sm text-zinc-600">No hay datos todavía.</div>
          @else
            <div class="space-y-2">
              @foreach($repairCounts as $st => $cnt)
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold text-zinc-800">{{ $st }}</div>
                  <div class="badge-zinc">{{ $cnt }}</div>
                </div>
              @endforeach
            </div>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection

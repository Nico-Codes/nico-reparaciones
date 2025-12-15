@extends('layouts.app')
@section('title', 'Admin — Dashboard')

@section('content')
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <div class="page-head mb-0">
        <h1 class="page-title">Panel Admin</h1>
        <p class="page-subtitle">Resumen rápido del negocio y accesos principales.</p>
      </div>

      <div class="flex gap-2 flex-wrap">
        <a class="btn-outline" href="{{ route('store.index') }}">Ver tienda</a>
        <a class="btn-outline" href="{{ route('admin.settings.index') }}">Configuración</a>
        <a class="btn-primary" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div class="card">
        <div class="card-body">
          <div class="text-sm text-zinc-600">Pedidos (total)</div>
          <div class="text-3xl font-extrabold mt-1">{{ $stats['orders_total'] ?? 0 }}</div>
          <div class="text-sm text-zinc-600 mt-2">
            Pendientes: <span class="font-black text-zinc-900">{{ $stats['orders_pending'] ?? 0 }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="text-sm text-zinc-600">Reparaciones (total)</div>
          <div class="text-3xl font-extrabold mt-1">{{ $stats['repairs_total'] ?? 0 }}</div>
          <div class="text-sm text-zinc-600 mt-2">Seguimiento por estado abajo.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="text-sm text-zinc-600">Productos (total)</div>
          <div class="text-3xl font-extrabold mt-1">{{ $stats['products_total'] ?? 0 }}</div>
          <div class="text-sm text-zinc-600 mt-2">Gestión desde “Productos”.</div>
        </div>
      </div>
    </div>

    <div class="grid gap-3 lg:grid-cols-2">
      <div class="card">
        <div class="card-head">
          <div class="font-extrabold">Pedidos por estado</div>
          <a class="btn-outline btn-sm" href="{{ route('admin.orders.index') }}">Ver pedidos</a>
        </div>
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
        <div class="card-head">
          <div class="font-extrabold">Reparaciones por estado</div>
          <a class="btn-outline btn-sm" href="{{ route('admin.repairs.index') }}">Ver reparaciones</a>
        </div>
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

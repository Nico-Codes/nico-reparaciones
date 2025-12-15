@extends('layouts.app')

@section('title', 'Estado de reparación — NicoReparaciones')

@section('content')
@php
  $badgeClass = function($status) {
    return match($status) {
      'received' => 'badge badge-slate',
      'diagnosing' => 'badge badge-amber',
      'waiting_approval' => 'badge badge-purple',
      'repairing' => 'badge badge-sky',
      'ready_pickup' => 'badge badge-emerald',
      'delivered' => 'badge bg-zinc-900 text-white ring-zinc-900/10',
      'cancelled' => 'badge badge-rose',
      default => 'badge badge-zinc',
    };
  };
@endphp

<div class="container-page py-6">
  <h1 class="page-title">Estado de reparación</h1>
  <p class="page-subtitle">Resultado de tu búsqueda por código + teléfono.</p>

  @if (!$repair)
    <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div class="text-sm font-semibold text-rose-900">No se encontró ninguna reparación con esos datos.</div>
      <div class="mt-1 text-sm text-rose-800/90">
        Verificá que el <b>código</b> y el <b>teléfono</b> estén exactamente como fueron registrados.
      </div>

      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <a href="{{ route('repairs.lookup') }}" class="btn-primary">Volver a intentar</a>
        <a href="{{ route('store.index') }}" class="btn-outline">Ir a la tienda</a>
      </div>
    </div>
  @else
    <div class="mt-6 card">
      <div class="card-header">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-zinc-900">Reparación</div>
          <div class="font-mono text-sm font-extrabold text-zinc-900">#{{ $repair->code }}</div>
        </div>
      </div>

      <div class="card-body space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm text-zinc-600">Cliente</div>
          <div class="text-sm font-semibold text-zinc-900">{{ $repair->customer_name }}</div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="text-sm text-zinc-600">Equipo</div>
          <div class="text-sm font-semibold text-zinc-900">
            {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="text-sm text-zinc-600">Estado</div>
          <span class="{{ $badgeClass($repair->status) }}">
            {{ $statuses[$repair->status] ?? $repair->status }}
          </span>
        </div>

        <div class="h-px bg-zinc-100"></div>

        <div class="text-xs text-zinc-500">
          Última actualización: {{ $repair->updated_at?->format('d/m/Y H:i') ?? '—' }}
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <a href="{{ route('repairs.lookup') }}" class="btn-outline flex-1">Volver</a>

          @auth
            @if((int)$repair->user_id === (int)auth()->id())
              <a href="{{ route('repairs.my.show', $repair) }}" class="btn-primary flex-1">Ver en “Mis reparaciones”</a>
            @endif
          @endauth
        </div>
      </div>
    </div>
  @endif
</div>
@endsection

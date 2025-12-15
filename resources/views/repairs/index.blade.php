@extends('layouts.app')

@section('title', 'Mis reparaciones — NicoReparaciones')

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
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="page-title">Mis reparaciones</h1>
      <p class="page-subtitle">Seguimiento de tus equipos: estado, diagnóstico y fechas.</p>
    </div>

    <a href="{{ route('repairs.lookup') }}" class="btn-outline">
      Consultar con código
    </a>
  </div>

  @if($repairs->count() === 0)
    <div class="mt-6 card">
      <div class="card-body">
        <div class="text-sm text-zinc-700 font-semibold">Todavía no tenés reparaciones vinculadas a tu cuenta.</div>
        <div class="mt-2 text-sm text-zinc-500">
          Si te dieron un <b>código</b> y querés consultar sin cuenta, usá la búsqueda por teléfono.
        </div>
        <div class="mt-4 flex flex-col sm:flex-row gap-3">
          <a href="{{ route('repairs.lookup') }}" class="btn-primary">Consultar reparación</a>
          <a href="{{ route('store.index') }}" class="btn-outline">Ir a la tienda</a>
        </div>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      @foreach($repairs as $r)
        <div class="card overflow-hidden">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="font-mono text-sm font-extrabold text-zinc-900">#{{ $r->code }}</div>
                  <span class="{{ $badgeClass($r->status) }}">
                    {{ $statuses[$r->status] ?? $r->status }}
                  </span>
                </div>

                <div class="mt-2 text-sm text-zinc-700 font-semibold">
                  {{ trim(($r->device_brand ?? '').' '.($r->device_model ?? '')) ?: 'Equipo sin especificar' }}
                </div>

                <div class="mt-1 text-xs text-zinc-500">
                  Actualizado: {{ $r->updated_at?->format('d/m/Y H:i') ?? '—' }}
                </div>
              </div>

              <a href="{{ route('repairs.my.show', $r) }}" class="btn-primary px-3 py-2.5">
                Ver
              </a>
            </div>

            <div class="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <div class="text-xs text-zinc-500">Falla reportada</div>
              <div class="mt-1 line-clamp-2">{{ $r->issue_reported }}</div>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    <div class="mt-6">
      {{ $repairs->links() }}
    </div>
  @endif
</div>
@endsection

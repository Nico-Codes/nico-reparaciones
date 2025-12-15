@extends('layouts.app')

@section('title', 'Reparación #' . $repair->code . ' — NicoReparaciones')

@section('content')
@php
  $badgeClass = match($repair->status) {
    'received' => 'badge badge-slate',
    'diagnosing' => 'badge badge-amber',
    'waiting_approval' => 'badge badge-purple',
    'repairing' => 'badge badge-sky',
    'ready_pickup' => 'badge badge-emerald',
    'delivered' => 'badge bg-zinc-900 text-white ring-zinc-900/10',
    'cancelled' => 'badge badge-rose',
    default => 'badge badge-zinc',
  };
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="page-title">Reparación <span class="font-mono">#{{ $repair->code }}</span></h1>
        <span class="{{ $badgeClass }}">{{ $statuses[$repair->status] ?? $repair->status }}</span>
      </div>
      <p class="page-subtitle">
        {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: 'Equipo sin especificar' }}
      </p>
    </div>

    <a href="{{ route('repairs.my.index') }}" class="btn-outline">Volver</a>
  </div>

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    {{-- Principal --}}
    <div class="lg:col-span-2 space-y-6">

      <section class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Detalle del problema</div>
          <div class="text-xs text-zinc-500">Lo que se reportó y el diagnóstico actual (si existe).</div>
        </div>
        <div class="card-body space-y-4">
          <div>
            <div class="text-xs text-zinc-500">Falla reportada</div>
            <div class="mt-1 text-sm text-zinc-800 whitespace-pre-line">{{ $repair->issue_reported }}</div>
          </div>

          <div class="h-px bg-zinc-100"></div>

          <div>
            <div class="text-xs text-zinc-500">Diagnóstico</div>
            <div class="mt-1 text-sm text-zinc-800 whitespace-pre-line">
              {{ $repair->diagnosis ?: 'Aún no disponible. Estamos trabajando en el diagnóstico.' }}
            </div>
          </div>
        </div>
      </section>

      @if(!empty($repair->notes))
        <section class="card">
          <div class="card-header">
            <div class="text-sm font-semibold text-zinc-900">Notas</div>
            <div class="text-xs text-zinc-500">Información adicional cargada por el taller.</div>
          </div>
          <div class="card-body">
            <div class="text-sm text-zinc-800 whitespace-pre-line">{{ $repair->notes }}</div>
          </div>
        </section>
      @endif

    </div>

    {{-- Sidebar --}}
    <div class="space-y-6">
      <section class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Seguimiento</div>
          <div class="text-xs text-zinc-500">Fechas y garantía (si aplica).</div>
        </div>
        <div class="card-body space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Recibido</span>
            <span class="font-semibold text-zinc-900">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Entregado</span>
            <span class="font-semibold text-zinc-900">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
          </div>

          @if(($repair->warranty_days ?? 0) > 0)
            <div class="h-px bg-zinc-100"></div>

            <div class="flex items-center justify-between">
              <span class="text-zinc-600">Garantía</span>
              <span class="font-semibold text-zinc-900">{{ (int)$repair->warranty_days }} días</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-zinc-600">Vence</span>
              <span class="font-semibold text-zinc-900">{{ $repair->warranty_expires_at?->format('d/m/Y') ?? '—' }}</span>
            </div>

            @if($repair->in_warranty)
              <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                <div class="font-semibold">✅ En garantía</div>
                <div class="text-xs text-emerald-800/90 mt-1">Traelo al local si aparece cualquier falla relacionada.</div>
              </div>
            @endif
          @endif
        </div>
      </section>

      <section class="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <div class="text-sm font-semibold text-sky-900">¿No ves tu reparación?</div>
        <div class="mt-1 text-sm text-sky-800/90">
          Podés buscar con <b>código</b> + <b>teléfono</b> aunque no esté vinculada a tu cuenta.
        </div>
        <a href="{{ route('repairs.lookup') }}" class="btn-primary w-full mt-3">Consultar con código</a>
      </section>
    </div>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Resultado reparación - NicoReparaciones')

@section('content')
  @php
    $repair = $repair ?? null;

    $status = $repair ? (string)$repair->status : '';
    $badge = match ($status) {
      'received' => 'badge-blue',
      'diagnosing' => 'badge-amber',
      'waiting_approval' => 'badge-amber',
      'repairing' => 'badge-blue',
      'ready_pickup' => 'badge-green',
      'delivered' => 'badge-green',
      'cancelled' => 'badge-red',
      default => 'badge-zinc'
    };

    $label = $repair?->status_label ?? ucfirst(str_replace('_',' ',$status));
  @endphp

  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Resultado</h1>
      <p class="muted mt-1">Estado actual de tu reparación.</p>
    </div>
    <a href="{{ route('repairs.lookup') }}" class="btn-outline">Nueva consulta</a>
  </div>

  @if(!$repair)
    <div class="mt-6 card">
      <div class="card-body">
        <div class="font-bold text-lg text-rose-700">No encontramos una reparación con esos datos</div>
        <div class="muted mt-1">Revisá el código y el teléfono tal como figuran en el comprobante.</div>

        <div class="mt-4">
          <a class="btn-primary" href="{{ route('repairs.lookup') }}">Volver a consultar</a>
        </div>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div class="card">
        <div class="card-header flex items-center justify-between gap-3">
          <div class="section-title">Reparación {{ $repair->code ?? ('#'.$repair->id) }}</div>
          <span class="{{ $badge }}">{{ $label }}</span>
        </div>

        <div class="card-body space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
              <div class="muted">Equipo</div>
              <div class="font-semibold">
                {{ $repair->device_brand ?? '—' }} {{ $repair->device_model ?? '' }}
              </div>
            </div>
            <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
              <div class="muted">Ingreso</div>
              <div class="font-semibold">
                {{ optional($repair->received_at ?? $repair->created_at)->format('d/m/Y') }}
              </div>
            </div>
          </div>

          <div>
            <div class="section-title">Problema reportado</div>
            <p class="mt-2 text-sm text-zinc-700 leading-relaxed">
              {{ $repair->issue_reported ?? '—' }}
            </p>
          </div>

          @if(!empty($repair->diagnosis))
            <div>
              <div class="section-title">Diagnóstico</div>
              <p class="mt-2 text-sm text-zinc-700 leading-relaxed">
                {{ $repair->diagnosis }}
              </p>
            </div>
          @endif

          @if(!empty($repair->notes))
            <div>
              <div class="section-title">Notas</div>
              <p class="mt-2 text-sm text-zinc-700 leading-relaxed">
                {{ $repair->notes }}
              </p>
            </div>
          @endif
        </div>
      </div>

      <div class="card h-fit lg:sticky lg:top-20">
        <div class="card-header">
          <div class="section-title">Info rápida</div>
          <div class="muted">Pagos / entrega</div>
        </div>

        <div class="card-body space-y-3">
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-3">
            <div class="font-bold">¿Cuándo retiro?</div>
            <div class="muted mt-1">
              Si el estado está en <span class="font-semibold">“Listo para retirar”</span>, podés pasar por el local.
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="muted">Entrega</div>
            <div class="font-semibold">
              {{ $repair->delivered_at ? $repair->delivered_at->format('d/m/Y') : '—' }}
            </div>
          </div>

          @if(!empty($repair->final_price))
            <div class="flex items-center justify-between">
              <div class="muted">Precio</div>
              <div class="font-extrabold text-xl">${{ number_format((float)$repair->final_price, 0, ',', '.') }}</div>
            </div>
          @endif

          <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">Consultar otra</a>
        </div>
      </div>
    </div>
  @endif
@endsection

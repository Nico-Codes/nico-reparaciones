@extends('layouts.app')

@section('title', 'Reparación ' . ($repair->code ?? ('#'.$repair->id)) . ' - NicoReparaciones')

@section('content')
  @php
    $status = (string) $repair->status;
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
    $label = $repair->status_label ?? ucfirst(str_replace('_',' ',$status));

    $final = (float)($repair->final_price ?? 0);
    $paid  = (float)($repair->paid_amount ?? 0);
    $due   = max(0, $final - $paid);
  @endphp

  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Reparación {{ $repair->code ?? ('#'.$repair->id) }}</h1>
      <p class="muted mt-1">{{ $repair->device_brand ?? 'Equipo' }} {{ $repair->device_model ?? '' }}</p>
    </div>
    <a href="{{ route('repairs.my.index') }}" class="btn-outline">Volver</a>
  </div>

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
    {{-- Info principal --}}
    <div class="card">
      <div class="card-header flex items-center justify-between gap-3">
        <div class="section-title">Estado</div>
        <span class="{{ $badge }}">{{ $label }}</span>
      </div>

      <div class="card-body space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="muted">Ingreso</div>
            <div class="font-semibold">
              {{ optional($repair->received_at ?? $repair->created_at)->format('d/m/Y H:i') }}
            </div>
          </div>
          <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="muted">Entrega</div>
            <div class="font-semibold">
              {{ $repair->delivered_at ? $repair->delivered_at->format('d/m/Y H:i') : '—' }}
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

    {{-- Resumen económico (si hay precio) --}}
    <div class="card h-fit lg:sticky lg:top-20">
      <div class="card-header">
        <div class="section-title">Resumen</div>
        <div class="muted">Pagos y garantía</div>
      </div>

      <div class="card-body space-y-3">
        <div class="flex items-center justify-between">
          <div class="muted">Precio final</div>
          <div class="font-extrabold text-xl">
            ${{ number_format($final, 0, ',', '.') }}
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="muted">Pagado</div>
          <div class="font-semibold">
            ${{ number_format($paid, 0, ',', '.') }}
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="muted">Saldo</div>
          <div class="font-semibold {{ $due > 0 ? 'text-rose-700' : 'text-emerald-700' }}">
            ${{ number_format($due, 0, ',', '.') }}
          </div>
        </div>

        @if(!empty($repair->payment_method))
          <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="muted">Método</div>
            <div class="font-semibold">{{ ucfirst(str_replace('_',' ', $repair->payment_method)) }}</div>
          </div>
        @endif

        @if(!empty($repair->warranty_days) && $repair->delivered_at)
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-3">
            <div class="font-bold">Garantía</div>
            <div class="muted mt-1">
              {{ (int)$repair->warranty_days }} días · vence el
              <span class="font-semibold text-zinc-800">
                {{ $repair->delivered_at->copy()->addDays((int)$repair->warranty_days)->format('d/m/Y') }}
              </span>
            </div>
          </div>
        @endif

        <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">Consultar otra reparación</a>
      </div>
    </div>
  </div>
@endsection

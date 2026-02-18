@extends('layouts.app')

@section('title', 'Aprobacion de presupuesto')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $statusLabel = $statuses[(string)($repair->status ?? '')] ?? (string)($repair->status ?? '-');
@endphp

@section('content')
<div class="container-page store-shell">
  <div class="mx-auto max-w-2xl space-y-4">
    <div class="page-head store-hero reveal-item">
      <div>
        <h1 class="page-title">Presupuesto de reparacion</h1>
        <p class="page-subtitle">Codigo {{ $repair->code ?? '-' }}</p>
      </div>
      <span class="badge-zinc">{{ $statusLabel }}</span>
    </div>

    @if(session('success'))
      <div class="alert-success reveal-item">{{ session('success') }}</div>
    @endif

    <div class="card reveal-item">
      <div class="card-body space-y-3">
        <div class="grid gap-2 sm:grid-cols-2">
          <div>
            <div class="text-xs font-black uppercase text-zinc-500">Cliente</div>
            <div class="font-extrabold text-zinc-900">{{ $repair->customer_name ?? '-' }}</div>
          </div>
          <div>
            <div class="text-xs font-black uppercase text-zinc-500">Equipo</div>
            <div class="font-extrabold text-zinc-900">{{ trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? '')) ?: '-' }}</div>
          </div>
          <div>
            <div class="text-xs font-black uppercase text-zinc-500">Falla</div>
            <div class="font-semibold text-zinc-800">{{ $repair->issue_reported ?? '-' }}</div>
          </div>
          <div>
            <div class="text-xs font-black uppercase text-zinc-500">Presupuesto</div>
            <div class="text-lg font-black text-zinc-900">{{ $repair->final_price !== null ? $money($repair->final_price) : 'A confirmar' }}</div>
          </div>
        </div>

        @if(!empty($repair->diagnosis))
          <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <div class="text-xs font-black uppercase text-zinc-500">Diagnostico</div>
            <div class="mt-1 whitespace-pre-wrap text-sm font-semibold text-zinc-800">{{ $repair->diagnosis }}</div>
          </div>
        @endif
      </div>
    </div>

    @if($canDecide)
      <div class="card reveal-item">
        <div class="card-body space-y-3">
          <div class="font-black text-zinc-900">Como quieres continuar?</div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <form method="POST" action="{{ $approveUrl }}" data-disable-on-submit>
              @csrf
              <button type="submit" class="btn-primary h-11 w-full justify-center">
                Aprobar presupuesto
              </button>
            </form>

            <form method="POST" action="{{ $rejectUrl }}" data-disable-on-submit>
              @csrf
              <button type="submit" class="btn-outline h-11 w-full justify-center">
                Rechazar presupuesto
              </button>
            </form>
          </div>
          <p class="text-xs text-zinc-500">
            Si apruebas, el estado pasa a "En reparacion". Si rechazas, la reparacion se cancela.
          </p>
        </div>
      </div>
    @else
      <div class="card reveal-item">
        <div class="card-body">
          <div class="font-black text-zinc-900">Esta reparacion ya no esta esperando aprobacion.</div>
          <div class="mt-1 text-sm text-zinc-600">
            Estado actual: <span class="font-extrabold">{{ $statusLabel }}</span>
          </div>
        </div>
      </div>
    @endif
  </div>
</div>
@endsection

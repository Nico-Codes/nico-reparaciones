@extends('layouts.app')

@section('title', 'Resultado reparación')

@php
  $badge = function(string $s) {
    return match($s) {
      'received' => 'badge-sky',
      'diagnosing' => 'badge-indigo',
      'waiting_approval' => 'badge-amber',
      'repairing' => 'badge-indigo',
      'ready_pickup' => 'badge-emerald',
      'delivered' => 'badge-zinc',
      'cancelled' => 'badge-rose',
      default => 'badge-zinc',
    };
  };
@endphp

@section('content')
  <div class="max-w-2xl mx-auto">
    <div class="page-head">
      <div class="page-title">Resultado</div>
      <div class="page-subtitle">Estado actual de tu reparación.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-black text-lg">
              {{ $repair->device_brand }} {{ $repair->device_model }}
            </div>
            <div class="muted mt-1">
              Código: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
            </div>
          </div>

          <span class="{{ $badge($repair->status) }}">
            {{ \App\Models\Repair::STATUSES[$repair->status] ?? $repair->status }}
          </span>
        </div>

        <hr class="my-4">

        <div class="grid gap-3">
          <div>
            <div class="muted">Falla reportada</div>
            <div class="text-sm text-zinc-800">{{ $repair->issue_reported }}</div>
          </div>

          @if($repair->diagnosis)
            <div>
              <div class="muted">Diagnóstico</div>
              <div class="text-sm text-zinc-800">{{ $repair->diagnosis }}</div>
            </div>
          @endif
        </div>

        <div class="mt-5 flex flex-col sm:flex-row gap-2">
          <a href="{{ route('repairs.lookup.form') }}" class="btn-outline w-full sm:w-auto">Volver</a>
          <a href="{{ route('store.index') }}" class="btn-primary w-full sm:w-auto">Ir a la tienda</a>
        </div>
      </div>
    </div>
  </div>
@endsection

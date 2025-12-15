@extends('layouts.app')

@section('title', 'Reparación '.$repair->code)

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
  <div class="flex items-start justify-between gap-3 mb-5">
    <div>
      <div class="page-title">Reparación</div>
      <div class="page-subtitle">
        Código: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
      </div>
    </div>

    <span class="{{ $badge($repair->status) }}">
      {{ \App\Models\Repair::STATUSES[$repair->status] ?? $repair->status }}
    </span>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="lg:col-span-2 card">
      <div class="card-head">
        <div class="font-black">Detalle</div>
        <span class="badge-sky">{{ $repair->created_at?->format('d/m/Y') }}</span>
      </div>

      <div class="card-body grid gap-4">
        <div class="grid gap-2">
          <div class="muted">Equipo</div>
          <div class="font-black">{{ $repair->device_brand }} {{ $repair->device_model }}</div>
        </div>

        <div class="grid gap-2">
          <div class="muted">Falla reportada</div>
          <div class="text-sm text-zinc-800">{{ $repair->issue_reported }}</div>
        </div>

        @if($repair->diagnosis)
          <div class="grid gap-2">
            <div class="muted">Diagnóstico</div>
            <div class="text-sm text-zinc-800">{{ $repair->diagnosis }}</div>
          </div>
        @endif

        @if($repair->notes)
          <div class="grid gap-2">
            <div class="muted">Notas</div>
            <div class="text-sm text-zinc-800">{{ $repair->notes }}</div>
          </div>
        @endif
      </div>
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Ayuda</div>
        <span class="badge-sky">Consulta</span>
      </div>

      <div class="card-body grid gap-3">
        <div class="muted">
          Si no usás cuenta, también podés consultar con el código.
        </div>
        <a href="{{ route('repairs.lookup.form') }}" class="btn-primary w-full">Consultar por código</a>
        <a href="{{ route('repairs.index') }}" class="btn-outline w-full">Volver</a>
      </div>
    </div>
  </div>
@endsection

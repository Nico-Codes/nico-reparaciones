@extends('layouts.app')

@section('title', 'Mis reparaciones')

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
  <div class="page-head">
    <div class="page-title">Mis reparaciones</div>
    <div class="page-subtitle">Seguimiento del estado de tu equipo.</div>
  </div>

  <div class="grid gap-3">
    @forelse($repairs as $repair)
      <a href="{{ route('repairs.show', $repair) }}" class="card hover:shadow-md transition">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-black">
                {{ $repair->device_brand }} {{ $repair->device_model }}
              </div>
              <div class="muted mt-1">
                Código: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
                · {{ $repair->created_at?->format('d/m/Y') }}
              </div>
            </div>

            <span class="{{ $badge($repair->status) }}">
              {{ \App\Models\Repair::STATUSES[$repair->status] ?? $repair->status }}
            </span>
          </div>
        </div>
      </a>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">No tenés reparaciones asociadas.</div>
          <div class="muted mt-1">Si te pasamos un código, también podés consultarla sin cuenta.</div>
          <div class="mt-4">
            <a href="{{ route('repairs.lookup.form') }}" class="btn-primary">Consultar por código</a>
          </div>
        </div>
      </div>
    @endforelse
  </div>

  <div class="mt-6">
    {{ $repairs->links() }}
  </div>
@endsection

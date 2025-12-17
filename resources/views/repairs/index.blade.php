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

  $label = fn(string $s) => \App\Models\Repair::STATUSES[$s] ?? ucfirst(str_replace('_',' ',$s));

  $hint = fn(string $s) => match($s) {
    'received' => 'Recibido en el taller.',
    'diagnosing' => 'Estamos diagnosticando.',
    'waiting_approval' => 'Esperando tu aprobación.',
    'repairing' => 'Reparación en curso.',
    'ready_pickup' => '¡Listo para retirar!',
    'delivered' => 'Entregado.',
    'cancelled' => 'Cancelado.',
    default => 'Estado actualizado.',
  };

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Mis reparaciones</div>
    <div class="page-subtitle">Seguimiento del estado de tu equipo.</div>
  </div>

  <div class="flex flex-col sm:flex-row gap-2 mb-5">
    @if($has('repairs.lookup'))
      <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full sm:w-auto">Consultar por código</a>
    @endif
    @if($has('orders.index'))
      <a href="{{ route('orders.index') }}" class="btn-ghost w-full sm:w-auto">Mis pedidos</a>
    @endif
    @if($has('store.index'))
      <a href="{{ route('store.index') }}" class="btn-primary w-full sm:w-auto">Ir a la tienda</a>
    @endif
  </div>

  <div class="grid gap-3">
    @forelse($repairs as $repair)
      <a href="{{ route('repairs.my.show', $repair) }}" class="card group hover:shadow-md transition">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <div class="font-black text-zinc-900 truncate">
                  {{ $repair->device_brand }} {{ $repair->device_model }}
                </div>
                <span class="{{ $badge($repair->status) }}">
                  {{ $label($repair->status) }}
                </span>
              </div>

              <div class="mt-1 text-xs text-zinc-500">
                Código: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
                · {{ $repair->created_at?->format('d/m/Y') }}
              </div>

              <div class="mt-3 text-xs text-zinc-600">
                {{ $hint($repair->status) }}
              </div>
            </div>

            <div class="text-zinc-400 group-hover:text-zinc-600 transition shrink-0">→</div>
          </div>
        </div>
      </a>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">No tenés reparaciones asociadas.</div>
          <div class="muted mt-1">Si te pasamos un código, también podés consultarla sin cuenta.</div>
          <div class="mt-4">
            @if($has('repairs.lookup'))
              <a href="{{ route('repairs.lookup') }}" class="btn-primary">Consultar por código</a>
            @endif
          </div>
        </div>
      </div>
    @endforelse
  </div>

  {{-- Paginación SOLO si $repairs es paginator --}}
  @if(is_object($repairs) && method_exists($repairs, 'links'))
    <div class="mt-6">
      {{ $repairs->links() }}
    </div>
  @endif
@endsection

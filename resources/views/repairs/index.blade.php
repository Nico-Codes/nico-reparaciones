@extends('layouts.app')

@section('title', 'Mis reparaciones - NicoReparaciones')

@section('content')
  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Mis reparaciones</h1>
      <p class="muted mt-1">Seguimiento del estado de tus equipos.</p>
    </div>
    <a href="{{ route('repairs.lookup') }}" class="btn-outline">Consultar por código</a>
  </div>

  @if($repairs->isEmpty())
    <div class="mt-6 card">
      <div class="card-body">
        <div class="font-bold text-lg">Todavía no tenés reparaciones registradas</div>
        <div class="muted mt-1">
          Si dejaste un equipo en el local, podés consultarlo con el código desde “Consultar reparación”.
        </div>
        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <a class="btn-primary" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
          <a class="btn-outline" href="{{ route('store.index') }}">Ir a la tienda</a>
        </div>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      @foreach($repairs as $repair)
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

          $label = method_exists($repair, 'getStatusLabelAttribute')
            ? ($repair->status_label ?? ucfirst(str_replace('_',' ',$status)))
            : ucfirst(str_replace('_',' ',$status));
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-extrabold tracking-tight">
                  Reparación {{ $repair->code ?? ('#'.$repair->id) }}
                </div>
                <div class="muted mt-1">
                  {{ $repair->device_brand ?? 'Equipo' }} {{ $repair->device_model ?? '' }}
                </div>
              </div>
              <span class="{{ $badge }}">{{ $label }}</span>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
                <div class="muted">Ingreso</div>
                <div class="font-semibold">
                  {{ optional($repair->received_at ?? $repair->created_at)->format('d/m/Y') }}
                </div>
              </div>
              <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
                <div class="muted">Entrega</div>
                <div class="font-semibold">
                  {{ $repair->delivered_at ? $repair->delivered_at->format('d/m/Y') : '—' }}
                </div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-3">
              <div class="muted">
                Problema: <span class="font-semibold text-zinc-800">{{ Str::limit($repair->issue_reported ?? '—', 40) }}</span>
              </div>
              <a href="{{ route('repairs.show', $repair->id) }}" class="btn-primary">Ver</a>
            </div>
          </div>
        </div>
      @endforeach
    </div>
  @endif
@endsection

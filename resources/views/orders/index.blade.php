@extends('layouts.app')

@section('title', 'Mis pedidos — NicoReparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $statusLabel = fn($s) => match($s) {
    'pendiente' => 'Pendiente',
    'confirmado' => 'Confirmado',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado' => 'Entregado',
    'cancelado' => 'Cancelado',
    default => ucfirst(str_replace('_', ' ', (string)$s)),
  };

  $statusBadge = fn($s) => match($s) {
    'pendiente' => 'badge badge-amber',
    'confirmado' => 'badge badge-sky',
    'preparando' => 'badge badge-purple',
    'listo_retirar' => 'badge badge-emerald',
    'entregado' => 'badge bg-zinc-900 text-white ring-zinc-900/10',
    'cancelado' => 'badge badge-rose',
    default => 'badge badge-zinc',
  };
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="page-title">Mis pedidos</h1>
      <p class="page-subtitle">Historial y estado de tus compras.</p>
    </div>

    <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if($orders->isEmpty())
    <div class="mt-6 card">
      <div class="card-body">
        <div class="text-sm font-semibold text-zinc-900">Todavía no hiciste ningún pedido.</div>
        <div class="mt-1 text-sm text-zinc-500">Cuando compres, vas a ver acá el seguimiento del estado.</div>
        <a href="{{ route('store.index') }}" class="btn-primary mt-4">Ver productos</a>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      @foreach($orders as $order)
        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="text-sm font-extrabold text-zinc-900">Pedido #{{ $order->id }}</div>
                  <span class="{{ $statusBadge($order->status) }}">{{ $statusLabel($order->status) }}</span>
                </div>

                <div class="mt-2 text-xs text-zinc-500">
                  {{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs text-zinc-500">Total</div>
                <div class="text-base font-extrabold text-zinc-900">{{ $money($order->total) }}</div>
              </div>
            </div>

            <div class="mt-4 flex flex-col sm:flex-row gap-3">
              <a href="{{ route('orders.show', $order->id) }}" class="btn-primary flex-1">Ver detalle</a>
              <a href="{{ route('repairs.lookup') }}" class="btn-outline flex-1">Consultar reparación</a>
            </div>
          </div>
        </div>
      @endforeach
    </div>
  @endif
</div>
@endsection

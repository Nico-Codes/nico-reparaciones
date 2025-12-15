@extends('layouts.app')

@section('title', 'Mis pedidos - NicoReparaciones')

@section('content')
  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Mis pedidos</h1>
      <p class="muted mt-1">Historial y estado de tus compras.</p>
    </div>
    <a href="{{ route('store.index') }}" class="btn-outline">Ir a la tienda</a>
  </div>

  @if($orders->isEmpty())
    <div class="mt-6 card">
      <div class="card-body">
        <div class="font-bold text-lg">Todavía no hiciste ningún pedido</div>
        <div class="muted mt-1">Cuando compres algo, lo vas a ver reflejado acá.</div>
        <div class="mt-4">
          <a class="btn-primary" href="{{ route('store.index') }}">Explorar productos</a>
        </div>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      @foreach($orders as $order)
        @php
          $status = (string) $order->status;

          $badge = match ($status) {
            'pending' => 'badge-amber',
            'confirmed', 'preparing' => 'badge-blue',
            'ready', 'delivered' => 'badge-green',
            'cancelled', 'canceled' => 'badge-red',
            default => 'badge-zinc',
          };

          $statusLabel = ucfirst(str_replace('_', ' ', $status));
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-extrabold tracking-tight">Pedido #{{ $order->id }}</div>
                <div class="muted mt-1">{{ $order->created_at->format('d/m/Y H:i') }}</div>
              </div>

              <span class="{{ $badge }}">{{ $statusLabel }}</span>
            </div>

            <div class="mt-4 flex items-end justify-between gap-3">
              <div>
                <div class="muted">Total</div>
                <div class="text-2xl font-extrabold">${{ number_format($order->total, 0, ',', '.') }}</div>
              </div>

              <a href="{{ route('orders.show', $order->id) }}" class="btn-primary">Ver detalle</a>
            </div>
          </div>
        </div>
      @endforeach
    </div>
  @endif
@endsection

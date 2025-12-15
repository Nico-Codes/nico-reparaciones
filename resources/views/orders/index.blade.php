@extends('layouts.app')

@section('title', 'Mis pedidos')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $badge = function(string $s) {
    return match($s) {
      'pendiente' => 'badge-amber',
      'confirmado' => 'badge-sky',
      'preparando' => 'badge-indigo',
      'listo_retirar' => 'badge-emerald',
      'entregado' => 'badge-zinc',
      'cancelado' => 'badge-rose',
      default => 'badge-zinc',
    };
  };

  $label = fn(string $s) => ucfirst(str_replace('_',' ',$s));
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Mis pedidos</div>
    <div class="page-subtitle">Historial de compras en la tienda.</div>
  </div>

  <div class="grid gap-3">
    @forelse($orders as $order)
      <a href="{{ route('orders.show', $order) }}" class="card hover:shadow-md transition">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-black">Pedido #{{ $order->id }}</div>
              <div class="muted mt-1">
                {{ $order->created_at?->format('d/m/Y H:i') }}
                · Total: <span class="font-black text-zinc-900">{{ $fmt($order->total) }}</span>
              </div>
            </div>
            <span class="{{ $badge($order->status) }}">{{ $label($order->status) }}</span>
          </div>
        </div>
      </a>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">Todavía no tenés pedidos.</div>
          <div class="muted mt-1">Cuando compres, van a aparecer acá.</div>
          <div class="mt-4">
            <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
          </div>
        </div>
      </div>
    @endforelse
  </div>

  {{-- Paginación SOLO si $orders es paginator --}}
  @if(is_object($orders) && method_exists($orders, 'links'))
    <div class="mt-6">
      {{ $orders->links() }}
    </div>
  @endif
@endsection

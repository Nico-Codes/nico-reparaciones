@extends('layouts.app')

@section('title', 'Carrito — NicoReparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

<div class="container-page py-6">
  <h1 class="page-title">Carrito</h1>
  <p class="page-subtitle">Revisá productos y cantidades antes de finalizar.</p>

  @if (session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if(empty($cart))
    <div class="mt-6 card">
      <div class="card-body">
        <div class="text-sm text-zinc-600">Tu carrito está vacío.</div>
        <a class="btn-primary mt-4" href="{{ route('store.index') }}">Ir a la tienda</a>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {{-- Lista --}}
      <div class="lg:col-span-2 space-y-3">
        @foreach($cart as $item)
          <div class="card">
            <div class="card-body">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <a href="{{ route('store.product', $item['slug']) }}"
                     class="block text-sm font-semibold text-zinc-900 hover:text-sky-700">
                    {{ $item['name'] }}
                  </a>
                  <div class="mt-1 text-sm text-zinc-500">Unitario: {{ $money($item['price']) }}</div>
                </div>

                <form action="{{ route('cart.remove', $item['id']) }}" method="POST">
                  @csrf
                  <button type="submit" class="btn-outline px-3 py-2">Quitar</button>
                </form>
              </div>

              <div class="mt-4 flex items-end justify-between gap-3">
                <form action="{{ route('cart.update', $item['id']) }}" method="POST" class="flex items-end gap-2">
                  @csrf
                  <div class="w-24">
                    <label class="text-sm font-medium text-zinc-800">Cant.</label>
                    <input class="input" type="number" name="quantity" min="1" value="{{ $item['quantity'] }}">
                  </div>
                  <button type="submit" class="btn-primary px-3 py-2.5">Actualizar</button>
                </form>

                <div class="text-right">
                  <div class="text-xs text-zinc-500">Subtotal</div>
                  <div class="text-base font-extrabold text-zinc-900">
                    {{ $money($item['price'] * $item['quantity']) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        @endforeach
      </div>

      {{-- Resumen --}}
      <div class="space-y-3">
        <div class="card">
          <div class="card-header">
            <div class="text-sm font-semibold text-zinc-900">Resumen</div>
          </div>
          <div class="card-body space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-600">Total</span>
              <span class="text-lg font-extrabold text-zinc-900">{{ $money($total) }}</span>
            </div>

            <a href="{{ route('checkout') }}" class="btn-primary w-full">Finalizar pedido</a>

            <form action="{{ route('cart.clear') }}" method="POST">
              @csrf
              <button type="submit" class="btn-outline w-full">Vaciar carrito</button>
            </form>

            <a href="{{ route('store.index') }}" class="btn-ghost w-full">Seguir comprando</a>
          </div>
        </div>

        <div class="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <div class="font-semibold">Tip</div>
          <div class="mt-1 text-sky-800/90">Si necesitás instalación o reparación, usá “Mis reparaciones” para seguimiento.</div>
        </div>
      </div>
    </div>
  @endif
</div>
@endsection

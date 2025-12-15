@extends('layouts.app')

@section('title', 'Carrito')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Carrito</div>
    <div class="page-subtitle">Revisá tu compra antes de confirmar.</div>
  </div>

  @if(empty($cart))
    <div class="card">
      <div class="card-body">
        <div class="font-black">Tu carrito está vacío.</div>
        <div class="muted mt-1">Volvé a la tienda y agregá un producto.</div>
        <div class="mt-4">
          <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
        </div>
      </div>
    </div>
  @else
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 grid gap-3">
        @foreach($cart as $item)
          <div class="card">
            <div class="card-body">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-black leading-snug">
                    <a href="{{ route('store.product', $item['slug']) }}" class="text-zinc-900 hover:text-sky-700">
                      {{ $item['name'] }}
                    </a>
                  </div>
                  <div class="muted mt-1">
                    Precio: <span class="font-bold text-zinc-900">{{ $fmt($item['price']) }}</span>
                  </div>
                </div>

                <form method="POST" action="{{ route('cart.remove', $item['id']) }}">
                  @csrf
                  <button class="btn-ghost btn-sm text-rose-700 hover:bg-rose-50">Eliminar</button>
                </form>
              </div>

              <div class="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <form method="POST" action="{{ route('cart.update', $item['id']) }}" class="flex items-center gap-2">
                  @csrf
                  <input type="number" name="quantity" min="1" value="{{ $item['quantity'] }}" class="w-24">
                  <button class="btn-outline btn-sm">Actualizar</button>
                </form>

                <div class="font-black">
                  Subtotal: {{ $fmt($item['price'] * $item['quantity']) }}
                </div>
              </div>
            </div>
          </div>
        @endforeach

        <div class="flex flex-col sm:flex-row gap-2">
          <a href="{{ route('store.index') }}" class="btn-outline w-full sm:w-auto">Seguir comprando</a>

          <form method="POST" action="{{ route('cart.clear') }}" class="w-full sm:w-auto">
            @csrf
            <button class="btn-ghost w-full sm:w-auto text-rose-700 hover:bg-rose-50">Vaciar carrito</button>
          </form>
        </div>
      </div>

      <div class="card h-fit">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-sky">{{ count($cart) }} ítems</span>
        </div>
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-xl font-black">{{ $fmt($total) }}</div>
          </div>

          <a href="{{ route('checkout') }}" class="btn-primary w-full mt-4">
            Ir a checkout
          </a>

          <div class="muted mt-3">
            Tip: si no estás logueado, te pedirá iniciar sesión antes de confirmar.
          </div>
        </div>
      </div>
    </div>
  @endif
@endsection

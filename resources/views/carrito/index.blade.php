@extends('layouts.app')

@section('title', 'Carrito')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Carrito</div>
    <div class="page-subtitle">Revisá los productos antes de finalizar tu pedido.</div>
  </div>

  @if(empty($cart))
    <div class="card">
      <div class="card-body">
        <div class="font-black">Tu carrito está vacío.</div>
        <div class="muted mt-1">Agregá productos desde la tienda.</div>
        <div class="mt-4">
          <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
        </div>
      </div>
    </div>
  @else
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 grid gap-3">
        @foreach($cart as $item)
          @php $subtotal = (float)$item['price'] * (int)$item['quantity']; @endphp

          <div class="card">
            <div class="card-body">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <a href="{{ route('store.product', $item['slug']) }}"
                     class="font-black text-zinc-900 hover:text-[rgb(var(--brand-700))]">
                    {{ $item['name'] }}
                  </a>

                  <div class="muted mt-1">
                    Precio: <span class="font-black text-zinc-900">{{ $fmt($item['price']) }}</span>
                    · Subtotal: <span class="font-black text-zinc-900">{{ $fmt($subtotal) }}</span>
                  </div>
                </div>

                <form method="POST" action="{{ route('cart.remove', $item['id']) }}">
                  @csrf
                  <button class="btn-ghost btn-sm" type="submit">🗑️</button>
                </form>
              </div>

              <div class="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <form method="POST" action="{{ route('cart.update', $item['id']) }}" class="flex items-center gap-2">
                  @csrf
                  <label class="text-sm font-black text-zinc-700">Cant.</label>
                  <input type="number" name="quantity" min="1" value="{{ (int)$item['quantity'] }}" class="w-24">
                  <button class="btn-outline btn-sm" type="submit">Actualizar</button>
                </form>

                <div class="sm:ml-auto">
                  <a href="{{ route('store.index') }}" class="btn-ghost btn-sm">Seguir comprando</a>
                </div>
              </div>
            </div>
          </div>
        @endforeach
      </div>

      <div class="card h-fit">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-sky">{{ array_sum(array_map(fn($i)=>(int)$i['quantity'], $cart)) }} ítems</span>
        </div>

        <div class="card-body grid gap-3">
          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-xl font-black">{{ $fmt($total) }}</div>
          </div>

          <a href="{{ route('checkout') }}" class="btn-primary w-full">Finalizar compra</a>

          <form method="POST" action="{{ route('cart.clear') }}">
            @csrf
            <button class="btn-outline w-full" type="submit">Vaciar carrito</button>
          </form>

          <div class="muted text-xs">
            Retiro en el local. Al confirmar, te aparece el pedido en “Mis pedidos”.
          </div>
        </div>
      </div>
    </div>
  @endif
@endsection

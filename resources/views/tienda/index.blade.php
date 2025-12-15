@extends('layouts.app')

@section('title', 'Carrito - NicoReparaciones')

@section('content')
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="page-title">Carrito</h1>
      <p class="muted mt-1">Revisá tus productos antes de finalizar.</p>
    </div>
    <a href="{{ route('store.index') }}" class="btn-outline">Seguir comprando</a>
  </div>

  @if(empty($cart))
    <div class="mt-6 card">
      <div class="card-body">
        <div class="font-bold text-lg">Tu carrito está vacío</div>
        <div class="muted mt-1">Elegí algún producto y agregalo al carrito.</div>
        <div class="mt-4">
          <a class="btn-primary" href="{{ route('store.index') }}">Ir a la tienda</a>
        </div>
      </div>
    </div>
  @else
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {{-- Items --}}
      <div class="card">
        <div class="card-header flex items-center justify-between gap-3">
          <div class="section-title">Productos</div>

          <form action="{{ route('cart.clear') }}" method="POST">
            @csrf
            <button type="submit" class="btn-ghost text-rose-600 hover:bg-rose-50">Vaciar carrito</button>
          </form>
        </div>

        <div class="card-body">
          <div class="space-y-3">
            @foreach($cart as $item)
              @php
                $subtotal = ($item['price'] ?? 0) * ($item['quantity'] ?? 0);
              @endphp

              <div class="rounded-2xl ring-1 ring-zinc-200 p-3 sm:p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-bold leading-snug">
                      <a class="hover:underline" href="{{ route('store.product', $item['slug']) }}">
                        {{ $item['name'] }}
                      </a>
                    </div>
                    <div class="muted mt-1">
                      Precio: <span class="font-semibold text-zinc-800">${{ number_format($item['price'], 0, ',', '.') }}</span>
                      · Subtotal: <span class="font-semibold text-zinc-800">${{ number_format($subtotal, 0, ',', '.') }}</span>
                    </div>
                  </div>

                  <form action="{{ route('cart.remove', $item['id']) }}" method="POST">
                    @csrf
                    <button type="submit" class="btn-ghost px-2 py-1 text-zinc-700 hover:bg-zinc-100" aria-label="Eliminar">✕</button>
                  </form>
                </div>

                <div class="mt-3 flex flex-wrap items-end gap-3">
                  <form action="{{ route('cart.update', $item['id']) }}" method="POST" class="flex items-end gap-2">
                    @csrf
                    <div>
                      <label class="label" for="qty_{{ $item['id'] }}">Cantidad</label>
                      <input
                        id="qty_{{ $item['id'] }}"
                        type="number"
                        name="quantity"
                        min="1"
                        value="{{ $item['quantity'] }}"
                        class="input w-[120px]"
                      />
                    </div>

                    <button type="submit" class="btn-outline h-[42px]">Actualizar</button>
                  </form>
                </div>
              </div>
            @endforeach
          </div>
        </div>
      </div>

      {{-- Resumen --}}
      <div class="card h-fit lg:sticky lg:top-20">
        <div class="card-header">
          <div class="section-title">Resumen</div>
          <div class="muted">Total del carrito</div>
        </div>

        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-2xl font-extrabold">
              ${{ number_format($total, 0, ',', '.') }}
            </div>
          </div>

          <div class="mt-4 space-y-2">
            @auth
              <a href="{{ route('checkout') }}" class="btn-primary w-full">Finalizar compra</a>
            @else
              <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-3">
                <div class="font-bold">Ingresá para finalizar</div>
                <div class="muted mt-1">Tu carrito queda guardado en esta sesión.</div>
              </div>
              <a href="{{ route('login') }}" class="btn-primary w-full">Ingresar</a>
              <a href="{{ route('register') }}" class="btn-outline w-full">Crear cuenta</a>
            @endauth

            <a href="{{ route('store.index') }}" class="btn-outline w-full">Seguir comprando</a>
          </div>
        </div>
      </div>
    </div>
  @endif
@endsection

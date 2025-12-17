@extends('layouts.app')

@section('title', 'Carrito')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $cart  = $cart ?? [];
  $total = $total ?? 0;

  $itemsCount = 0;
  foreach ($cart as $i) { $itemsCount += (int)($i['quantity'] ?? 0); }
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
    @return
  @endif

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Items --}}
    <div class="lg:col-span-2 grid gap-3">
      @foreach($cart as $item)
        @php
          $qty = (int)($item['quantity'] ?? 1);
          if ($qty < 1) $qty = 1;

          $price = (float)($item['price'] ?? 0);
          $subtotal = $price * $qty;

          $slug = $item['slug'] ?? null;
          $productUrl = $slug ? route('store.product', $slug) : route('store.index');

          $decQty = max(1, $qty - 1);
          $incQty = $qty + 1;
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start gap-3">
              {{-- Thumb simple --}}
              <div class="h-14 w-14 shrink-0 rounded-2xl border border-zinc-100 bg-zinc-50 flex items-center justify-center">
                <span class="text-lg">🧩</span>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <a href="{{ $productUrl }}"
                       class="font-black text-zinc-900 hover:text-[rgb(var(--brand-700))] truncate block">
                      {{ $item['name'] ?? 'Producto' }}
                    </a>

                    <div class="text-xs text-zinc-500 mt-1">
                      Precio unitario: <span class="font-black text-zinc-900">{{ $fmt($price) }}</span>
                    </div>
                  </div>

                  <form method="POST" action="{{ route('cart.remove', $item['id']) }}">
                    @csrf
                    <button class="btn-ghost btn-sm px-3" type="submit" aria-label="Eliminar del carrito">🗑️</button>
                  </form>
                </div>

                {{-- Qty controls + subtotal --}}
                <div class="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div class="flex items-center gap-2">
                    {{-- - --}}
                    <form method="POST" action="{{ route('cart.update', $item['id']) }}">
                      @csrf
                      <input type="hidden" name="quantity" value="{{ $decQty }}">
                      <button class="btn-outline btn-sm px-3" type="submit" {{ $qty <= 1 ? 'disabled' : '' }} aria-label="Restar">
                        −
                      </button>
                    </form>

                    {{-- input + actualizar --}}
                    <form method="POST" action="{{ route('cart.update', $item['id']) }}" class="flex items-center gap-2">
                      @csrf
                      <label class="sr-only" for="qty_{{ $item['id'] }}">Cantidad</label>
                      <input
                        id="qty_{{ $item['id'] }}"
                        type="number"
                        name="quantity"
                        min="1"
                        inputmode="numeric"
                        value="{{ $qty }}"
                        class="w-20 text-center">
                      <button class="btn-outline btn-sm" type="submit">Actualizar</button>
                    </form>

                    {{-- + --}}
                    <form method="POST" action="{{ route('cart.update', $item['id']) }}">
                      @csrf
                      <input type="hidden" name="quantity" value="{{ $incQty }}">
                      <button class="btn-outline btn-sm px-3" type="submit" aria-label="Sumar">
                        +
                      </button>
                    </form>
                  </div>

                  <div class="sm:ml-auto text-right">
                    <div class="text-xs text-zinc-500">Subtotal</div>
                    <div class="font-black text-zinc-900">{{ $fmt($subtotal) }}</div>
                  </div>
                </div>

                <div class="mt-3">
                  <a href="{{ route('store.index') }}" class="btn-ghost btn-sm">Seguir comprando</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    {{-- Summary --}}
    <div class="lg:col-span-1">
      <div class="card h-fit">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-sky">{{ $itemsCount }} ítems</span>
        </div>

        <div class="card-body grid gap-3">
          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-xl font-black">{{ $fmt($total) }}</div>
          </div>

          <div class="text-xs text-zinc-500">
            Retiro en el local. Podés confirmar el pedido y después coordinamos.
          </div>

          <div class="grid gap-2">
            <a href="{{ route('checkout') }}" class="btn-primary w-full">Finalizar compra</a>

            <form method="POST" action="{{ route('cart.clear') }}">
              @csrf
              <button class="btn-outline w-full" type="submit">Vaciar carrito</button>
            </form>

            <a href="{{ route('store.index') }}" class="btn-ghost w-full">Volver a la tienda</a>
          </div>

          <div class="muted text-xs">
            Al confirmar, el pedido queda asociado a tu cuenta y lo ves en “Mis pedidos”.
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

@extends('layouts.app')

@section('title', 'Carrito')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $cart  = $cart ?? [];
  $total = $total ?? 0;

  $itemsCount = 0;
  foreach ($cart as $i) { $itemsCount += (int)($i['quantity'] ?? 0); }

  // ✅ Si hay productos sin stock o cantidad > stock, bloqueamos checkout
  $hasStockIssue = false;
  foreach ($cart as $it) {
    $s = (int)($it['stock'] ?? 0);
    $q = (int)($it['quantity'] ?? 1);
    if ($q < 1) $q = 1;

    if ($s <= 0 || $q > $s) { $hasStockIssue = true; break; }
  }
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

  <div class="grid gap-4 lg:grid-cols-3" data-cart-grid data-store-url="{{ route('store.index') }}">
    {{-- Items --}}
    <div class="lg:col-span-2 grid gap-3" data-cart-items-wrap>
      @foreach($cart as $item)
        @php
          $qty = (int)($item['quantity'] ?? 1);
          if ($qty < 1) $qty = 1;

          $price = (float)($item['price'] ?? 0);
          $subtotal = $price * $qty;

          $slug = $item['slug'] ?? null;
          $productUrl = $slug ? route('store.product', $slug) : route('store.index');

          $stock  = (int)($item['stock'] ?? 0);
          $isOut  = $stock <= 0;

          // ✅ Si está sin stock, no permitimos subir (y dejamos max en 1 para que el JS no use 999)
          $maxQty = $stock > 0 ? $stock : 1;

          // Seguridad visual por si quedó desfasado
          if ($qty > $maxQty) $qty = $maxQty;
        @endphp



        <div class="card" data-cart-item data-item-id="{{ $item['id'] }}">
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

                    <div class="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-2 gap-y-1 items-center">
                      <span>
                        Precio unitario: <span class="font-black text-zinc-900">{{ $fmt($price) }}</span>
                      </span>
                      <span class="text-zinc-300">•</span>
                      <span>
                        Disponible: <span class="font-black text-zinc-900" data-stock-available>{{ $stock }}</span>
                      </span>

                      @if($isOut)
                        <span class="badge-rose">Sin stock</span>
                      @endif
                    </div>


                  </div>

                  <form method="POST" action="{{ route('cart.remove', $item['id']) }}" data-cart-remove>
                    @csrf
                    <button class="btn-ghost btn-sm px-3" type="submit" aria-label="Eliminar del carrito">🗑️</button>
                  </form>
                </div>

                {{-- Qty controls + subtotal --}}
                <div class="mt-4 flex items-center justify-between gap-3">
                  <form
                    method="POST"
                    action="{{ route('cart.update', $item['id']) }}"
                    class="inline-flex items-center gap-2"
                    data-cart-qty
                    data-preserve-scroll="1"
                  >
                    @csrf

                    <button
                      type="button"
                      class="btn-outline btn-sm px-3"
                      data-qty-minus
                      {{ ($isOut || $qty <= 1) ? 'disabled' : '' }}
                      aria-label="Restar"
                    >−</button>

                    <label class="sr-only" for="qty_{{ $item['id'] }}">Cantidad</label>
                    <input
                      id="qty_{{ $item['id'] }}"
                      type="number"
                      name="quantity"
                      min="1"
                      inputmode="numeric"
                      value="{{ $qty }}"
                      class="w-20 text-center"
                      data-qty-input
                      max="{{ $maxQty }}"
                      {{ $isOut ? 'disabled' : '' }}
                    >

                    <button
                      {{ ($isOut || ($qty >= $maxQty)) ? 'disabled' : '' }}
                      type="button"
                      class="btn-outline btn-sm px-3"
                      data-qty-plus
                      aria-label="Sumar"
                    >+</button>

                  </form>

                  <div class="text-right leading-tight">
                    <div class="text-[11px] text-zinc-500">Subtotal</div>
                    <div class="font-black text-zinc-900" data-line-subtotal>{{ $fmt($subtotal) }}</div>
                  </div>
                </div>



               
              </div>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    {{-- Summary --}}
    <div class="lg:col-span-1" data-cart-summary-wrap>
      <div class="card h-fit">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-sky" data-cart-items-count>{{ $itemsCount }} ítems</span>
        </div>

        <div class="card-body grid gap-3">
          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-xl font-black" data-cart-total>{{ $fmt($total) }}</div>
          </div>

          <div class="text-xs text-zinc-500">
            Retiro en el local. Podés confirmar el pedido y después coordinamos.
          </div>

          <div class="grid gap-2">
            <a
              href="{{ route('checkout') }}"
              data-checkout-btn
              class="btn-primary w-full {{ $hasStockIssue ? 'opacity-50 pointer-events-none' : '' }}"
              aria-disabled="{{ $hasStockIssue ? 'true' : 'false' }}"
              tabindex="{{ $hasStockIssue ? '-1' : '0' }}"
            >
              Finalizar compra
            </a>

            <div
              data-stock-warning
              class="mt-2 text-xs text-rose-700 font-semibold {{ $hasStockIssue ? '' : 'hidden' }}"
            >
              Hay productos sin stock o con cantidad mayor al stock. Ajustá el carrito para continuar.
            </div>

            <form method="POST" action="{{ route('cart.clear') }}" data-cart-clear>
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

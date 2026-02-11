@extends('layouts.app')

@section('title', 'Carrito')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $cart  = $cart ?? [];
  $total = $total ?? 0;

  $itemsCount = 0;
  foreach ($cart as $i) { $itemsCount += (int)($i['quantity'] ?? 0); }

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
    <div>
      <div class="page-title">Carrito</div>
      <div class="page-subtitle">Revisa tus productos antes de confirmar.</div>
    </div>
    <a href="{{ route('store.index') }}" class="btn-ghost h-11 w-full justify-center sm:w-auto">Seguir comprando</a>
  </div>

  @if(empty($cart))
    <div class="card">
      <div class="card-body">
        <div class="font-black">Tu carrito esta vacio.</div>
        <div class="muted mt-1">Agrega productos desde la tienda.</div>
        <div class="mt-4">
          <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
        </div>
      </div>
    </div>
  @else
    <div class="grid gap-4 lg:grid-cols-3 lg:items-start" data-cart-grid data-store-url="{{ route('store.index') }}">
      <div class="order-2 grid gap-3 lg:order-1 lg:col-span-2" data-cart-items-wrap>
        @foreach($cart as $item)
          @php
            $qty = (int)($item['quantity'] ?? 1);
            if ($qty < 1) $qty = 1;

            $price = (float)($item['price'] ?? 0);
            $subtotal = $price * $qty;

            $slug = $item['slug'] ?? null;
            $productUrl = $slug ? route('store.product', $slug) : route('store.index');

            $stock = (int)($item['stock'] ?? 0);
            $isOut = $stock <= 0;
            $maxQty = $stock > 0 ? $stock : 1;
            if ($qty > $maxQty) $qty = $maxQty;
          @endphp

          <div class="card" data-cart-item data-item-id="{{ $item['id'] }}" data-unit-price="{{ (float) $price }}">
            <div class="card-body p-3 sm:p-4">
              <div class="flex items-start gap-3">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
                  <svg class="h-7 w-7 text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5v-7Z" stroke="currentColor" stroke-width="1.5" />
                    <path d="M5.5 8.5 12 12l6.5-3.5M12 12v7.5" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                      <a href="{{ $productUrl }}" class="block truncate text-[15px] font-black leading-tight text-zinc-900 hover:text-[rgb(var(--brand-700))]">
                        {{ $item['name'] ?? 'Producto' }}
                      </a>

                      <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                        <span>Precio: <span class="font-black text-zinc-900">{{ $fmt($price) }}</span></span>
                        <span class="text-zinc-300">|</span>
                        <span>Stock: <span class="font-black text-zinc-900" data-stock-available>{{ $stock }}</span></span>
                        @if($isOut)
                          <span class="badge-rose">Sin stock</span>
                        @endif
                      </div>
                    </div>

                    <form method="POST" action="{{ route('cart.remove', $item['id']) }}" data-cart-remove>
                      @csrf
                      <button
                        class="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-3 text-xs font-black text-zinc-700 hover:bg-zinc-50"
                        type="submit"
                        aria-label="Eliminar del carrito"
                      >
                        Quitar
                      </button>
                    </form>
                  </div>

                  <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form
                      method="POST"
                      action="{{ route('cart.update', $item['id']) }}"
                      class="inline-flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/70 p-1 sm:w-auto sm:justify-start sm:gap-2"
                      data-cart-qty
                      data-preserve-scroll="1"
                    >
                      @csrf

                      <button
                        type="button"
                        class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                        data-qty-minus
                        {{ ($isOut || $qty <= 1) ? 'disabled' : '' }}
                        aria-label="Restar"
                      >-</button>

                      <label class="sr-only" for="qty_{{ $item['id'] }}">Cantidad</label>
                      <input
                        id="qty_{{ $item['id'] }}"
                        type="number"
                        name="quantity"
                        min="1"
                        inputmode="numeric"
                        value="{{ $qty }}"
                        class="h-11 w-16 rounded-xl border-zinc-200 text-center text-base font-black"
                        data-qty-input
                        max="{{ $maxQty }}"
                        {{ $isOut ? 'disabled' : '' }}
                      >

                      <button
                        {{ ($isOut || ($qty >= $maxQty)) ? 'disabled' : '' }}
                        type="button"
                        class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                        data-qty-plus
                        aria-label="Sumar"
                      >+</button>
                    </form>

                    <div class="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 sm:block sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                      <div class="text-[11px] text-zinc-500">Subtotal</div>
                      <div class="text-lg font-black text-zinc-900 sm:text-base" data-line-subtotal>{{ $fmt($subtotal) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        @endforeach
      </div>

      <div class="order-1 lg:order-2 lg:col-span-1" data-cart-summary-wrap>
        <div class="card h-fit overflow-hidden">
          <div class="card-head items-start">
            <div class="min-w-0">
              <div class="font-black">Resumen</div>
              <div class="text-xs text-zinc-500" data-cart-items-count>{{ $itemsCount }} items</div>
            </div>
          </div>

          <div class="card-body grid gap-4">
            <div class="rounded-2xl bg-zinc-50 px-3 py-2">
              <div class="flex items-center justify-between">
                <div class="text-sm font-bold text-zinc-600">Total</div>
                <div class="text-2xl font-black tracking-tight text-zinc-900" data-cart-total>{{ $fmt($total) }}</div>
              </div>
            </div>

            <div class="grid gap-2">
              <a
                href="{{ route('checkout') }}"
                data-checkout-btn
                class="btn-primary h-11 w-full {{ $hasStockIssue ? 'opacity-50 pointer-events-none' : '' }}"
                aria-disabled="{{ $hasStockIssue ? 'true' : 'false' }}"
                tabindex="{{ $hasStockIssue ? '-1' : '0' }}"
              >
                Finalizar compra
              </a>

              <div
                data-stock-warning
                class="mt-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 {{ $hasStockIssue ? '' : 'hidden' }}"
              >
                Hay productos sin stock o con cantidad mayor al stock. Ajusta el carrito para continuar.
              </div>

              <form method="POST" action="{{ route('cart.clear') }}" data-cart-clear>
                @csrf
                <button class="btn-outline w-full" type="submit">Vaciar carrito</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  @endif
@endsection

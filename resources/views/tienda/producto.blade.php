@extends('layouts.app')

@section('title', $product->name . ' - Tienda')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
  $cat = $product->category ?? null;
  $stock = (int)($product->stock ?? 0);
  $hasStock = $stock > 0;
  $maxQty = $hasStock ? $stock : 1;
@endphp

@section('content')
  <div class="mb-4 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600">
    <a href="{{ route('store.index') }}" class="font-black">Tienda</a>
    <span class="mx-2">/</span>
    @if($cat)
      <a href="{{ route('store.category', ['category' => $cat->slug]) }}" class="font-black">{{ $cat->name }}</a>
      <span class="mx-2">/</span>
    @endif
    <span class="text-zinc-500">{{ $product->name }}</span>
  </div>

  <div class="grid gap-5 lg:grid-cols-2 lg:items-start">
    <div class="card overflow-hidden">
      <div class="aspect-square bg-zinc-50 sm:aspect-[4/3]">
        @if($product->image_url)
          <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
        @else
          <div class="flex h-full w-full items-center justify-center text-sm font-black text-zinc-400">
            Sin imagen
          </div>
        @endif
      </div>
    </div>

    <div class="card">
      <div class="card-body p-4 sm:p-5">
        <div class="page-title">{{ $product->name }}</div>

        <div class="mt-2 flex flex-wrap items-center gap-2">
          <span class="badge-{{ $hasStock ? 'emerald' : 'rose' }}">
            {{ $hasStock ? ('Disponible: ' . $stock) : 'Sin stock' }}
          </span>

          @if(!empty($product->brand))
            <span class="badge-zinc">Marca: {{ $product->brand }}</span>
          @endif
        </div>

        <div class="mt-4 rounded-2xl bg-zinc-50 px-3 py-2">
          <div class="text-xs font-black uppercase tracking-wide text-zinc-500">Precio</div>
          <div class="text-3xl font-black tracking-tight text-zinc-900">{{ $fmt($product->price) }}</div>
        </div>

        @if(!$hasStock)
          <div class="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800">
            Sin stock por ahora. Puedes consultar disponibilidad por WhatsApp.
          </div>
        @endif

        @if(!empty($product->short_description))
          <div class="mt-3 text-sm text-zinc-700">
            {{ $product->short_description }}
          </div>
        @endif

        @if($product->description)
          <div class="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
            {{ $product->description }}
          </div>
        @endif

        <div class="mt-6 grid gap-3">
          <form method="POST" action="{{ route('cart.add', $product) }}" class="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
            @csrf

            <div>
              <label class="text-xs font-black uppercase tracking-wide text-zinc-600" for="productQty">Cantidad</label>
              <div class="mt-1 inline-flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-1" data-product-qty>
                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                  data-product-qty-minus
                  {{ $hasStock ? '' : 'disabled' }}
                  aria-label="Restar cantidad"
                >-</button>

                <input
                  id="productQty"
                  type="number"
                  name="quantity"
                  value="1"
                  min="1"
                  max="{{ $maxQty }}"
                  class="h-10 w-16 border-0 bg-transparent text-center text-base font-black text-zinc-900 focus:ring-0"
                  inputmode="numeric"
                  data-product-qty-input
                  {{ $hasStock ? '' : 'disabled' }}
                >

                <button
                  type="button"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                  data-product-qty-plus
                  {{ $hasStock ? '' : 'disabled' }}
                  aria-label="Sumar cantidad"
                >+</button>
              </div>
            </div>

            <button
              class="btn-primary h-11 w-full justify-center"
              type="submit"
              data-product-name="{{ $product->name }}"
              data-testid="product-add-to-cart"
              aria-label="Agregar al carrito"
              {{ $hasStock ? '' : 'disabled' }}
            >
              {{ $hasStock ? 'Agregar al carrito' : 'Sin stock' }}
            </button>
          </form>

          <div class="grid gap-2 sm:grid-cols-2">
            <a href="{{ route('cart.index') }}" class="btn-outline h-11 w-full justify-center">Ver carrito</a>
            <a href="{{ route('store.index') }}" class="btn-ghost h-11 w-full justify-center">Seguir comprando</a>
          </div>
        </div>

        <div class="mt-4 text-xs text-zinc-500">
          Necesitas reparar tu equipo? Usa <a class="font-black" href="{{ route('repairs.lookup') }}">Consultar reparacion</a>.
        </div>
      </div>
    </div>
  </div>
@endsection

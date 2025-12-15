@extends('layouts.app')

@section('title', $product->name.' - Tienda')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
  $img = $product->image_url;
  $inStock = ((int)($product->stock ?? 0)) > 0;
@endphp

<div class="space-y-4">
  {{-- Breadcrumb --}}
  <div class="text-xs text-zinc-500">
    <a class="hover:text-sky-700" href="{{ route('store.index') }}">Tienda</a>
    <span class="mx-1">/</span>
    @if($product->category)
      <a class="hover:text-sky-700" href="{{ route('store.category', $product->category->slug) }}">{{ $product->category->name }}</a>
      <span class="mx-1">/</span>
    @endif
    <span class="text-zinc-700 font-semibold">{{ $product->name }}</span>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {{-- Image --}}
    <div class="card overflow-hidden">
      <div class="aspect-square bg-zinc-50">
        @if($img)
          <img src="{{ $img }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
        @else
          <div class="h-full w-full flex items-center justify-center">
            <div class="h-20 w-20 rounded-3xl bg-white border border-zinc-200 flex items-center justify-center font-extrabold text-2xl text-zinc-700">
              {{ strtoupper(substr($product->name, 0, 1)) }}
            </div>
          </div>
        @endif
      </div>
    </div>

    {{-- Info --}}
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">{{ $product->name }}</h1>

        <div class="mt-2 flex items-center gap-2 flex-wrap">
          <span class="badge {{ $inStock ? 'badge-emerald' : 'badge-rose' }}">
            {{ $inStock ? 'En stock' : 'Sin stock' }}
          </span>

          @if($product->category)
            <span class="badge badge-zinc">{{ $product->category->name }}</span>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-body space-y-3">
          <div class="flex items-end justify-between gap-3">
            <div class="text-xs text-zinc-500">Precio</div>
            <div class="text-2xl font-extrabold text-zinc-900">{{ $money($product->price) }}</div>
          </div>

          <form method="POST" action="{{ route('cart.add', $product->id) }}" class="grid grid-cols-3 gap-2 items-end">
            @csrf

            <div class="col-span-1">
              <label class="label">Cantidad</label>
              <input class="input" type="number" name="quantity" min="1" value="1" {{ $inStock ? '' : 'disabled' }}>
            </div>

            <div class="col-span-2">
              <button class="btn-primary w-full" type="submit" {{ $inStock ? '' : 'disabled' }}>
                Agregar al carrito
              </button>
            </div>
          </form>

          <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div class="font-extrabold text-zinc-900">Retiro en local</div>
            <div class="mt-1 text-zinc-600">
              Coordinás y retirás en el local. Más adelante sumamos envío si querés.
            </div>
          </div>

          <a href="{{ route('store.index') }}" class="btn-outline w-full text-center">← Volver a la tienda</a>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-extrabold text-zinc-900">Descripción</div>
        </div>
        <div class="card-body text-sm text-zinc-700 leading-relaxed">
          {{ $product->description ?: 'Sin descripción por ahora.' }}
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

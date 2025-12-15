@extends('layouts.app')

@section('title', $product->name . ' — NicoReparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

<div class="container-page py-6">
  <div class="text-sm text-zinc-500">
    <a href="{{ route('store.index') }}" class="hover:text-zinc-900">Tienda</a>
    <span class="mx-2 text-zinc-300">/</span>
    <span class="text-zinc-900 font-semibold">{{ $product->name }}</span>
  </div>

  <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
    {{-- Imagen --}}
    <div class="card overflow-hidden">
      <div class="aspect-square bg-zinc-50 flex items-center justify-center">
        <img src="{{ asset('img/' . ($product->image ?? 'logo-nicoreparaciones.jpg')) }}"
             alt="{{ $product->name }}"
             class="h-full w-full object-cover">
      </div>
    </div>

    {{-- Detalle --}}
    <div class="space-y-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-zinc-900">{{ $product->name }}</h1>
        <div class="mt-1 text-sm text-zinc-500">
          {{ $product->brand ?? 'Marca genérica' }}
          · Calidad: <span class="font-semibold text-zinc-700">{{ ucfirst($product->quality ?? 'standard') }}</span>
          @if($product->category?->name)
            · <span class="text-zinc-700">{{ $product->category->name }}</span>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center justify-between gap-3">
            <div class="text-2xl font-extrabold text-zinc-900">{{ $money($product->price) }}</div>
            <span class="badge {{ $product->stock > 0 ? 'badge-emerald' : 'badge-rose' }}">
              {{ $product->stock > 0 ? 'En stock' : 'Sin stock' }}
            </span>
          </div>

          <p class="mt-3 text-sm text-zinc-600">
            {{ $product->description ?? $product->short_description ?? '—' }}
          </p>

          <div class="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            <div class="font-semibold">Retiro en local</div>
            <div class="text-sky-800/90 mt-1">Pagás en el local / Mercado Pago / transferencia (según config del pedido).</div>
          </div>

          <form action="{{ route('cart.add', $product->id) }}" method="POST" class="mt-4">
            @csrf
            <div class="flex items-end gap-3">
              <div class="w-28">
                <label class="text-sm font-medium text-zinc-800">Cantidad</label>
                <input class="input" type="number" name="quantity" min="1" value="1">
              </div>

              <button type="submit"
                      class="{{ $product->stock > 0 ? 'btn-primary flex-1' : 'btn-outline flex-1 opacity-60 cursor-not-allowed' }}"
                      {{ $product->stock > 0 ? '' : 'disabled' }}>
                Agregar al carrito
              </button>
            </div>
          </form>

          <div class="mt-3">
            <a href="{{ route('store.index') }}" class="btn-ghost">← Volver a la tienda</a>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>
@endsection

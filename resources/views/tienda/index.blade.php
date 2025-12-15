@extends('layouts.app')

@section('title', isset($currentCategory) ? $currentCategory->name . ' — Tienda' : 'Tienda — NicoReparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

<div class="container-page py-6">

  {{-- Hero --}}
  <div class="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-600 to-cyan-500 text-white p-5 sm:p-7">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          @if(isset($currentCategory))
            {{ $currentCategory->name }}
          @else
            Tienda
          @endif
        </h1>
        <p class="mt-2 text-sm sm:text-base text-white/90 max-w-2xl">
          Accesorios listos para retirar en el local. Comprás rápido desde el celu y listo.
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <span class="badge badge-sky">Mobile-first</span>
          <span class="badge bg-white/20 text-white ring-white/20">Retiro en local</span>
          <span class="badge bg-white/20 text-white ring-white/20">Stock visible</span>
        </div>
      </div>

      <img src="{{ asset('brand/logo.png') }}" onerror="this.style.display='none'" class="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/90 p-2 border border-white/30 object-contain" alt="Logo">
    </div>
  </div>

  {{-- Categorías (solo cuando NO estás filtrando) --}}
  @if(!isset($currentCategory))
    <div class="mt-6">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-zinc-900">Categorías</h2>
        <span class="text-xs text-zinc-500">Elegí una para filtrar</span>
      </div>

      <div class="mt-3 flex gap-2 overflow-x-auto pb-2">
        @foreach($categories as $category)
          <a href="{{ route('store.category', $category->slug) }}"
             class="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            {{ $category->icon ?? '📦' }} {{ $category->name }}
          </a>
        @endforeach
      </div>
    </div>
  @else
    <div class="mt-6 flex items-center gap-2 text-sm">
      <a href="{{ route('store.index') }}" class="text-zinc-600 hover:text-zinc-900">Tienda</a>
      <span class="text-zinc-400">/</span>
      <span class="font-semibold text-zinc-900">{{ $currentCategory->name }}</span>
    </div>
  @endif

  {{-- Productos --}}
  <div class="mt-6 space-y-8">

    @foreach($categories as $category)
      @if(!isset($currentCategory))
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-zinc-900">{{ $category->name }}</h2>
          <a class="text-sm font-semibold" href="{{ route('store.category', $category->slug) }}">Ver todo →</a>
        </div>
      @endif

      @if($category->products->isEmpty())
        <div class="card">
          <div class="card-body text-sm text-zinc-500">
            No hay productos cargados en esta categoría todavía.
          </div>
        </div>
      @else
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          @foreach($category->products as $product)
            <div class="card overflow-hidden">
              <a href="{{ route('store.product', $product->slug) }}" class="block">
                <div class="aspect-square bg-zinc-50 border-b border-zinc-100 flex items-center justify-center">
                  <img
                    src="{{ asset('img/' . ($product->image ?? 'logo-nicoreparaciones.jpg')) }}"
                    alt="{{ $product->name }}"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  >
                </div>
              </a>

              <div class="card-body">
                <a href="{{ route('store.product', $product->slug) }}"
                   class="block text-sm font-semibold text-zinc-900 hover:text-sky-700 line-clamp-2">
                  {{ $product->name }}
                </a>

                <div class="mt-2 flex items-center justify-between gap-2">
                  <div class="text-sm font-extrabold text-zinc-900">
                    {{ $money($product->price) }}
                  </div>

                  @if($product->stock > 0)
                    <span class="badge badge-emerald">En stock</span>
                  @else
                    <span class="badge badge-rose">Sin stock</span>
                  @endif
                </div>

                <form action="{{ route('cart.add', $product->id) }}" method="POST" class="mt-3">
                  @csrf
                  <input type="hidden" name="quantity" value="1">
                  <button
                    type="submit"
                    class="{{ $product->stock > 0 ? 'btn-primary w-full' : 'btn-outline w-full opacity-60 cursor-not-allowed' }}"
                    {{ $product->stock > 0 ? '' : 'disabled' }}
                  >
                    Agregar
                  </button>
                </form>
              </div>
            </div>
          @endforeach
        </div>
      @endif

      @if(!isset($currentCategory))
        <div class="h-px bg-zinc-100"></div>
      @endif
    @endforeach

    {{-- Destacados (si existe) --}}
    @if(isset($featuredProducts) && $featuredProducts->count() && !isset($currentCategory))
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-zinc-900">Destacados</h2>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        @foreach($featuredProducts as $product)
          <div class="card overflow-hidden">
            <a href="{{ route('store.product', $product->slug) }}" class="block">
              <div class="aspect-square bg-zinc-50 border-b border-zinc-100">
                <img src="{{ asset('img/' . ($product->image ?? 'logo-nicoreparaciones.jpg')) }}"
                     alt="{{ $product->name }}"
                     class="h-full w-full object-cover"
                     loading="lazy">
              </div>
            </a>

            <div class="card-body">
              <a href="{{ route('store.product', $product->slug) }}"
                 class="block text-sm font-semibold text-zinc-900 hover:text-sky-700 line-clamp-2">
                {{ $product->name }}
              </a>

              <div class="mt-2 flex items-center justify-between gap-2">
                <div class="text-sm font-extrabold text-zinc-900">{{ $money($product->price) }}</div>
                <span class="badge {{ $product->stock > 0 ? 'badge-emerald' : 'badge-rose' }}">
                  {{ $product->stock > 0 ? 'En stock' : 'Sin stock' }}
                </span>
              </div>

              <form action="{{ route('cart.add', $product->id) }}" method="POST" class="mt-3">
                @csrf
                <input type="hidden" name="quantity" value="1">
                <button type="submit" class="btn-primary w-full" {{ $product->stock > 0 ? '' : 'disabled' }}>
                  Agregar
                </button>
              </form>
            </div>
          </div>
        @endforeach
      </div>
    @endif

  </div>
</div>
@endsection

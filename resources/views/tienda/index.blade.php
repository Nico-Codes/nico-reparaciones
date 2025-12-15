@extends('layouts.app')

@section('title', isset($currentCategory) ? ($currentCategory->name.' - Tienda') : 'Tienda - NicoReparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

<div class="space-y-6">
  {{-- Hero --}}
  <section class="card overflow-hidden">
    <div class="card-body">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 class="page-title">
            @if(isset($currentCategory))
              {{ $currentCategory->name }}
            @else
              Tienda
            @endif
          </h1>
          <p class="page-subtitle">
            Accesorios listos para retirar. Comprás rápido, sin vueltas.
          </p>
        </div>

        <div class="flex gap-2 flex-wrap">
          @if(isset($currentCategory))
            <a class="btn-outline" href="{{ route('store.index') }}">Ver todas</a>
          @endif
          <a class="btn-primary" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
        </div>
      </div>
    </div>
  </section>

  {{-- Categorías (solo home) --}}
  @if(!isset($currentCategory))
    <section class="card">
      <div class="card-header">
        <div class="text-sm font-extrabold text-zinc-900">Categorías</div>
        <div class="text-xs text-zinc-500">Elegí una para filtrar.</div>
      </div>
      <div class="card-body">
        <div class="flex gap-2 overflow-x-auto pb-1">
          @foreach($categories as $cat)
            <a href="{{ route('store.category', $cat->slug) }}"
               class="badge badge-zinc whitespace-nowrap hover:bg-zinc-200 transition">
              {{ $cat->name }}
            </a>
          @endforeach
        </div>
      </div>
    </section>
  @endif

  {{-- Productos --}}
  @foreach($categories as $category)
    @if(!isset($currentCategory))
      <div class="flex items-end justify-between gap-3">
        <h2 class="text-lg font-extrabold text-zinc-900">{{ $category->name }}</h2>
        <a class="text-sm font-semibold text-sky-700 hover:text-sky-800"
           href="{{ route('store.category', $category->slug) }}">
          Ver más →
        </a>
      </div>
    @endif

    @if($category->products->isEmpty())
      <div class="card">
        <div class="card-body text-sm text-zinc-600">No hay productos cargados en esta categoría.</div>
      </div>
    @else
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        @foreach($category->products as $product)
          @php
            $img = $product->image_url;
            $inStock = ((int)($product->stock ?? 0)) > 0;
          @endphp

          <article class="card overflow-hidden">
            <a href="{{ route('store.product', $product->slug) }}" class="block">
              <div class="aspect-square bg-zinc-50 border-b border-zinc-100 overflow-hidden">
                @if($img)
                  <img src="{{ $img }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
                @else
                  <div class="h-full w-full flex items-center justify-center">
                    <div class="h-14 w-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center font-extrabold text-zinc-700">
                      {{ strtoupper(substr($product->name, 0, 1)) }}
                    </div>
                  </div>
                @endif
              </div>
            </a>

            <div class="p-4">
              <div class="flex items-start justify-between gap-2">
                <a href="{{ route('store.product', $product->slug) }}"
                   class="text-sm font-extrabold text-zinc-900 leading-snug">
                  {{ $product->name }}
                </a>
                <span class="badge {{ $inStock ? 'badge-emerald' : 'badge-rose' }}">
                  {{ $inStock ? 'Stock' : 'Sin' }}
                </span>
              </div>

              <div class="mt-2 flex items-center justify-between gap-2">
                <div class="text-base font-extrabold text-zinc-900">{{ $money($product->price) }}</div>
                <div class="text-xs text-zinc-500">#{{ $product->id }}</div>
              </div>

              <form class="mt-3" method="POST" action="{{ route('cart.add', $product->id) }}">
                @csrf
                <input type="hidden" name="quantity" value="1">
                <button type="submit" class="btn-primary w-full" {{ $inStock ? '' : 'disabled' }}>
                  Agregar
                </button>
              </form>
            </div>
          </article>
        @endforeach
      </div>
    @endif
  @endforeach

  {{-- Destacados (si existen y estamos en home) --}}
  @if(isset($featuredProducts) && $featuredProducts->count() && !isset($currentCategory))
    <div class="flex items-end justify-between gap-3">
      <h2 class="text-lg font-extrabold text-zinc-900">Destacados</h2>
      <a class="text-sm font-semibold text-sky-700 hover:text-sky-800" href="{{ route('store.index') }}">
        Ver tienda →
      </a>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      @foreach($featuredProducts as $product)
        @php
          $img = $product->image_url;
          $inStock = ((int)($product->stock ?? 0)) > 0;
        @endphp

        <article class="card overflow-hidden">
          <a href="{{ route('store.product', $product->slug) }}" class="block">
            <div class="aspect-square bg-zinc-50 border-b border-zinc-100 overflow-hidden">
              @if($img)
                <img src="{{ $img }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
              @else
                <div class="h-full w-full flex items-center justify-center">
                  <div class="h-14 w-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center font-extrabold text-zinc-700">
                    {{ strtoupper(substr($product->name, 0, 1)) }}
                  </div>
                </div>
              @endif
            </div>
          </a>

          <div class="p-4">
            <div class="text-sm font-extrabold text-zinc-900 leading-snug">
              <a href="{{ route('store.product', $product->slug) }}">{{ $product->name }}</a>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <div class="text-base font-extrabold text-zinc-900">{{ $money($product->price) }}</div>
              <span class="badge {{ $inStock ? 'badge-emerald' : 'badge-rose' }}">
                {{ $inStock ? 'Stock' : 'Sin' }}
              </span>
            </div>

            <form class="mt-3" method="POST" action="{{ route('cart.add', $product->id) }}">
              @csrf
              <input type="hidden" name="quantity" value="1">
              <button type="submit" class="btn-primary w-full" {{ $inStock ? '' : 'disabled' }}>
                Agregar
              </button>
            </form>
          </div>
        </article>
      @endforeach
    </div>
  @endif
</div>
@endsection

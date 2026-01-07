@extends('layouts.app')

@section('title', $product->name.' — Tienda')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
  $cat = $product->category ?? null;
@endphp

@section('content')
  <div class="mb-4 text-sm text-zinc-600">
    <a href="{{ route('store.index') }}" class="font-black">Tienda</a>
    <span class="mx-2">/</span>
    @if($cat)
      <a href="{{ route('store.category', ['category' => $cat->slug]) }}" class="font-black">{{ $cat->name }}</a>

      <span class="mx-2">/</span>
    @endif
    <span class="text-zinc-500">{{ $product->name }}</span>
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    <div class="card overflow-hidden">
      <div class="aspect-[4/3] bg-zinc-50">
        @if($product->image_url)
          <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
        @else
          <div class="h-full w-full flex items-center justify-center text-zinc-400 text-sm font-black">
            Sin imagen
          </div>
        @endif
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="page-title">{{ $product->name }}</div>

        <div class="mt-2 flex flex-wrap items-center gap-2">
          @if(($product->stock ?? 0) > 0)
            <span class="badge-zinc">Disponible: {{ (int)$product->stock }}</span>
          @endif


          @if(!empty($product->brand))
            <span class="badge-zinc">Marca: {{ $product->brand }}</span>
          @endif

          @if(!empty($product->quality))
            <span class="badge-indigo">Calidad: {{ $product->quality }}</span>
          @endif
        </div>

        <div class="mt-4 text-2xl font-black">{{ $fmt($product->price) }}</div>

        @if(!empty($product->short_description))
          <div class="mt-3 text-sm text-zinc-700">
            {{ $product->short_description }}
          </div>
        @endif

        @if($product->description)
          <div class="mt-4 text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
            {{ $product->description }}
          </div>
        @endif

        <div class="mt-6 flex flex-col sm:flex-row gap-2">
          <form method="POST" action="{{ route('cart.add', $product) }}" class="sm:flex-1">
            @csrf
            <button class="btn-primary w-full" {{ ($product->stock ?? 0) > 0 ? '' : 'disabled' }}>
              Agregar al carrito
            </button>
          </form>

          <a href="{{ route('cart.index') }}" class="btn-outline w-full sm:w-auto">
            Ver carrito
          </a>
        </div>

        <div class="mt-4 text-xs text-zinc-500">
          ¿Necesitás reparar tu equipo? Usá <a class="font-black" href="{{ route('repairs.lookup') }}">Consultar reparación</a>.
        </div>
      </div>
    </div>
  </div>
@endsection

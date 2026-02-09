@extends('layouts.app')

@section('title', $product->name.' - Tienda')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
  $cat = $product->category ?? null;
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
          <div class="h-full w-full flex items-center justify-center text-zinc-400 text-sm font-black">
            Sin imagen
          </div>
        @endif
      </div>
    </div>

    <div class="card">
      <div class="card-body p-4 sm:p-5">
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

        <div class="mt-4 rounded-2xl bg-zinc-50 px-3 py-2">
          <div class="text-xs font-black uppercase tracking-wide text-zinc-500">Precio</div>
          <div class="text-3xl font-black tracking-tight text-zinc-900">{{ $fmt($product->price) }}</div>
        </div>

        @if(($product->stock ?? 0) <= 0)
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
          <div class="mt-4 text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
            {{ $product->description }}
          </div>
        @endif

        <div class="mt-6 grid gap-2 sm:flex sm:flex-row">
          <form method="POST" action="{{ route('cart.add', $product) }}" class="sm:flex-1">
            @csrf
            <button class="btn-primary h-11 w-full" {{ ($product->stock ?? 0) > 0 ? '' : 'disabled' }}>
              Agregar al carrito
            </button>
          </form>

          <a href="{{ route('cart.index') }}" class="btn-outline h-11 w-full sm:w-auto">
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

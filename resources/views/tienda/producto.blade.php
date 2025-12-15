@extends('layouts.app')

@section('title', $product->name.' — Tienda')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">{{ $product->name }}</div>
    <div class="page-subtitle">
      Categoría:
      <a href="{{ route('store.category', $product->category->slug) }}" class="font-bold">
        {{ $product->category->name }}
      </a>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    <div class="card overflow-hidden">
      <div class="aspect-[4/3] bg-zinc-50">
        @if($product->image_url)
          <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
        @else
          <div class="h-full w-full flex items-center justify-center text-zinc-400 text-sm font-bold">
            Sin imagen
          </div>
        @endif
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="flex items-center justify-between gap-3">
          <div class="text-2xl font-black">{{ $fmt($product->price) }}</div>

          @if($product->stock > 0)
            <span class="badge-emerald">En stock</span>
          @else
            <span class="badge-rose">Sin stock</span>
          @endif
        </div>

        @if($product->description)
          <div class="mt-4 text-sm text-zinc-700 leading-relaxed">
            {{ $product->description }}
          </div>
        @endif

        <div class="mt-6 flex flex-col sm:flex-row gap-2">
          <form method="POST" action="{{ route('cart.add', $product) }}" class="sm:flex-1">
            @csrf
            <button class="btn-primary w-full" {{ $product->stock > 0 ? '' : 'disabled' }}>
              Agregar al carrito
            </button>
          </form>

          <a href="{{ route('cart.index') }}" class="btn-outline w-full sm:w-auto">
            Ver carrito
          </a>
        </div>
      </div>
    </div>
  </div>
@endsection

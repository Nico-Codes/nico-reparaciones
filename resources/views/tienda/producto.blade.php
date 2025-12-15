@extends('layouts.app')

@section('title', $product->name . ' - NicoReparaciones')

@section('content')
  {{-- Breadcrumbs --}}
  <div class="mb-4 text-sm text-zinc-600">
    <a class="link text-brand" href="{{ route('store.index') }}">Tienda</a>
    @if($product->category)
      <span class="mx-1">/</span>
      <a class="link text-brand" href="{{ route('store.category', $product->category->slug) }}">{{ $product->category->name }}</a>
    @endif
    <span class="mx-1">/</span>
    <span class="text-zinc-800 font-semibold">{{ $product->name }}</span>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {{-- Imagen --}}
    <div class="card overflow-hidden">
      <div class="aspect-square bg-zinc-50 grid place-items-center overflow-hidden">
        <img
          src="{{ $product->image_url ?? asset('img/logo-nico.png') }}"
          alt="{{ $product->name }}"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    {{-- Info --}}
    <div class="card">
      <div class="card-body">
        <h1 class="page-title">{{ $product->name }}</h1>

        <div class="mt-2 flex flex-wrap items-center gap-2">
          @if($product->category)
            <span class="badge-blue">{{ $product->category->name }}</span>
          @endif

          @if($product->stock > 0)
            <span class="badge-green">En stock ({{ $product->stock }})</span>
          @else
            <span class="badge-red">Sin stock</span>
          @endif
        </div>

        <div class="mt-4 flex items-end justify-between gap-3">
          <div>
            <div class="muted">Precio</div>
            <div class="text-3xl font-extrabold tracking-tight">
              ${{ number_format($product->price, 0, ',', '.') }}
            </div>
          </div>

          <a href="{{ route('store.index') }}" class="btn-outline">Seguir comprando</a>
        </div>

        <div class="mt-4">
          <div class="section-title">Descripción</div>
          <p class="mt-2 text-sm text-zinc-700 leading-relaxed">
            {{ $product->description ?: 'Producto listo para retirar en el local. Si tenés dudas, consultanos y te asesoramos.' }}
          </p>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="card">
            <div class="card-body">
              <div class="font-bold">Retiro en el local</div>
              <div class="muted mt-1">Coordinás y retirás sin vueltas.</div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <div class="font-bold">Compra rápida</div>
              <div class="muted mt-1">Carrito simple, pensado para celular.</div>
            </div>
          </div>
        </div>

        {{-- Agregar --}}
        <div class="mt-6">
          <form action="{{ route('cart.add', $product->id) }}" method="POST" class="grid grid-cols-[110px_1fr] gap-3 items-end">
            @csrf

            <div>
              <label class="label" for="quantity">Cantidad</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value="1"
                class="input"
                {{ $product->stock <= 0 ? 'disabled' : '' }}
              />
            </div>

            <button
              type="submit"
              class="btn-primary w-full h-[42px] {{ $product->stock <= 0 ? 'btn-disabled' : '' }}"
              {{ $product->stock <= 0 ? 'disabled' : '' }}
            >
              🧺 Agregar al carrito
            </button>
          </form>

          @if($product->stock <= 0)
            <div class="muted mt-2">Este producto está sin stock por ahora.</div>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection

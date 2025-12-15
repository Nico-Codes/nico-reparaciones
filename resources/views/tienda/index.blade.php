@extends('layouts.app')

@php
  /** @var \App\Models\Category|null $currentCategory */
  $currentCategory = $currentCategory ?? ($category ?? null);

  // Compatibilidad: si el controlador no envía $products, intentamos armarlo desde $categories->products
  $products = $products ?? null;

  if (!$products) {
    $tmp = collect();

    if (isset($categories)) {
      foreach ($categories as $cat) {
        if (isset($cat->products)) {
          foreach ($cat->products as $p) {
            $tmp->push($p);
          }
        }
      }
    }

    // Si armamos algo, lo usamos. Si no, dejamos colección vacía.
    $products = $tmp->isNotEmpty() ? $tmp : collect();
  }

  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('title', $currentCategory ? ($currentCategory->name.' — Tienda') : 'Tienda')

@section('content')
  <div class="page-head">
    <div class="page-title">
      {{ $currentCategory ? $currentCategory->name : 'Tienda' }}
    </div>
    <div class="page-subtitle">
      Accesorios disponibles. Comprá en 1 minuto desde el celu.
    </div>
  </div>

  {{-- Categorías --}}
  <div class="card mb-5">
    <div class="card-body">
      <div class="flex flex-wrap gap-2">
        <a href="{{ route('store.index') }}"
           class="{{ $currentCategory ? 'btn-outline' : 'btn-primary' }} btn-sm">
          Todas
        </a>

        @if(isset($categories))
          @foreach($categories as $cat)
            <a href="{{ route('store.category', $cat->slug) }}"
               class="{{ ($currentCategory && $currentCategory->id === $cat->id) ? 'btn-primary' : 'btn-outline' }} btn-sm">
              {{ $cat->name }}
            </a>
          @endforeach
        @endif
      </div>
    </div>
  </div>

  {{-- Productos --}}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    @forelse($products as $product)
      <div class="card overflow-hidden">
        <a href="{{ route('store.product', $product->slug) }}" class="block">
          <div class="aspect-[4/3] bg-zinc-50">
            @if($product->image_url)
              <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
            @else
              <div class="h-full w-full flex items-center justify-center text-zinc-400 text-sm font-bold">
                Sin imagen
              </div>
            @endif
          </div>
        </a>

        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="font-black leading-snug">
              <a href="{{ route('store.product', $product->slug) }}" class="text-zinc-900 hover:text-sky-700">
                {{ $product->name }}
              </a>
              <div class="text-xs text-zinc-500 mt-1">
                {{ $product->category?->name ?? 'Sin categoría' }}
              </div>
            </div>

            @if(($product->stock ?? 0) > 0)
              <span class="badge-emerald">Stock</span>
            @else
              <span class="badge-rose">Sin stock</span>
            @endif
          </div>

          <div class="mt-3 flex items-end justify-between gap-3">
            <div class="text-lg font-black">{{ $fmt($product->price) }}</div>

            <form method="POST" action="{{ route('cart.add', $product) }}">
              @csrf
              <button class="btn-primary btn-sm" {{ ($product->stock ?? 0) > 0 ? '' : 'disabled' }}>
                Agregar
              </button>
            </form>
          </div>
        </div>
      </div>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">No hay productos para mostrar.</div>
          <div class="muted">Cargá productos desde Admin → Productos.</div>
          <div class="mt-4">
            <a class="btn-primary" href="{{ route('admin.products.index') }}">Ir a Admin Productos</a>
          </div>
        </div>
      </div>
    @endforelse
  </div>

  {{-- Paginación solo si existe paginator real --}}
  @if(is_object($products) && method_exists($products, 'links'))
    <div class="mt-6">
      {{ $products->links() }}
    </div>
  @endif
@endsection

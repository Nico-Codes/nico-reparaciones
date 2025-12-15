@extends('layouts.app')

@php
  /** @var \App\Models\Category|null $currentCategory */
  $currentCategory = $currentCategory ?? ($category ?? null);

  // Productos: si el controlador manda $products (paginado), lo usamos.
  // Si no, armamos una colección desde $categories->products (tu StoreController actual).
  $products = $products ?? null;

  if (!$products) {
    $tmp = collect();
    if (isset($categories)) {
      foreach ($categories as $cat) {
        if (isset($cat->products)) {
          foreach ($cat->products as $p) $tmp->push($p);
        }
      }
    }
    $products = $tmp->values();
  }

  $q = $q ?? request('q', '');
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('title', $currentCategory ? ($currentCategory->name.' — Tienda') : 'Tienda')

@section('content')
  <div class="page-head">
    <div class="page-title">{{ $currentCategory ? $currentCategory->name : 'Tienda' }}</div>
    <div class="page-subtitle">Accesorios disponibles. Comprá rápido desde el celu.</div>
  </div>

  {{-- Buscador --}}
  <div class="card mb-4">
    <div class="card-body">
      <form method="GET" action="{{ $currentCategory ? route('store.category', $currentCategory->slug) : route('store.index') }}" class="flex flex-col sm:flex-row gap-2">
        <input name="q" value="{{ $q }}" placeholder="Buscar: funda, vidrio, cable, cargador…" />
        <button class="btn-primary sm:w-40" type="submit">Buscar</button>
      </form>
      <div class="mt-2 text-xs text-zinc-500">
        Tip: marcá productos como <span class="font-black">featured</span> para que salgan en “Destacados”.
      </div>
    </div>
  </div>

  {{-- Categorías (scroll horizontal mobile) --}}
  <div class="card mb-5">
    <div class="card-body">
      <div class="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
        <a href="{{ route('store.index') }}" class="{{ $currentCategory ? 'btn-outline' : 'btn-primary' }} btn-sm">Todas</a>

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

  {{-- Destacados --}}
  @if(!$currentCategory && isset($featuredProducts) && $featuredProducts->count())
    <div class="card mb-6">
      <div class="card-head">
        <div class="font-black">Destacados</div>
        <span class="badge-sky">Top</span>
      </div>
      <div class="card-body">
        <div class="flex gap-3 overflow-x-auto pb-2">
          @foreach($featuredProducts as $p)
            <a href="{{ route('store.product', $p->slug) }}" class="min-w-[230px] max-w-[230px] card overflow-hidden hover:border-zinc-200 transition">
              <div class="aspect-[4/3] bg-zinc-50">
                @if($p->image_url)
                  <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
                @else
                  <div class="h-full w-full flex items-center justify-center text-zinc-400 text-sm font-black">Sin imagen</div>
                @endif
              </div>
              <div class="card-body">
                <div class="font-black leading-snug text-zinc-900 line-clamp-2">{{ $p->name }}</div>
                <div class="mt-2 flex items-center justify-between gap-2">
                  <div class="text-lg font-black">{{ $fmt($p->price) }}</div>
                  @if(($p->stock ?? 0) > 0)
                    <span class="badge-emerald">Stock</span>
                  @else
                    <span class="badge-rose">Sin stock</span>
                  @endif
                </div>
              </div>
            </a>
          @endforeach
        </div>
      </div>
    </div>
  @endif

  {{-- Grid productos --}}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    @forelse($products as $product)
      <div class="card overflow-hidden hover:border-zinc-200 transition">
        <a href="{{ route('store.product', $product->slug) }}" class="block">
          <div class="aspect-[4/3] bg-zinc-50">
            @if($product->image_url)
              <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
            @else
              <div class="h-full w-full flex items-center justify-center text-zinc-400 text-sm font-black">
                Sin imagen
              </div>
            @endif
          </div>
        </a>

        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <a href="{{ route('store.product', $product->slug) }}" class="font-black leading-snug text-zinc-900 hover:text-[rgb(var(--brand-700))]">
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
      <div class="card sm:col-span-2 lg:col-span-3">
        <div class="card-body">
          <div class="font-black">No hay productos para mostrar.</div>
          <div class="muted mt-1">Cargá productos desde Admin → Productos.</div>
          @if(auth()->check() && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false)))
            <div class="mt-4">
              <a class="btn-primary" href="{{ route('admin.products.index') }}">Ir a Admin Productos</a>
            </div>
          @endif
        </div>
      </div>
    @endforelse
  </div>

  {{-- Paginación (si viene paginator real) --}}
  @if(is_object($products) && method_exists($products, 'links'))
    <div class="mt-6">
      {{ $products->links() }}
    </div>
  @endif
@endsection

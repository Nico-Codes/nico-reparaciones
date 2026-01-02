@extends('layouts.app')

@section('title', 'Tienda')

@section('content')
@php
  $currentCategorySafe = $currentCategory ?? null;
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
@endphp

<div id="top" class="container-page py-8">

  {{-- Tabs de categorías --}}
  @if(($categories ?? collect())->count())
    <div class="card">
      <div class="card-body">
        <div class="flex flex-wrap gap-2">
          <a href="{{ route('store.index') }}" class="nav-pill {{ empty($currentCategorySafe) ? 'nav-pill-active' : '' }}">
            Todas
          </a>

          @foreach($categories as $cat)
            <a href="{{ route('store.category', $cat->slug) }}"
               class="nav-pill {{ ($currentCategorySafe?->id === $cat->id) ? 'nav-pill-active' : '' }}">
              {{ $cat->name }}
            </a>
          @endforeach
        </div>
      </div>
    </div>
  @endif

  {{-- Destacados --}}
  @if(($featuredProducts ?? collect())->count())
    <div class="mt-6 card">
      <div class="card-head flex items-center justify-between">
        <div class="font-black">Destacados</div>
        <a href="#top" class="link-soft">Top</a>
      </div>

      <div class="card-body">
        <div class="grid grid-flow-col gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 pr-4
              items-start snap-x snap-mandatory
              auto-cols-[calc((100%-2rem)/2.5)]
              md:auto-cols-[calc((100%-3rem)/4)]
              lg:auto-cols-[calc((100%-5rem)/6)]">
          @foreach($featuredProducts as $product)
            @php
              $hasStock = (int)($product->stock ?? 0) > 0;

              $img = null;
              if (!empty($product->image_path)) {
                $img = \Illuminate\Support\Str::startsWith($product->image_path, ['http://','https://'])
                  ? $product->image_path
                  : asset('storage/' . ltrim($product->image_path, '/'));
              }
            @endphp

            <div class="product-card product-card-featured">
              <a class="product-image" href="{{ route('store.product', $product->slug) }}">
                @if($img)
                  <img src="{{ $img }}" alt="{{ $product->name }}">
                @else
                  <div class="product-image-placeholder">Sin imagen</div>
                @endif
              </a>

              <div class="product-body">
                <a class="product-title" href="{{ route('store.product', $product->slug) }}">
                  {{ $product->name }}
                </a>

                <div class="product-row">
                  <div class="product-price">{{ $money($product->price) }}</div>

                  <div class="product-actions">
                    <span class="badge-stock {{ $hasStock ? 'is-in' : 'is-out' }}">
                      {{ $hasStock ? ('Stock: ' . (int)$product->stock) : 'Sin stock' }}
                    </span>


                    <form method="POST" action="{{ route('cart.add', $product) }}">
                      @csrf
                      <input type="hidden" name="quantity" value="1">

                      <button
                        type="submit"
                        class="btn-cart {{ $hasStock ? '' : 'is-disabled' }}"
                        {{ $hasStock ? '' : 'disabled' }}
                        aria-label="Agregar al carrito"
                        title="{{ $hasStock ? 'Agregar al carrito' : 'Sin stock' }}"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L22 7H6.2"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="10" cy="20" r="1.5"/>
                          <circle cx="18" cy="20" r="1.5"/>
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </div>
          @endforeach
        </div>
      </div>
    </div>
  @endif

  {{-- Productos --}}
  <div class="mt-8" id="productos">
    @if(($products ?? collect())->count())
      <div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">

        @foreach($products as $product)
          @php
            $hasStock = (int)($product->stock ?? 0) > 0;

            $img = null;
            if (!empty($product->image_path)) {
              $img = \Illuminate\Support\Str::startsWith($product->image_path, ['http://','https://'])
                ? $product->image_path
                : asset('storage/' . ltrim($product->image_path, '/'));
            }
          @endphp

          <div class="product-card product-card-grid">

            <a class="product-image" href="{{ route('store.product', $product->slug) }}">
              @if($img)
                <img src="{{ $img }}" alt="{{ $product->name }}">
              @else
                <div class="product-image-placeholder">Sin imagen</div>
              @endif
            </a>

            <div class="product-body">
              <a class="product-title" href="{{ route('store.product', $product->slug) }}">
                {{ $product->name }}
              </a>

              <div class="product-meta">
                {{ $product->category->name ?? '' }}
              </div>

              <div class="product-row">
                <div class="product-price">{{ $money($product->price) }}</div>

                <div class="product-actions">
                  <span class="badge-stock {{ $hasStock ? 'is-in' : 'is-out' }}">
                    {{ $hasStock ? ('Stock: ' . (int)$product->stock) : 'Sin stock' }}
                  </span>


                  <form method="POST" action="{{ route('cart.add', $product) }}">
                    @csrf
                    <input type="hidden" name="quantity" value="1">

                    <button
                      type="submit"
                      class="btn-cart {{ $hasStock ? '' : 'is-disabled' }}"
                      {{ $hasStock ? '' : 'disabled' }}
                      aria-label="Agregar al carrito"
                      title="{{ $hasStock ? 'Agregar al carrito' : 'Sin stock' }}"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L22 7H6.2"
                          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="10" cy="20" r="1.5"/>
                        <circle cx="18" cy="20" r="1.5"/>
                      </svg>
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        @endforeach
      </div>

      @if(method_exists($products, 'links'))
        <div class="mt-6">
          {{ $products->links() }}
        </div>
      @endif
    @else
      <div class="card">
        <div class="card-body">
          <div class="muted">No hay productos para mostrar.</div>
        </div>
      </div>
    @endif
  </div>

</div>
@endsection

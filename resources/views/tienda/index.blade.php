@extends('layouts.app')

@section('title', 'Tienda')

@section('content')
@php
  $currentCategorySafe = $currentCategory ?? ($category ?? null);
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $item) { $cartCount += (int)($item['quantity'] ?? 0); }

  $formAction = $currentCategorySafe
    ? route('store.category', ['category' => $currentCategorySafe->slug])
    : route('store.index');

  $qVal = (string)($filters['q'] ?? '');
  $sortVal = (string)($filters['sort'] ?? 'relevance');
  $storeHeroData = $storeHero ?? [];
  $showStoreFrontHero = empty($currentCategorySafe);
@endphp

<div id="top" class="container-page store-shell {{ $showStoreFrontHero ? 'store-shell--hero' : '' }}">
  @if($showStoreFrontHero)
    <section class="store-front-hero store-front-hero--fullbleed store-front-hero--flush reveal-item" style="background-image: url('{{ $storeHeroData['image'] ?? asset('brand/logo.png') }}');">
      <div aria-hidden="true"></div>
    </section>
  @else
    <div class="page-head store-hero">
      <div>
        <div class="page-title">Tienda</div>
        <div class="page-subtitle">Productos con stock real para retiro en local.</div>
      </div>

      <div class="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
        <a href="{{ route('cart.index') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">
          Ver carrito
          @if($cartCount > 0)
            <span class="badge-zinc ml-1">{{ $cartCount }}</span>
          @endif
        </a>
        <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Consultar reparacion</a>
      </div>
    </div>
  @endif

  @if(($categories ?? collect())->count())
    <div class="card reveal-item">
      <div class="card-body">
        @php
          $keep = [];
          if (request()->filled('q')) $keep['q'] = request('q');
          if (request()->filled('sort')) $keep['sort'] = request('sort');
        @endphp

        <div class="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 md:flex-wrap md:overflow-visible">
          <a href="{{ route('store.index', $keep) }}" class="nav-pill shrink-0 whitespace-nowrap {{ empty($currentCategorySafe) ? 'nav-pill-active' : '' }}">
            Todas
          </a>

          @foreach($categories as $cat)
            <a
              href="{{ route('store.category', ['category' => $cat->slug] + $keep) }}"
              class="nav-pill shrink-0 whitespace-nowrap {{ ($currentCategorySafe?->id === $cat->id) ? 'nav-pill-active' : '' }}"
            >
              {{ $cat->name }}
            </a>
          @endforeach
        </div>
      </div>
    </div>
  @endif

  <div class="card mt-4 store-toolbar" data-store-toolbar>
    <div class="card-body">
      <form method="GET" action="{{ $formAction }}" class="grid gap-3 md:grid-cols-12 md:items-end">
        <div class="md:col-span-7">
          <div class="text-xs font-black text-zinc-700">Buscar</div>
          <div
            class="relative mt-1"
            data-store-search
            data-store-suggestions-url="{{ route('store.suggestions') }}"
            data-store-search-category="{{ $currentCategorySafe?->slug ?? '' }}"
          >
            <input
              name="q"
              value="{{ $qVal }}"
              placeholder="Ej: iPhone, display, bateria..."
              autocomplete="off"
              data-store-search-input
              class="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 sm:text-sm"
            >

            <div
              class="absolute inset-x-0 top-full z-20 mt-2 hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-xl"
              data-store-search-panel
              aria-live="polite"
            >
              <div class="max-h-64 overflow-y-auto" data-store-search-list></div>
            </div>
          </div>
        </div>

        <div class="md:col-span-3">
          <div class="text-xs font-black text-zinc-700">Ordenar</div>
          <select
            name="sort"
            class="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 sm:text-sm"
          >
            <option value="relevance" {{ $sortVal === 'relevance' ? 'selected' : '' }}>Relevancia</option>
            <option value="newest" {{ $sortVal === 'newest' ? 'selected' : '' }}>Mas nuevos</option>
            <option value="price_asc" {{ $sortVal === 'price_asc' ? 'selected' : '' }}>Menor precio</option>
            <option value="price_desc" {{ $sortVal === 'price_desc' ? 'selected' : '' }}>Mayor precio</option>
            <option value="name_asc" {{ $sortVal === 'name_asc' ? 'selected' : '' }}>Nombre A-Z</option>
            <option value="name_desc" {{ $sortVal === 'name_desc' ? 'selected' : '' }}>Nombre Z-A</option>
            <option value="stock_desc" {{ $sortVal === 'stock_desc' ? 'selected' : '' }}>Mas stock</option>
          </select>
        </div>

        <div class="md:col-span-2 grid gap-2 sm:grid-cols-2 md:flex md:items-center">
          <button type="submit" class="btn-primary w-full justify-center">Aplicar</button>

          @if($qVal !== '' || ($sortVal !== 'relevance'))
            <a href="{{ $formAction }}" class="btn-outline w-full justify-center">Limpiar</a>
          @endif
        </div>
      </form>
    </div>
  </div>

  @if(($featuredProducts ?? collect())->count() && $qVal === '' && $sortVal === 'relevance')
    <div class="mt-6 card reveal-item">
      <div class="card-head flex items-center justify-between">
        <div class="font-black">Destacados</div>
        <a href="#productos" class="btn-ghost btn-sm">Ver todos</a>
      </div>

      <div class="card-body">
        <div class="grid grid-flow-col auto-cols-[78%] gap-3 overflow-x-auto overscroll-x-contain pb-2 pr-3 sm:auto-cols-[47%] md:auto-cols-[31%] lg:auto-cols-[19%]">
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

            <div class="product-card product-card-featured reveal-item">
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

  <div class="mt-8" id="productos">
    @if(($products ?? collect())->count())
      <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
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

          <div class="product-card product-card-grid reveal-item">
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

      @php
        $hasPaginator = method_exists($products, 'links');
        $hasPages = $hasPaginator && method_exists($products, 'hasPages') ? $products->hasPages() : false;
      @endphp

      @if($hasPaginator)
        <div class="mt-6 flex flex-col gap-2">
          @if(method_exists($products, 'total') && $products->total() > 0)
            <div class="muted text-sm">
              Mostrando {{ $products->firstItem() }}-{{ $products->lastItem() }} de {{ $products->total() }}
            </div>
          @endif

          @if($hasPages)
            <div>
              {{ $products->onEachSide(1)->fragment('productos')->links() }}
            </div>
          @endif
        </div>
      @endif
    @else
      <div class="card reveal-item">
        <div class="card-body space-y-3">
          @if($qVal !== '')
            <div class="font-black">Sin resultados</div>
            <div class="muted">
              No encontramos productos para "{{ $qVal }}"
              @if($currentCategorySafe) en "{{ $currentCategorySafe->name }}" @endif.
            </div>
            <div class="flex flex-wrap gap-2">
              <a class="btn-outline" href="{{ $formAction }}">Limpiar busqueda</a>
              @if($currentCategorySafe)
                <a class="btn-outline" href="{{ route('store.index') }}">Ver todas</a>
              @endif
            </div>
          @elseif($currentCategorySafe)
            <div class="font-black">Categoria sin productos</div>
            <div class="muted">Todavia no hay productos en "{{ $currentCategorySafe->name }}".</div>
            <div>
              <a class="btn-outline" href="{{ route('store.index') }}">Ver todas</a>
            </div>
          @else
            <div class="font-black">No hay productos</div>
            <div class="muted">Todavia no hay productos para mostrar.</div>
          @endif
        </div>
      </div>
    @endif
  </div>
</div>
<div data-react-store-search-suggestions data-root-selector="[data-store-search]"></div>
@endsection

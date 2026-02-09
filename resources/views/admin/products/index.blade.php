@extends('layouts.app')

@section('title', 'Admin — Productos')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $stockBadge = function($stock) {
    $stock = (int)($stock ?? 0);
    return $stock > 0 ? 'badge-emerald' : 'badge-rose';
  };

  $stockLabel = function($stock) {
    $stock = (int)($stock ?? 0);
    return $stock > 0 ? ('Stock: ' . $stock) : 'Sin stock';
  };

  $activeBadge = fn($active) => ((bool)$active) ? 'badge-emerald' : 'badge-zinc';
  $activeLabel = fn($active) => ((bool)$active) ? 'Activo' : 'Inactivo';

  $featuredBadge = fn($featured) => ((bool)$featured) ? 'badge-amber' : 'badge-zinc';
  $featuredLabel = fn($featured) => ((bool)$featured) ? 'Destacado' : 'Normal';

  $q = $q ?? '';
@endphp

@section('content')
<div class="space-y-6" data-admin-products>
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Productos</div>
      <div class="page-subtitle">Administrá tu catálogo (precio, stock, categoría e imagen).</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.categories.index') }}">Categorías</a>
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.products.create') }}">+ Nuevo producto</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  <div class="card">
    <div class="card-body">
      <form method="GET" class="flex flex-col sm:flex-row gap-2">
        <input name="q" value="{{ $q }}" placeholder="Buscar por nombre o slug…" class="h-11" />

        <select name="category_id" class="h-11 sm:w-56">
          <option value="" @selected(($category_id ?? '')==='')>Categoría: Todas</option>
          @foreach(($categories ?? collect()) as $c)
            <option value="{{ $c->id }}" @selected((string)($category_id ?? '') === (string)$c->id)>{{ $c->name }}</option>
          @endforeach
        </select>

        <select name="active" class="h-11 sm:w-44">
          <option value="" @selected(($active ?? '')==='')>Estado: Todos</option>
          <option value="1" @selected(($active ?? '')==='1')>Activos</option>
          <option value="0" @selected(($active ?? '')==='0')>Inactivos</option>
        </select>

        <select name="featured" class="h-11 sm:w-44">
          <option value="" @selected(($featured ?? '')==='')>Destacado: Todos</option>
          <option value="1" @selected(($featured ?? '')==='1')>Destacados</option>
          <option value="0" @selected(($featured ?? '')==='0')>No destacados</option>
        </select>

        <select name="stock" class="h-11 sm:w-48">
          <option value="" @selected($stock==='')>Stock: Todos</option>
          <option value="out" @selected($stock==='out')>Sin stock</option>
          <option value="low" @selected($stock==='low')>Stock bajo (≤ 5)</option>
        </select>

        <button class="btn-outline h-11 w-full justify-center sm:w-40" type="submit">Filtrar</button>

        @php
          $hasFilters =
            ($q ?? '') !== '' ||
            ($stock ?? '') !== '' ||
            ($category_id ?? '') !== '' ||
            ($active ?? '') !== '' ||
            ($featured ?? '') !== '';
        @endphp

        @if($hasFilters)
          <a class="btn-ghost h-11 w-full justify-center sm:w-40" href="{{ route('admin.products.index') }}">Limpiar</a>
        @endif
      </form>


    </div>
  </div>

  {{-- Bulk actions --}}
  <div class="card hidden" data-products-bulk-bar>
    <div class="card-body flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="text-sm text-zinc-600">
        <span class="font-black" data-bulk-count>0</span> seleccionados
      </div>

      <form method="POST" action="{{ route('admin.products.bulk') }}" class="flex flex-col sm:flex-row gap-2 sm:items-center" data-admin-products-bulk>
        @csrf

        <select name="action" class="h-11 sm:w-64" data-bulk-action>
          <option value="">Acción masiva…</option>
          <option value="activate">Activar</option>
          <option value="deactivate">Desactivar</option>
          <option value="feature">Marcar destacado</option>
          <option value="unfeature">Quitar destacado</option>
          <option value="stock_zero">Poner stock en 0</option>
          <option value="set_stock">Setear stock…</option>
          <option value="delete">Eliminar (si no tiene pedidos)</option>
        </select>

        <input type="number" name="stock" min="0" class="h-11 sm:w-40 hidden" placeholder="Stock" data-bulk-stock>

        <button type="submit" class="btn-primary h-11 w-full justify-center sm:w-40" data-bulk-apply disabled>Aplicar</button>
        <button type="button" class="btn-ghost h-11 w-full justify-center sm:w-40" data-bulk-clear>Limpiar</button>
      </form>
    </div>
  </div>

  {{-- Mobile (cards) --}}

  <div class="grid gap-3 md:hidden">
    @forelse($products as $p)
      <div class="card">
        <div class="card-body">
          <div class="flex gap-3">
            <div class="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              @if($p->image_url)
                <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
              @else
                <div class="h-full w-full grid place-items-center text-xs font-black text-zinc-400">Sin imagen</div>
              @endif
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate font-black text-zinc-900">{{ $p->name }}</div>
                  <div class="mt-1 text-xs text-zinc-500">Slug: <span class="font-semibold">{{ $p->slug }}</span></div>
                  <div class="mt-1 text-xs text-zinc-500">Categoría: <span class="font-semibold">{{ $p->category?->name ?? '—' }}</span></div>
                </div>
                <span class="{{ $stockBadge($p->stock) }} shrink-0" data-stock-label-for="{{ $p->id }}">
                  {{ $stockLabel($p->stock) }}
                </span>
              </div>

                <div class="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div class="text-lg font-black">{{ $money($p->price) }}</div>

                  <div class="flex items-center gap-2 flex-wrap justify-start">
                    <form method="POST"
                          action="{{ route('admin.products.toggleActive', $p) }}"
                          data-admin-product-toggle="active"
                          class="inline">
                      @csrf
                      <button type="submit" class="{{ $activeBadge($p->active) }} h-10 justify-center hover:opacity-90 transition" data-toggle-btn>
                        {{ $activeLabel($p->active) }}
                      </button>
                    </form>

                    <form method="POST"
                          action="{{ route('admin.products.toggleFeatured', $p) }}"
                          data-admin-product-toggle="featured"
                          class="inline">
                      @csrf
                      <button type="submit" class="{{ $featuredBadge($p->featured) }} h-10 justify-center hover:opacity-90 transition" data-toggle-btn>
                        {{ $featuredLabel($p->featured) }}
                      </button>
                    </form>

                    <a class="btn-outline btn-sm h-10 justify-center" href="{{ route('admin.products.edit', $p) }}">Editar</a>
                  </div>
                </div>

                <form method="POST"
                      action="{{ route('admin.products.updateStock', $p) }}"
                      data-admin-product-stock
                      data-product-id="{{ $p->id }}"
                      class="mt-2 flex items-center gap-2 flex-wrap">
                  @csrf
                  <input type="number"
                        name="stock"
                        min="0"
                        value="{{ (int)$p->stock }}"
                        class="!w-28 h-10 text-right"
                        data-stock-input-for="{{ $p->id }}">
                  <button type="submit" class="btn-outline btn-sm h-10 justify-center">Guardar stock</button>
                </form>
            </div>
          </div>
        </div>
      </div>
    @empty
      <div class="card"><div class="card-body text-sm text-zinc-600">No hay productos todavía.</div></div>
    @endforelse
  </div>

  {{-- Desktop (table) --}}
  <div class="card hidden md:block">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="w-10">
              <input type="checkbox" class="h-4 w-4 rounded border-zinc-300" data-bulk-select-all>
            </th>
            <th>Producto</th>
            <th>Categoría</th>
            <th class="hidden lg:table-cell">Slug</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Stock</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          @forelse($products as $p)
            <tr>
              <td class="align-top">
                <input type="checkbox" value="{{ $p->id }}" class="h-4 w-4 rounded border-zinc-300" data-bulk-checkbox>
              </td>
              <td>
                <div class="flex items-center gap-3">

                  <div class="h-10 w-10 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                    @if($p->image_url)
                      <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
                    @endif
                  </div>
                  <div class="min-w-0">
                    <div class="truncate font-black text-zinc-900">{{ $p->name }}</div>
                    <div class="text-xs text-zinc-500">ID: {{ $p->id }}</div>
                  </div>
                </div>
              </td>
              <td class="font-semibold text-zinc-700">{{ $p->category?->name ?? '—' }}</td>
              <td class="hidden lg:table-cell text-zinc-700">{{ $p->slug }}</td>
              <td class="text-right font-black">{{ $money($p->price) }}</td>
              <td class="text-right">
                <form method="POST"
                      action="{{ route('admin.products.updateStock', $p) }}"
                      data-admin-product-stock
                      data-product-id="{{ $p->id }}"
                      class="inline-flex items-center justify-end gap-2">
                  @csrf
                  <span class="{{ $stockBadge($p->stock) }}" data-stock-label-for="{{ $p->id }}">
                    {{ $stockLabel($p->stock) }}
                  </span>


                  <input type="number"
                        name="stock"
                        min="0"
                        value="{{ (int)$p->stock }}"
                        class="!w-24 text-right"
                        data-stock-input-for="{{ $p->id }}">
                  <button type="submit" class="btn-outline btn-sm">OK</button>
                </form>
              </td>

              <td class="text-right">
                <div class="inline-flex items-center justify-end gap-2">
                  <form method="POST"
                        action="{{ route('admin.products.toggleActive', $p) }}"
                        data-admin-product-toggle="active"
                        class="inline">
                    @csrf
                    <button type="submit" class="{{ $activeBadge($p->active) }} hover:opacity-90 transition" data-toggle-btn>
                      {{ $activeLabel($p->active) }}
                    </button>
                  </form>

                  <form method="POST"
                        action="{{ route('admin.products.toggleFeatured', $p) }}"
                        data-admin-product-toggle="featured"
                        class="inline">
                    @csrf
                    <button type="submit" class="{{ $featuredBadge($p->featured) }} hover:opacity-90 transition" data-toggle-btn>
                      {{ $featuredLabel($p->featured) }}
                    </button>
                  </form>

                  <a class="btn-outline btn-sm" href="{{ route('admin.products.edit', $p) }}">Editar</a>
                </div>
              </td>

            </tr>
          @empty
            <tr><td colspan="6" class="py-8 text-center text-zinc-500">No hay productos.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div>
    {{ $products->links() }}
  </div>
</div>
@endsection

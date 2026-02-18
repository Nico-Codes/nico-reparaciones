@extends('layouts.app')

@section('title', 'Admin - Productos')

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

  $marginPercent = function ($cost, $sale) {
    $cost = (int) ($cost ?? 0);
    $sale = (int) ($sale ?? 0);
    if ($cost <= 0) return null;
    return round((($sale - $cost) / $cost) * 100, 1);
  };

  $marginBadge = function ($cost, $sale) {
    $cost = (int) ($cost ?? 0);
    $sale = (int) ($sale ?? 0);
    if ($cost <= 0) return 'badge-zinc';
    if ($sale > $cost) return 'badge-emerald';
    if ($sale === $cost) return 'badge-amber';
    return 'badge-rose';
  };

  $marginLabel = function ($cost, $sale) use ($marginPercent) {
    $m = $marginPercent($cost, $sale);
    if ($m === null) return 'Margen: N/A';
    if ($m > 0) return 'Margen: +' . rtrim(rtrim(number_format($m, 1, '.', ''), '0'), '.') . '%';
    return 'Margen: ' . rtrim(rtrim(number_format($m, 1, '.', ''), '0'), '.') . '%';
  };

  $q = $q ?? '';
@endphp

@section('content')
<div class="store-shell space-y-6" data-admin-products>
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0">
      <div class="page-title">Productos</div>
      <div class="page-subtitle">Administra catalogo con identificacion por SKU y codigo de barras.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.categories.index') }}">Categorias</a>
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.products.create') }}">+ Nuevo producto</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  <div class="card reveal-item">
    <div class="card-body">
      <form method="GET" class="flex flex-col sm:flex-row gap-2">
        <input name="q" value="{{ $q }}" placeholder="Buscar por nombre, slug, SKU o barcode..." class="h-11" />

        <select name="category_id" class="h-11 sm:w-56">
          <option value="" @selected(($category_id ?? '')==='')>Categoria: Todas</option>
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
          <option value="low" @selected($stock==='low')>Stock bajo (<= 5)</option>
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

  <div class="card reveal-item hidden" data-products-bulk-bar>
    <div class="card-body flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="text-sm text-zinc-600">
        <span class="font-black" data-bulk-count>0</span> seleccionados
      </div>

      <form method="POST" action="{{ route('admin.products.bulk') }}" class="flex flex-col sm:flex-row gap-2 sm:items-center" data-admin-products-bulk>
        @csrf

        <select name="action" class="h-11 sm:w-64" data-bulk-action>
          <option value="">Accion masiva...</option>
          <option value="activate">Activar</option>
          <option value="deactivate">Desactivar</option>
          <option value="feature">Marcar destacado</option>
          <option value="unfeature">Quitar destacado</option>
          <option value="stock_zero">Poner stock en 0</option>
          <option value="set_stock">Setear stock...</option>
          <option value="delete">Eliminar (si no tiene pedidos)</option>
        </select>

        <input type="number" name="stock" min="0" class="h-11 sm:w-40 hidden" placeholder="Stock" data-bulk-stock>
        <button type="submit" class="btn-primary h-11 w-full justify-center sm:w-40" data-bulk-apply disabled>Aplicar</button>
        <button type="button" class="btn-ghost h-11 w-full justify-center sm:w-40" data-bulk-clear>Limpiar</button>
      </form>
    </div>
  </div>

  <div class="grid gap-3 md:hidden">
    @forelse($products as $p)
      @php
        $margin = $marginPercent($p->cost_price, $p->price);
      @endphp
      <div class="card reveal-item">
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
                  <div class="mt-1 text-xs text-zinc-500">SKU: <span class="font-semibold">{{ $p->sku ?: '-' }}</span></div>
                  <div class="mt-1 text-xs text-zinc-500">Barcode: <span class="font-semibold">{{ $p->barcode ?: '-' }}</span></div>
                  <div class="mt-1 text-xs text-zinc-500">Proveedor: <span class="font-semibold">{{ $p->supplier?->name ?: '-' }}</span></div>
                  <div class="mt-1 text-xs text-zinc-500">Categoria: <span class="font-semibold">{{ $p->category?->name ?: '-' }}</span></div>
                </div>
                <span class="{{ $stockBadge($p->stock) }} shrink-0" data-stock-label-for="{{ $p->id }}">{{ $stockLabel($p->stock) }}</span>
              </div>

              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <div class="text-xs text-zinc-500">Venta</div>
                  <div class="text-lg font-black">{{ $money($p->price) }}</div>
                </div>
                <div>
                  <div class="text-xs text-zinc-500">Costo</div>
                  <div class="text-lg font-black text-zinc-700">{{ $money($p->cost_price) }}</div>
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2 flex-wrap">
                <span class="{{ $marginBadge($p->cost_price, $p->price) }}">{{ $marginLabel($p->cost_price, $p->price) }}</span>
                @if($margin !== null)
                  <span class="text-xs font-semibold {{ ((int)$p->price - (int)$p->cost_price) >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">
                    Utilidad: {{ $money(((int)$p->price - (int)$p->cost_price)) }}
                  </span>
                @endif
              </div>

              <div class="mt-3 flex items-center gap-2 flex-wrap justify-start">
                <form method="POST" action="{{ route('admin.products.toggleActive', $p) }}" data-admin-product-toggle="active" class="inline">
                  @csrf
                  <button type="submit" class="{{ $activeBadge($p->active) }} h-10 justify-center hover:opacity-90 transition" data-toggle-btn>{{ $activeLabel($p->active) }}</button>
                </form>

                <form method="POST" action="{{ route('admin.products.toggleFeatured', $p) }}" data-admin-product-toggle="featured" class="inline">
                  @csrf
                  <button type="submit" class="{{ $featuredBadge($p->featured) }} h-10 justify-center hover:opacity-90 transition" data-toggle-btn>{{ $featuredLabel($p->featured) }}</button>
                </form>

                <a class="btn-outline btn-sm h-10 justify-center" href="{{ route('admin.products.label', $p) }}" target="_blank" rel="noopener">Etiqueta</a>
                <a class="btn-outline btn-sm h-10 justify-center" href="{{ route('admin.products.edit', $p) }}">Editar</a>
              </div>

              <form method="POST" action="{{ route('admin.products.updateStock', $p) }}" data-admin-product-stock data-product-id="{{ $p->id }}" class="mt-2 flex items-center gap-2 flex-wrap">
                @csrf
                <input type="number" name="stock" min="0" value="{{ (int)$p->stock }}" class="!w-28 h-10 text-right" data-stock-input-for="{{ $p->id }}">
                <button type="submit" class="btn-outline btn-sm h-10 justify-center">Guardar stock</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    @empty
      <div class="card reveal-item"><div class="card-body text-sm text-zinc-600">No hay productos todavia.</div></div>
    @endforelse
  </div>

  <div class="card reveal-item hidden md:block">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th class="w-10"><input type="checkbox" class="h-4 w-4 rounded border-zinc-300" data-bulk-select-all></th>
            <th>Producto</th>
            <th>SKU</th>
            <th>Barcode</th>
            <th>Categoria</th>
            <th>Proveedor</th>
            <th class="text-right">Costo</th>
            <th class="text-right">Venta</th>
            <th class="text-right">Margen</th>
            <th class="text-right">Stock</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          @forelse($products as $p)
            @php $margin = $marginPercent($p->cost_price, $p->price); @endphp
            <tr>
              <td class="align-top"><input type="checkbox" value="{{ $p->id }}" class="h-4 w-4 rounded border-zinc-300" data-bulk-checkbox></td>
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
              <td class="font-semibold text-zinc-700">{{ $p->sku ?: '-' }}</td>
              <td class="font-semibold text-zinc-700">{{ $p->barcode ?: '-' }}</td>
              <td class="font-semibold text-zinc-700">{{ $p->category?->name ?: '-' }}</td>
              <td class="font-semibold text-zinc-700">{{ $p->supplier?->name ?: '-' }}</td>
              <td class="text-right font-black text-zinc-700">{{ $money($p->cost_price) }}</td>
              <td class="text-right font-black">{{ $money($p->price) }}</td>
              <td class="text-right">
                <div class="inline-flex flex-col items-end gap-1">
                  <span class="{{ $marginBadge($p->cost_price, $p->price) }}">{{ $marginLabel($p->cost_price, $p->price) }}</span>
                  @if($margin !== null)
                    <span class="text-xs font-semibold {{ ((int)$p->price - (int)$p->cost_price) >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">{{ $money(((int)$p->price - (int)$p->cost_price)) }}</span>
                  @endif
                </div>
              </td>
              <td class="text-right">
                <form method="POST" action="{{ route('admin.products.updateStock', $p) }}" data-admin-product-stock data-product-id="{{ $p->id }}" class="inline-flex items-center justify-end gap-2">
                  @csrf
                  <span class="{{ $stockBadge($p->stock) }}" data-stock-label-for="{{ $p->id }}">{{ $stockLabel($p->stock) }}</span>
                  <input type="number" name="stock" min="0" value="{{ (int)$p->stock }}" class="!w-24 text-right" data-stock-input-for="{{ $p->id }}">
                  <button type="submit" class="btn-outline btn-sm">OK</button>
                </form>
              </td>
              <td class="text-right">
                <div class="inline-flex items-center justify-end gap-2">
                  <form method="POST" action="{{ route('admin.products.toggleActive', $p) }}" data-admin-product-toggle="active" class="inline">
                    @csrf
                    <button type="submit" class="{{ $activeBadge($p->active) }} hover:opacity-90 transition" data-toggle-btn>{{ $activeLabel($p->active) }}</button>
                  </form>

                  <form method="POST" action="{{ route('admin.products.toggleFeatured', $p) }}" data-admin-product-toggle="featured" class="inline">
                    @csrf
                    <button type="submit" class="{{ $featuredBadge($p->featured) }} hover:opacity-90 transition" data-toggle-btn>{{ $featuredLabel($p->featured) }}</button>
                  </form>

                  <a class="btn-outline btn-sm" href="{{ route('admin.products.label', $p) }}" target="_blank" rel="noopener">Etiqueta</a>
                  <a class="btn-outline btn-sm" href="{{ route('admin.products.edit', $p) }}">Editar</a>
                </div>
              </td>
            </tr>
          @empty
            <tr><td colspan="11" class="py-8 text-center text-zinc-500">No hay productos.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div>
    {{ $products->links() }}
  </div>
</div>
<div data-react-admin-quick-actions-enhancements></div>
@endsection

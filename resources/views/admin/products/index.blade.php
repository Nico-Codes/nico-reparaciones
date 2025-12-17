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

  $q = $q ?? '';
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Productos</div>
      <div class="page-subtitle">Administrá tu catálogo (precio, stock, categoría e imagen).</div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-outline" href="{{ route('admin.categories.index') }}">Categorías</a>
      <a class="btn-primary" href="{{ route('admin.products.create') }}">+ Nuevo producto</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  <div class="card">
    <div class="card-body">
      <form method="GET" class="flex flex-col sm:flex-row gap-2">
        <input name="q" value="{{ $q }}" placeholder="Buscar por nombre o slug…" />
        <button class="btn-outline sm:w-40" type="submit">Buscar</button>
        @if($q !== '')
          <a class="btn-ghost sm:w-40" href="{{ route('admin.products.index') }}">Limpiar</a>
        @endif
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
                <span class="{{ $stockBadge($p->stock) }} shrink-0">{{ $stockLabel($p->stock) }}</span>
              </div>

              <div class="mt-3 flex items-center justify-between gap-2">
                <div class="text-lg font-black">{{ $money($p->price) }}</div>
                <a class="btn-outline btn-sm" href="{{ route('admin.products.edit', $p) }}">Editar</a>
              </div>
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
              <td class="text-right"><span class="{{ $stockBadge($p->stock) }}">{{ $stockLabel($p->stock) }}</span></td>
              <td class="text-right">
                <a class="btn-outline btn-sm" href="{{ route('admin.products.edit', $p) }}">Editar</a>
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

@extends('layouts.app')

@section('title', 'Admin — Productos')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $stockBadge = function($stock) {
    $s = (int)($stock ?? 0);
    return match(true) {
      $s <= 0 => 'badge-rose',
      $s <= 3 => 'badge-amber',
      default => 'badge-emerald',
    };
  };

  $stockLabel = function($stock) {
    $s = (int)($stock ?? 0);
    return match(true) {
      $s <= 0 => 'Sin stock',
      $s <= 3 => 'Bajo',
      default => 'OK',
    };
  };
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="page-head">
    <div class="page-title">Productos</div>
    <div class="page-subtitle">Administrá tu catálogo: precio, stock, categoría e imagen.</div>
  </div>

  @if(session('success'))
    <div class="alert-success mb-4">{{ session('success') }}</div>
  @endif
  @if(session('error'))
    <div class="alert-error mb-4">{{ session('error') }}</div>
  @endif

  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
    <form method="GET" action="{{ route('admin.products.index') }}" class="flex gap-2">
      <input
        name="q"
        value="{{ $q ?? '' }}"
        placeholder="Buscar por nombre o slug…"
        class="w-full sm:w-80">
      <button class="btn-outline" type="submit">Buscar</button>

      @if(!empty($q))
        <a href="{{ route('admin.products.index') }}" class="btn-ghost">Limpiar</a>
      @endif
    </form>

    <a href="{{ route('admin.products.create') }}" class="btn-primary">+ Nuevo</a>
  </div>

  {{-- MOBILE: cards --}}
  <div class="grid gap-3 md:hidden">
    @forelse($products as $p)
      <div class="card">
        <div class="card-body">
          <div class="flex items-start gap-3">
            <div class="h-14 w-14 shrink-0 rounded-2xl border border-zinc-100 bg-zinc-50 overflow-hidden flex items-center justify-center">
              @if($p->image_url)
                <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
              @else
                <span class="text-lg">🧩</span>
              @endif
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-black text-zinc-900 truncate">{{ $p->name }}</div>
                  <div class="text-xs text-zinc-500 mt-1 truncate">
                    {{ $p->category?->name ?? 'Sin categoría' }} · <span class="font-bold">{{ $p->slug }}</span>
                  </div>
                </div>

                <div class="relative">
                  <button class="btn-ghost btn-sm" type="button" data-menu="prodMenuM-{{ $p->id }}" aria-expanded="false">⋯</button>
                  <div id="prodMenuM-{{ $p->id }}" class="dropdown-menu hidden">
                    <a href="{{ route('admin.products.edit', $p) }}" class="dropdown-item">Editar</a>

                    <form method="POST" action="{{ route('admin.products.destroy', $p) }}"
                          onsubmit="return confirm('¿Eliminar este producto?');">
                      @csrf
                      @method('DELETE')
                      <button type="submit" class="dropdown-item">Eliminar</button>
                    </form>
                  </div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="rounded-2xl border border-zinc-100 bg-white p-3">
                  <div class="text-xs text-zinc-500">Precio</div>
                  <div class="font-black text-zinc-900">{{ $money($p->price) }}</div>
                </div>

                <div class="rounded-2xl border border-zinc-100 bg-white p-3">
                  <div class="text-xs text-zinc-500">Stock</div>
                  <div class="flex items-center justify-between">
                    <div class="font-black text-zinc-900">{{ (int)$p->stock }}</div>
                    <span class="{{ $stockBadge($p->stock) }}">{{ $stockLabel($p->stock) }}</span>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex gap-2">
                <a href="{{ route('admin.products.edit', $p) }}" class="btn-outline btn-sm">Editar</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">No hay productos.</div>
          <div class="muted mt-1">Creá el primero para que se muestre en la tienda.</div>
          <div class="mt-4">
            <a href="{{ route('admin.products.create') }}" class="btn-primary">+ Nuevo producto</a>
          </div>
        </div>
      </div>
    @endforelse
  </div>

  {{-- DESKTOP: table --}}
  <div class="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-[900px] w-full text-sm">
        <thead class="bg-zinc-50">
          <tr class="text-left">
            <th class="px-4 py-3">Producto</th>
            <th class="px-4 py-3">Categoría</th>
            <th class="px-4 py-3">Precio</th>
            <th class="px-4 py-3">Stock</th>
            <th class="px-4 py-3">Actualizado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($products as $p)
            <tr class="border-t border-zinc-100 hover:bg-zinc-50">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 shrink-0 rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden flex items-center justify-center">
                    @if($p->image_url)
                      <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
                    @else
                      <span>🧩</span>
                    @endif
                  </div>
                  <div class="min-w-0">
                    <div class="font-black text-zinc-900 truncate">{{ $p->name }}</div>
                    <div class="text-xs text-zinc-500 truncate">{{ $p->slug }}</div>
                  </div>
                </div>
              </td>

              <td class="px-4 py-3">
                {{ $p->category?->name ?? '—' }}
              </td>

              <td class="px-4 py-3 font-black">
                {{ $money($p->price) }}
              </td>

              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-black text-zinc-900">{{ (int)$p->stock }}</span>
                  <span class="{{ $stockBadge($p->stock) }}">{{ $stockLabel($p->stock) }}</span>
                </div>
              </td>

              <td class="px-4 py-3 text-zinc-600">
                {{ $p->updated_at?->format('d/m/Y H:i') }}
              </td>

              <td class="px-4 py-3 text-right">
                <div class="relative inline-block text-left">
                  <button class="btn-ghost btn-sm" type="button" data-menu="prodMenu-{{ $p->id }}" aria-expanded="false">⋯</button>
                  <div id="prodMenu-{{ $p->id }}" class="dropdown-menu hidden">
                    <a href="{{ route('admin.products.edit', $p) }}" class="dropdown-item">Editar</a>

                    <form method="POST" action="{{ route('admin.products.destroy', $p) }}"
                          onsubmit="return confirm('¿Eliminar este producto?');">
                      @csrf
                      @method('DELETE')
                      <button type="submit" class="dropdown-item">Eliminar</button>
                    </form>
                  </div>
                </div>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="6" class="px-4 py-10 text-center text-zinc-500">No hay productos.</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  {{-- Paginación --}}
  @if(is_object($products) && method_exists($products, 'links'))
    <div class="mt-6">
      {{ $products->links() }}
    </div>
  @endif
</div>
@endsection

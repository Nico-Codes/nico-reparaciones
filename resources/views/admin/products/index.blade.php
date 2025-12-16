@extends('layouts.app')

@section('title', 'Admin — Productos')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-xl font-black tracking-tight">Productos</h1>
      <p class="mt-1 text-sm text-zinc-600">Administrá tu catálogo: precio, stock, categoría e imagen.</p>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <form method="GET" class="flex gap-2">
        <input name="q" value="{{ $q ?? '' }}" placeholder="Buscar por nombre o slug…"
               class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:w-72">
        <button class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
          Buscar
        </button>
      </form>

      <a href="{{ route('admin.products.create') }}"
         class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[.99]">
        + Nuevo producto
      </a>
    </div>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  {{-- Mobile cards --}}
  <div class="mt-5 grid gap-3 md:hidden">
    @forelse($products as $p)
      <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="flex gap-3">
          <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            @if($p->image_url)
              <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
            @else
              <div class="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400">Sin imagen</div>
            @endif
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="truncate font-black">{{ $p->name }}</div>
                <div class="mt-1 text-xs text-zinc-500">Slug: <span class="font-semibold">{{ $p->slug }}</span></div>
                <div class="mt-1 text-xs text-zinc-500">
                  Categoría: <span class="font-semibold">{{ $p->category?->name ?? '—' }}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-zinc-500">Stock</div>
                <div class="font-black {{ (int)$p->stock <= 0 ? 'text-rose-600' : 'text-zinc-900' }}">{{ (int)$p->stock }}</div>
              </div>
            </div>

            <div class="mt-2 flex items-center justify-between">
              <div class="text-sm font-black">{{ $money($p->price) }}</div>
              <a href="{{ route('admin.products.edit', $p) }}"
                 class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
                Editar
              </a>
            </div>
          </div>
        </div>
      </div>
    @empty
      <div class="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        No hay productos todavía.
      </div>
    @endforelse
  </div>

  {{-- Desktop table --}}
  <div class="mt-5 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th class="px-4 py-3 text-left">Producto</th>
            <th class="px-4 py-3 text-left">Categoría</th>
            <th class="px-4 py-3 text-left">Slug</th>
            <th class="px-4 py-3 text-right">Precio</th>
            <th class="px-4 py-3 text-right">Stock</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          @forelse($products as $p)
            <tr class="hover:bg-zinc-50/70">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    @if($p->image_url)
                      <img src="{{ $p->image_url }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
                    @endif
                  </div>
                  <div class="min-w-0">
                    <div class="truncate font-black">{{ $p->name }}</div>
                    <div class="text-xs text-zinc-500">ID: {{ $p->id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 font-semibold text-zinc-700">{{ $p->category?->name ?? '—' }}</td>
              <td class="px-4 py-3 text-zinc-700">{{ $p->slug }}</td>
              <td class="px-4 py-3 text-right font-black">{{ $money($p->price) }}</td>
              <td class="px-4 py-3 text-right font-black {{ (int)$p->stock <= 0 ? 'text-rose-600' : 'text-zinc-900' }}">
                {{ (int)$p->stock }}
              </td>
              <td class="px-4 py-3 text-right">
                <a href="{{ route('admin.products.edit', $p) }}"
                   class="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
                  Editar
                </a>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="6" class="px-4 py-8 text-center text-zinc-500">No hay productos.</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div class="mt-6">
    {{ $products->links() }}
  </div>
</div>
@endsection

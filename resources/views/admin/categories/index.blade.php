@extends('layouts.app')

@section('title', 'Admin — Categorías')

@section('content')
@php
  $count = $categories->count();
@endphp

<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-xl font-black tracking-tight">Categorías</h1>
      <p class="mt-1 text-sm text-zinc-600">Organizá tu catálogo. Total: <span class="font-semibold">{{ $count }}</span></p>
    </div>

    <a href="{{ route('admin.categories.create') }}"
       class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[.99]">
      + Nueva categoría
    </a>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  <div class="mt-5 grid gap-3 md:hidden">
    @forelse($categories as $c)
      <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs text-zinc-500">Categoría</div>
            <div class="flex items-center gap-2">
              @if($c->icon)
                <span class="text-lg">{{ $c->icon }}</span>
              @endif
              <div class="font-black">{{ $c->name }}</div>
            </div>
            <div class="mt-1 text-sm text-zinc-600">
              <span class="text-zinc-500">Slug:</span> <span class="font-semibold">{{ $c->slug }}</span>
            </div>
            @if($c->description)
              <div class="mt-1 text-sm text-zinc-600">{{ $c->description }}</div>
            @endif
          </div>

          <div class="text-right">
            <div class="text-xs text-zinc-500">Productos</div>
            <div class="font-black">{{ $c->products_count ?? 0 }}</div>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <a href="{{ route('admin.categories.edit', $c) }}"
             class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
            Editar
          </a>

          <form method="POST" action="{{ route('admin.categories.destroy', $c) }}"
                onsubmit="return confirm('¿Eliminar categoría? Esto puede afectar el catálogo.');">
            @csrf
            @method('DELETE')
            <button class="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
              Eliminar
            </button>
          </form>
        </div>
      </div>
    @empty
      <div class="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        No hay categorías todavía.
      </div>
    @endforelse
  </div>

  <div class="mt-5 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Slug</th>
            <th class="px-4 py-3 text-left">Descripción</th>
            <th class="px-4 py-3 text-right">Productos</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          @forelse($categories as $c)
            <tr class="hover:bg-zinc-50/70">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  @if($c->icon)
                    <span class="text-lg">{{ $c->icon }}</span>
                  @endif
                  <div class="font-black">{{ $c->name }}</div>
                </div>
              </td>
              <td class="px-4 py-3 font-semibold text-zinc-700">{{ $c->slug }}</td>
              <td class="px-4 py-3 text-zinc-700">{{ $c->description ?: '—' }}</td>
              <td class="px-4 py-3 text-right font-black">{{ $c->products_count ?? 0 }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <a href="{{ route('admin.categories.edit', $c) }}"
                     class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
                    Editar
                  </a>

                  <form method="POST" action="{{ route('admin.categories.destroy', $c) }}"
                        onsubmit="return confirm('¿Eliminar categoría? Esto puede afectar el catálogo.');">
                    @csrf
                    @method('DELETE')
                    <button class="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                      Eliminar
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="5" class="px-4 py-8 text-center text-zinc-500">No hay categorías.</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

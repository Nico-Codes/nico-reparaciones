@extends('layouts.app')

@section('title', 'Admin — Categorías')

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="page-head">
    <div class="page-title">Categorías</div>
    <div class="page-subtitle">Organizá el catálogo de la tienda por categorías.</div>
  </div>

  @if(session('success'))
    <div class="alert-success mb-4">{{ session('success') }}</div>
  @endif
  @if(session('error'))
    <div class="alert-error mb-4">{{ session('error') }}</div>
  @endif

  <div class="flex items-center justify-between mb-4">
    <div class="text-sm text-zinc-600">
      Total: <span class="font-black text-zinc-900">{{ is_countable($categories) ? count($categories) : 0 }}</span>
    </div>

    <a href="{{ route('admin.categories.create') }}" class="btn-primary">+ Nueva</a>
  </div>

  {{-- MOBILE: cards --}}
  <div class="grid gap-3 md:hidden">
    @forelse($categories as $c)
      <div class="card">
        <div class="card-body">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="font-black text-zinc-900 truncate">{{ $c->name }}</div>
              <div class="text-xs text-zinc-500 mt-1 truncate">
                Slug: <span class="font-bold text-zinc-800">{{ $c->slug }}</span>
              </div>
              <div class="mt-2">
                <span class="badge-sky">{{ (int)($c->products_count ?? 0) }} productos</span>
              </div>
            </div>

            <div class="relative">
              <button class="btn-ghost btn-sm" type="button" data-menu="catMenuM-{{ $c->id }}" aria-expanded="false">⋯</button>
              <div id="catMenuM-{{ $c->id }}" class="dropdown-menu hidden">
                <a href="{{ route('admin.categories.edit', $c) }}" class="dropdown-item">Editar</a>

                <form method="POST" action="{{ route('admin.categories.destroy', $c) }}"
                      onsubmit="return confirm('¿Eliminar esta categoría?');">
                  @csrf
                  @method('DELETE')
                  <button type="submit" class="dropdown-item">Eliminar</button>
                </form>
              </div>
            </div>
          </div>

          @if(!empty($c->description))
            <div class="mt-3 text-sm text-zinc-700">
              {{ $c->description }}
            </div>
          @endif

          <div class="mt-4 flex gap-2">
            <a href="{{ route('admin.categories.edit', $c) }}" class="btn-outline btn-sm">Editar</a>
          </div>
        </div>
      </div>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">No hay categorías.</div>
          <div class="muted mt-1">Creá categorías para ordenar la tienda.</div>
          <div class="mt-4">
            <a href="{{ route('admin.categories.create') }}" class="btn-primary">+ Nueva categoría</a>
          </div>
        </div>
      </div>
    @endforelse
  </div>

  {{-- DESKTOP: table --}}
  <div class="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-[820px] w-full text-sm">
        <thead class="bg-zinc-50">
          <tr class="text-left">
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">Productos</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($categories as $c)
            <tr class="border-t border-zinc-100 hover:bg-zinc-50">
              <td class="px-4 py-3 font-black text-zinc-900">{{ $c->name }}</td>
              <td class="px-4 py-3 text-zinc-700">{{ $c->slug }}</td>
              <td class="px-4 py-3">
                <span class="badge-sky">{{ (int)($c->products_count ?? 0) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="relative inline-block text-left">
                  <button class="btn-ghost btn-sm" type="button" data-menu="catMenu-{{ $c->id }}" aria-expanded="false">⋯</button>
                  <div id="catMenu-{{ $c->id }}" class="dropdown-menu hidden">
                    <a href="{{ route('admin.categories.edit', $c) }}" class="dropdown-item">Editar</a>

                    <form method="POST" action="{{ route('admin.categories.destroy', $c) }}"
                          onsubmit="return confirm('¿Eliminar esta categoría?');">
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
              <td colspan="4" class="px-4 py-10 text-center text-zinc-500">No hay categorías.</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Categorías')

@php
  $count = isset($categories) ? $categories->count() : 0;
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Categorías</div>
      <div class="page-subtitle">Organizá tu catálogo. Total: <span class="font-black">{{ $count }}</span></div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-outline" href="{{ route('admin.products.index') }}">Productos</a>
      <a class="btn-primary" href="{{ route('admin.categories.create') }}">+ Nueva categoría</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  {{-- Mobile (cards) --}}
  <div class="grid gap-3 md:hidden">
    @forelse($categories as $c)
      <div class="card">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                @if($c->icon)
                  <span class="text-lg">{{ $c->icon }}</span>
                @endif
                <div class="truncate font-black text-zinc-900">{{ $c->name }}</div>
              </div>
              <div class="mt-1 text-xs text-zinc-500">Slug: <span class="font-semibold">{{ $c->slug }}</span></div>
              @if($c->description)
                <div class="mt-2 text-sm text-zinc-700">{{ $c->description }}</div>
              @endif
            </div>

            <span class="badge-zinc shrink-0">Productos: {{ $c->products_count ?? 0 }}</span>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <a class="btn-outline btn-sm" href="{{ route('admin.categories.edit', $c) }}">Editar</a>
            <form method="POST" action="{{ route('admin.categories.destroy', $c) }}" onsubmit="return confirm('¿Eliminar categoría? Esto puede afectar el catálogo.');">
              @csrf
              @method('DELETE')
              <button class="btn-danger btn-sm" type="submit">Eliminar</button>
            </form>
          </div>
        </div>
      </div>
    @empty
      <div class="card"><div class="card-body text-sm text-zinc-600">No hay categorías todavía.</div></div>
    @endforelse
  </div>

  {{-- Desktop (table) --}}
  <div class="card hidden md:block">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Slug</th>
            <th class="hidden lg:table-cell">Descripción</th>
            <th class="text-right">Productos</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($categories as $c)
            <tr>
              <td>
                <div class="flex items-center gap-2">
                  @if($c->icon)
                    <span class="text-lg">{{ $c->icon }}</span>
                  @endif
                  <div class="font-black text-zinc-900">{{ $c->name }}</div>
                </div>
              </td>
              <td class="font-semibold text-zinc-700">{{ $c->slug }}</td>
              <td class="hidden lg:table-cell text-zinc-700">{{ $c->description ?: '—' }}</td>
              <td class="text-right"><span class="badge-zinc">{{ $c->products_count ?? 0 }}</span></td>
              <td class="text-right">
                <div class="inline-flex gap-2">
                  <a class="btn-outline btn-sm" href="{{ route('admin.categories.edit', $c) }}">Editar</a>
                  <form method="POST" action="{{ route('admin.categories.destroy', $c) }}" onsubmit="return confirm('¿Eliminar categoría? Esto puede afectar el catálogo.');">
                    @csrf
                    @method('DELETE')
                    <button class="btn-danger btn-sm" type="submit">Eliminar</button>
                  </form>
                </div>
              </td>
            </tr>
          @empty
            <tr><td colspan="5" class="py-8 text-center text-zinc-500">No hay categorías.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

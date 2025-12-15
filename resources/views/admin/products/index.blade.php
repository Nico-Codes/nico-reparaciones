@extends('layouts.app')

@section('title', 'Admin — Productos')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="page-title">Productos</h1>
      <p class="page-subtitle">Stock, precio y categoría. CRUD completo.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a href="{{ route('admin.products.create') }}" class="btn-primary">+ Crear producto</a>
      <a href="{{ route('admin.dashboard') }}" class="btn-outline">Volver al panel</a>
    </div>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if($products->isEmpty())
    <div class="mt-6 card">
      <div class="card-body text-sm text-zinc-600">
        No hay productos cargados todavía.
      </div>
    </div>
  @else
    {{-- Mobile cards --}}
    <div class="mt-6 grid grid-cols-1 md:hidden gap-3">
      @foreach($products as $p)
        @php
          $img = $p->image_url ?? null;
          if(!$img && !empty($p->image_path)) $img = route('storage.local', $p->image_path);
          $cat = $p->category->name ?? '—';
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start gap-3">
              <div class="h-14 w-14 rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden shrink-0">
                @if($img)
                  <img src="{{ $img }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
                @endif
              </div>

              <div class="min-w-0 flex-1">
                <div class="text-sm font-extrabold text-zinc-900">{{ $p->name }}</div>
                <div class="mt-1 text-xs text-zinc-500">{{ $cat }}</div>

                <div class="mt-2 flex items-center justify-between gap-2">
                  <div class="text-sm font-extrabold text-zinc-900">{{ $money($p->price) }}</div>
                  <span class="badge {{ ($p->stock ?? 0) > 0 ? 'badge-emerald' : 'badge-rose' }}">
                    Stock: {{ (int)($p->stock ?? 0) }}
                  </span>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <a class="btn-primary" href="{{ route('admin.products.edit', $p) }}">Editar</a>

                  <form method="POST" action="{{ route('admin.products.destroy', $p) }}"
                        onsubmit="return confirm('¿Eliminar este producto?')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn-outline w-full">Eliminar</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    {{-- Desktop table --}}
    <div class="mt-6 hidden md:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-100">
            <tr class="text-left">
              <th class="px-4 py-3 font-semibold text-zinc-700">Producto</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Categoría</th>
              <th class="px-4 py-3 font-semibold text-zinc-700 text-right">Precio</th>
              <th class="px-4 py-3 font-semibold text-zinc-700 text-right">Stock</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody class="divide-y divide-zinc-100">
            @foreach($products as $p)
              @php
                $img = $p->image_url ?? null;
                if(!$img && !empty($p->image_path)) $img = route('storage.local', $p->image_path);
                $cat = $p->category->name ?? '—';
              @endphp
              <tr class="hover:bg-zinc-50/70">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden shrink-0">
                      @if($img)
                        <img src="{{ $img }}" alt="{{ $p->name }}" class="h-full w-full object-cover">
                      @endif
                    </div>
                    <div class="min-w-0">
                      <div class="font-extrabold text-zinc-900">{{ $p->name }}</div>
                      <div class="text-xs text-zinc-500">#{{ $p->id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-zinc-800">{{ $cat }}</td>
                <td class="px-4 py-3 text-right font-extrabold text-zinc-900">{{ $money($p->price) }}</td>
                <td class="px-4 py-3 text-right">
                  <span class="badge {{ ($p->stock ?? 0) > 0 ? 'badge-emerald' : 'badge-rose' }}">
                    {{ (int)($p->stock ?? 0) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-2">
                    <a class="btn-primary" href="{{ route('admin.products.edit', $p) }}">Editar</a>

                    <form method="POST" action="{{ route('admin.products.destroy', $p) }}"
                          onsubmit="return confirm('¿Eliminar este producto?')">
                      @csrf
                      @method('DELETE')
                      <button class="btn-outline" type="submit">Eliminar</button>
                    </form>
                  </div>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4">
      {{ $products->links() }}
    </div>
  @endif
</div>
@endsection

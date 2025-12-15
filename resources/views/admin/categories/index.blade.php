@extends('layouts.app')

@section('title', 'Admin — Categorías')

@section('content')
<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="page-title">Categorías</h1>
      <p class="page-subtitle">Ordená tu tienda por categorías y slugs amigables.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a href="{{ route('admin.categories.create') }}" class="btn-primary">+ Crear categoría</a>
      <a href="{{ route('admin.dashboard') }}" class="btn-outline">Volver al panel</a>
    </div>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if($categories->isEmpty())
    <div class="mt-6 card">
      <div class="card-body text-sm text-zinc-600">
        No hay categorías cargadas todavía.
      </div>
    </div>
  @else
    {{-- Mobile cards --}}
    <div class="mt-6 grid grid-cols-1 md:hidden gap-3">
      @foreach($categories as $c)
        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-extrabold text-zinc-900">{{ $c->name }}</div>
                <div class="mt-1 text-xs text-zinc-500">Slug: <span class="font-mono">{{ $c->slug }}</span></div>
              </div>

              <span class="badge badge-zinc">#{{ $c->id }}</span>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <a class="btn-primary" href="{{ route('admin.categories.edit', $c) }}">Editar</a>

              <form method="POST" action="{{ route('admin.categories.destroy', $c) }}"
                    onsubmit="return confirm('¿Eliminar esta categoría?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="btn-outline w-full">Eliminar</button>
              </form>
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
              <th class="px-4 py-3 font-semibold text-zinc-700">Categoría</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Slug</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">ID</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody class="divide-y divide-zinc-100">
            @foreach($categories as $c)
              <tr class="hover:bg-zinc-50/70">
                <td class="px-4 py-3">
                  <div class="font-extrabold text-zinc-900">{{ $c->name }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="font-mono text-xs bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-lg">
                    {{ $c->slug }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="badge badge-zinc">#{{ $c->id }}</span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-2">
                    <a class="btn-primary" href="{{ route('admin.categories.edit', $c) }}">Editar</a>

                    <form method="POST" action="{{ route('admin.categories.destroy', $c) }}"
                          onsubmit="return confirm('¿Eliminar esta categoría?')">
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
      {{ $categories->links() }}
    </div>
  @endif
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Nuevo producto')

@section('content')
<div class="mx-auto w-full max-w-4xl px-4 py-6">
  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-xl font-black tracking-tight">Nuevo producto</h1>
      <p class="mt-1 text-sm text-zinc-600">Creá un producto con nombre, precio, stock, categoría e imagen.</p>
    </div>

    <a href="{{ route('admin.products.index') }}"
       class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
      Volver
    </a>
  </div>

  @if ($errors->any())
    <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-bold">Revisá estos errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data" class="mt-5 space-y-4">
    @csrf

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Nombre *</label>
          <input name="name" required value="{{ old('name') }}"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Slug (opcional)</label>
          <input name="slug" value="{{ old('slug') }}" placeholder="Se genera si lo dejás vacío"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Categoría *</label>
          <select name="category_id" required
                  class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            <option value="">Seleccionar…</option>
            @foreach($categories as $c)
              <option value="{{ $c->id }}" @selected((string)old('category_id') === (string)$c->id)>{{ $c->name }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Precio *</label>
          <input name="price" required value="{{ old('price') }}" inputmode="decimal"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Stock *</label>
          <input name="stock" required value="{{ old('stock', 0) }}" inputmode="numeric"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Descripción (opcional)</label>
          <textarea name="description" rows="4"
                    class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('description') }}</textarea>
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Imagen (opcional)</label>
          <input name="image" type="file" accept="image/*"
                 class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
          <p class="mt-1 text-xs text-zinc-500">Recomendado: cuadrada, buena luz, JPG/PNG.</p>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
        Crear producto
      </button>
    </div>
  </form>
</div>
@endsection

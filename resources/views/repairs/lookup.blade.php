@extends('layouts.app')

@section('title', 'Consultar reparación')

@php
  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="max-w-xl mx-auto">
    <div class="page-head">
      <div class="page-title">Consultar reparación</div>
      <div class="page-subtitle">Ingresá el código y el teléfono que dejaste en el local.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
          <span class="font-black text-zinc-900">Tip:</span> el teléfono puede ir con espacios o guiones, lo normalizamos automáticamente.
        </div>

        <form method="POST" action="{{ route('repairs.lookup.post') }}" class="mt-4 grid gap-4">
          @csrf

          <div>
            <label for="code">Código</label>
            <input
              id="code"
              name="code"
              value="{{ old('code') }}"
              placeholder="Ej: NR-8F2K1"
              autocomplete="off"
              required>
            <div class="text-xs text-zinc-500 mt-1">Te lo damos en el comprobante / WhatsApp.</div>
          </div>

          <div>
            <label for="phone">Teléfono</label>
            <input
              id="phone"
              name="phone"
              value="{{ old('phone') }}"
              placeholder="Ej: 341 555-0000"
              inputmode="tel"
              autocomplete="tel"
              required>
            <div class="text-xs text-zinc-500 mt-1">Debe coincidir con el que registramos en el ingreso.</div>
          </div>

          <div class="grid gap-2">
            <button class="btn-primary w-full" type="submit">Buscar</button>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              @if($has('store.index'))
                <a href="{{ route('store.index') }}" class="btn-outline w-full">Ir a la tienda</a>
              @endif

              @auth
                @if($has('repairs.my.index'))
                  <a href="{{ route('repairs.my.index') }}" class="btn-ghost w-full">Mis reparaciones</a>
                @endif
              @endauth
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection

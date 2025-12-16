@extends('layouts.app')

@section('title', 'Consultar reparación')

@section('content')
  <div class="max-w-xl mx-auto space-y-5">
    <div class="page-head">
      <div class="page-title">Consultar reparación</div>
      <div class="page-subtitle">Ingresá tu código y tu teléfono para ver el estado actual.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" action="{{ route('repairs.lookup.post') }}" class="space-y-4">
          @csrf

          <div>
            <label class="block text-sm font-black text-zinc-900 mb-1">Código</label>
            <input
              name="code"
              value="{{ old('code') }}"
              placeholder="Ej: NR-1234"
              class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              autocomplete="off"
            >
            <div class="mt-1 text-xs text-zinc-500">Es el código que te dimos cuando dejaste el equipo.</div>
          </div>

          <div>
            <label class="block text-sm font-black text-zinc-900 mb-1">Teléfono</label>
            <input
              name="phone"
              value="{{ old('phone') }}"
              placeholder="Ej: 341 555 1234"
              class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              autocomplete="tel"
            >
            <div class="mt-1 text-xs text-zinc-500">Usá el mismo teléfono que dejaste al ingresar el equipo.</div>
          </div>

          <button class="btn-primary w-full">Consultar estado</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="font-black text-zinc-900">¿No encontrás tu código?</div>
        <div class="mt-1 text-sm text-zinc-600">
          Escribinos o acercate al local y te ayudamos. (Para proteger tu información, pedimos código + teléfono).
        </div>

        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <a href="{{ route('store.index') }}" class="btn-outline w-full sm:w-auto">Ir a la tienda</a>
        </div>
      </div>
    </div>
  </div>
@endsection

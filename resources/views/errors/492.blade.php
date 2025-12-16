@extends('layouts.app')

@section('title', '429 — Muchas solicitudes')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAdmin ? route('admin.dashboard') : route('store.index');
  $primaryLabel = $isAdmin ? 'Ir al panel admin' : 'Ir a la tienda';
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Demasiadas solicitudes</div>
    <div class="page-subtitle">Estás haciendo muchas acciones en poco tiempo. Esperá un momento y volvé a intentar.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-5xl font-black tracking-tight text-zinc-900">429</div>

          <div class="mt-2 text-zinc-700 font-bold">
            Límite de solicitudes alcanzado.
          </div>

          <div class="muted mt-1">
            Esto es una protección automática para evitar spam o sobrecarga.
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" class="btn-primary w-full" onclick="window.location.reload();">
              Reintentar
            </button>

            <a href="{{ $primaryUrl }}" class="btn-outline w-full">
              {{ $primaryLabel }}
            </a>

            <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">
              Consultar reparación
            </a>

            <a href="{{ url()->previous() }}" class="btn-ghost w-full">
              Volver
            </a>
          </div>
        </div>

        <div class="hidden md:block md:w-[300px]">
          <div class="card">
            <div class="card-head">
              <div class="font-black">Qué podés hacer</div>
            </div>
            <div class="card-body">
              <ul class="list-disc pl-5 space-y-2 text-sm text-zinc-700">
                <li>Esperá 10–30 segundos y reintentá.</li>
                <li>Evita refrescar muchas veces seguidas.</li>
                <li>Si sos admin y esto pasa mucho, hay que ajustar rate limits.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

@extends('layouts.app')

@section('title', '503 — Mantenimiento')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAdmin ? route('admin.dashboard') : route('store.index');
  $primaryLabel = $isAdmin ? 'Ir al panel admin' : 'Ir a la tienda';
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Estamos en mantenimiento</div>
    <div class="page-subtitle">Volvemos en breve. Estamos mejorando el sistema para que funcione aún mejor.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-5xl font-black tracking-tight text-zinc-900">503</div>

          <div class="mt-2 text-zinc-700 font-bold">
            Servicio temporalmente no disponible.
          </div>

          <div class="muted mt-1">
            Probá nuevamente en unos minutos.
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" class="btn-primary h-11 w-full justify-center" onclick="window.location.reload();">
              Reintentar
            </button>

            <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center">
              Consultar reparación
            </a>

            <a href="{{ $primaryUrl }}" class="btn-outline h-11 w-full justify-center">
              {{ $primaryLabel }}
            </a>

            <a href="{{ url()->previous() }}" class="btn-ghost h-11 w-full justify-center">
              Volver
            </a>
          </div>
        </div>

        <div class="hidden md:block md:w-[300px]">
          <div class="card">
            <div class="card-head">
              <div class="font-black">Mientras tanto</div>
            </div>
            <div class="card-body">
              <ul class="list-disc pl-5 space-y-2 text-sm text-zinc-700">
                <li>Si estabas pagando o enviando un formulario, recargá y volvé a intentar.</li>
                <li>Podés usar “Consultar reparación” para ver el estado.</li>
                <li>Si sos admin, revisá el panel cuando vuelva el servicio.</li>
              </ul>
              <div class="muted mt-3 text-xs">
                Tip técnico: en mantenimiento, Laravel suele devolver 503 por “maintenance mode”.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

@extends('layouts.app')

@section('title', '503 - Mantenimiento')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAdmin ? route('admin.dashboard') : route('store.index');
  $primaryLabel = $isAdmin ? 'Ir al panel admin' : 'Ir a la tienda';
@endphp

@section('content')
  <div class="store-shell">
    <div class="store-hero mb-4 reveal-item">
      <div class="page-title">Estamos en mantenimiento</div>
      <div class="page-subtitle">Volvemos en breve. Estamos mejorando el sistema.</div>
    </div>

    <div class="card reveal-item">
      <div class="card-body">
        <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="text-5xl font-black tracking-tight text-zinc-900">503</div>
            <div class="mt-2 text-zinc-700 font-bold">Servicio temporalmente no disponible.</div>
            <div class="muted mt-1">Prueba nuevamente en unos minutos.</div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" class="btn-primary h-11 w-full justify-center" onclick="window.location.reload();">Reintentar</button>
              <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center">Consultar reparacion</a>
              <a href="{{ $primaryUrl }}" class="btn-outline h-11 w-full justify-center">{{ $primaryLabel }}</a>
              <a href="{{ url()->previous() }}" class="btn-ghost h-11 w-full justify-center">Volver</a>
            </div>
          </div>

          <div class="hidden md:block md:w-[300px]">
            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div class="font-black text-zinc-900">Mientras tanto</div>
              <ul class="mt-2 list-disc pl-5 space-y-2 text-sm text-zinc-700">
                <li>Si estabas enviando un formulario, recarga e intenta de nuevo.</li>
                <li>Puedes usar "Consultar reparacion" para ver el estado.</li>
                <li>Si eres admin, revisa el panel cuando vuelva el servicio.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

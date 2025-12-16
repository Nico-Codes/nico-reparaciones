@extends('layouts.app')

@section('title', '500 — Error interno')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAdmin ? route('admin.dashboard') : route('store.index');
  $primaryLabel = $isAdmin ? 'Ir al panel admin' : 'Ir a la tienda';
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Ups… algo salió mal</div>
    <div class="page-subtitle">Ocurrió un error inesperado. Probá nuevamente en unos segundos.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-5xl font-black tracking-tight text-zinc-900">500</div>

          <div class="mt-2 text-zinc-700 font-bold">
            Error interno del servidor.
          </div>

          <div class="muted mt-1">
            Si el problema persiste, revisá los logs (storage/logs) o el debug en local.
          </div>

          <div class="mt-3 text-xs text-zinc-500">
            Consejo: en local, mirá el stacktrace en la terminal / navegador. En producción, dejá debug desactivado.
          </div>
        </div>

        <div class="flex flex-col gap-2 md:min-w-[240px]">
          <a href="{{ $primaryUrl }}" class="btn-primary w-full">{{ $primaryLabel }}</a>

          <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">Consultar reparación</a>

          <button type="button" class="btn-outline w-full" onclick="window.location.reload();">
            Reintentar
          </button>

          <a href="{{ url()->previous() }}" class="btn-ghost w-full">Volver</a>
        </div>
      </div>
    </div>
  </div>
@endsection

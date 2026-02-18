@extends('layouts.app')

@section('title', '419 - Sesion expirada')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAuth ? ($isAdmin ? route('admin.dashboard') : route('store.index')) : route('login');
  $primaryLabel = $isAuth ? ($isAdmin ? 'Ir al panel admin' : 'Ir a la tienda') : 'Iniciar sesion';
@endphp

@section('content')
  <div class="store-shell">
    <div class="store-hero mb-4 reveal-item">
      <div class="page-title">Sesion expirada</div>
      <div class="page-subtitle">Tu sesion caduco o el token CSRF ya no es valido. Reintenta.</div>
    </div>

    <div class="card reveal-item">
      <div class="card-body">
        <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="text-5xl font-black tracking-tight text-zinc-900">419</div>
            <div class="mt-2 text-zinc-700 font-bold">Esto suele pasar por inactividad o por recargar un formulario viejo.</div>
            <div class="muted mt-1">Solucion rapida: recarga la pagina e intenta de nuevo.</div>
          </div>

          <div class="flex flex-col gap-2 md:min-w-[240px]">
            <a href="{{ $primaryUrl }}" class="btn-primary h-11 w-full justify-center">{{ $primaryLabel }}</a>
            <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center">Consultar reparacion</a>
            <button type="button" class="btn-outline h-11 w-full justify-center" onclick="window.location.reload();">Recargar pagina</button>
            <a href="{{ url()->previous() }}" class="btn-ghost h-11 w-full justify-center">Volver</a>
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

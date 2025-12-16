@extends('layouts.app')

@section('title', '419 — Sesión expirada')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAuth ? ($isAdmin ? route('admin.dashboard') : route('store.index')) : route('login');
  $primaryLabel = $isAuth ? ($isAdmin ? 'Ir al panel admin' : 'Ir a la tienda') : 'Iniciar sesión';
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Sesión expirada</div>
    <div class="page-subtitle">Tu sesión caducó (o el token CSRF ya no es válido). Probá recargar o iniciar sesión de nuevo.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-5xl font-black tracking-tight text-zinc-900">419</div>

          <div class="mt-2 text-zinc-700 font-bold">
            Esto suele pasar por inactividad o por recargar un formulario viejo.
          </div>

          <div class="muted mt-1">
            Solución rápida: recargá la página e intentá de nuevo.
          </div>

          @if($isAuth)
            <div class="mt-3 text-xs text-zinc-500">
              Sesión: <span class="font-black text-zinc-700">{{ auth()->user()->email ?? (auth()->user()->name ?? 'Usuario') }}</span>
            </div>
          @endif
        </div>

        <div class="flex flex-col gap-2 md:min-w-[240px]">
          <a href="{{ $primaryUrl }}" class="btn-primary w-full">{{ $primaryLabel }}</a>

          <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">Consultar reparación</a>

          <button type="button" class="btn-outline w-full" onclick="window.location.reload();">
            Recargar página
          </button>

          <a href="{{ url()->previous() }}" class="btn-ghost w-full">Volver</a>
        </div>
      </div>
    </div>
  </div>
@endsection

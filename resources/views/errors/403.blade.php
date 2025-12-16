@extends('layouts.app')

@section('title', '403 — Acceso denegado')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $primaryUrl = $isAdmin ? route('admin.dashboard') : route('store.index');
  $primaryLabel = $isAdmin ? 'Ir al panel admin' : 'Ir a la tienda';
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Acceso denegado</div>
    <div class="page-subtitle">No tenés permisos para ver esta página.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-5xl font-black tracking-tight text-zinc-900">403</div>

          <div class="mt-2 text-zinc-700 font-bold">
            Esta acción está restringida.
          </div>

          <div class="muted mt-1">
            Si creés que esto es un error, revisá tu sesión o pedí acceso al administrador.
          </div>

          @if($isAuth)
            <div class="mt-3 text-xs text-zinc-500">
              Sesión: <span class="font-black text-zinc-700">{{ auth()->user()->email ?? (auth()->user()->name ?? 'Usuario') }}</span>
            </div>
          @endif
        </div>

        <div class="flex flex-col gap-2 md:min-w-[220px]">
          <a href="{{ $primaryUrl }}" class="btn-primary w-full">{{ $primaryLabel }}</a>

          <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">Consultar reparación</a>

          @if(!$isAuth)
            <a href="{{ route('login') }}" class="btn-outline w-full">Iniciar sesión</a>
          @endif

          <a href="{{ url()->previous() }}" class="btn-ghost w-full">Volver</a>
        </div>
      </div>
    </div>
  </div>
@endsection

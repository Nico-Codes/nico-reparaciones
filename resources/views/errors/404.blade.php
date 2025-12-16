@extends('layouts.app')

@section('title', '404 — Página no encontrada')

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $path = request()->path();
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Página no encontrada</div>
    <div class="page-subtitle">La URL que buscaste no existe o fue movida.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="text-5xl font-black tracking-tight text-zinc-900">404</div>

          <div class="mt-2 text-zinc-700 font-bold">
            No encontramos esa página.
          </div>

          <div class="muted mt-1">
            Ruta solicitada: <span class="font-black text-zinc-700">/{{ $path }}</span>
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <a href="{{ route('store.index') }}" class="btn-primary w-full">Ir a la tienda</a>
            <a href="{{ route('repairs.lookup') }}" class="btn-outline w-full">Consultar reparación</a>

            <a href="{{ route('cart.index') }}" class="btn-outline w-full">Ver carrito</a>

            @if($isAuth)
              <a href="{{ route('orders.index') }}" class="btn-outline w-full">Mis pedidos</a>
            @else
              <a href="{{ route('login') }}" class="btn-outline w-full">Iniciar sesión</a>
            @endif

            @if($isAdmin)
              <a href="{{ route('admin.dashboard') }}" class="btn-outline w-full">Panel admin</a>
            @endif

            <a href="{{ url()->previous() }}" class="btn-ghost w-full">Volver</a>
          </div>
        </div>

        <div class="hidden md:block md:w-[260px]">
          <div class="card">
            <div class="card-head">
              <div class="font-black">Sugerencias</div>
            </div>
            <div class="card-body">
              <ul class="list-disc pl-5 space-y-2 text-sm text-zinc-700">
                <li>Revisá si la URL está bien escrita.</li>
                <li>Probá entrar desde el menú superior.</li>
                <li>Si venías de un link viejo, puede haber cambiado.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

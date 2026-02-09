@extends('layouts.app')

@section('title', config('app.name', 'NicoReparaciones'))

@section('content')
<div class="card max-w-3xl mx-auto">
  <div class="card-body space-y-4">
    <div class="space-y-1">
      <div class="text-xs font-black uppercase tracking-wide text-zinc-500">Bienvenido</div>
      <h1 class="text-2xl md:text-3xl font-black tracking-tight text-zinc-900">NicoReparaciones</h1>
      <p class="text-sm text-zinc-600">
        Servicio técnico y tienda online en una sola plataforma.
      </p>
    </div>

    <div class="grid gap-2 sm:grid-cols-2">
      @if (Route::has('store.index'))
        <a href="{{ route('store.index') }}" class="btn-primary h-11 w-full justify-center">Ir a la tienda</a>
      @endif

      @if (Route::has('repairs.lookup'))
        <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center">Consultar reparación</a>
      @endif

      @auth
        @if ((auth()->user()->role ?? null) === 'admin' && Route::has('admin.dashboard'))
          <a href="{{ route('admin.dashboard') }}" class="btn-outline h-11 w-full justify-center sm:col-span-2">Abrir panel admin</a>
        @elseif (Route::has('account.edit'))
          <a href="{{ route('account.edit') }}" class="btn-outline h-11 w-full justify-center sm:col-span-2">Mi cuenta</a>
        @endif
      @else
        @if (Route::has('login'))
          <a href="{{ route('login') }}" class="btn-outline h-11 w-full justify-center sm:col-span-2">Iniciar sesión</a>
        @endif
      @endauth
    </div>
  </div>
</div>
@endsection

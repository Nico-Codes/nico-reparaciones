@extends('layouts.app')

@section('title', 'Demasiadas solicitudes')

@section('content')
<div class="store-shell max-w-2xl mx-auto">
  <div class="store-hero mb-4 reveal-item">
    <div class="text-xs font-black text-zinc-500">Error 429</div>
    <h1 class="text-2xl md:text-3xl font-black tracking-tight">Demasiadas solicitudes</h1>
    <p class="text-sm text-zinc-600">Estas haciendo muchas solicitudes en poco tiempo.</p>
  </div>

  <div class="card reveal-item">
    <div class="card-body space-y-3">
      <p class="text-zinc-700 font-semibold">Espera unos segundos y vuelve a intentar.</p>

      <div class="flex flex-col sm:flex-row gap-2">
        <a href="{{ url()->previous() }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Volver</a>
        <a href="{{ route('home') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">Ir al inicio</a>
      </div>

      <p class="text-xs text-zinc-500">Si el problema persiste, podria ser un bloqueo temporal de seguridad.</p>
    </div>
  </div>
</div>
@endsection

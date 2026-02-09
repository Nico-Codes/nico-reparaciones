@extends('layouts.app')

@section('title', 'Demasiadas solicitudes')

@section('content')
<div class="card max-w-2xl mx-auto">
    <div class="card-head">
      <div class="font-black">Error 429</div>
      <span class="badge-rose">Rate limit</span>
    </div>

    <div class="card-body space-y-3">
      <p class="text-zinc-700 font-semibold">
        Estás haciendo muchas solicitudes en poco tiempo.
        Esperá unos segundos y volvé a intentar.
      </p>

      <div class="flex flex-col sm:flex-row gap-2">
        <a href="{{ url()->previous() }}" class="btn-outline h-11 w-full justify-center sm:w-auto">← Volver</a>
        <a href="{{ route('home') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">Ir al inicio</a>
      </div>

      <p class="text-xs text-zinc-500">
        Si el problema persiste, podría ser un bloqueo temporal del servidor o un límite de seguridad.
      </p>
    </div>
  </div>
@endsection

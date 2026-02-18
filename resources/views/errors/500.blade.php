@extends('layouts.app')

@section('title', 'Error interno')

@section('content')
<div class="store-shell max-w-2xl mx-auto">
  <div class="store-hero mb-4 reveal-item">
    <div class="text-xs font-black text-zinc-500">Error 500</div>
    <h1 class="text-2xl md:text-3xl font-black tracking-tight">Algo salio mal</h1>
    <p class="text-sm text-zinc-600">Hubo un problema interno. Prueba recargar o volver al inicio.</p>
  </div>

  <div class="card reveal-item">
    <div class="card-body">
      <div class="mt-1 flex flex-col sm:flex-row gap-2">
        <a href="{{ route('store.index') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">Volver al inicio</a>
        <a href="{{ url()->previous() }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Volver atras</a>
      </div>
    </div>
  </div>
</div>
@endsection

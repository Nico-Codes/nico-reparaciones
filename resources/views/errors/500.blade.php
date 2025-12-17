@extends('layouts.app')

@section('title', 'Error interno')

@section('content')
<div class="card">
  <div class="card-body">
    <div class="flex flex-col gap-2">
      <div class="text-xs font-black text-zinc-500">Error 500</div>
      <h1 class="text-2xl md:text-3xl font-black tracking-tight">Algo salió mal</h1>
      <p class="text-sm text-zinc-600">
        Hubo un problema interno. Probá recargar la página o volver al inicio.
      </p>

      <div class="mt-3 flex flex-col sm:flex-row gap-2">
        <a href="{{ route('store.index') }}" class="btn-primary">Volver al inicio</a>
        <a href="{{ url()->previous() }}" class="btn-outline">Volver atrás</a>
      </div>
    </div>
  </div>
</div>
@endsection

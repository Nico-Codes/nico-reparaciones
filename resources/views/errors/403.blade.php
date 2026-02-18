@extends('layouts.app')

@section('title', 'Acceso restringido')

@section('content')
  <div class="store-shell max-w-2xl mx-auto">
    <div class="store-hero mb-4 reveal-item">
      <div class="text-xs font-black text-zinc-500">Error 403</div>
      <h1 class="text-2xl md:text-3xl font-black tracking-tight text-zinc-900">Acceso restringido</h1>
    </div>

    <div class="card reveal-item">
      <div class="card-body">
        <p class="mt-2 text-sm text-zinc-600">
          {{ isset($exception) && $exception->getMessage() ? $exception->getMessage() : 'No tenes permisos para acceder a esta seccion.'}}
        </p>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ url()->previous() }}">Volver</a>
          <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('store.index') }}">Ir a la tienda</a>
        </div>
      </div>
    </div>
  </div>
@endsection

@extends('layouts.app')

@section('title', 'Acceso restringido')

@section('content')
  <div class="card max-w-2xl mx-auto">
    <div class="card-body">
      <div class="space-y-2">
        <div class="text-xs font-black text-zinc-500">Error 403</div>
        <h1 class="text-2xl md:text-3xl font-black tracking-tight text-zinc-900">Acceso restringido</h1>
      </div>

      <p class="mt-2 text-sm text-zinc-600">
        {{ isset($exception) && $exception->getMessage() ? $exception->getMessage() : 'No tenés permisos para acceder a esta sección.'}}
      </p>

      <div class="mt-4 flex flex-col gap-2 sm:flex-row">
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ url()->previous() }}">Volver</a>
        <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('store.index') }}">Ir a la tienda</a>
      </div>
    </div>
  </div>
@endsection

@extends('layouts.app')

@section('title', 'Acceso restringido')

@section('content')
  <div class="card max-w-xl mx-auto">
    <div class="card-body">
      <div class="text-lg font-black text-zinc-900">Acceso restringido</div>
      <p class="text-sm text-zinc-600 mt-2">
        {{ isset($exception) && $exception->getMessage() ? $exception->getMessage() : 'No tenés permisos para acceder a esta sección.' }}
      </p>

      <div class="mt-4 flex gap-2 flex-wrap">
        <a class="btn-outline" href="{{ url()->previous() }}">Volver</a>
        <a class="btn-primary" href="{{ route('store.index') }}">Ir a la tienda</a>
      </div>
    </div>
  </div>
@endsection

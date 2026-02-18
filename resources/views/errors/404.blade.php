@extends('layouts.app')

@section('title', 'Pagina no encontrada')

@section('content')
<div class="store-shell max-w-2xl mx-auto">
  <div class="store-hero mb-4 reveal-item">
    <div class="text-xs font-black text-zinc-500">Error 404</div>
    <h1 class="text-2xl md:text-3xl font-black tracking-tight">No encontramos esa pagina</h1>
    <p class="text-sm text-zinc-600">
      Puede que el enlace este mal o que la pagina se haya movido.
    </p>
  </div>

  <div class="card reveal-item">
    <div class="card-body">
      <div class="mt-1 flex flex-col sm:flex-row gap-2">
        <a href="{{ route('store.index') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">Ir a la tienda</a>
        <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Consultar reparacion</a>
      </div>
    </div>
  </div>
</div>
@endsection

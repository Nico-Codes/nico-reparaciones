@extends('layouts.app')

@section('title', 'Página no encontrada')

@section('content')
<div class="card">
  <div class="card-body">
    <div class="flex flex-col gap-2">
      <div class="text-xs font-black text-zinc-500">Error 404</div>
      <h1 class="text-2xl md:text-3xl font-black tracking-tight">No encontramos esa página</h1>
      <p class="text-sm text-zinc-600">
        Puede que el enlace esté mal o que la página se haya movido.
      </p>

      <div class="mt-3 flex flex-col sm:flex-row gap-2">
        <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
        <a href="{{ route('repairs.lookup') }}" class="btn-outline">Consultar reparación</a>
      </div>
    </div>
  </div>
</div>
@endsection

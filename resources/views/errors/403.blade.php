@extends('layouts.app')

@section('title', 'Acceso denegado')

@section('content')
<div class="card">
  <div class="card-body">
    <div class="flex flex-col gap-2">
      <div class="text-xs font-black text-zinc-500">Error 403</div>
      <h1 class="text-2xl md:text-3xl font-black tracking-tight">No tenés permiso para ver esto</h1>
      <p class="text-sm text-zinc-600">
        Si creés que esto es un error, iniciá sesión con la cuenta correcta o volvé al inicio.
      </p>

      <div class="mt-3 flex flex-col sm:flex-row gap-2">
        <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
        <a href="{{ route('login') }}" class="btn-outline">Iniciar sesión</a>
      </div>
    </div>
  </div>
</div>
@endsection

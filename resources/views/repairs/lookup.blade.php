@extends('layouts.app')

@section('title', 'Consultar reparación — NicoReparaciones')

@section('content')
<div class="container-page py-6">
  <div class="max-w-2xl">
    <h1 class="page-title">Consultar reparación</h1>
    <p class="page-subtitle">Ingresá el código y el teléfono del cliente para ver el estado.</p>

    @if ($errors->any())
      <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        <div class="font-semibold">Hay errores para corregir:</div>
        <ul class="mt-2 list-disc pl-5 space-y-1">
          @foreach ($errors->all() as $error)
            <li>{{ $error }}</li>
          @endforeach
        </ul>
      </div>
    @endif

    <div class="mt-6 card">
      <div class="card-header">
        <div class="text-sm font-semibold text-zinc-900">Datos de búsqueda</div>
        <div class="text-xs text-zinc-500">Tip: escribí el teléfono como te lo tomaron en el local (solo números).</div>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('repairs.lookup.post') }}" class="space-y-4">
          @csrf

          <div>
            <label class="text-sm font-medium text-zinc-800">Código</label>
            <input class="input" name="code" value="{{ old('code') }}" required placeholder="Ej: R-20251212-00001">
          </div>

          <div>
            <label class="text-sm font-medium text-zinc-800">Teléfono</label>
            <input class="input" name="phone" value="{{ old('phone') }}" required placeholder="Ej: 3411234567">
            <div class="mt-1 text-xs text-zinc-500">Sin espacios, sin +54, sin guiones.</div>
          </div>

          <button type="submit" class="btn-primary w-full">Consultar estado</button>

          <a href="{{ route('store.index') }}" class="btn-outline w-full">Ir a la tienda</a>
        </form>
      </div>
    </div>
  </div>
</div>
@endsection

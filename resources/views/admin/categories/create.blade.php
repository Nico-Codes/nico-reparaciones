@extends('layouts.app')

@section('title', 'Admin — Crear categoría')

@section('content')
<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="page-title">Crear categoría</h1>
      <p class="page-subtitle">Nombre y slug amigable (si no lo ponés, se genera).</p>
    </div>
    <a href="{{ route('admin.categories.index') }}" class="btn-outline">← Volver</a>
  </div>

  @if($errors->any())
    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Revisá estos errores:</div>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6" method="POST" action="{{ route('admin.categories.store') }}">
    @csrf

    <div class="lg:col-span-2 space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Datos</div>
          <div class="text-xs text-zinc-500">Usá un nombre claro (ej: Fundas / Cargadores).</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Nombre *</label>
            <input class="input" name="name" value="{{ old('name') }}" required placeholder="Ej: Fundas">
          </div>

          <div class="md:col-span-2">
            <label class="label">Slug</label>
            <input class="input" name="slug" value="{{ old('slug') }}" placeholder="Ej: fundas (opcional)">
            <p class="helper">Si lo dejás vacío, se genera automáticamente.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Acciones</div>
        </div>
        <div class="card-body">
          <button class="btn-primary w-full" type="submit">Guardar</button>
          <a class="btn-outline w-full text-center mt-2" href="{{ route('admin.categories.index') }}">Cancelar</a>
        </div>
      </div>
    </div>
  </form>
</div>
@endsection

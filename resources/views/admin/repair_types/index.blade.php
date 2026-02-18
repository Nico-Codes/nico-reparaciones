@extends('layouts.app')
@section('title', 'Admin - Tipos de reparacion')

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Tipos de reparacion</div>
        <div class="page-subtitle">Estos son los tipos usados en el calculo automatico.</div>
      </div>

      <div class="flex w-full gap-2 flex-wrap sm:w-auto">
        <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.pricing.index') }}">Precios</a>
      </div>
    </div>
  </div>

  <div class="reveal-item grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
    <div class="card">
      <div class="card-head"><div class="font-black">Crear tipo</div></div>
      <div class="card-body">
        <form method="POST" action="{{ route('admin.repairTypes.store') }}" class="space-y-3">
          @csrf
          <div class="space-y-1">
            <label class="text-sm font-semibold text-zinc-800">Nombre</label>
            <input class="h-11" name="name" placeholder="Ej: Modulo" required>
          </div>
          <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <input class="h-4 w-4 rounded border-zinc-300" type="checkbox" name="active" value="1" checked>
            <span>Activo</span>
          </label>
          <button class="btn-primary h-11 w-full justify-center">Crear</button>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-black">Listado</div>
        <span class="badge-zinc">{{ $repairTypes->count() }}</span>
      </div>
      <div class="card-body">
        <div class="space-y-2">
          @forelse($repairTypes as $rt)
            <form method="POST" action="{{ route('admin.repairTypes.update', $rt) }}" class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm space-y-3">
              @csrf
              @method('PUT')
              <div class="grid gap-3 sm:grid-cols-3 items-end">
                <div class="space-y-1 sm:col-span-2">
                  <label class="text-xs font-black uppercase text-zinc-500">Nombre</label>
                  <input class="h-11" name="name" value="{{ $rt->name }}" required>
                </div>
                <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <input class="h-4 w-4 rounded border-zinc-300" type="checkbox" name="active" value="1" @checked($rt->active)>
                  <span>Activo</span>
                </label>
              </div>
              <button class="btn-outline h-10 w-full justify-center sm:w-auto">Guardar</button>
            </form>
          @empty
            <div class="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">No hay tipos de reparacion cargados.</div>
          @endforelse
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

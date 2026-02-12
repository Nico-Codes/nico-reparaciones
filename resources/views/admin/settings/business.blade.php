@extends('layouts.app')

@section('title', 'Admin - Datos del negocio')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Datos del negocio</div>
      <div class="page-subtitle">Informacion base usada en mensajes y comprobantes.</div>
    </div>
    <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Volver a configuracion</a>
  </div>

  <div class="card">
    <div class="card-body">
      <form method="POST" action="{{ route('admin.settings.update') }}" class="grid gap-4">
        @csrf

        <div class="grid gap-2">
          <label>WhatsApp del local (opcional)</label>
          <input
            class="h-11"
            name="shop_phone"
            value="{{ old('shop_phone', $shopPhone ?? '') }}"
            placeholder="Ej: +54 341 5550000">
          <div class="text-xs text-zinc-500">
            Se usa para el boton "Escribir por WhatsApp".
          </div>
        </div>

        <div class="grid gap-2">
          <label>Direccion del local (opcional)</label>
          <textarea name="shop_address" rows="3" placeholder="Ej: Av. San Martin 123">{{ old('shop_address', $shopAddress ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Placeholder: <code>{shop_address}</code></div>
        </div>

        <div class="grid gap-2">
          <label>Horarios (opcional)</label>
          <textarea name="shop_hours" rows="3" placeholder="Ej: Lun a Vie 9-13 / 16-20">{{ old('shop_hours', $shopHours ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Placeholder: <code>{shop_hours}</code></div>
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Cancelar</a>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</div>
@endsection

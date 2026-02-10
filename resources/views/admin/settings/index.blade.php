@extends('layouts.app')

@section('title', 'Admin - Configuración')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Configuración</div>
      <div class="page-subtitle">Administra los datos del local usados en mensajes y comprobantes.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Volver</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.assets.index') }}">Identidad visual</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.two_factor.settings') }}">Seguridad 2FA</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.whatsapp_templates.index') }}">Plantillas WhatsApp</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Datos del local</div>
        <div class="text-xs text-zinc-500">Se usan en WhatsApp, tickets y mensajes del sistema.</div>
      </div>
      <span class="badge-zinc">Negocio</span>
    </div>

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
            Se usa para el botón "Escribir por WhatsApp".
          </div>
        </div>

        <div class="grid gap-2">
          <label>Dirección del local (opcional)</label>
          <textarea name="shop_address" rows="3" placeholder="Ej: Av. San Martin 123">{{ old('shop_address', $shopAddress ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Placeholder: <code>{shop_address}</code></div>
        </div>

        <div class="grid gap-2">
          <label>Horarios (opcional)</label>
          <textarea name="shop_hours" rows="3" placeholder="Ej: Lun a Vie 9-13 / 16-20">{{ old('shop_hours', $shopHours ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Placeholder: <code>{shop_hours}</code></div>
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Cancelar</a>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Guardar</button>
        </div>
      </form>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Identidad visual</div>
        <div class="text-xs text-zinc-500">Gestiona logos, íconos y favicons en una vista separada.</div>
      </div>
      <span class="badge-sky">Identidad</span>
    </div>
    <div class="card-body">
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.assets.index') }}">
        Abrir identidad visual
      </a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Links rápidos</div>
        <div class="text-xs text-zinc-500">Accesos directos para operar rápido.</div>
      </div>
    </div>
    <div class="card-body">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.orders.index') }}">Pedidos</a>
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.products.index') }}">Productos</a>
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.categories.index') }}">Categorías</a>
      </div>
    </div>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Configuración')

@section('content')
@php
  $logoRel = 'brand/logo.png';
  $logoOk  = file_exists(public_path($logoRel));
@endphp

<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Configuración</div>
      <div class="page-subtitle">Datos del negocio que se usan en reparaciones (WhatsApp, impresión, etc.).</div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-outline" href="{{ route('admin.dashboard') }}">Volver</a>
      <a class="btn-outline" href="{{ route('admin.whatsapp_templates.index') }}">Plantillas WhatsApp</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="alert-error">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Identidad (simple) --}}
    <div class="card">
      <div class="card-head">
        <div>
          <div class="font-black">Identidad</div>
          <div class="text-xs text-zinc-500">Solo referencia visual.</div>
        </div>
        <span class="badge-sky">Brand</span>
      </div>
      <div class="card-body">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            @if($logoOk)
              <img src="{{ asset($logoRel) }}" alt="Logo" class="h-full w-full object-contain" />
            @else
              <div class="h-full w-full flex items-center justify-center text-xs font-black text-zinc-500">NR</div>
            @endif
          </div>
          <div class="min-w-0">
            <div class="truncate font-black text-zinc-900">NicoReparaciones</div>
            <div class="text-xs text-zinc-500">Paleta azul/celeste · UI simple y responsive</div>
          </div>
        </div>

        <div class="mt-4 text-sm text-zinc-600">
          Tip: poné tu logo en <span class="font-black text-zinc-900">public/brand/logo.png</span>.
        </div>
      </div>
    </div>

    {{-- Form principal --}}
    <div class="card lg:col-span-2">
      <div class="card-head">
        <div>
          <div class="font-black">Datos del local</div>
          <div class="text-xs text-zinc-500">Se usan como placeholders en mensajes y comprobantes.</div>
        </div>
        <span class="badge-zinc">Negocio</span>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('admin.settings.update') }}" class="grid gap-4">
          @csrf

          <div class="grid gap-2">
            <label>WhatsApp del local (opcional)</label>
            <input
              name="shop_phone"
              value="{{ old('shop_phone', $shopPhone ?? '') }}"
              placeholder="Ej: +54 341 5550000 (solo números también sirve)">
            <div class="text-xs text-zinc-500">
              Se usa para el botón “Escribir por WhatsApp” en el checkout/pedido.
            </div>
          </div>


          <div class="grid gap-2">
            <label>Dirección del local (opcional)</label>
            <textarea name="shop_address" rows="4" placeholder="Ej: Av. San Martín 123, Carcarañá">{{ old('shop_address', $shopAddress ?? '') }}</textarea>
            <div class="text-xs text-zinc-500">Ejemplo de placeholder: <code>{shop_address}</code></div>
          </div>

          <div class="grid gap-2">
            <label>Horarios (opcional)</label>
            <textarea name="shop_hours" rows="4" placeholder="Ej: Lun a Vie 9:00–13:00 / 16:00–20:00">{{ old('shop_hours', $shopHours ?? '') }}</textarea>
            <div class="text-xs text-zinc-500">Ejemplo de placeholder: <code>{shop_hours}</code></div>
          </div>

          <div class="flex justify-end">
            <button class="btn-primary" type="submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Links rápidos</div>
        <div class="text-xs text-zinc-500">Accesos directos para operar más rápido.</div>
      </div>
    </div>
    <div class="card-body">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <a class="btn-outline" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
        <a class="btn-outline" href="{{ route('admin.orders.index') }}">Pedidos</a>
        <a class="btn-outline" href="{{ route('admin.products.index') }}">Productos</a>
        <a class="btn-outline" href="{{ route('admin.categories.index') }}">Categorías</a>
      </div>
    </div>
  </div>
</div>
@endsection

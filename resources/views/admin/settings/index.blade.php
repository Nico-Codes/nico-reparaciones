@extends('layouts.app')

@section('title', 'Admin — Configuración')

@section('content')
<div class="mx-auto w-full max-w-5xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-xl font-black tracking-tight">Configuración</h1>
      <p class="mt-1 text-sm text-zinc-600">Ajustes del negocio, links rápidos y parámetros generales.</p>
    </div>

    <a href="{{ route('admin.dashboard') }}"
       class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
      Volver al panel
    </a>
  </div>

  <div class="mt-5 grid gap-4 lg:grid-cols-3">
    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="text-sm font-black">Identidad</div>
      <p class="mt-1 text-sm text-zinc-600">Logo, colores y nombre comercial.</p>

      <div class="mt-4 flex items-center gap-3">
        <div class="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <img src="{{ asset('images/logo-nico.png') }}" alt="Logo" class="h-full w-full object-contain">
        </div>
        <div class="min-w-0">
          <div class="truncate font-semibold">NicoReparaciones</div>
          <div class="text-xs text-zinc-500">Paleta basada en azul/celeste del logo</div>
        </div>
      </div>

      <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        (Etapa siguiente) Acá podemos agregar editor: WhatsApp del local, dirección, horarios, etc.
      </div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="text-sm font-black">Links rápidos</div>
      <p class="mt-1 text-sm text-zinc-600">Accesos directos para operar más rápido.</p>

      <div class="mt-4 grid gap-2">
        <a href="{{ route('admin.repairs.index') }}"
           class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Reparaciones
        </a>
        <a href="{{ route('admin.orders.index') }}"
           class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Pedidos
        </a>
        <a href="{{ route('admin.products.index') }}"
           class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Productos
        </a>
        <a href="{{ route('admin.categories.index') }}"
           class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Categorías
        </a>
      </div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="text-sm font-black">Operación</div>
      <p class="mt-1 text-sm text-zinc-600">Tareas recomendadas y controles.</p>

      <ul class="mt-4 space-y-2 text-sm text-zinc-700">
        <li class="flex gap-2">
          <span class="mt-0.5">✅</span>
          <span>Frontend mobile-first unificado</span>
        </li>
        <li class="flex gap-2">
          <span class="mt-0.5">✅</span>
          <span>CRUD completo: productos/categorías/pedidos/reparaciones</span>
        </li>
        <li class="flex gap-2">
          <span class="mt-0.5">⏭️</span>
          <span>(Siguiente etapa) Plantillas WhatsApp por estado + editor simple</span>
        </li>
        <li class="flex gap-2">
          <span class="mt-0.5">⏭️</span>
          <span>(Siguiente etapa) Timeline visual usando repair_status_histories</span>
        </li>
      </ul>

      <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Si querés, acá sumamos “checklist de apertura/cierre” del local.
      </div>
    </div>
  </div>
</div>
@endsection

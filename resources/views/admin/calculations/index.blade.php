@extends('layouts.app')

@section('title', 'Admin - Reglas de calculo')

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="page-head mb-0">
      <div>
        <div class="page-title">Reglas de calculo</div>
        <div class="page-subtitle">Gestion centralizada del calculo automatico para productos y reparaciones.</div>
      </div>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Volver al panel</a>
    </div>
  </div>

  <div class="reveal-item grid gap-3 sm:grid-cols-2">
    <a href="{{ route('admin.product_pricing_rules.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Productos</div>
      <div class="mt-1 text-sm text-zinc-600">Reglas por categoria, producto, rango de costo y porcentaje de margen.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir reglas de productos</div>
    </a>

    <a href="{{ route('admin.pricing.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Reparaciones</div>
      <div class="mt-1 text-sm text-zinc-600">Reglas por tipo, marca, modelo y prioridad para calculo automatico.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir reglas de reparaciones</div>
    </a>
  </div>
</div>
@endsection

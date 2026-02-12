@extends('layouts.app')

@section('title', 'Admin - Reglas de calculo')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Reglas de calculo</div>
      <div class="page-subtitle">Gestion centralizada del calculo automatico de precios para productos y reparaciones.</div>
    </div>
    <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Volver al panel</a>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <a href="{{ route('admin.product_pricing_rules.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Productos</div>
      <div class="mt-1 text-sm text-zinc-600">Reglas por categoria, producto, rango de costo y porcentaje de margen.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir reglas de productos</div>
    </a>

    <a href="{{ route('admin.pricing.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Reparaciones</div>
      <div class="mt-1 text-sm text-zinc-600">Reglas existentes por tipo, marca, modelo y prioridad para calculo automatico.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir reglas de reparaciones</div>
    </a>
  </div>
</div>
@endsection

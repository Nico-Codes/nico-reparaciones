@extends('layouts.app')

@section('title', 'Admin - Proveedores')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $scoreBadge = function ($score) {
    $s = (int) ($score ?? 0);
    if ($s >= 85) return 'badge-emerald';
    if ($s >= 70) return 'badge-sky';
    if ($s >= 50) return 'badge-amber';
    return 'badge-rose';
  };
@endphp

@section('content')
<div class="space-y-5">
  <div class="flex items-start justify-between gap-3 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Proveedores</div>
      <div class="page-subtitle">Gestiona tus lugares de compra para trazabilidad de fallas.</div>
    </div>

    <a href="{{ route('admin.warranty_incidents.index') }}" class="btn-outline h-11 w-full sm:w-auto justify-center">Ver garantias</a>
  </div>

  @if(session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  <div class="card">
    <div class="card-head">
      <div class="font-black">Nuevo proveedor</div>
    </div>
    <div class="card-body">
      <form method="POST" action="{{ route('admin.suppliers.store') }}" class="grid gap-3 sm:grid-cols-2" data-disable-on-submit>
        @csrf
        <div class="space-y-1">
          <label>Nombre *</label>
          <input name="name" class="h-11" required placeholder="Ej: Importadora Centro">
        </div>
        <div class="space-y-1">
          <label>Telefono (opcional)</label>
          <input name="phone" class="h-11" placeholder="Ej: 3511234567">
        </div>
        <div class="space-y-1 sm:col-span-2">
          <label>Notas (opcional)</label>
          <textarea name="notes" rows="3" placeholder="Contacto, zona, tiempos, etc."></textarea>
        </div>
        <div class="sm:col-span-2">
          <button class="btn-primary h-11 justify-center w-full sm:w-auto" type="submit">Guardar proveedor</button>
        </div>
      </form>
    </div>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Telefono</th>
            <th class="text-right">Productos</th>
            <th class="text-right">Incidentes</th>
            <th class="text-right">Garantias OK</th>
            <th class="text-right">Perdida</th>
            <th>Puntuacion</th>
            <th>Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($suppliers as $supplier)
            <tr>
              <td>
                <div class="font-semibold text-zinc-900">{{ $supplier->name }}</div>
                @if($supplier->notes)
                  <div class="text-xs text-zinc-500 mt-1">{{ $supplier->notes }}</div>
                @endif
              </td>
              <td class="text-sm text-zinc-700">{{ $supplier->phone ?: '-' }}</td>
              <td class="text-right font-semibold">{{ (int)$supplier->products_count }}</td>
              <td class="text-right font-semibold">{{ (int)$supplier->warranty_incidents_count }}</td>
              <td class="text-right font-semibold">
                {{ (int)($supplier->warranty_success_count ?? 0) }}/{{ (int)($supplier->warranty_eligible_count ?? 0) }}
                <div class="text-xs text-zinc-500 mt-1">
                  @if($supplier->warranty_success_rate !== null)
                    {{ (int)$supplier->warranty_success_rate }}% exito
                  @else
                    Sin garantias vencidas
                  @endif
                </div>
              </td>
              <td class="text-right font-semibold {{ (int)$supplier->warranty_loss_total > 0 ? 'text-rose-700' : 'text-zinc-700' }}">{{ $money((int)$supplier->warranty_loss_total) }}</td>
              <td>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="{{ $scoreBadge($supplier->score ?? 0) }}">{{ (int)($supplier->score ?? 0) }}/100</span>
                  <span class="text-xs font-semibold text-zinc-600">{{ $supplier->score_tier ?? 'Sin datos' }}</span>
                </div>
              </td>
              <td><span class="{{ $supplier->active ? 'badge-emerald' : 'badge-zinc' }}">{{ $supplier->active ? 'Activo' : 'Inactivo' }}</span></td>
              <td class="text-right">
                <div class="inline-flex items-center gap-2">
                  <form method="POST" action="{{ route('admin.suppliers.toggle', $supplier) }}" data-disable-on-submit>
                    @csrf
                    <button class="btn-outline btn-sm" type="submit">{{ $supplier->active ? 'Desactivar' : 'Activar' }}</button>
                  </form>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="9" class="pt-0 pb-4">
                <form method="POST" action="{{ route('admin.suppliers.update', $supplier) }}" class="grid gap-2 sm:grid-cols-3" data-disable-on-submit>
                  @csrf
                  @method('PUT')
                  <input name="name" class="h-10" value="{{ $supplier->name }}" required>
                  <input name="phone" class="h-10" value="{{ $supplier->phone }}">
                  <div class="flex gap-2">
                    <input name="notes" class="h-10 flex-1" value="{{ $supplier->notes }}" placeholder="Notas">
                    <button class="btn-ghost btn-sm h-10" type="submit">Actualizar</button>
                  </div>
                </form>
              </td>
            </tr>
          @empty
            <tr><td colspan="9" class="text-center py-8 text-zinc-500">Aun no hay proveedores cargados.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Pedidos')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusMap = [
    'pendiente' => 'Pendiente',
    'confirmado' => 'Confirmado',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado' => 'Entregado',
    'cancelado' => 'Cancelado',
  ];

  $badge = function(string $st) {
    return match($st) {
      'pendiente' => 'badge-amber',
      'confirmado' => 'badge-sky',
      'preparando' => 'badge-indigo',
      'listo_retirar' => 'badge-emerald',
      'entregado' => 'badge-zinc',
      'cancelado' => 'badge-rose',
      default => 'badge-zinc',
    };
  };

  $currentStatus = $currentStatus ?? '';
  $q = $q ?? '';
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Pedidos</div>
      <div class="page-subtitle">Listado global de pedidos de la tienda.</div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-outline" href="{{ route('admin.dashboard') }}">Volver</a>
    </div>
  </div>

  <div class="card">
    <div class="card-body">
      <form method="GET" class="grid gap-3 sm:grid-cols-6">
        <div class="sm:col-span-2">
          <label>Buscar</label>
          <input name="q" value="{{ $q }}" placeholder="ID, nombre, teléfono, email…" />
        </div>

        <div class="sm:col-span-2">
          <label>Estado</label>
          <select name="status">
            <option value="">Todos los estados</option>
            @foreach($statusMap as $k => $label)
              <option value="{{ $k }}" @selected($currentStatus === $k)>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div class="sm:col-span-2 flex items-end gap-2">
          <button class="btn-outline w-full" type="submit">Aplicar</button>
        </div>

        <div class="sm:col-span-6">
          @if($currentStatus || $q !== '')
            <a class="btn-ghost" href="{{ route('admin.orders.index') }}">Limpiar filtros</a>
          @endif
        </div>
      </form>
    </div>
  </div>

  {{-- Mobile (cards) --}}
  <div class="grid gap-3 md:hidden">
    @forelse($orders as $order)
      <a href="{{ route('admin.orders.show', $order) }}" class="card hover:border-zinc-200 transition">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs text-zinc-500">Pedido</div>
              <div class="font-black text-zinc-900">#{{ $order->id }}</div>
              <div class="mt-1 text-sm text-zinc-700">
                <span class="font-semibold">{{ $order->pickup_name ?: ($order->user?->name ?? '—') }}</span>
                <span class="text-zinc-400">·</span>
                <span class="text-zinc-600">{{ $order->pickup_phone ?: ($order->user?->email ?? '—') }}</span>
              </div>
              <div class="mt-1 text-xs text-zinc-500">{{ $order->created_at?->format('d/m/Y H:i') }}</div>
            </div>

            <div class="flex flex-col items-end gap-2">
              <span class="{{ $badge($order->status) }}">{{ $statusMap[$order->status] ?? $order->status }}</span>
              <div class="text-lg font-black">{{ $money($order->total) }}</div>
            </div>
          </div>

          <div class="mt-3">
            <span class="btn-ghost btn-sm">Ver detalle</span>
          </div>
        </div>
      </a>
    @empty
      <div class="card"><div class="card-body text-sm text-zinc-600">No hay pedidos.</div></div>
    @endforelse
  </div>

  {{-- Desktop (table) --}}
  <div class="card hidden md:block">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th class="text-right">Total</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($orders as $order)
            <tr>
              <td class="font-black">#{{ $order->id }}</td>
              <td>
                <div class="font-semibold text-zinc-900">{{ $order->pickup_name ?: ($order->user?->name ?? '—') }}</div>
                <div class="text-xs text-zinc-500">{{ $order->pickup_phone ?: ($order->user?->email ?? '—') }}</div>
              </td>
              <td class="text-zinc-700">{{ $order->created_at?->format('d/m/Y H:i') }}</td>
              <td><span class="{{ $badge($order->status) }}">{{ $statusMap[$order->status] ?? $order->status }}</span></td>
              <td class="text-right font-black">{{ $money($order->total) }}</td>
              <td class="text-right">
                <a class="btn-outline btn-sm" href="{{ route('admin.orders.show', $order) }}">Ver</a>
              </td>
            </tr>
          @empty
            <tr><td colspan="6" class="py-8 text-center text-zinc-500">No hay pedidos.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div>
    {{ $orders->links() }}
  </div>
</div>
@endsection

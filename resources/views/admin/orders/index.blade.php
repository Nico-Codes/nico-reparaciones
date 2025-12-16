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
      'pendiente' => 'bg-amber-100 text-amber-900 border-amber-200',
      'confirmado' => 'bg-sky-100 text-sky-800 border-sky-200',
      'preparando' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'listo_retirar' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'entregado' => 'bg-zinc-100 text-zinc-800 border-zinc-200',
      'cancelado' => 'bg-rose-100 text-rose-800 border-rose-200',
      default => 'bg-zinc-100 text-zinc-800 border-zinc-200',
    };
  };
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-xl font-black tracking-tight">Pedidos</h1>
      <p class="mt-1 text-sm text-zinc-600">Listado de pedidos de la tienda. Filtrá por estado y abrí el detalle.</p>
    </div>

    <form method="GET" class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select name="status"
              class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:w-64">
        <option value="">Todos los estados</option>
        @foreach($statusMap as $k => $label)
          <option value="{{ $k }}" @selected(($currentStatus ?? '') === $k)>{{ $label }}</option>
        @endforeach
      </select>
      <button class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
        Filtrar
      </button>
    </form>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  {{-- Mobile cards --}}
  <div class="mt-5 grid gap-3 md:hidden">
    @forelse($orders as $order)
      <a href="{{ route('admin.orders.show', $order) }}"
         class="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs text-zinc-500">Pedido</div>
            <div class="font-black">#{{ $order->id }}</div>
            <div class="mt-1 text-sm text-zinc-700">
              <span class="font-semibold">{{ $order->pickup_name ?: ($order->user?->name ?? '—') }}</span>
              <span class="text-zinc-400">·</span>
              <span class="text-zinc-600">{{ $order->pickup_phone ?: ($order->user?->email ?? '—') }}</span>
            </div>
            <div class="mt-1 text-sm text-zinc-600">
              {{ $order->created_at?->format('d/m/Y H:i') }}
            </div>
          </div>

          <div class="flex flex-col items-end gap-2">
            <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($order->status) }}">
              {{ $statusMap[$order->status] ?? $order->status }}
            </span>
            <div class="text-sm font-black">{{ $money($order->total) }}</div>
          </div>
        </div>
      </a>
    @empty
      <div class="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        No hay pedidos todavía.
      </div>
    @endforelse
  </div>

  {{-- Desktop table --}}
  <div class="mt-5 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th class="px-4 py-3 text-left">Pedido</th>
            <th class="px-4 py-3 text-left">Cliente</th>
            <th class="px-4 py-3 text-left">Contacto</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">Fecha</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          @forelse($orders as $order)
            <tr class="hover:bg-zinc-50/70">
              <td class="px-4 py-3 font-black">#{{ $order->id }}</td>
              <td class="px-4 py-3">
                <div class="font-semibold">{{ $order->pickup_name ?: ($order->user?->name ?? '—') }}</div>
                <div class="text-xs text-zinc-500">{{ $order->user?->email ?? '—' }}</div>
              </td>
              <td class="px-4 py-3 text-zinc-700">{{ $order->pickup_phone ?: '—' }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($order->status) }}">
                  {{ $statusMap[$order->status] ?? $order->status }}
                </span>
              </td>
              <td class="px-4 py-3 text-zinc-700">{{ $order->created_at?->format('d/m/Y H:i') }}</td>
              <td class="px-4 py-3 text-right font-black">{{ $money($order->total) }}</td>
              <td class="px-4 py-3 text-right">
                <a href="{{ route('admin.orders.show', $order) }}"
                   class="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
                  Ver
                </a>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="7" class="px-4 py-8 text-center text-zinc-500">No hay pedidos.</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>
</div>
@endsection

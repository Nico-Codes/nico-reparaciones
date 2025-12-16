@extends('layouts.app')

@section('title', 'Admin — Pedido #' . $order->id)

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
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-black tracking-tight">Pedido #{{ $order->id }}</h1>
        <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($order->status) }}">
          {{ $statusMap[$order->status] ?? $order->status }}
        </span>
      </div>
      <p class="mt-1 text-sm text-zinc-600">
        {{ $order->created_at?->format('d/m/Y H:i') }}
        <span class="text-zinc-400">·</span>
        Total: <span class="font-black text-zinc-900">{{ $money($order->total) }}</span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.orders.index') }}"
         class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
        Volver
      </a>
    </div>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if ($errors->any())
    <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-bold">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <div class="mt-5 grid gap-4 lg:grid-cols-3">
    {{-- Resumen --}}
    <div class="space-y-4 lg:col-span-1">
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Cliente</div>

        <div class="mt-3 text-sm text-zinc-700">
          <div class="flex justify-between gap-3">
            <span class="text-zinc-500">Nombre</span>
            <span class="font-semibold">{{ $order->pickup_name ?: ($order->user?->name ?? '—') }}</span>
          </div>

          <div class="mt-1 flex justify-between gap-3">
            <span class="text-zinc-500">Teléfono</span>
            <span class="font-semibold">{{ $order->pickup_phone ?: '—' }}</span>
          </div>

          <div class="mt-1 flex justify-between gap-3">
            <span class="text-zinc-500">Email</span>
            <span class="font-semibold">{{ $order->user?->email ?? '—' }}</span>
          </div>

          <div class="mt-1 flex justify-between gap-3">
            <span class="text-zinc-500">Pago</span>
            <span class="font-semibold">{{ $order->payment_method ?: '—' }}</span>
          </div>
        </div>

        @if($order->notes)
          <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
            <div class="text-xs font-bold text-zinc-500 uppercase">Notas</div>
            <div class="mt-1 whitespace-pre-wrap">{{ $order->notes }}</div>
          </div>
        @endif
      </div>

      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Cambiar estado</div>

        <form method="POST" action="{{ route('admin.orders.updateStatus', $order) }}" class="mt-3 space-y-3">
          @csrf
          <select name="status" required
                  class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            @foreach($statusMap as $k => $label)
              <option value="{{ $k }}" @selected($order->status === $k)>{{ $label }}</option>
            @endforeach
          </select>

          <button class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Guardar estado
          </button>

          <p class="text-xs text-zinc-500">
            Tip: “Listo para retirar” es ideal para avisar al cliente.
          </p>
        </form>
      </div>
    </div>

    {{-- Items --}}
    <div class="lg:col-span-2">
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-black">Items del pedido</div>
          <div class="text-sm font-black">{{ $money($order->total) }}</div>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th class="px-3 py-2 text-left">Producto</th>
                <th class="px-3 py-2 text-right">Precio</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              @forelse($order->items as $it)
                <tr>
                  <td class="px-3 py-2">
                    <div class="font-semibold">{{ $it->product_name }}</div>
                  </td>
                  <td class="px-3 py-2 text-right">{{ $money($it->price) }}</td>
                  <td class="px-3 py-2 text-right font-semibold">{{ (int)$it->quantity }}</td>
                  <td class="px-3 py-2 text-right font-black">{{ $money($it->subtotal) }}</td>
                </tr>
              @empty
                <tr>
                  <td colspan="4" class="px-3 py-6 text-center text-zinc-500">Pedido sin items.</td>
                </tr>
              @endforelse
            </tbody>
          </table>
        </div>

        <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Total</span>
            <span class="font-black">{{ $money($order->total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Pedido #' . $order->id)

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusMap = [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado'     => 'Entregado',
    'cancelado'     => 'Cancelado',
  ];

  $badge = function(string $st) {
    return match($st) {
      'pendiente'     => 'badge-amber',
      'confirmado'    => 'badge-sky',
      'preparando'    => 'badge-indigo',
      'listo_retirar' => 'badge-emerald',
      'entregado'     => 'badge-zinc',
      'cancelado'     => 'badge-rose',
      default         => 'badge-zinc',
    };
  };

  $customerName = $order->pickup_name ?: ($order->user?->name ?? '—');
  $customerPhone = $order->pickup_phone ?: '—';
@endphp

@section('content')
<div class="container-page py-6">
  <div class="page-head">
    <div class="flex flex-wrap items-center gap-2">
      <h1 class="page-title">Pedido #{{ $order->id }}</h1>
      <span class="{{ $badge($order->status) }}">{{ $statusMap[$order->status] ?? $order->status }}</span>
      <span class="badge-zinc">Total: {{ $money($order->total) }}</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.orders.index') }}" class="btn-ghost btn-sm">Volver</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success mb-4">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="alert-error mb-4">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5 font-semibold">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Columna izquierda: cliente + estado --}}
    <div class="space-y-4 lg:col-span-1">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Cliente</div>
          <span class="badge-zinc">{{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}</span>
        </div>
        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Nombre</span>
              <span class="font-extrabold text-right">{{ $customerName }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Teléfono</span>
              <span class="font-extrabold text-right">{{ $customerPhone }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Email</span>
              <span class="font-extrabold text-right">{{ $order->user?->email ?? '—' }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Pago</span>
              <span class="font-extrabold text-right">{{ $order->payment_method ?: '—' }}</span>
            </div>
          </div>

          @if($order->notes)
            <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div class="text-xs font-black uppercase text-zinc-500">Notas</div>
              <div class="mt-1 whitespace-pre-wrap font-semibold text-zinc-800">{{ $order->notes }}</div>
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Estado</div>
          <span class="{{ $badge($order->status) }}">{{ $statusMap[$order->status] ?? $order->status }}</span>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.orders.updateStatus', $order->id) }}" class="space-y-3">
            @csrf

            <div>
              <label for="status" class="block mb-1">Nuevo estado</label>
              <select id="status" name="status">
                @foreach($statusMap as $k => $label)
                  <option value="{{ $k }}" @selected(old('status', $order->status) === $k)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <button class="btn-primary w-full">Guardar estado</button>

            <p class="text-xs text-zinc-500">
              Tip: “Listo para retirar” es ideal para avisar al cliente.
            </p>
          </form>
        </div>
      </div>
    </div>

    {{-- Columna derecha: items --}}
    <div class="lg:col-span-2">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Items del pedido</div>
          <div class="font-black">{{ $money($order->total) }}</div>
        </div>

        <div class="card-body">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Cant.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @forelse($order->items as $it)
                  <tr>
                    <td>
                      <div class="font-extrabold">{{ $it->product_name }}</div>
                    </td>
                    <td class="text-right font-semibold">{{ $money($it->price) }}</td>
                    <td class="text-right font-extrabold">{{ (int)$it->quantity }}</td>
                    <td class="text-right font-black">{{ $money($it->subtotal) }}</td>
                  </tr>
                @empty
                  <tr>
                    <td colspan="4" class="py-8 text-center text-zinc-500">Pedido sin items.</td>
                  </tr>
                @endforelse
              </tbody>
            </table>
          </div>

          <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-zinc-600 font-semibold">Total</span>
              <span class="font-black">{{ $money($order->total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

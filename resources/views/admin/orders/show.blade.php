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
      'pendiente' => 'badge-amber',
      'confirmado' => 'badge-sky',
      'preparando' => 'badge-indigo',
      'listo_retirar' => 'badge-emerald',
      'entregado' => 'badge-zinc',
      'cancelado' => 'badge-rose',
      default => 'badge-zinc',
    };
  };

  $payLabel = fn(?string $m) => match($m) {
    'local' => 'Pago en el local',
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => $m ? ucfirst(str_replace('_',' ',$m)) : '—',
  };

  $items = $order->items ?? collect();

  $clientName  = $order->pickup_name ?: ($order->user?->name ?? '—');
  $clientPhone = $order->pickup_phone ?: '—';
  $clientEmail = $order->user?->email ?? null;
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-black tracking-tight">Pedido #{{ $order->id }}</h1>
        <span class="{{ $badge($order->status) }}">
          {{ $statusMap[$order->status] ?? $order->status }}
        </span>
      </div>

      <p class="mt-1 text-sm text-zinc-600">
        {{ $order->created_at?->format('d/m/Y H:i') }}
        <span class="text-zinc-400">·</span>
        Total: <span class="font-black text-zinc-900">{{ $money($order->total) }}</span>
      </p>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <a href="{{ route('admin.orders.index') }}" class="btn-outline w-full sm:w-auto">Volver</a>
    </div>
  </div>

  @if(session('success'))
    <div class="alert-success mt-4">{{ session('success') }}</div>
  @endif
  @if(session('error'))
    <div class="alert-error mt-4">{{ session('error') }}</div>
  @endif

  <div class="mt-5 grid gap-4 lg:grid-cols-3">
    {{-- Columna derecha: cliente + estado --}}
    <div class="lg:col-span-1 grid gap-4">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Cliente</div>
          <span class="badge-sky">Retiro</span>
        </div>

        <div class="card-body grid gap-3">
          <div>
            <div class="muted">Nombre</div>
            <div class="font-black">{{ $clientName }}</div>
          </div>

          <div>
            <div class="muted">Teléfono</div>
            <div class="font-black">{{ $clientPhone }}</div>
          </div>

          @if($clientEmail)
            <div>
              <div class="muted">Email</div>
              <div class="font-black break-all">{{ $clientEmail }}</div>
            </div>
          @endif

          <div>
            <div class="muted">Pago</div>
            <div class="font-black">{{ $payLabel($order->payment_method) }}</div>
          </div>

          @if($order->notes)
            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-800">
              <div class="text-xs font-bold text-zinc-500 uppercase">Notas</div>
              <div class="mt-1 whitespace-pre-wrap">{{ $order->notes }}</div>
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Cambiar estado</div>
          <span class="{{ $badge($order->status) }}">{{ $statusMap[$order->status] ?? $order->status }}</span>
        </div>

        <div class="card-body">
          <form method="POST" action="{{ route('admin.orders.updateStatus', $order) }}" class="grid gap-3">
            @csrf

            <select name="status" required class="w-full">
              @foreach($statusMap as $k => $label)
                <option value="{{ $k }}" @selected($order->status === $k)>{{ $label }}</option>
              @endforeach
            </select>

            <button class="btn-primary w-full" type="submit">Guardar estado</button>

            <p class="text-xs text-zinc-500">
              Tip: “Listo para retirar” es ideal para avisar al cliente.
            </p>
          </form>
        </div>
      </div>
    </div>

    {{-- Items --}}
    <div class="lg:col-span-2">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Items del pedido</div>
          <span class="badge-sky">{{ $items->count() }} ítems</span>
        </div>

        <div class="card-body">
          {{-- Mobile: cards --}}
          <div class="grid gap-3 md:hidden">
            @forelse($items as $item)
              @php
                $qty = (int)($item->quantity ?? 0);
                $price = (float)($item->price ?? 0);
                $sub = (float)($item->subtotal ?? ($price * $qty));
              @endphp
              <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                <div class="font-black text-zinc-900">{{ $item->product_name }}</div>
                <div class="text-xs text-zinc-500 mt-1">
                  {{ $money($price) }} · x{{ $qty }}
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <div class="text-xs text-zinc-500">Subtotal</div>
                  <div class="font-black text-zinc-900">{{ $money($sub) }}</div>
                </div>
              </div>
            @empty
              <div class="text-zinc-500">No hay ítems.</div>
            @endforelse
          </div>

          {{-- Desktop: tabla --}}
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-[720px] w-full text-sm">
              <thead>
                <tr class="border-b border-zinc-100 text-left">
                  <th class="py-2">Producto</th>
                  <th class="py-2">Precio</th>
                  <th class="py-2">Cant.</th>
                  <th class="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @forelse($items as $item)
                  @php
                    $qty = (int)($item->quantity ?? 0);
                    $price = (float)($item->price ?? 0);
                    $sub = (float)($item->subtotal ?? ($price * $qty));
                  @endphp
                  <tr class="border-b border-zinc-50">
                    <td class="py-3 font-bold">{{ $item->product_name }}</td>
                    <td class="py-3">{{ $money($price) }}</td>
                    <td class="py-3">{{ $qty }}</td>
                    <td class="py-3 text-right font-black">{{ $money($sub) }}</td>
                  </tr>
                @empty
                  <tr>
                    <td colspan="4" class="py-6 text-center text-zinc-500">No hay ítems.</td>
                  </tr>
                @endforelse
              </tbody>
            </table>
          </div>

          <div class="mt-4 rounded-2xl border border-zinc-100 bg-white p-4">
            <div class="flex items-center justify-between">
              <span class="muted">Total</span>
              <span class="text-xl font-black text-zinc-900">{{ $money($order->total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
@endsection

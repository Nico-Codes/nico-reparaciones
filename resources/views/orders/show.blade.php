@extends('layouts.app')

@section('title', 'Pedido #' . $order->id . ' - NicoReparaciones')

@section('content')
  @php
    $status = (string) $order->status;

    $badge = match ($status) {
      'pending' => 'badge-amber',
      'confirmed', 'preparing' => 'badge-blue',
      'ready', 'delivered' => 'badge-green',
      'cancelled', 'canceled' => 'badge-red',
      default => 'badge-zinc',
    };

    $statusLabel = ucfirst(str_replace('_', ' ', $status));

    $payLabel = match ((string)($order->payment_method ?? 'local')) {
      'mercado_pago' => 'Mercado Pago',
      'transferencia' => 'Transferencia',
      default => 'Pago en el local',
    };

    $items = $order->items ?? collect();
  @endphp

  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Pedido #{{ $order->id }}</h1>
      <p class="muted mt-1">Detalle del pedido y productos.</p>
    </div>
    <a href="{{ route('orders.index') }}" class="btn-outline">Volver</a>
  </div>

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
    {{-- Items --}}
    <div class="card">
      <div class="card-header flex items-center justify-between gap-3">
        <div class="section-title">Productos</div>
        <span class="muted">{{ $items->count() }} item{{ $items->count() === 1 ? '' : 's' }}</span>
      </div>

      <div class="card-body">
        @if($items->isEmpty())
          <div class="muted">No hay items asociados a este pedido.</div>
        @else
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th class="th">Producto</th>
                  <th class="th">Precio</th>
                  <th class="th">Cant.</th>
                  <th class="th text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @foreach($items as $item)
                  @php
                    $sub = (float)($item->price ?? 0) * (int)($item->quantity ?? 0);
                  @endphp
                  <tr class="row-hover">
                    <td class="td">
                      <div class="font-semibold">{{ $item->product_name ?? 'Producto' }}</div>
                    </td>
                    <td class="td">${{ number_format($item->price ?? 0, 0, ',', '.') }}</td>
                    <td class="td">{{ $item->quantity ?? 0 }}</td>
                    <td class="td text-right font-semibold">${{ number_format($sub, 0, ',', '.') }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          </div>
        @endif
      </div>
    </div>

    {{-- Summary --}}
    <div class="card h-fit lg:sticky lg:top-20">
      <div class="card-header">
        <div class="section-title">Resumen</div>
        <div class="muted">Estado y total</div>
      </div>

      <div class="card-body space-y-3">
        <div class="flex items-center justify-between">
          <div class="muted">Estado</div>
          <span class="{{ $badge }}">{{ $statusLabel }}</span>
        </div>

        <div class="flex items-center justify-between">
          <div class="muted">Pago</div>
          <div class="font-semibold">{{ $payLabel }}</div>
        </div>

        @if(!empty($order->pickup_name) || !empty($order->pickup_phone))
          <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="font-bold">Retiro</div>
            <div class="muted mt-1">
              @if(!empty($order->pickup_name))
                <div><span class="font-semibold text-zinc-800">Retira:</span> {{ $order->pickup_name }}</div>
              @endif
              @if(!empty($order->pickup_phone))
                <div><span class="font-semibold text-zinc-800">Tel:</span> {{ $order->pickup_phone }}</div>
              @endif
            </div>
          </div>
        @endif

        @if(!empty($order->notes))
          <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="font-bold">Notas</div>
            <div class="muted mt-1">{{ $order->notes }}</div>
          </div>
        @endif

        <div class="h-px bg-zinc-100"></div>

        <div class="flex items-center justify-between">
          <div class="muted">Total</div>
          <div class="text-2xl font-extrabold">${{ number_format($order->total, 0, ',', '.') }}</div>
        </div>

        <div class="pt-2 space-y-2">
          <a href="{{ route('store.index') }}" class="btn-outline w-full">Seguir comprando</a>
          <a href="{{ route('orders.index') }}" class="btn-primary w-full">Volver a mis pedidos</a>
        </div>
      </div>
    </div>
  </div>
@endsection

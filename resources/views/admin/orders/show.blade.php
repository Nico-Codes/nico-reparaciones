@extends('layouts.app')

@section('title', 'Admin - Pedido #'.$order->id)

@section('content')
@php
  $status = (string)($order->status ?? '');
  $badge = match ($status) {
    'pendiente' => 'badge-amber',
    'confirmado', 'preparando' => 'badge-blue',
    'listo_retirar', 'entregado' => 'badge-green',
    'cancelado' => 'badge-red',
    default => 'badge-zinc',
  };

  $statusLabel = match ($status) {
    'pendiente' => 'Pendiente',
    'confirmado' => 'Confirmado',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado' => 'Entregado',
    'cancelado' => 'Cancelado',
    default => ucfirst(str_replace('_',' ', $status)),
  };

  $pay = (string)($order->payment_method ?? 'local');
  $payLabel = match ($pay) {
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => 'Pago en el local',
  };

  $customerName = $order->pickup_name ?: trim(($order->user->name ?? '').' '.($order->user->last_name ?? ''));
  $customerPhone = $order->pickup_phone ?: ($order->user->phone ?? '');
  $customerEmail = $order->user->email ?? '';

  $items = $order->items ?? collect();

  $itemsSummary = $items->map(fn($i) => ($i->quantity ?? 0).'x '.($i->product_name ?? 'Producto'))->implode(', ');
  $notesPrefill = "Generado desde pedido #{$order->id} ({$order->created_at->format('d/m/Y H:i')}).";
  if ($itemsSummary) $notesPrefill .= " Productos: {$itemsSummary}.";

  $repairCreateUrl = route('admin.repairs.create', [
    'user_email' => $customerEmail,
    'customer_name' => $customerName,
    'customer_phone' => $customerPhone,
    'notes' => $notesPrefill,
  ]);
@endphp

  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Pedido #{{ $order->id }}</h1>
      <p class="muted mt-1">{{ $order->created_at->format('d/m/Y H:i') }} · <span class="{{ $badge }}">{{ $statusLabel }}</span></p>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <a class="btn-outline" href="{{ route('admin.orders.index') }}">Volver</a>
      <a class="btn-primary" href="{{ $repairCreateUrl }}">Crear reparación</a>
    </div>
  </div>

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
    {{-- Items --}}
    <div class="card">
      <div class="card-header flex items-center justify-between gap-3">
        <div class="section-title">Productos</div>
        <div class="muted">{{ $items->count() }} item{{ $items->count() === 1 ? '' : 's' }}</div>
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
                    $p = (float)($item->price ?? 0);
                    $q = (int)($item->quantity ?? 0);
                    $sub = $p * $q;
                  @endphp
                  <tr class="row-hover">
                    <td class="td">
                      <div class="font-semibold">{{ $item->product_name ?? 'Producto' }}</div>
                    </td>
                    <td class="td">${{ number_format($p, 0, ',', '.') }}</td>
                    <td class="td">{{ $q }}</td>
                    <td class="td text-right font-semibold">${{ number_format($sub, 0, ',', '.') }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          </div>
        @endif

        @if(!empty($order->notes))
          <div class="mt-4 rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="font-bold">Notas del cliente</div>
            <div class="muted mt-1">{{ $order->notes }}</div>
          </div>
        @endif
      </div>
    </div>

    {{-- Sidebar --}}
    <div class="space-y-4">
      {{-- Resumen --}}
      <div class="card">
        <div class="card-header">
          <div class="section-title">Resumen</div>
          <div class="muted">Cliente / pago / total</div>
        </div>

        <div class="card-body space-y-3">
          <div class="rounded-2xl bg-zinc-50 ring-1 ring-zinc-200 p-3">
            <div class="muted">Cliente</div>
            <div class="font-bold">{{ $customerName ?: '—' }}</div>
            @if($customerPhone)<div class="muted mt-1">📞 {{ $customerPhone }}</div>@endif
            @if($customerEmail)<div class="muted">✉️ {{ $customerEmail }}</div>@endif
          </div>

          <div class="flex items-center justify-between">
            <div class="muted">Pago</div>
            <div class="font-semibold">{{ $payLabel }}</div>
          </div>

          <div class="flex items-center justify-between">
            <div class="muted">Estado</div>
            <span class="{{ $badge }}">{{ $statusLabel }}</span>
          </div>

          <div class="h-px bg-zinc-100"></div>

          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-2xl font-extrabold">${{ number_format($order->total ?? 0, 0, ',', '.') }}</div>
          </div>

          <a class="btn-primary w-full" href="{{ $repairCreateUrl }}">Crear reparación desde este pedido</a>
        </div>
      </div>

      {{-- Cambiar estado --}}
      <div class="card">
        <div class="card-header">
          <div class="section-title">Cambiar estado</div>
          <div class="muted">Actualizá y guardá</div>
        </div>

        <div class="card-body">
          <form action="{{ route('admin.orders.updateStatus', $order->id) }}" method="POST" class="space-y-3">
            @csrf

            <div>
              <label class="label" for="status">Estado</label>
              <select id="status" name="status" class="select">
                <option value="pendiente" {{ $status === 'pendiente' ? 'selected' : '' }}>Pendiente</option>
                <option value="confirmado" {{ $status === 'confirmado' ? 'selected' : '' }}>Confirmado</option>
                <option value="preparando" {{ $status === 'preparando' ? 'selected' : '' }}>Preparando</option>
                <option value="listo_retirar" {{ $status === 'listo_retirar' ? 'selected' : '' }}>Listo para retirar</option>
                <option value="entregado" {{ $status === 'entregado' ? 'selected' : '' }}>Entregado</option>
                <option value="cancelado" {{ $status === 'cancelado' ? 'selected' : '' }}>Cancelado</option>
              </select>
            </div>

            <button type="submit" class="btn-primary w-full">Guardar estado</button>
          </form>

          <div class="muted mt-3">
            Tip: si el pedido deriva en una reparación, usá “Crear reparación” para prellenar datos.
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Pedido #' . $order->id)

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $statusLabel = fn($s) => match($s) {
    'pendiente' => 'Pendiente',
    'confirmado' => 'Confirmado',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado' => 'Entregado',
    'cancelado' => 'Cancelado',
    default => ucfirst(str_replace('_', ' ', (string)$s)),
  };

  $statusBadge = fn($s) => match($s) {
    'pendiente' => 'badge badge-amber',
    'confirmado' => 'badge badge-sky',
    'preparando' => 'badge badge-purple',
    'listo_retirar' => 'badge badge-emerald',
    'entregado' => 'badge bg-zinc-900 text-white ring-zinc-900/10',
    'cancelado' => 'badge badge-rose',
    default => 'badge badge-zinc',
  };

  $payLabel = fn($p) => match($p) {
    'local' => 'Pago en el local',
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => ucfirst(str_replace('_', ' ', (string)$p)),
  };

  $customerName = $order->pickup_name ?: trim(($order->user->name ?? '').' '.($order->user->last_name ?? ''));
  $customerPhone = $order->pickup_phone ?: ($order->user->phone ?? '');
  $itemsSummary = $order->items->map(fn($i) => $i->quantity.'x '.$i->product_name)->implode(', ');

  $notesPrefill = "Generado desde pedido #{$order->id} ({$order->created_at->format('d/m/Y H:i')}).";
  if ($itemsSummary) $notesPrefill .= " Productos: {$itemsSummary}.";

  $repairCreateUrl = route('admin.repairs.create', [
    'user_email' => $order->user->email ?? '',
    'customer_name' => $customerName,
    'customer_phone' => $customerPhone,
    'notes' => $notesPrefill,
  ]);
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="page-title">Pedido #{{ $order->id }}</h1>
        <span class="{{ $statusBadge($order->status) }}">{{ $statusLabel($order->status) }}</span>
      </div>
      <p class="page-subtitle">Detalle completo del pedido y acciones de administración.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a href="{{ route('admin.orders.index') }}" class="btn-outline">← Volver</a>
      <a href="{{ $repairCreateUrl }}" class="btn-primary">🛠️ Crear reparación</a>
    </div>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

    {{-- Items --}}
    <div class="lg:col-span-2 space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Productos</div>
          <div class="text-xs text-zinc-500">Resumen de items del pedido.</div>
        </div>
        <div class="card-body space-y-3">
          @foreach($order->items as $item)
            <div class="rounded-2xl border border-zinc-200 bg-white p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-zinc-900">{{ $item->product_name }}</div>
                  <div class="mt-1 text-sm text-zinc-500">
                    x {{ $item->quantity }} · {{ $money($item->price) }} c/u
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-zinc-500">Subtotal</div>
                  <div class="text-sm font-extrabold text-zinc-900">{{ $money($item->subtotal) }}</div>
                </div>
              </div>
            </div>
          @endforeach
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Actualizar estado</div>
          <div class="text-xs text-zinc-500">Esto cambia lo que ve el cliente en “Mis pedidos”.</div>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.orders.updateStatus', $order) }}" class="flex flex-col sm:flex-row gap-3">
            @csrf
            <select name="status" class="select sm:w-72" required>
              <option value="pendiente" {{ $order->status === 'pendiente' ? 'selected' : '' }}>Pendiente</option>
              <option value="confirmado" {{ $order->status === 'confirmado' ? 'selected' : '' }}>Confirmado</option>
              <option value="preparando" {{ $order->status === 'preparando' ? 'selected' : '' }}>Preparando</option>
              <option value="listo_retirar" {{ $order->status === 'listo_retirar' ? 'selected' : '' }}>Listo para retirar</option>
              <option value="entregado" {{ $order->status === 'entregado' ? 'selected' : '' }}>Entregado</option>
              <option value="cancelado" {{ $order->status === 'cancelado' ? 'selected' : '' }}>Cancelado</option>
            </select>
            <button type="submit" class="btn-primary">Guardar estado</button>
          </form>
        </div>
      </div>
    </div>

    {{-- Sidebar --}}
    <div class="space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Cliente</div>
          <div class="text-xs text-zinc-500">Datos del usuario / retiro.</div>
        </div>
        <div class="card-body text-sm space-y-2">
          <div class="flex items-center justify-between gap-3">
            <span class="text-zinc-600">Nombre</span>
            <span class="font-semibold text-zinc-900">{{ $order->user->name ?? '—' }} {{ $order->user->last_name ?? '' }}</span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-zinc-600">Email</span>
            <span class="font-semibold text-zinc-900">{{ $order->user->email ?? '—' }}</span>
          </div>

          @if(!empty($order->user->phone))
            <div class="flex items-center justify-between gap-3">
              <span class="text-zinc-600">Teléfono</span>
              <span class="font-semibold text-zinc-900">{{ $order->user->phone }}</span>
            </div>
          @endif

          @if(!empty($order->pickup_name) || !empty($order->pickup_phone))
            <div class="h-px bg-zinc-100 my-2"></div>

            @if(!empty($order->pickup_name))
              <div class="flex items-center justify-between gap-3">
                <span class="text-zinc-600">Retira</span>
                <span class="font-semibold text-zinc-900">{{ $order->pickup_name }}</span>
              </div>
            @endif

            @if(!empty($order->pickup_phone))
              <div class="flex items-center justify-between gap-3">
                <span class="text-zinc-600">Tel. retiro</span>
                <span class="font-semibold text-zinc-900">{{ $order->pickup_phone }}</span>
              </div>
            @endif
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Pedido</div>
          <div class="text-xs text-zinc-500">Total, pago y notas.</div>
        </div>
        <div class="card-body text-sm space-y-2">
          <div class="flex items-center justify-between gap-3">
            <span class="text-zinc-600">Fecha</span>
            <span class="font-semibold text-zinc-900">{{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}</span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-zinc-600">Total</span>
            <span class="font-extrabold text-zinc-900">{{ $money($order->total) }}</span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-zinc-600">Pago</span>
            <span class="font-semibold text-zinc-900">{{ $payLabel($order->payment_method) }}</span>
          </div>

          @if($order->notes)
            <div class="h-px bg-zinc-100 my-2"></div>
            <div>
              <div class="text-xs text-zinc-500">Notas cliente</div>
              <div class="mt-1 text-sm text-zinc-800 whitespace-pre-line">{{ $order->notes }}</div>
            </div>
          @endif
        </div>
      </div>
    </div>

  </div>
</div>
@endsection

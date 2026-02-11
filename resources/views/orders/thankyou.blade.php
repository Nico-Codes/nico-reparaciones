@extends('layouts.app')

@section('title', 'Pedido recibido')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $payLabel = fn(?string $m) => match($m) {
    'local' => 'Pago en el local',
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => $m ? ucfirst(str_replace('_',' ',$m)) : '-',
  };

  $status = (string)($order->status ?? 'pendiente');
  $label = fn(string $s) => match($s) {
    'listo_retirar' => 'Listo para retirar',
    default => ucfirst(str_replace('_',' ',$s)),
  };

  $statusHint = match($status) {
    'pendiente' => 'Recibimos tu pedido. En breve lo confirmamos.',
    'confirmado' => 'Pedido confirmado. Lo estamos preparando.',
    'preparando' => 'Estamos preparando tu pedido.',
    'listo_retirar' => 'Listo, podes pasar a retirarlo por el local.',
    'entregado' => 'Pedido entregado. Gracias por tu compra.',
    'cancelado' => 'Este pedido fue cancelado.',
    default => 'Estado actualizado.',
  };
@endphp

@section('content')
  <div class="mb-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="inline-flex items-center gap-2 text-emerald-800">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">OK</span>
          <span class="text-xl font-black tracking-tight">Pedido recibido</span>
        </div>
        <div class="mt-1 text-sm text-emerald-900/80">
          Pedido #{{ $order->id }} · {{ $order->created_at?->format('d/m/Y H:i') }}
        </div>
      </div>

      <div class="text-left sm:text-right">
        <div class="text-xs font-bold uppercase tracking-wide text-emerald-800/80">Total</div>
        <div class="text-2xl font-black text-emerald-900">{{ $fmt($order->total) }}</div>
      </div>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="card lg:col-span-2">
      <div class="card-head">
        <div class="font-black">Resumen</div>
        <span class="badge-sky">{{ $label($status) }}</span>
      </div>

      <div class="card-body grid gap-4">
        <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
          <div class="font-black text-zinc-900">Estado actual</div>
          <div class="mt-1">{{ $statusHint }}</div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <div class="muted">Nombre</div>
            <div class="font-black">{{ $order->pickup_name ?: '-' }}</div>
          </div>
          <div>
            <div class="muted">Telefono</div>
            <div class="font-black">{{ $order->pickup_phone ?: '-' }}</div>
          </div>

          @if($order->pickup_delegate_name || $order->pickup_delegate_phone)
            <div class="sm:col-span-2">
              <div class="muted">Retira</div>
              <div class="font-black">
                {{ $order->pickup_delegate_name ?: '-' }}
                @if($order->pickup_delegate_phone)
                  <span class="muted font-normal">({{ $order->pickup_delegate_phone }})</span>
                @endif
              </div>
            </div>
          @endif

          <div>
            <div class="muted">Pago</div>
            <div class="font-black">{{ $payLabel($order->payment_method) }}</div>
          </div>
          <div>
            <div class="muted">Retiro</div>
            <div class="font-black">En el local</div>
          </div>
        </div>

        @if($order->notes)
          <div>
            <div class="muted">Notas</div>
            <div class="text-sm text-zinc-800">{{ $order->notes }}</div>
          </div>
        @endif

        <div class="h-px bg-zinc-100"></div>

        <div class="grid gap-2">
          @foreach($order->items as $it)
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate font-bold text-zinc-900">{{ $it->product_name }}</div>
                <div class="text-xs text-zinc-500">x{{ (int)$it->quantity }}</div>
              </div>
              <div class="whitespace-nowrap font-black text-zinc-900">{{ $fmt($it->subtotal) }}</div>
            </div>
          @endforeach
        </div>

        <div class="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          <a class="btn-outline w-full sm:w-auto" href="{{ route('orders.show', $order->id) }}">Ver detalle</a>
          <a class="btn-outline w-full sm:w-auto" href="{{ route('orders.index') }}">Mis pedidos</a>
          <a class="btn-primary w-full sm:w-auto" href="{{ route('store.index') }}">Seguir comprando</a>

          @if(!empty($waNumber))
            <textarea id="nrWaText" class="hidden" readonly>{{ $waText }}</textarea>

            <a class="btn-ghost w-full sm:w-auto"
               target="_blank" rel="noopener"
               href="https://wa.me/{{ $waNumber }}?text={{ rawurlencode($waText) }}">
              Consultar por WhatsApp
            </a>

            <button type="button"
                    class="btn-outline w-full sm:w-auto"
                    data-copy-target="#nrWaText"
                    data-copy-toast="Mensaje copiado">
              Copiar mensaje
            </button>
          @endif
        </div>
      </div>
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Siguiente paso</div>
      </div>
      <div class="card-body text-sm text-zinc-700">
        Revisa el estado en "Mis pedidos". Te avisamos cuando este listo para retirar.
      </div>
    </div>
  </div>
@endsection


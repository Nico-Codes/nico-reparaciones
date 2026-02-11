@extends('layouts.app')

@section('title', 'Pedido #'.$order->id)

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $badge = function(string $s) {
    return match($s) {
      'pendiente' => 'badge-amber',
      'confirmado' => 'badge-sky',
      'preparando' => 'badge-indigo',
      'listo_retirar' => 'badge-emerald',
      'entregado' => 'badge-zinc',
      'cancelado' => 'badge-rose',
      default => 'badge-zinc',
    };
  };

  $label = fn(string $s) => match($s) {
    'listo_retirar' => 'Listo para retirar',
    default => ucfirst(str_replace('_',' ',$s)),
  };

  $payLabel = fn(?string $m) => match($m) {
    'local' => 'Pago en el local',
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => $m ? ucfirst(str_replace('_',' ',$m)) : '-',
  };

  $items = $order->items ?? collect();

  $steps = ['pendiente', 'confirmado', 'preparando', 'listo_retirar', 'entregado'];
  $status = (string)($order->status ?? 'pendiente');
  $isCancelled = $status === 'cancelado';

  $stepIndex = array_search($status, $steps, true);
  if ($stepIndex === false) $stepIndex = 0;

  $stepName = fn($s) => match($s) {
    'pendiente' => 'Pendiente',
    'confirmado' => 'Confirmado',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listo',
    'entregado' => 'Entregado',
    default => ucfirst(str_replace('_',' ',$s)),
  };

  $statusHint = match($status) {
    'pendiente' => 'Recibimos tu pedido. En breve lo confirmamos.',
    'confirmado' => 'Pedido confirmado. Lo estamos preparando.',
    'preparando' => 'Estamos preparando tu pedido.',
    'listo_retirar' => 'Listo. Puedes pasar a retirarlo por el local.',
    'entregado' => 'Pedido entregado. Gracias.',
    'cancelado' => 'Este pedido fue cancelado.',
    default => 'Estado actualizado.',
  };

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <div class="page-title">Pedido #{{ $order->id }}</div>
      <div class="page-subtitle">{{ $order->created_at?->format('d/m/Y H:i') }}</div>
    </div>

    <div class="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
      <span class="{{ $badge($status) }}">{{ $label($status) }}</span>
      <a href="{{ route('orders.index') }}" class="btn-ghost h-10 px-3 text-xs">Volver</a>
    </div>
  </div>

  <div class="mb-5 rounded-2xl border border-zinc-200 bg-white p-4">
    <div class="text-sm text-zinc-700">
      <span class="font-black text-zinc-900">Estado:</span> {{ $statusHint }}
    </div>

    @if($isCancelled)
      <div class="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
        Si necesitas ayuda, escribenos y lo resolvemos.
      </div>
    @else
      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        @foreach($steps as $i => $s)
          @php
            $done = $i <= $stepIndex;
          @endphp
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-full border {{ $done ? 'border-sky-600 bg-sky-600 text-white' : 'border-zinc-200 bg-white text-zinc-400' }}">
              <span class="text-xs font-black">{{ $i+1 }}</span>
            </div>
            <div class="text-xs {{ $done ? 'font-black text-zinc-900' : 'font-bold text-zinc-500' }}">
              {{ $stepName($s) }}
            </div>
          </div>
        @endforeach
      </div>
    @endif
  </div>

  <div class="grid gap-4 lg:grid-cols-3 lg:items-start">
    <div class="card lg:col-span-2">
      <div class="card-head items-start">
        <div class="font-black">Items</div>
        <span class="badge-sky">{{ $items->count() }} producto{{ $items->count() === 1 ? '' : 's' }}</span>
      </div>

      <div class="card-body p-4 sm:p-5">
        <div class="grid gap-3 md:hidden">
          @foreach($items as $item)
            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <div class="font-black text-zinc-900">{{ $item->product_name }}</div>
              <div class="mt-1 text-xs text-zinc-500">
                {{ $fmt($item->price) }} | x{{ (int)$item->quantity }}
              </div>
              <div class="mt-2 flex items-center justify-between">
                <div class="text-xs text-zinc-500">Subtotal</div>
                <div class="font-black text-zinc-900">{{ $fmt($item->subtotal) }}</div>
              </div>
            </div>
          @endforeach
        </div>

        <div class="hidden overflow-x-auto md:block">
          <table class="min-w-[640px]">
            <thead>
              <tr class="border-b border-zinc-100">
                <th class="py-2 text-left">Producto</th>
                <th class="py-2 text-left">Precio</th>
                <th class="py-2 text-left">Cant.</th>
                <th class="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @foreach($items as $item)
                <tr class="border-b border-zinc-50">
                  <td class="py-3 font-bold">{{ $item->product_name }}</td>
                  <td class="py-3">{{ $fmt($item->price) }}</td>
                  <td class="py-3">{{ (int)$item->quantity }}</td>
                  <td class="py-3 text-right font-black">{{ $fmt($item->subtotal) }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
        </div>

        <div class="mt-4 rounded-2xl bg-zinc-50 px-3 py-2">
          <div class="flex items-center justify-between">
            <div class="text-sm font-bold text-zinc-600">Total</div>
            <div class="text-2xl font-black tracking-tight">{{ $fmt($order->total) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card h-fit lg:sticky lg:top-20">
      <div class="card-head">
        <div class="font-black">Detalles</div>
        <span class="badge-sky">Retiro</span>
      </div>

      <div class="card-body grid gap-3 p-4 sm:p-5">
        <div>
          <div class="muted">Nombre</div>
          <div class="font-black">{{ $order->pickup_name ?: '-' }}</div>
        </div>

        <div>
          <div class="muted">Teléfono</div>
          <div class="font-black">{{ $order->pickup_phone ?: '-' }}</div>
        </div>

        @if($order->pickup_delegate_name || $order->pickup_delegate_phone)
          <div>
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
          <div class="muted">Metodo de pago</div>
          <div class="font-black">{{ $payLabel($order->payment_method) }}</div>
        </div>

        @if($order->notes)
          <div>
            <div class="muted">Notas</div>
            <div class="text-sm text-zinc-800">{{ $order->notes }}</div>
          </div>
        @endif

        <div class="mt-2 grid gap-2">
          @if(!empty($waNumber))
            <textarea id="nrOrderWaText" class="hidden" readonly>{{ $waText }}</textarea>

            <a class="btn-ghost h-11 w-full"
               target="_blank" rel="noopener"
               href="https://wa.me/{{ $waNumber }}?text={{ rawurlencode($waText) }}">
              Consultar por WhatsApp
            </a>

            <button type="button"
                    class="btn-outline h-11 w-full"
                    data-copy-target="#nrOrderWaText"
                    data-copy-toast="Mensaje copiado">
              Copiar mensaje
            </button>
          @endif

          @if($has('store.index'))
            <a href="{{ route('store.index') }}" class="btn-primary h-11 w-full">Ir a la tienda</a>
          @endif

          <a href="{{ route('orders.index') }}" class="btn-outline h-11 w-full">Volver a pedidos</a>
        </div>
      </div>
    </div>
  </div>
@endsection

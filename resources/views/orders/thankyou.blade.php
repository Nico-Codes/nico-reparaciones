@extends('layouts.app')

@section('title', 'Pedido recibido')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $payLabel = fn(?string $m) => match($m) {
    'local' => 'Pago en el local',
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => $m ? ucfirst(str_replace('_',' ',$m)) : '—',
  };
    $status = (string)($order->status ?? 'pendiente');
  $isCancelled = $status === 'cancelado';

  $steps = ['pendiente', 'confirmado', 'preparando', 'listo_retirar', 'entregado'];

  $stepIndex = array_search($status, $steps, true);
  if ($stepIndex === false) $stepIndex = 0;

  $label = fn(string $s) => match($s) {
    'listo_retirar' => 'Listo para retirar',
    default => ucfirst(str_replace('_',' ',$s)),
  };

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
    'listo_retirar' => '¡Listo! Podés pasar a retirarlo por el local.',
    'entregado' => 'Pedido entregado. ¡Gracias!',
    'cancelado' => 'Este pedido fue cancelado.',
    default => 'Estado actualizado.',
  };

@endphp

@section('content')
  <div class="page-head">
    <div>
      <div class="page-title flex items-center gap-2">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">✓</span>
        Pedido recibido
      </div>
      <div class="page-subtitle">
        Pedido #{{ $order->id }} · {{ $order->created_at?->format('d/m/Y H:i') }}
      </div>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="lg:col-span-2 card">
      <div class="card-head">
        <div class="font-black">Resumen</div>
        <span class="badge-sky">{{ $fmt($order->total) }}</span>
      </div>

      <div class="card-body grid gap-4">
        <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
          <div class="font-black text-zinc-900">¡Listo!</div>
          <div class="mt-1">
            <span class="font-black text-zinc-900">Estado:</span>
            <span class="font-black">{{ $label($status) }}</span>
            <span class="text-zinc-500">·</span>
            {{ $statusHint }}

          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <div class="muted">Nombre</div>
            <div class="font-black">{{ $order->pickup_name ?: '—' }}</div>
          </div>
          <div>
            <div class="muted">Teléfono</div>
            <div class="font-black">{{ $order->pickup_phone ?: '—' }}</div>
          </div>
          @if($order->pickup_delegate_name || $order->pickup_delegate_phone)
            <div class="sm:col-span-2">
                <div class="muted">Retira</div>
                <div class="font-black">
                {{ $order->pickup_delegate_name ?: '—' }}
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
                <div class="font-bold text-zinc-900 truncate">{{ $it->product_name }}</div>
                <div class="text-xs text-zinc-500">x{{ (int)$it->quantity }}</div>
              </div>
              <div class="font-black text-zinc-900 whitespace-nowrap">{{ $fmt($it->subtotal) }}</div>
            </div>
          @endforeach
        </div>

        <div class="flex flex-col sm:flex-row gap-2 pt-2">
          <a class="btn-outline w-full sm:w-auto" href="{{ route('orders.show', $order->id) }}">Ver detalle</a>
          <a class="btn-primary w-full sm:w-auto" href="{{ route('store.index') }}">Seguir comprando</a>
          <a class="btn-outline w-full sm:w-auto"
            target="_blank" rel="noopener"
            href="{{ route('orders.ticket', $order->id) }}?autoprint=1">
            Imprimir ticket
          </a>

          <a class="btn-outline w-full sm:w-auto"
            target="_blank" rel="noopener"
            href="{{ route('orders.print', $order->id) }}">
            Imprimir A4
          </a>

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
                    data-copy-toast="Mensaje copiado ✅">
                Copiar mensaje
            </button>
            @else
            <span class="text-xs text-zinc-500 sm:self-center">
                WhatsApp no disponible por el momento.
            </span>
            @endif


        </div>
      </div>
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Próximos pasos</div>
      </div>
            <div class="card-body grid gap-3 text-sm text-zinc-700">
            @if($isCancelled)
                <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                Este pedido fue cancelado. Si necesitás ayuda, escribinos y lo resolvemos.
                </div>
            @else
                @foreach($steps as $i => $s)
                @php $done = $i <= $stepIndex; @endphp

                <div class="flex items-center gap-2">
                    <div class="h-7 w-7 rounded-full border flex items-center justify-center
                                {{ $done ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-zinc-200 text-zinc-400' }}">
                    <span class="text-xs font-black">{{ $i+1 }}</span>
                    </div>

                    <div class="text-xs {{ $done ? 'text-zinc-900 font-black' : 'text-zinc-500 font-bold' }}">
                    {{ $stepName($s) }}
                    </div>
                </div>
                @endforeach
            @endif
            </div>

    </div>
  </div>
@endsection

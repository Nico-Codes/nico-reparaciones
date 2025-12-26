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
            Tu pedido quedó en estado <span class="font-black">Pendiente</span>. En breve lo confirmamos.
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

          @if(!empty($waNumber))
            <a class="btn-ghost w-full sm:w-auto"
               target="_blank" rel="noopener"
               href="https://wa.me/{{ $waNumber }}?text={{ rawurlencode($waText) }}">
              Escribir por WhatsApp
            </a>
          @else
            <span class="text-xs text-zinc-500 sm:self-center">
              (Configurar WhatsApp en Admin → Configuración)
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
        <div class="flex items-center gap-2">
          <span class="badge-sky">1</span> Recibido (Pendiente)
        </div>
        <div class="flex items-center gap-2">
          <span class="badge-zinc">2</span> Confirmación
        </div>
        <div class="flex items-center gap-2">
          <span class="badge-zinc">3</span> Preparación
        </div>
        <div class="flex items-center gap-2">
          <span class="badge-zinc">4</span> Listo para retirar
        </div>
      </div>
    </div>
  </div>
@endsection

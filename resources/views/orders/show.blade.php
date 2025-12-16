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

  $label = fn(string $s) => ucfirst(str_replace('_',' ',$s));

  $payLabel = function($m) {
    return match((string)$m) {
      'local' => 'Pago en el local',
      'mercado_pago' => 'Mercado Pago',
      'transferencia' => 'Transferencia',
      default => $m ?: '—',
    };
  };

  $status = (string)($order->status ?? 'pendiente');
  $isCanceled = ($status === 'cancelado');

  $steps = [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo',
    'entregado'     => 'Entregado',
  ];

  $stepKeys = array_keys($steps);
  $currentIndex = array_search($status, $stepKeys, true);
  if ($currentIndex === false) $currentIndex = 0;

  $histories = $order->statusHistories ?? collect();
@endphp

@section('content')
  <div class="flex items-start justify-between gap-3 mb-5">
    <div>
      <div class="page-title">Pedido #{{ $order->id }}</div>
      <div class="page-subtitle">
        {{ $order->created_at?->format('d/m/Y H:i') }}
      </div>
    </div>
    <span class="{{ $badge($order->status) }}">{{ $label($order->status) }}</span>
  </div>

  {{-- Progreso --}}
  <div class="card mb-4">
    <div class="card-head">
      <div class="font-black">Progreso</div>
      @if($isCanceled)
        <span class="badge-rose">Cancelado</span>
      @else
        <span class="badge-sky">En curso</span>
      @endif
    </div>
    <div class="card-body">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        @foreach($steps as $k => $t)
          @php
            $i = array_search($k, $stepKeys, true);
            $done = (!$isCanceled && $i !== false && $i < $currentIndex);
            $current = (!$isCanceled && $i !== false && $i === $currentIndex);

            $dot = $done ? 'bg-emerald-600' : ($current ? 'bg-zinc-900' : 'bg-zinc-200');
            $text = $done ? 'text-emerald-700' : ($current ? 'text-zinc-900' : 'text-zinc-500');
          @endphp
          <div class="flex items-center gap-3">
            <div class="h-3 w-3 rounded-full {{ $dot }}"></div>
            <div class="text-sm font-bold {{ $text }}">{{ $t }}</div>
          </div>
          @if(!$loop->last)
            <div class="hidden sm:block flex-1 h-px bg-zinc-200 mx-3"></div>
          @endif
        @endforeach
      </div>

      @if($isCanceled)
        <div class="alert-danger mt-4">
          Este pedido fue cancelado.
        </div>
      @endif
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="lg:col-span-2 card">
      <div class="card-head">
        <div class="font-black">Ítems</div>
        <span class="badge-sky">{{ $order->items->count() }} productos</span>
      </div>

      <div class="card-body overflow-x-auto">
        <table class="min-w-[520px]">
          <thead>
            <tr class="border-b border-zinc-100">
              <th class="py-2">Producto</th>
              <th class="py-2">Precio</th>
              <th class="py-2">Cant.</th>
              <th class="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @foreach($order->items as $item)
              <tr class="border-b border-zinc-50">
                <td class="py-3 font-bold">{{ $item->product_name }}</td>
                <td class="py-3">{{ $fmt($item->price) }}</td>
                <td class="py-3">{{ $item->quantity }}</td>
                <td class="py-3 text-right font-black">{{ $fmt($item->subtotal) }}</td>
              </tr>
            @endforeach
          </tbody>
        </table>

        <div class="mt-4 flex items-center justify-between">
          <div class="muted">Total</div>
          <div class="text-xl font-black">{{ $fmt($order->total) }}</div>
        </div>
      </div>
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Detalles</div>
        <span class="badge-sky">Retiro</span>
      </div>

      <div class="card-body grid gap-3">
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

        @if($order->notes)
          <div>
            <div class="muted">Notas</div>
            <div class="text-sm text-zinc-800">{{ $order->notes }}</div>
          </div>
        @endif

        <a href="{{ route('orders.index') }}" class="btn-outline w-full">Volver</a>
      </div>
    </div>
  </div>

  {{-- Historial --}}
  <div class="card mt-4">
    <div class="card-head">
      <div class="font-black">Historial</div>
      <span class="badge-zinc">{{ $histories->count() }} cambios</span>
    </div>

    <div class="card-body">
      @if($histories->isEmpty())
        <div class="muted">Todavía no hay historial para este pedido.</div>
      @else
        <div class="grid gap-3">
          @foreach($histories->sortByDesc('changed_at') as $h)
            <div class="rounded-2xl border border-zinc-200 p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-black">
                    {{ $label($h->to_status) }}
                    <span class="text-zinc-400">·</span>
                    <span class="muted">{{ $h->changed_at?->format('d/m/Y H:i') }}</span>
                  </div>
                  @if($h->comment)
                    <div class="mt-2 text-sm text-zinc-800 whitespace-pre-wrap">{{ $h->comment }}</div>
                  @endif
                </div>
                <span class="{{ $badge($h->to_status) }}">{{ $label($h->to_status) }}</span>
              </div>
            </div>
          @endforeach
        </div>
      @endif
    </div>
  </div>
@endsection

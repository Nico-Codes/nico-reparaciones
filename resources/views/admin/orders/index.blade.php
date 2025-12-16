@extends('layouts.app')

@section('title', 'Admin — Pedidos')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusMap = $statuses ?? \App\Models\Order::STATUSES;
  $paymentMap = \App\Models\Order::PAYMENT_METHODS;

  $badge = function(string $st) {
    return match($st) {
      'pendiente' => 'bg-amber-100 text-amber-900 border-amber-200',
      'confirmado' => 'bg-sky-100 text-sky-800 border-sky-200',
      'preparando' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'listo_retirar' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'entregado' => 'bg-zinc-100 text-zinc-800 border-zinc-200',
      'cancelado' => 'bg-rose-100 text-rose-800 border-rose-200',
      default => 'bg-zinc-100 text-zinc-800 border-zinc-200',
    };
  };

  $currentStatus = $currentStatus ?? null;
  $currentWa = $currentWa ?? null; // pending|sent|null
  $q = $q ?? '';

  $statusCounts = $statusCounts ?? collect();
  $totalMatching = $totalMatching ?? ($orders->total() ?? 0);

  $waCounts = $waCounts ?? ['pending' => 0, 'sent' => 0, 'all' => 0];

  $tabClass = function($active) {
    return $active
      ? 'bg-zinc-900 text-white border-zinc-900'
      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50';
  };

  $pillClass = function($active) {
    return $active
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50';
  };

  $params = function(array $override = []) use ($currentStatus, $currentWa, $q) {
    $base = [
      'status' => $currentStatus,
      'wa' => $currentWa,
      'q' => $q,
    ];

    $merged = array_merge($base, $override);

    return array_filter($merged, fn($v) => $v !== null && $v !== '');
  };
@endphp

@section('content')
<div class="space-y-5">
  <div class="page-head mb-0">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="page-title">Pedidos</div>
        <div class="page-subtitle">
          Gestión de pedidos. Buscá por ID, nombre, email o teléfono.
        </div>
      </div>

      <div class="flex gap-2 flex-wrap">
        <a href="{{ route('admin.orders.index') }}" class="btn-outline">Ver todo</a>
        <a href="{{ route('admin.dashboard') }}" class="btn-outline">Dashboard</a>
      </div>
    </div>
  </div>

  {{-- Métricas rápidas --}}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div class="text-xs font-bold text-zinc-500 uppercase">Resultados</div>
      <div class="mt-1 text-2xl font-black">{{ (int)$totalMatching }}</div>
      <div class="text-xs text-zinc-500 mt-1">Coinciden con la búsqueda</div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div class="text-xs font-bold text-zinc-500 uppercase">Pendientes</div>
      <div class="mt-1 text-2xl font-black">{{ (int)($statusCounts['pendiente'] ?? 0) }}</div>
      <div class="text-xs text-zinc-500 mt-1">A confirmar</div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div class="text-xs font-bold text-zinc-500 uppercase">Preparando</div>
      <div class="mt-1 text-2xl font-black">{{ (int)($statusCounts['preparando'] ?? 0) }}</div>
      <div class="text-xs text-zinc-500 mt-1">En proceso</div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div class="text-xs font-bold text-zinc-500 uppercase">Listo retirar</div>
      <div class="mt-1 text-2xl font-black">{{ (int)($statusCounts['listo_retirar'] ?? 0) }}</div>
      <div class="text-xs text-zinc-500 mt-1">Para entregar</div>
    </div>
  </div>

  {{-- Filtros --}}
  <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
    {{-- Tabs por estado --}}
    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.orders.index', array_filter(['q' => $q, 'wa' => $currentWa])) }}"
         class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold {{ $tabClass($currentStatus === null) }}">
        Todos
        <span class="text-xs opacity-80">{{ (int)$totalMatching }}</span>
      </a>

      @foreach($statusMap as $key => $label)
        @php $count = (int)($statusCounts[$key] ?? 0); @endphp
        <a href="{{ route('admin.orders.index', array_filter(['status' => $key, 'q' => $q, 'wa' => $currentWa])) }}"
           class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold {{ $tabClass($currentStatus === $key) }}">
          {{ $label }}
          <span class="text-xs opacity-80">{{ $count }}</span>
        </a>
      @endforeach
    </div>

    {{-- WhatsApp pills --}}
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <div class="text-xs font-black uppercase text-zinc-500 mr-1">WhatsApp</div>

      <a href="{{ route('admin.orders.index', $params(['wa' => null])) }}"
         class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold {{ $pillClass($currentWa === null) }}">
        Todos
        <span class="text-xs opacity-80">{{ (int)($waCounts['all'] ?? 0) }}</span>
      </a>

      <a href="{{ route('admin.orders.index', $params(['wa' => 'pending'])) }}"
         class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold {{ $pillClass($currentWa === 'pending') }}">
        Pendientes
        <span class="text-xs opacity-80">{{ (int)($waCounts['pending'] ?? 0) }}</span>
      </a>

      <a href="{{ route('admin.orders.index', $params(['wa' => 'sent'])) }}"
         class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold {{ $pillClass($currentWa === 'sent') }}">
        Enviados
        <span class="text-xs opacity-80">{{ (int)($waCounts['sent'] ?? 0) }}</span>
      </a>

      <div class="text-xs text-zinc-500 ml-auto">
        (WA pendiente/enviado se calcula según el estado actual del pedido)
      </div>
    </div>

    {{-- Búsqueda --}}
    <form method="GET" action="{{ route('admin.orders.index') }}" class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      @if($currentStatus)
        <input type="hidden" name="status" value="{{ $currentStatus }}">
      @endif

      @if($currentWa)
        <input type="hidden" name="wa" value="{{ $currentWa }}">
      @endif

      <div class="flex-1">
        <input
          name="q"
          value="{{ $q }}"
          placeholder="Buscar: ID, nombre, email, teléfono…"
          class="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div class="flex gap-2">
        <button class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
          Buscar
        </button>

        <a href="{{ route('admin.orders.index', array_filter(['status' => $currentStatus, 'wa' => $currentWa])) }}"
           class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Limpiar búsqueda
        </a>
      </div>
    </form>

    <div class="mt-3 text-xs text-zinc-500">
      Tip: si ponés un número, intenta buscar por <span class="font-bold">ID</span> también.
    </div>
  </div>

  {{-- Tabla --}}
  <div class="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
    <div class="flex items-center justify-between gap-2 p-4 border-b border-zinc-100">
      <div class="text-sm font-black">Listado</div>
      <div class="text-xs text-zinc-500">
        Mostrando {{ $orders->count() }} de {{ $orders->total() }}
      </div>
    </div>

    @if($orders->isEmpty())
      <div class="p-6">
        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <div class="font-black text-zinc-900">No hay pedidos para mostrar.</div>
          <div class="mt-1 text-sm text-zinc-600">
            Probá cambiar el estado, el filtro WhatsApp o limpiar la búsqueda.
          </div>
          <div class="mt-4 flex gap-2 flex-wrap">
            <a href="{{ route('admin.orders.index') }}" class="btn-primary">Ver todos</a>
            @if($currentStatus)
              <a href="{{ route('admin.orders.index', ['status' => $currentStatus]) }}" class="btn-outline">Mantener estado</a>
            @endif
          </div>
        </div>
      </div>
    @else
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th class="px-4 py-3 text-left">Pedido</th>
              <th class="px-4 py-3 text-left">Cliente</th>
              <th class="px-4 py-3 text-left">Teléfono</th>
              <th class="px-4 py-3 text-left">Pago</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            @foreach($orders as $order)
              @php
                $st = (string)($order->status ?? 'pendiente');
                $customer = $order->pickup_name ?: ($order->user?->name ?? '—');
                $phone = $order->pickup_phone ?: '—';
                $pay = $paymentMap[$order->payment_method] ?? ($order->payment_method ?: '—');
              @endphp

              <tr class="hover:bg-zinc-50/70">
                <td class="px-4 py-3">
                  <div class="font-black text-zinc-900">#{{ $order->id }}</div>
                  <div class="text-xs text-zinc-500">{{ $order->created_at?->format('d/m/Y H:i') }}</div>
                </td>

                <td class="px-4 py-3">
                  <div class="font-semibold text-zinc-900">{{ $customer }}</div>
                  <div class="text-xs text-zinc-500">{{ $order->user?->email ?? '—' }}</div>
                </td>

                <td class="px-4 py-3">
                  <div class="font-semibold text-zinc-900">{{ $phone }}</div>
                </td>

                <td class="px-4 py-3">
                  <div class="text-zinc-800">{{ $pay }}</div>
                </td>

                <td class="px-4 py-3 text-right">
                  <div class="font-black text-zinc-900">{{ $money($order->total) }}</div>
                </td>

                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($st) }}">
                    {{ $statusMap[$st] ?? $st }}
                  </span>
                </td>

                <td class="px-4 py-3 text-right">
                  <a href="{{ route('admin.orders.show', $order) }}"
                     class="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800">
                    Ver
                  </a>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>

      @if(method_exists($orders, 'hasPages') && $orders->hasPages())
        <div class="p-4 border-t border-zinc-100">
          {{ $orders->links() }}
        </div>
      @endif
    @endif
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Pedidos')

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

  $chips = [
    '' => 'Todos',
    'pendiente' => 'Pendientes',
    'confirmado' => 'Confirmados',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listos retiro',
    'entregado' => 'Entregados',
    'cancelado' => 'Cancelados',
  ];
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="page-title">Pedidos</h1>
      <p class="page-subtitle">Listado de pedidos de clientes y estados.</p>
    </div>
    <a href="{{ route('admin.dashboard') }}" class="btn-outline">Volver al panel</a>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  {{-- filtros --}}
  <div class="mt-6 card">
    <div class="card-body">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          @foreach($chips as $key => $label)
            @php $active = ((string)$currentStatus === (string)$key); @endphp
            <a href="{{ route('admin.orders.index', $key ? ['status'=>$key] : []) }}"
               class="{{ $active ? 'btn-primary' : 'btn-outline' }}">
              {{ $label }}
            </a>
          @endforeach
        </div>

        <form method="GET" action="{{ route('admin.orders.index') }}" class="flex items-center gap-2">
          <select name="status" class="select w-56" onchange="this.form.submit()">
            <option value="">Todos</option>
            <option value="pendiente" {{ $currentStatus === 'pendiente' ? 'selected' : '' }}>Pendiente</option>
            <option value="confirmado" {{ $currentStatus === 'confirmado' ? 'selected' : '' }}>Confirmado</option>
            <option value="preparando" {{ $currentStatus === 'preparando' ? 'selected' : '' }}>Preparando</option>
            <option value="listo_retirar" {{ $currentStatus === 'listo_retirar' ? 'selected' : '' }}>Listo para retirar</option>
            <option value="entregado" {{ $currentStatus === 'entregado' ? 'selected' : '' }}>Entregado</option>
            <option value="cancelado" {{ $currentStatus === 'cancelado' ? 'selected' : '' }}>Cancelado</option>
          </select>
          <noscript><button class="btn-primary" type="submit">Filtrar</button></noscript>
        </form>
      </div>
    </div>
  </div>

  @if($orders->isEmpty())
    <div class="mt-6 card">
      <div class="card-body text-sm text-zinc-600">No hay pedidos para mostrar.</div>
    </div>
  @else
    {{-- mobile cards --}}
    <div class="mt-6 grid grid-cols-1 md:hidden gap-3">
      @foreach($orders as $order)
        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="text-sm font-extrabold text-zinc-900">Pedido #{{ $order->id }}</div>
                  <span class="{{ $statusBadge($order->status) }}">{{ $statusLabel($order->status) }}</span>
                </div>

                <div class="mt-2 text-xs text-zinc-500">
                  {{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}
                </div>

                <div class="mt-2 text-sm text-zinc-700">
                  <span class="font-semibold">{{ $order->user->name ?? '—' }}</span>
                  <span class="text-zinc-500">· {{ $order->user->email ?? '' }}</span>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs text-zinc-500">Total</div>
                <div class="text-base font-extrabold text-zinc-900">{{ $money($order->total) }}</div>
              </div>
            </div>

            <a href="{{ route('admin.orders.show', $order->id) }}" class="btn-primary w-full mt-4">
              Ver detalle
            </a>
          </div>
        </div>
      @endforeach
    </div>

    {{-- desktop table --}}
    <div class="mt-6 hidden md:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-100">
            <tr class="text-left">
              <th class="px-4 py-3 font-semibold text-zinc-700">Pedido</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Cliente</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Estado</th>
              <th class="px-4 py-3 font-semibold text-zinc-700 text-right">Total</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            @foreach($orders as $order)
              <tr class="hover:bg-zinc-50/70">
                <td class="px-4 py-3">
                  <div class="font-semibold text-zinc-900">#{{ $order->id }}</div>
                  <div class="text-xs text-zinc-500">{{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="font-semibold text-zinc-900">{{ $order->user->name ?? '—' }}</div>
                  <div class="text-xs text-zinc-500">{{ $order->user->email ?? '' }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="{{ $statusBadge($order->status) }}">{{ $statusLabel($order->status) }}</span>
                </td>
                <td class="px-4 py-3 text-right font-extrabold text-zinc-900">
                  {{ $money($order->total) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <a class="btn-outline" href="{{ route('admin.orders.show', $order->id) }}">Ver</a>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>
  @endif
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin - Pedidos')

@section('content')
@php
  $current = request()->query('status');

  $statuses = [
    '' => 'Todos',
    'pendiente' => 'Pendiente',
    'confirmado' => 'Confirmado',
    'preparando' => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado' => 'Entregado',
    'cancelado' => 'Cancelado',
  ];

  $badgeFor = function ($status) {
    return match ((string)$status) {
      'pendiente' => 'badge-amber',
      'confirmado', 'preparando' => 'badge-blue',
      'listo_retirar', 'entregado' => 'badge-green',
      'cancelado' => 'badge-red',
      default => 'badge-zinc',
    };
  };

  $labelFor = function ($status) use ($statuses) {
    return $statuses[$status] ?? ucfirst(str_replace('_',' ', (string)$status));
  };
@endphp

  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Pedidos</h1>
      <p class="muted mt-1">Listado general de pedidos (con filtros por estado).</p>
    </div>

    <a class="btn-outline" href="{{ route('store.index') }}">Ver sitio</a>
  </div>

  {{-- Filtros --}}
  <div class="mt-4 card">
    <div class="card-body">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="section-title">Filtro por estado</div>

        <form method="GET" action="{{ route('admin.orders.index') }}" class="flex items-center gap-2">
          <select name="status" class="select w-[220px]">
            @foreach($statuses as $key => $label)
              <option value="{{ $key }}" {{ $current === $key ? 'selected' : '' }}>{{ $label }}</option>
            @endforeach
          </select>
          <button class="btn-primary" type="submit">Aplicar</button>

          @if($current)
            <a class="btn-ghost" href="{{ route('admin.orders.index') }}">Limpiar</a>
          @endif
        </form>
      </div>

      {{-- Chips (rápido en mobile) --}}
      <div class="mt-3 flex gap-2 overflow-x-auto pb-1 tap">
        @foreach($statuses as $key => $label)
          @php
            $active = ($current === $key) || (!$current && $key === '');
          @endphp
          <a
            href="{{ $key === '' ? route('admin.orders.index') : route('admin.orders.index', ['status' => $key]) }}"
            class="badge-zinc whitespace-nowrap {{ $active ? 'ring-2' : '' }}"
            style="{{ $active ? 'border-color: rgb(var(--brand)); ring-color: rgb(var(--brand));' : '' }}"
          >
            {{ $label }}
          </a>
        @endforeach
      </div>
    </div>
  </div>

  {{-- Lista --}}
  @if($orders->isEmpty())
    <div class="mt-6 card">
      <div class="card-body">
        <div class="font-bold text-lg">No hay pedidos</div>
        <div class="muted mt-1">
          Probá cambiando el filtro o esperá a que entren nuevos pedidos.
        </div>
      </div>
    </div>
  @else
    {{-- Mobile cards --}}
    <div class="mt-6 grid grid-cols-1 md:hidden gap-3">
      @foreach($orders as $order)
        @php
          $customer = $order->pickup_name
            ?: trim(($order->user->name ?? '').' '.($order->user->last_name ?? ''));

          $phone = $order->pickup_phone ?: ($order->user->phone ?? '');
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-extrabold tracking-tight">Pedido #{{ $order->id }}</div>
                <div class="muted mt-1">{{ $order->created_at->format('d/m/Y H:i') }}</div>
              </div>
              <span class="{{ $badgeFor($order->status) }}">{{ $labelFor($order->status) }}</span>
            </div>

            <div class="mt-3 text-sm text-zinc-700">
              <div><span class="font-semibold">Cliente:</span> {{ $customer ?: '—' }}</div>
              @if($phone)<div><span class="font-semibold">Tel:</span> {{ $phone }}</div>@endif
            </div>

            <div class="mt-4 flex items-end justify-between gap-3">
              <div>
                <div class="muted">Total</div>
                <div class="text-xl font-extrabold">${{ number_format($order->total ?? 0, 0, ',', '.') }}</div>
              </div>
              <a class="btn-primary" href="{{ route('admin.orders.show', $order->id) }}">Ver</a>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    {{-- Desktop table --}}
    <div class="mt-6 hidden md:block card overflow-hidden">
      <div class="card-header flex items-center justify-between">
        <div class="section-title">Listado</div>
        <div class="muted">{{ $orders->count() }} en esta página</div>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="th">Pedido</th>
              <th class="th">Cliente</th>
              <th class="th">Estado</th>
              <th class="th text-right">Total</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @foreach($orders as $order)
              @php
                $customer = $order->pickup_name
                  ?: trim(($order->user->name ?? '').' '.($order->user->last_name ?? ''));

                $phone = $order->pickup_phone ?: ($order->user->phone ?? '');
              @endphp

              <tr class="row-hover">
                <td class="td">
                  <div class="font-semibold">#{{ $order->id }}</div>
                  <div class="muted">{{ $order->created_at->format('d/m/Y H:i') }}</div>
                </td>
                <td class="td">
                  <div class="font-semibold">{{ $customer ?: '—' }}</div>
                  @if($phone)<div class="muted">{{ $phone }}</div>@endif
                </td>
                <td class="td">
                  <span class="{{ $badgeFor($order->status) }}">{{ $labelFor($order->status) }}</span>
                </td>
                <td class="td text-right font-extrabold">
                  ${{ number_format($order->total ?? 0, 0, ',', '.') }}
                </td>
                <td class="td text-right">
                  <a class="btn-outline" href="{{ route('admin.orders.show', $order->id) }}">Ver</a>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>

      <div class="card-body">
        {{ $orders->appends(request()->query())->links() }}
      </div>
    </div>
  @endif
@endsection

@extends('layouts.app')

@section('title', 'Mis pedidos')

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

  $tab = $tab ?? request('tab', 'activos');
  $q = $q ?? request('q', '');

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="store-shell">
  <div class="page-head store-hero reveal-item">
    <div>
      <div class="page-title">Mis pedidos</div>
      <div class="page-subtitle">Consulta estado y detalle de cada compra.</div>
    </div>

    @if($has('store.index'))
      <a href="{{ route('store.index') }}" class="btn-ghost h-11 w-full justify-center sm:w-auto">Ir a la tienda</a>
    @endif
  </div>

  <div class="card mb-4 reveal-item">
    <div class="card-body grid gap-3 p-3 sm:p-4 md:flex md:items-center md:justify-between">
      <div class="grid grid-cols-2 gap-2 md:flex md:gap-2">
      <a class="nav-pill h-11 w-full justify-center md:w-auto {{ $tab === 'activos' ? 'nav-pill-active' : '' }}"
           href="{{ route('orders.index', ['tab' => 'activos', 'q' => $q ?: null]) }}">
          Activos
        </a>

        <a class="nav-pill h-11 w-full justify-center md:w-auto {{ $tab === 'historial' ? 'nav-pill-active' : '' }}"
           href="{{ route('orders.index', ['tab' => 'historial', 'q' => $q ?: null]) }}">
          Historial
        </a>
      </div>

      <form method="GET" action="{{ route('orders.index') }}" class="grid w-full gap-2 sm:grid-cols-[1fr_auto_auto] md:flex md:w-auto">
        <input type="hidden" name="tab" value="{{ $tab }}">
        <input class="h-11 text-base sm:text-sm" name="q" value="{{ $q }}" placeholder="Buscar #pedido o nombre...">
        <button class="btn-outline h-11" type="submit">Buscar</button>
        @if($q)
          <a class="btn-ghost h-11" href="{{ route('orders.index', ['tab' => $tab]) }}">Limpiar</a>
        @endif
      </form>
    </div>
  </div>

  <div class="grid gap-3">
    @forelse($orders as $order)
      @php
        $itemsCount = (int)($order->items_count ?? ($order->items?->count() ?? 0));
      @endphp

      <a href="{{ route('orders.show', $order) }}" class="card group reveal-item transition hover:shadow-md active:scale-[0.995]">
        <div class="card-body p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <div class="font-black text-zinc-900">Pedido #{{ $order->id }}</div>
                <span class="{{ $badge($order->status) }}">{{ $label($order->status) }}</span>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{{ $order->created_at?->format('d/m/Y H:i') }}</span>
                <span>|</span>
                <span>{{ $itemsCount }} item{{ $itemsCount === 1 ? '' : 's' }}</span>
              </div>
            </div>

            <div class="shrink-0 rounded-2xl bg-zinc-50 px-3 py-2 text-left sm:text-right">
              <div class="text-[11px] text-zinc-500">Total</div>
              <div class="text-lg font-black text-zinc-900">{{ $fmt($order->total) }}</div>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-zinc-500">Ver detalle</span>
            <svg class="h-4 w-4 text-zinc-400 transition group-hover:text-zinc-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </a>
    @empty
      <div class="card reveal-item">
        <div class="card-body">
          <div class="font-black">Todavia no tienes pedidos.</div>
          <div class="muted mt-1">Cuando compres, los veras aqui.</div>
          <div class="mt-4">
            @if($has('store.index'))
              <a href="{{ route('store.index') }}" class="btn-primary h-11">Ir a la tienda</a>
            @endif
          </div>
        </div>
      </div>
    @endforelse
  </div>

  @if(is_object($orders) && method_exists($orders, 'links'))
    <div class="mt-6">
      {{ $orders->links() }}
    </div>
  @endif
  </div>
@endsection

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
  $q   = $q ?? request('q', '');

  $payLabel = fn(?string $m) => match($m) {
    'local' => 'Pago en el local',
    'mercado_pago' => 'Mercado Pago',
    'transferencia' => 'Transferencia',
    default => $m ? ucfirst(str_replace('_',' ',$m)) : '—',
  };

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Mis pedidos</div>
    <div class="page-subtitle">Acá podés ver el estado y el detalle de cada pedido.</div>
  </div>
    <div class="card mb-4">
      <div class="card-body flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex gap-2">
          <a class="btn-ghost btn-sm {{ $tab === 'activos' ? 'bg-zinc-100' : '' }}"
            href="{{ route('orders.index', ['tab' => 'activos', 'q' => $q ?: null]) }}">
            Activos
          </a>

          <a class="btn-ghost btn-sm {{ $tab === 'historial' ? 'bg-zinc-100' : '' }}"
            href="{{ route('orders.index', ['tab' => 'historial', 'q' => $q ?: null]) }}">
            Historial
          </a>
        </div>

        <form method="GET" action="{{ route('orders.index') }}" class="flex gap-2 w-full md:w-auto">
          <input type="hidden" name="tab" value="{{ $tab }}">
          <input name="q" value="{{ $q }}" placeholder="Buscar #pedido, nombre o teléfono…">
          <button class="btn-outline btn-sm" type="submit">Buscar</button>

          @if($q)
            <a class="btn-ghost btn-sm" href="{{ route('orders.index', ['tab' => $tab]) }}">Limpiar</a>
          @endif
        </form>
      </div>
    </div>

  <div class="flex flex-col sm:flex-row gap-2 mb-5">
    @if($has('store.index'))
      <a href="{{ route('store.index') }}" class="btn-primary w-full sm:w-auto">Ir a la tienda</a>
    @endif
    @if($has('repairs.my.index'))
      <a href="{{ route('repairs.my.index') }}" class="btn-outline w-full sm:w-auto">Mis reparaciones</a>
    @endif
  </div>

  <div class="grid gap-3">
    @forelse($orders as $order)
      @php
        $itemsCount = (int)($order->items_count ?? ($order->items?->count() ?? 0));
        $preview = $order->items ? $order->items->take(2) : collect();
        $more = max(0, $itemsCount - $preview->count());
      @endphp


      <a href="{{ route('orders.show', $order) }}" class="card group hover:shadow-md transition">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <div class="font-black text-zinc-900">Pedido #{{ $order->id }}</div>
                <span class="{{ $badge($order->status) }}">{{ $label($order->status) }}</span>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span>{{ $order->created_at?->format('d/m/Y H:i') }}</span>
                <span>·</span>
                <span>{{ $itemsCount }} ítem{{ $itemsCount === 1 ? '' : 's' }}</span>
                <span>·</span>
                <span class="badge-zinc">{{ $payLabel($order->payment_method) }}</span>
              </div>

            </div>

            <div class="text-right shrink-0">
              <div class="text-xs text-zinc-500">Total</div>
              <div class="font-black text-zinc-900">{{ $fmt($order->total) }}</div>
            </div>
          </div>
          
          @if($preview->count())
            <div class="mt-3 grid gap-1">
              @foreach($preview as $it)
                <div class="text-sm text-zinc-700 truncate">
                  <span class="font-black text-zinc-900">{{ (int)$it->quantity }}x</span>
                  {{ $it->product_name }}
                </div>
              @endforeach

              @if($more > 0)
                <div class="text-xs text-zinc-500">+{{ $more }} más</div>
              @endif
            </div>
          @endif

          <div class="mt-4 flex items-center justify-between">
            <span class="text-xs text-zinc-500">Ver detalle</span>
            <span class="text-zinc-400 group-hover:text-zinc-600 transition">→</span>
          </div>
        </div>
      </a>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black">Todavía no tenés pedidos.</div>
          <div class="muted mt-1">Cuando compres algo, van a aparecer acá con su estado.</div>
          <div class="mt-4">
            @if($has('store.index'))
              <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
            @endif
          </div>
        </div>
      </div>
    @endforelse
  </div>

  {{-- Paginación SOLO si $orders es paginator --}}
  @if(is_object($orders) && method_exists($orders, 'links'))
    <div class="mt-6">
      {{ $orders->links() }}
    </div>
  @endif
@endsection

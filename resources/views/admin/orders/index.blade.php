@extends('layouts.app')

@section('title', 'Admin — Pedidos')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusMap = [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado'     => 'Entregado',
    'cancelado'     => 'Cancelado',
  ];

  $badge = function (?string $st) {
    return match($st) {
      'pendiente'     => 'badge-amber',
      'confirmado'    => 'badge-sky',
      'preparando'    => 'badge-indigo',
      'listo_retirar' => 'badge-emerald',
      'entregado'     => 'badge-zinc',
      'cancelado'     => 'badge-rose',
      default         => 'badge-zinc',
    };
  };

  $tabs = [
    ''              => 'Todos',
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo',
    'entregado'     => 'Entregado',
    'cancelado'     => 'Cancelado',
  ];

  $currentStatus = $currentStatus ?? '';
  $q = $q ?? '';

  $currentWa = $currentWa ?? '';

  // UI: abrimos filtros/tabs si el usuario ya está filtrando
  $filtersMoreOpen = $currentWa !== '';
  $tabsOpen = $currentStatus !== '';

  $waTabs = [
    ''        => 'WhatsApp: Todos',
    'pending' => 'WA pendiente',
    'sent'    => 'WA enviado',
    'no_phone'=> 'Sin teléfono',
  ];


    // ✅ Urgentes
    $urgentHoursOrders = 24;
    $urgentOrderStatuses = ['pendiente','confirmado']; // ajustable


@endphp

@section('content')
<div class="container-page py-6"
     data-admin-orders-filter="{{ $currentStatus === '' ? 'all' : $currentStatus }}">
  <div class="page-head">
    <div class="min-w-0">
      <div class="page-title">Pedidos (Admin)</div>
      <div class="page-subtitle">Listado y control rápido de pedidos.</div>

    </div>

    <form method="GET" action="{{ route('admin.orders.index') }}" class="flex w-full flex-wrap gap-2 md:w-auto">
      @if($currentStatus !== '')
        <input type="hidden" name="status" value="{{ $currentStatus }}">
      @endif

      <input
        type="text"
        name="q"
        value="{{ $q }}"
        placeholder="Buscar: #id, nombre, teléfono…"
        class="h-11 w-full sm:flex-1 sm:min-w-[260px] md:w-[320px] md:flex-none"
      >

      <div class="{{ $filtersMoreOpen ? '' : 'hidden' }}" data-collapse="orders_filters_more">
        <select name="wa" class="h-11 w-full sm:w-52">
          @foreach($waTabs as $key => $label)
            <option value="{{ $key }}" @selected((string)$currentWa === (string)$key)>{{ $label }}</option>
          @endforeach
        </select>
      </div>

      <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Filtrar</button>

      @if($q !== '' || $currentWa !== '')
        <a class="btn-outline h-11 w-full justify-center sm:w-auto"
          href="{{ route('admin.orders.index', array_filter(['status' => $currentStatus, 'wa' => $currentWa], fn($v) => $v !== '')) }}">
          Limpiar
        </a>
      @endif

      <button type="button"
        class="btn-ghost h-11 w-full justify-center sm:w-auto"
        data-toggle-collapse="orders_filters_more"
        data-toggle-collapse-label="filtros"
        aria-expanded="{{ $filtersMoreOpen ? 'true' : 'false' }}">Ver filtros</button>
    </form>


  </div>

  {{-- Tabs --}}
  <div class="mt-3 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
    <div class="text-xs font-black uppercase text-zinc-500">Estados</div>

    <button type="button"
      class="btn-ghost btn-sm h-10 w-full justify-center sm:w-auto"
      data-toggle-collapse="orders_tabs"
      data-toggle-collapse-label="estados"
      aria-expanded="{{ $tabsOpen ? 'true' : 'false' }}">Ver estados</button>
  </div>

  <div class="mt-2 flex items-center gap-2 overflow-x-auto pb-1 snap-x {{ $tabsOpen ? '' : 'hidden' }}" data-collapse="orders_tabs">
    @foreach($tabs as $key => $label)
      @php
        $isActive = ((string)$currentStatus === (string)$key);
        $href = $key === ''
        ? route('admin.orders.index', array_filter(['q' => $q, 'wa' => $currentWa], fn($v) => $v !== ''))
        : route('admin.orders.index', array_filter(['status' => $key, 'q' => $q, 'wa' => $currentWa], fn($v) => $v !== ''));

      @endphp

      @php
        $count = ($key === '')
          ? ($totalCount ?? 0)
          : (int) (($statusCounts[$key] ?? 0));

        $countKey = $key === '' ? 'all' : (string)$key;
      @endphp

      <a href="{{ $href }}" class="nav-pill whitespace-nowrap {{ $isActive ? 'nav-pill-active' : '' }}">
        <span>{{ $label }}</span>
        <span
          class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black
                ring-1 ring-zinc-200 bg-white/70 text-zinc-700"
          data-admin-orders-count="{{ $countKey }}"
        >
          {{ $count }}
        </span>
      </a>
    @endforeach
  </div>

  @if (session('success'))
    <div class="alert-success mt-4">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="alert-error mt-4">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5 font-semibold">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- List --}}
  <div class="mt-4 grid gap-3" data-admin-orders-list>

    @forelse($orders as $order)
      @php
        $customerName  = $order->pickup_name ?: ($order->user?->name ?? '—');
        $customerPhone = $order->pickup_phone ?: ($order->user?->phone ?? '—');
        $created = $order->created_at?->format('d/m/Y H:i') ?? '—';
        $age = $order->created_at ? $order->created_at->locale('es')->diffForHumans() : null;

        $st = (string)($order->status ?? 'pendiente');
        $stLabel = $statusMap[$st] ?? $st;

        $isFinal = in_array($st, ['entregado','cancelado'], true);

        $isUrgent = $order->created_at
          && in_array($st, $urgentOrderStatuses, true)
          && $order->created_at->lte(now()->subHours($urgentHoursOrders));

      @endphp



      <div class="card" data-admin-order-card data-order-id="{{ $order->id }}" data-status="{{ $st }}">
        <div class="card-body">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <div class="font-black text-zinc-900">Pedido #{{ $order->id }}</div>
                <span class="{{ $badge($st) }}" data-admin-order-status-badge>{{ $stLabel }}</span>
                @if($isUrgent)
                  <span class="badge-rose" title="Más de {{ $urgentHoursOrders }}h en {{ $stLabel }}">URGENTE</span>
                @endif

                @if($order->payment_method)
                  <span class="badge-zinc">{{ $order->payment_method }}</span>
                @endif
              </div>

              <div class="mt-1 text-sm text-zinc-600">
                <span class="font-semibold text-zinc-900">{{ $customerName }}</span>
                <span class="text-zinc-400">·</span>
                <span class="font-semibold">{{ $customerPhone }}</span>
                <span class="text-zinc-400">·</span>
                <span>{{ $created }}</span>

                @if($age)
                  <span class="text-zinc-400">·</span>
                  <span class="text-xs font-bold text-zinc-600">{{ $age }}</span>
                @endif


              </div>

              @if($order->notes)
                <div class="mt-2 text-sm text-zinc-700">
                  <span class="font-black text-zinc-500">Notas:</span>
                  <span class="font-semibold">{{ \Illuminate\Support\Str::limit($order->notes, 120) }}</span>
                </div>
              @endif
            </div>

            <div class="shrink-0 flex w-full flex-col gap-2 md:w-auto md:items-end">
              <div class="text-left md:text-right">
                <div class="text-xs font-black uppercase text-zinc-500">Total</div>
                <div class="text-lg font-black text-zinc-900">{{ $money($order->total) }}</div>
              </div>

              @php
                $rawPhone = (string)($order->pickup_phone ?: ($order->user?->phone ?? ''));

                $waMsg = "Hola {$customerName} 👋\n"
                  . "Tu pedido #{$order->id} está: {$stLabel}.\n\n"
                  . "Cualquier cosa respondeme por acá.";

                $waHref = \App\Support\WhatsApp::waMeUrlFromRaw($rawPhone, $waMsg);

                $waNotified = (int)($order->wa_notified_current ?? 0) > 0;
                $waState = !$waHref ? 'no_phone' : ($waNotified ? 'ok' : 'pending');

                $waBadgeClass = match($waState) {
                  'ok' => 'badge-emerald',
                  'pending' => 'badge-amber',
                  default => 'badge-zinc',
                };

                $waBadgeText = match($waState) {
                  'ok' => 'WA OK',
                  'pending' => 'WA pendiente',
                  default => 'Sin tel',
                };
              @endphp


              <div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:flex-wrap md:items-center md:justify-end">
                <a class="btn-outline btn-sm h-10 w-full justify-center md:h-auto md:w-auto" href="{{ route('admin.orders.show', $order->id) }}">
                  Abrir
                </a>

                @if($waHref)
                  <a
                    class="btn-outline btn-sm h-10 w-full justify-center border-emerald-200 text-emerald-700 hover:bg-emerald-50 md:h-auto md:w-auto"
                    href="{{ $waHref }}"
                    target="_blank"
                    rel="noopener"
                    title="Enviar WhatsApp"
                    data-admin-order-wa-link
                    data-admin-order-wa-open
                  >
                    WhatsApp
                  </a>
                @endif

                @if($waState !== 'ok')
                  <span class="{{ $waBadgeClass }} inline-flex h-10 w-full items-center justify-center md:h-auto md:w-auto"
                        data-admin-order-wa-badge
                        data-wa-state="{{ $waState }}">
                    {{ $waBadgeText }}
                  </span>
                @endif

                <div class="dropdown w-full md:w-auto">
                  <button type="button" class="btn-ghost btn-sm h-10 w-full justify-center md:h-auto md:w-auto" data-menu="orderMoreMenu-{{ $order->id }}">
                    ⋯
                  </button>

                  <div id="orderMoreMenu-{{ $order->id }}" class="dropdown-menu hidden">
                    <a class="dropdown-item"
                      href="{{ route('admin.orders.print', $order->id) }}"
                      target="_blank"
                      rel="noopener">Imprimir</a>

                    <a class="dropdown-item"
                      href="{{ route('admin.orders.ticket', $order->id) }}?autoprint=1"
                      target="_blank"
                      rel="noopener">Ticket</a>
                  </div>
                </div>



                  {{-- Botón fijo Estado + dropdown --}}
                  <div class="dropdown w-full md:w-auto">
                    <button
                      type="button"
                      class="btn-primary btn-sm h-11 w-full justify-center md:h-auto md:w-auto {{ $isFinal ? 'opacity-60 cursor-not-allowed' : '' }}"
                      data-menu="orderStatusMenu-{{ $order->id }}"
                      data-admin-order-status-btn
                      {{ $isFinal ? 'disabled' : '' }}
                    >
                      Estado
                    </button>


                  <div id="orderStatusMenu-{{ $order->id }}" class="dropdown-menu hidden">
                    @foreach($statusMap as $k => $label)
                      <button
                        type="button"
                        class="dropdown-item {{ $k === $st ? 'bg-zinc-100' : '' }}"
                        data-admin-order-set-status
                        data-status="{{ $k }}"
                      >
                        {{ $label }}
                      </button>
                    @endforeach
                  </div>
                </div>

                {{-- Form oculto: updateStatus (AJAX) --}}
                <form method="POST"
                      action="{{ route('admin.orders.updateStatus', $order->id) }}"
                      class="hidden"
                      data-admin-order-status-form>
                  @csrf
                  <input type="hidden" name="status" value="">
                  <input type="hidden" name="comment" value="">
                </form>

                {{-- Form oculto: whatsapp log (AJAX) --}}
                <form method="POST"
                      action="{{ route('admin.orders.whatsappLogAjax', $order->id) }}"
                      class="hidden"
                      data-admin-order-wa-form>
                  @csrf
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    @empty
      <div class="card">
        <div class="card-body">
          <div class="font-black text-zinc-900">No hay pedidos</div>
          <div class="muted mt-1">
            Probá cambiar el estado o ajustar la búsqueda.
          </div>
        </div>
      </div>
    @endforelse

     <div class="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
      @foreach($waTabs as $key => $label)
        @php
          $isActiveWa = ((string)$currentWa === (string)$key);

          $href = route('admin.orders.index', array_filter([
            'status' => $currentStatus ?: null,
            'wa'     => $key ?: null,
            'q'      => $q ?: null,
          ], fn($v) => $v !== null && $v !== ''));

          $count = $key === '' ? ($waCounts['all'] ?? $orders->total()) : (int)($waCounts[$key] ?? 0);
          $countKey = $key === '' ? 'all' : (string)$key;
        @endphp

        <a href="{{ $href }}" class="nav-pill whitespace-nowrap {{ $isActiveWa ? 'nav-pill-active' : '' }}">
          <span>{{ $label }}</span>
          <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black
                ring-1 ring-zinc-200 bg-white/70 text-zinc-700"
                data-admin-orders-wa-count="{{ $countKey }}">
            {{ $count }}
          </span>
        </a>
      @endforeach
    </div>
              

  </div>

  @if(method_exists($orders, 'links'))
    <div class="mt-6">
      {{ $orders->links() }}
    </div>
  @endif
</div>
@endsection

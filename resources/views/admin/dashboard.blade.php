@extends('layouts.app')
@section('title', 'Admin - Panel')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $rangeDays = $rangeDays ?? 30;

  $orderStatuses = $orderStatuses ?? [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado'     => 'Entregado',
    'cancelado'     => 'Cancelado',
  ];

  $repairStatuses = $repairStatuses ?? [
    'received'         => 'Recibido',
    'diagnosing'       => 'Diagnosticando',
    'waiting_approval' => 'Esperando aprobación',
    'repairing'        => 'En reparación',
    'ready_pickup'     => 'Listo para retirar',
    'delivered'        => 'Entregado',
    'cancelled'        => 'Cancelado',
  ];

  $orderCounts = $orderCounts ?? [];
  $repairCounts = $repairCounts ?? [];

  $labels = $labels ?? [];
  $ordersSeries = $ordersSeries ?? [];
  $repairsSeries = $repairsSeries ?? [];
  $salesSeries = $salesSeries ?? [];

  $salesMax = max([1, ...$salesSeries]);
  $activityMax = max([1, ...$ordersSeries, ...$repairsSeries]);

  $deltaPill = function($pct) {
    if ($pct === null) return '<span class="text-xs text-zinc-500">sin historial</span>';
    $up = $pct >= 0;
    $cls = $up ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900';
    $sign = $up ? '+' : '';
    return '<span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold '.$cls.'">'.$sign.number_format($pct, 0).'%</span>';
  };

  $deltaPointsPill = function($points) {
    if ($points === null) return '<span class="text-xs text-zinc-500">sin historial</span>';
    $up = $points >= 0;
    $cls = $up ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900';
    $sign = $up ? '+' : '';
    return '<span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold '.$cls.'">'.$sign.number_format($points, 1, ',', '.').' pp</span>';
  };

  $hoursLabel = fn($hours) => $hours === null ? 'sin datos' : number_format((float)$hours, 1, ',', '.').' h';

  $badgeOrder = function(string $st) {
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

  $badgeRepair = function(string $st) {
    return match($st) {
      'received' => 'bg-amber-100 text-amber-900 border-amber-200',
      'diagnosing' => 'bg-sky-100 text-sky-800 border-sky-200',
      'waiting_approval' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'repairing' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'ready_pickup' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'delivered' => 'bg-zinc-100 text-zinc-800 border-zinc-200',
      'cancelled' => 'bg-rose-100 text-rose-800 border-rose-200',
      default => 'bg-zinc-100 text-zinc-800 border-zinc-200',
    };
  };

  $rangeBtn = function($days, $rangeDays) {
    return $days == $rangeDays
      ? 'bg-zinc-900 text-white border-zinc-900'
      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50';
  };
@endphp

@section('content')
<div class="space-y-6">
  {{-- Header --}}
  <div class="flex items-end justify-between gap-3 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <h1 class="page-title">Panel Admin</h1>
      <p class="page-subtitle">
        Panel inteligente · rango actual:
        <span class="font-black">{{ (int)$rangeDays }} días</span>
      </p>
    </div>

    <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('store.index') }}">Ver tienda</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.orders.index') }}">Pedidos</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.products.index') }}">Productos</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Configuración</a>
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
    </div>
  </div>

  {{-- Rango --}}
  <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="font-extrabold text-zinc-900">Rango de análisis</div>
        <div class="text-xs text-zinc-500">Afecta KPIs y top productos.</div>
      </div>

      <div class="flex gap-2 flex-wrap">
        <a href="{{ route('admin.dashboard', ['range' => 7]) }}"
           class="inline-flex h-11 min-w-[84px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold {{ $rangeBtn(7, $rangeDays) }}">
          7 días
        </a>
        <a href="{{ route('admin.dashboard', ['range' => 30]) }}"
           class="inline-flex h-11 min-w-[84px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold {{ $rangeBtn(30, $rangeDays) }}">
          30 días
        </a>
        <a href="{{ route('admin.dashboard', ['range' => 90]) }}"
           class="inline-flex h-11 min-w-[84px] items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold {{ $rangeBtn(90, $rangeDays) }}">
          90 días
        </a>
        <div class="dropdown">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            data-menu="dashboardExportMenu"
            aria-expanded="false"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
              <path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 3.99a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.41L11 12.58V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
            </svg>
            Exportar
          </button>

          <div id="dashboardExportMenu" class="dropdown-menu hidden">
            <a class="dropdown-item" href="{{ route('admin.dashboard.export', ['range' => $rangeDays]) }}">
              Descargar CSV
            </a>
            <a class="dropdown-item" href="{{ route('admin.dashboard.export_xlsx', ['range' => $rangeDays]) }}">
              Descargar XLSX
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  {{-- KPIs (por rango + operativos) --}}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Pedidos · últimos {{ (int)$rangeDays }} días</div>
        <div class="flex items-end justify-between gap-2 mt-1">
          <div class="text-3xl font-extrabold">{{ (int)($ordersInRange ?? 0) }}</div>
          {!! $deltaPill($ordersRangeDeltaPct ?? null) !!}
        </div>
        <div class="text-sm text-zinc-600 mt-2">
          Activos: <span class="font-black text-zinc-900">{{ (int)($ordersActive ?? 0) }}</span>
          <span class="text-zinc-300">·</span>
          Pendientes: <span class="font-black text-zinc-900">{{ (int)($ordersPending ?? 0) }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Ventas entregadas · últimos {{ (int)$rangeDays }} días</div>
        <div class="flex items-end justify-between gap-2 mt-1">
          <div class="text-3xl font-extrabold">{{ $money($salesInRange ?? 0) }}</div>
          {!! $deltaPill($salesRangeDeltaPct ?? null) !!}
        </div>
        <div class="text-sm text-zinc-600 mt-2">
          Basado en pedidos con estado <span class="font-black">entregado</span>.
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Reparaciones · últimos {{ (int)$rangeDays }} días</div>
        <div class="flex items-end justify-between gap-2 mt-1">
          <div class="text-3xl font-extrabold">{{ (int)($repairsInRange ?? 0) }}</div>
          {!! $deltaPill($repairsRangeDeltaPct ?? null) !!}
        </div>
        <div class="text-sm text-zinc-600 mt-2">
          Activas: <span class="font-black text-zinc-900">{{ (int)($repairsActive ?? 0) }}</span>
          <span class="text-zinc-300">·</span>
          Total: <span class="font-black text-zinc-900">{{ (int)($repairsTotal ?? 0) }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">WhatsApp pendientes (estado actual)</div>
        <div class="text-3xl font-extrabold mt-1">{{ (int)(($ordersWaPending ?? 0) + ($repairsWaPending ?? 0)) }}</div>

        <div class="mt-2 flex flex-wrap gap-2">
          <a href="{{ route('admin.orders.index', ['wa' => 'pending']) }}"
             class="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50">
            Pedidos: {{ (int)($ordersWaPending ?? 0) }}
          </a>

          <a href="{{ route('admin.repairs.index', ['wa' => 'pending']) }}"
             class="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50">
            Reparaciones: {{ (int)($repairsWaPending ?? 0) }}
          </a>
        </div>

        <div class="text-xs text-zinc-500 mt-2">
          Enviados (actual): Pedidos {{ (int)($ordersWaSent ?? 0) }} · Reparaciones {{ (int)($repairsWaSent ?? 0) }}
        </div>
      </div>
    </div>
  </div>

  {{-- KPI extra de negocio --}}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Ticket promedio (entregados)</div>
        <div class="flex items-end justify-between gap-2 mt-1">
          <div class="text-3xl font-extrabold">{{ $money($avgTicketInRange ?? 0) }}</div>
          {!! $deltaPill($avgTicketRangeDeltaPct ?? null) !!}
        </div>
        <div class="text-sm text-zinc-600 mt-2">
          Promedio de pedidos <span class="font-black">entregados</span> en {{ (int)$rangeDays }} dias.
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Tasa de entrega</div>
        <div class="flex items-end justify-between gap-2 mt-1">
          <div class="text-3xl font-extrabold">
            @if(($deliveryRateInRange ?? null) === null)
              --
            @else
              {{ number_format((float)$deliveryRateInRange, 1, ',', '.') }}%
            @endif
          </div>
          {!! $deltaPointsPill($deliveryRateDeltaPoints ?? null) !!}
        </div>
        <div class="text-sm text-zinc-600 mt-2">
          Entregados sobre pedidos creados en el rango.
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Tiempo medio reparacion entregada</div>
        <div class="flex items-end justify-between gap-2 mt-1">
          <div class="text-3xl font-extrabold">{{ $hoursLabel($avgRepairTurnaroundHours ?? null) }}</div>
          {!! $deltaPill($avgRepairTurnaroundDeltaPct ?? null) !!}
        </div>
        <div class="text-sm text-zinc-600 mt-2">
          Basado en reparaciones con recibido y entregado.
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Presupuestos esperando aprobacion</div>
        <div class="text-3xl font-extrabold mt-1">{{ (int)($waitingApprovalCount ?? 0) }}</div>
        <div class="text-sm text-zinc-600 mt-2">
          Mas de 48h: <span class="font-black {{ (int)($waitingApprovalOver48h ?? 0) > 0 ? 'text-rose-700' : 'text-zinc-900' }}">{{ (int)($waitingApprovalOver48h ?? 0) }}</span>
        </div>
      </div>
    </div>
  </div>

  {{-- Charts --}}
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="font-extrabold text-zinc-900">Gráficos</div>
        <div class="text-xs text-zinc-500">Opcional.</div>
      </div>

      <button type="button"
        class="btn-ghost btn-sm"
        data-toggle-collapse="dash_charts"
        aria-expanded="false">Ver</button>
    </div>

    <div class="grid gap-3 lg:grid-cols-2 hidden" data-collapse="dash_charts">

    {{-- Ventas 6 meses --}}
    <div class="card">
      <div class="card-head">
        <div>
          <div class="font-extrabold">Ventas (entregado) · últimos 6 meses</div>
          <div class="text-xs text-zinc-500">Barras mensuales (histórico).</div>
        </div>
        <a class="btn-outline btn-sm" href="{{ route('admin.orders.index', ['status' => 'entregado']) }}">Ver entregados</a>
      </div>

      <div class="card-body">
        @if(empty($salesSeries))
          <div class="text-sm text-zinc-600">No hay datos todavía.</div>
        @else
          <div class="h-36 flex items-end gap-2">
            @foreach($salesSeries as $i => $v)
              @php
                $pct = $salesMax > 0 ? round(($v / $salesMax) * 100) : 0;
                $label = $labels[$i] ?? '';
              @endphp
              <div class="flex-1 flex flex-col justify-end" title="{{ $label }}: {{ $money($v) }}">
                <div class="w-full rounded-xl bg-sky-600/90" style="height: {{ $pct }}%;"></div>
              </div>
            @endforeach
          </div>

          <div class="grid grid-cols-6 gap-2 mt-3 text-[11px] text-zinc-500">
            @foreach($labels as $lb)
              <div class="text-center">{{ $lb }}</div>
            @endforeach
          </div>
        @endif
      </div>
    </div>

    {{-- Actividad --}}
    <div class="card">
      <div class="card-head">
        <div>
          <div class="font-extrabold">Actividad · Pedidos vs Reparaciones</div>
          <div class="text-xs text-zinc-500">Cantidad creada por mes (histórico).</div>
        </div>
      </div>

      <div class="card-body">
        @if(empty($ordersSeries) && empty($repairsSeries))
          <div class="text-sm text-zinc-600">No hay datos todavía.</div>
        @else
          <div class="h-36 flex items-end gap-3">
            @foreach($labels as $i => $lb)
              @php
                $o = (int)($ordersSeries[$i] ?? 0);
                $r = (int)($repairsSeries[$i] ?? 0);
                $oPct = $activityMax > 0 ? round(($o / $activityMax) * 100) : 0;
                $rPct = $activityMax > 0 ? round(($r / $activityMax) * 100) : 0;
              @endphp

              <div class="flex-1 flex flex-col items-stretch justify-end" title="{{ $lb }} · Pedidos: {{ $o }} · Reparaciones: {{ $r }}">
                <div class="flex items-end gap-1 h-full">
                  <div class="w-1/2 rounded-xl bg-zinc-900/90" style="height: {{ $oPct }}%;"></div>
                  <div class="w-1/2 rounded-xl bg-emerald-600/90" style="height: {{ $rPct }}%;"></div>
                </div>
              </div>
            @endforeach
          </div>

          <div class="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
            <div class="flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded bg-zinc-900"></span> Pedidos
              <span class="inline-block h-2.5 w-2.5 rounded bg-emerald-600 ml-3"></span> Reparaciones
            </div>
            <div>Últimos 6 meses</div>
          </div>

          <div class="grid grid-cols-6 gap-2 mt-2 text-[11px] text-zinc-500">
            @foreach($labels as $lb)
              <div class="text-center">{{ $lb }}</div>
            @endforeach
          </div>
        @endif
      </div>
    </div>
  </div>

  {{-- Estados + Stock bajo --}}
  <div class="grid gap-3 lg:grid-cols-3">
    {{-- Pedidos por estado --}}
    <div class="card">
      <div class="card-head">
        <div class="font-extrabold">Pedidos por estado</div>
        <a class="btn-outline btn-sm" href="{{ route('admin.orders.index') }}">Ver</a>
      </div>
      <div class="card-body">
        <div class="space-y-2">
          @foreach($orderStatuses as $k => $label)
            @php $cnt = (int)($orderCounts[$k] ?? 0); @endphp
            <a href="{{ route('admin.orders.index', ['status' => $k]) }}" class="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 hover:bg-zinc-100/70">
              <div class="text-sm font-semibold text-zinc-900">{{ $label }}</div>
              <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badgeOrder($k) }}">{{ $cnt }}</span>
            </a>
          @endforeach
        </div>
      </div>
    </div>

    {{-- Reparaciones por estado --}}
    <div class="card">
      <div class="card-head">
        <div class="font-extrabold">Reparaciones por estado</div>
        <a class="btn-outline btn-sm" href="{{ route('admin.repairs.index') }}">Ver</a>
      </div>
      <div class="card-body">
        <div class="space-y-2">
          @foreach($repairStatuses as $k => $label)
            @php $cnt = (int)($repairCounts[$k] ?? 0); @endphp
            <a href="{{ route('admin.repairs.index', ['status' => $k]) }}" class="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 hover:bg-zinc-100/70">
              <div class="text-sm font-semibold text-zinc-900">{{ $label }}</div>
              <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badgeRepair($k) }}">{{ $cnt }}</span>
            </a>
          @endforeach
        </div>
      </div>
    </div>

    {{-- Stock bajo --}}
    <div class="card">
      <div class="card-head">
        <div>
          <div class="font-extrabold">Stock bajo</div>
          <div class="text-xs text-zinc-500">Productos con stock ≤ {{ (int)($lowStockThreshold ?? 3) }}</div>
        </div>
        <a class="btn-outline btn-sm" href="{{ route('admin.products.index') }}">Productos</a>
      </div>
      <div class="card-body">
        <div class="text-sm text-zinc-600">
          Total productos: <span class="font-black text-zinc-900">{{ (int)($productsTotal ?? 0) }}</span>
          <span class="text-zinc-300">·</span>
          Bajo stock: <span class="font-black text-rose-700">{{ (int)($lowStockCount ?? 0) }}</span>
        </div>

        @if(empty($lowStockProducts) || $lowStockProducts->count() === 0)
          <div class="mt-3 text-sm text-zinc-600">Todo ok ✅ No hay productos en bajo stock.</div>
        @else
          <div class="mt-3 space-y-2">
            @foreach($lowStockProducts as $p)
              <div class="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white px-3 py-2">
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-zinc-900 truncate">{{ $p->name }}</div>
                  <div class="text-xs text-zinc-500 truncate">ID: {{ $p->id }}</div>
                </div>
                <span class="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-900">
                  Stock: {{ (int)$p->stock }}
                </span>
              </div>
            @endforeach
          </div>
        @endif
      </div>
    </div>
  </div>

  {{-- Top productos + Actividad reciente --}}
  <div class="grid gap-3 lg:grid-cols-2">
    <div class="card">
      <div class="card-head">
        <div class="min-w-0">
          <div class="font-extrabold">Top productos (últimos {{ (int)$rangeDays }} días)</div>
          <div class="text-xs text-zinc-500">Por cantidad vendida (excluye cancelados).</div>
        </div>
        <a class="btn-outline btn-sm h-10 w-full justify-center sm:w-auto" href="{{ route('admin.orders.index') }}">Ver pedidos</a>
      </div>
      <div class="card-body">
        @if(empty($topProducts) || $topProducts->count() === 0)
          <div class="text-sm text-zinc-600">Aún no hay ventas en este rango.</div>
        @else
          <div class="space-y-2 md:hidden">
            @foreach($topProducts as $tp)
              <div class="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div class="font-semibold text-zinc-900">{{ $tp->product_name }}</div>
                <div class="mt-0.5 text-xs text-zinc-500">ID: {{ $tp->product_id }}</div>

                <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div class="font-black uppercase text-zinc-500">Cant.</div>
                    <div class="mt-0.5 text-sm font-black text-zinc-900">{{ (int)$tp->qty }}</div>
                  </div>
                  <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div class="font-black uppercase text-zinc-500">Facturación</div>
                    <div class="mt-0.5 text-sm font-black text-zinc-900">{{ $money((int)$tp->revenue) }}</div>
                  </div>
                </div>
              </div>
            @endforeach
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-zinc-50">
                <tr>
                  <th class="px-3 py-2">Producto</th>
                  <th class="px-3 py-2 text-right">Cant.</th>
                  <th class="px-3 py-2 text-right">Facturación</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                @foreach($topProducts as $tp)
                  <tr class="hover:bg-zinc-50/70">
                    <td class="px-3 py-2">
                      <div class="font-semibold text-zinc-900">{{ $tp->product_name }}</div>
                      <div class="text-xs text-zinc-500">ID: {{ $tp->product_id }}</div>
                    </td>
                    <td class="px-3 py-2 text-right font-black">{{ (int)$tp->qty }}</td>
                    <td class="px-3 py-2 text-right font-black">{{ $money((int)$tp->revenue) }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          </div>
        @endif
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <div class="font-extrabold">Actividad reciente</div>
          <div class="text-xs text-zinc-500">Últimos movimientos (opcional).</div>
        </div>

        <button type="button"
          class="btn-ghost btn-sm h-10 w-full justify-center sm:w-auto"
          data-toggle-collapse="dash_activity"
          data-toggle-collapse-label="actividad"
          aria-expanded="false">Ver actividad</button>
      </div>

      <div class="card-body space-y-4 hidden" data-collapse="dash_activity">

        <div>
          <div class="text-xs font-black uppercase text-zinc-500">Últimos pedidos</div>
          <div class="mt-2 space-y-2">
            @forelse($latestOrders as $o)
              @php
                $st = (string)($o->status ?? 'pendiente');
                $customer = $o->pickup_name ?: ($o->user?->name ?? '—');
              @endphp
              <a href="{{ route('admin.orders.show', $o) }}" class="block rounded-2xl border border-zinc-100 bg-white px-3 py-2 hover:bg-zinc-50">
                <div class="flex items-center justify-between gap-2">
                  <div class="font-black text-zinc-900">Pedido #{{ $o->id }}</div>
                  <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badgeOrder($st) }}">
                    {{ $orderStatuses[$st] ?? $st }}
                  </span>
                </div>
                <div class="text-xs text-zinc-500 mt-1">
                  {{ $o->created_at?->format('d/m/Y H:i') }} · {{ $customer }} · {{ $money($o->total) }}
                </div>
              </a>
            @empty
              <div class="text-sm text-zinc-600">No hay pedidos todavía.</div>
            @endforelse
          </div>
        </div>

        <div class="border-t border-zinc-100 pt-4">
          <div class="text-xs font-black uppercase text-zinc-500">Últimas reparaciones</div>
          <div class="mt-2 space-y-2">
            @forelse($latestRepairs as $r)
              @php
                $rst = (string)($r->status ?? 'received');
                $device = trim(((string)($r->device_brand ?? '')).' '.((string)($r->device_model ?? '')));
                $title = $r->code ?: ('#'.$r->id);
              @endphp
              <a href="{{ route('admin.repairs.show', $r) }}" class="block rounded-2xl border border-zinc-100 bg-white px-3 py-2 hover:bg-zinc-50">
                <div class="flex items-center justify-between gap-2">
                  <div class="font-black text-zinc-900">Reparación {{ $title }}</div>
                  <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badgeRepair($rst) }}">
                    {{ $repairStatuses[$rst] ?? $rst }}
                  </span>
                </div>
                <div class="text-xs text-zinc-500 mt-1">
                  {{ $r->created_at?->format('d/m/Y H:i') }} · {{ $r->customer_name }} · {{ $device ?: '—' }}
                </div>
              </a>
            @empty
              <div class="text-sm text-zinc-600">No hay reparaciones todavía.</div>
            @endforelse
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Reparaciones')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $badge = function(string $st) {
    return match($st) {
      'received' => 'badge-sky',
      'diagnosing' => 'badge-indigo',
      'waiting_approval' => 'badge-amber',
      'repairing' => 'badge-indigo',
      'ready_pickup' => 'badge-emerald',
      'delivered' => 'badge-zinc',
      'cancelled' => 'badge-rose',
      default => 'badge-zinc',
    };
  };

  $waChip = function($r) {
    $sent = (bool) ($r->wa_notified_current ?? false);
    return $sent ? 'badge-emerald' : 'badge-amber';
  };

  $status = $status ?? '';
  $wa = $wa ?? '';
  $q = $q ?? '';

  $filtersMoreOpen = $wa !== '';


  $tabs = ['' => 'Todos'] + ($statuses ?? []);
  $statusCounts = $statusCounts ?? [];
  $totalCount = $totalCount ?? 0;

    // ✅ Urgentes
  $urgentHoursRepairs = 72;
  $finalRepairStatuses = ['delivered','cancelled'];

@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Reparaciones</div>
      <div class="page-subtitle">Listado y control rápido de reparaciones.</div>
    </div>


        {{-- Tabs por estado (con contadores) --}}
        <div class="w-full">
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm font-semibold text-zinc-900">Estados</div>

            <button type="button"
              class="btn-ghost btn-sm h-10"
              data-toggle-collapse="repairs_tabs"
              data-toggle-collapse-label="estados"
              aria-expanded="false">Ver estados</button>
          </div>

          <div class="mt-2 flex items-center gap-2 overflow-x-auto pb-1 snap-x hidden" data-collapse="repairs_tabs">
            @foreach($tabs as $key => $label)
              @php
                $isActive = ($status ?? '') === (string)$key;

                $params = array_filter([
                  'q' => $q ?? '',
                  'wa' => $wa ?? '',
                  'status' => $key,
                ], fn($v) => $v !== '' && $v !== null);

                // Para "Todos", no mandamos status
                if ($key === '') unset($params['status']);

                $href = route('admin.repairs.index', $params);

                $count = $key === '' ? (int)$totalCount : (int)($statusCounts[$key] ?? 0);
                $countKey = $key === '' ? 'all' : (string)$key;
              @endphp

              <a href="{{ $href }}" class="nav-pill whitespace-nowrap {{ $isActive ? 'nav-pill-active' : '' }}">
                <span>{{ $label }}</span>
                <span
                  class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black
                        ring-1 ring-zinc-200 bg-white/70 text-zinc-700"
                  data-admin-repairs-count="{{ $countKey }}"
                >
                  {{ $count }}
                </span>
              </a>
            @endforeach
          </div>
        </div>



    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="alert-error">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- Filtros --}}
  <div class="card">
    <div class="card-body">
      <form method="GET" class="grid gap-3 sm:grid-cols-6">
        <div class="sm:col-span-2">
          <label>Buscar</label>
          <input name="q" value="{{ $q }}" placeholder="Código, nombre, teléfono…" class="h-11" />
        </div>

        <div class="sm:col-span-2">
          <label>Estado</label>
          <select name="status" class="h-11">
            <option value="">Todos</option>
            @foreach($statuses as $key => $label)
              <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div class="sm:col-span-2 {{ $filtersMoreOpen ? '' : 'hidden' }}" data-collapse="repairs_filters_more">
          <label>WhatsApp</label>
          <select name="wa" class="h-11">
            <option value="">Todos</option>
            <option value="pending" @selected($wa === 'pending')>Pendiente</option>
            <option value="sent" @selected($wa === 'sent')>Enviado (OK)</option>
            <option value="no_phone" @selected($wa === 'no_phone')>Sin teléfono</option>
          </select>
        </div>


       <div class="sm:col-span-6 flex flex-col sm:flex-row gap-2 sm:items-center">
          <button class="btn-outline h-11 w-full justify-center sm:w-40" type="submit">Aplicar</button>

          @if($q !== '' || $status !== '' || $wa !== '')
            <a class="btn-ghost h-11 w-full justify-center sm:w-40" href="{{ route('admin.repairs.index') }}">Limpiar</a>
          @endif

          <button type="button"
            class="btn-ghost h-11 w-full justify-center sm:w-40 sm:ml-auto"
            data-toggle-collapse="repairs_filters_more"
            data-toggle-collapse-label="filtros"
            aria-expanded="{{ $filtersMoreOpen ? 'true' : 'false' }}">Ver filtros</button>
        </div>

      </form>
    </div>
  </div>

  {{-- Mobile (cards) --}}
  <div class="grid gap-3 md:hidden">
    @forelse($repairs as $repair)
      <div class="card">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-xs text-zinc-500">Código</div>
              <div class="font-black text-zinc-900">{{ $repair->code }}</div>

              @php
                $rcv = $repair->received_at ?: $repair->created_at;
                $rcvText = $rcv ? $rcv->format('d/m/Y H:i') : '—';
                $rcvAge  = $rcv ? $rcv->locale('es')->diffForHumans() : null;
              @endphp
              <div class="mt-1 text-xs text-zinc-500">
                Recibido: <span class="font-semibold text-zinc-700">{{ $rcvText }}</span>
                @if($rcvAge)
                  <span class="text-zinc-400">·</span>
                  <span class="font-bold text-zinc-600">{{ $rcvAge }}</span>
                @endif
              </div>

              <div class="mt-1 text-sm text-zinc-700">

                  <span class="font-semibold">{{ $repair->customer_name }}</span>
                  <span class="text-zinc-400">·</span>
                  <span class="text-zinc-600">{{ $repair->customer_phone }}</span>
                </div>
                <div class="mt-1 text-sm text-zinc-600">
                  {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}
                </div>
              </div>

              <div class="flex flex-col items-end gap-2">
                @php
                  $rcv = $repair->received_at ?: $repair->created_at;
                  $isUrgentRepair = $rcv
                    && !in_array((string)$repair->status, $finalRepairStatuses, true)
                    && $rcv->lte(now()->subHours($urgentHoursRepairs));
                @endphp

                <span class="{{ $badge($repair->status) }}">
                  {{ $statuses[$repair->status] ?? $repair->status }}
                </span>

                @if($isUrgentRepair)
                  <span class="badge-rose" title="Más de {{ $urgentHoursRepairs }}h sin cerrar">URGENTE</span>
                @endif

                @if(!$repair->wa_url)
                  <span class="badge-amber">Sin teléfono</span>
                @elseif(!($repair->wa_notified_current ?? false))
                  <span class="badge-amber">WA pendiente</span>
                @endif


              </div>
          </div>

          <div class="mt-4 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-xs text-zinc-500">Precio final</div>
                <div class="text-lg font-black">{{ $money($repair->final_price) }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <a class="btn-outline btn-sm h-10 w-full justify-center" href="{{ route('admin.repairs.show', $repair) }}">Ver</a>

              @if($repair->wa_url)
                <a href="{{ $repair->wa_url }}" target="_blank" rel="noopener"
                  class="btn-sm inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[.99]">
                  WhatsApp
                </a>
              @endif

              <div class="dropdown col-span-2">
                <button type="button" class="btn-ghost btn-sm h-10 w-full justify-center" data-menu="repairMoreDesk-{{ $repair->id }}" aria-expanded="false">Más acciones</button>
                <div id="repairMoreDesk-{{ $repair->id }}" class="dropdown-menu hidden">
                  <a class="dropdown-item" href="{{ route('admin.repairs.print', $repair) }}" target="_blank" rel="noopener">Imprimir</a>
                  <a class="dropdown-item" href="{{ route('admin.repairs.ticket', $repair) }}?autoprint=1" target="_blank" rel="noopener">Ticket</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    @empty
      <div class="card"><div class="card-body text-sm text-zinc-600">No hay reparaciones.</div></div>
    @endforelse
  </div>

  {{-- Desktop (table) --}}
  <div class="card hidden md:block">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Equipo</th>
            <th>Estado</th>
            <th class="text-right">Final</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          @forelse($repairs as $repair)
            <tr>
              <td>
                <div class="font-black">{{ $repair->code }}</div>
                @php
                  $rcv = $repair->received_at ?: $repair->created_at;
                  $rcvText = $rcv ? $rcv->format('d/m/Y H:i') : '—';
                  $rcvAge  = $rcv ? $rcv->locale('es')->diffForHumans() : null;
                @endphp
                <div class="text-xs text-zinc-500">
                  Recibido: {{ $rcvText }}@if($rcvAge) · <span class="font-bold text-zinc-600">{{ $rcvAge }}</span>@endif
                </div>
              </td>

              <td>
                <div class="font-semibold text-zinc-900">{{ $repair->customer_name }}</div>
                <div class="text-xs text-zinc-500">{{ $repair->customer_phone }}</div>
              </td>
              <td class="text-zinc-700">{{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}</td>
              <td>
                @php
                  $rcv = $repair->received_at ?: $repair->created_at;
                  $isUrgentRepair = $rcv
                    && !in_array((string)$repair->status, $finalRepairStatuses, true)
                    && $rcv->lte(now()->subHours($urgentHoursRepairs));
                @endphp

                <div class="inline-flex items-center gap-2">
                  <span class="{{ $badge($repair->status) }}">{{ $statuses[$repair->status] ?? $repair->status }}</span>
                  @if($isUrgentRepair)
                    <span class="badge-rose" title="Más de {{ $urgentHoursRepairs }}h sin cerrar">URGENTE</span>
                  @endif
                </div>
              </td>

              
              <td class="text-right font-black">{{ $money($repair->final_price) }}</td>
              <td class="text-right">
                <div class="inline-flex items-center gap-2">
                  <span class="{{ $badge($repair->status) }}">{{ $statuses[$repair->status] ?? $repair->status }}</span>

                  @if(!$repair->wa_url)
                    <span class="badge-amber">Sin teléfono</span>
                  @elseif(!($repair->wa_notified_current ?? false))
                    <span class="badge-amber">WA pendiente</span>
                  @endif

                  @if($isUrgentRepair)
                    <span class="badge-rose" title="Más de {{ $urgentHoursRepairs }}h sin cerrar">URGENTE</span>
                  @endif
                </div>

              </td>
            </tr>
          @empty
            <tr><td colspan="7" class="py-8 text-center text-zinc-500">No hay reparaciones.</td></tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div>
    {{ $repairs->links() }}
  </div>
</div>
@endsection

@extends('layouts.app')

@section('title', 'Admin - Reparaciones')

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

  $tabs = ['' => 'Todos'] + ($statuses ?? []);
  $statusCounts = $statusCounts ?? [];
  $totalCount = $totalCount ?? 0;
  $tabItems = [];
  foreach ($tabs as $key => $label) {
    $params = array_filter([
      'q' => $q ?? '',
      'wa' => $wa ?? '',
      'status' => $key,
    ], fn($v) => $v !== '' && $v !== null);
    if ($key === '') unset($params['status']);
    $tabItems[] = [
      'key' => $key === '' ? 'all' : (string) $key,
      'label' => $label,
      'href' => route('admin.repairs.index', $params),
      'active' => ($status ?? '') === (string) $key,
      'count' => $key === '' ? (int) $totalCount : (int) ($statusCounts[$key] ?? 0),
    ];
  }
  $headerPayload = htmlspecialchars(json_encode([
    'title' => 'Reparaciones',
    'subtitle' => 'Listado y control rapido de reparaciones.',
    'createHref' => route('admin.repairs.create'),
    'createLabel' => '+ Nueva reparacion',
    'tabsTitle' => 'Estados',
    'tabs' => $tabItems,
  ], JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8');
  $filtersPayload = htmlspecialchars(json_encode([
    'q' => (string) $q,
    'status' => (string) $status,
    'wa' => (string) $wa,
    'statuses' => collect($statuses ?? [])->map(fn($label, $key) => [
      'key' => (string) $key,
      'label' => (string) $label,
    ])->values()->all(),
    'clearHref' => route('admin.repairs.index'),
  ], JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8');

    // Urgentes
  $urgentHoursRepairs = 72;
  $finalRepairStatuses = ['delivered','cancelled'];

@endphp

@section('content')
<div class="store-shell space-y-6">
  <div data-react-admin-repairs-header data-payload="{{ $headerPayload }}"></div>
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
  <div data-react-admin-repairs-filters data-payload="{{ $filtersPayload }}"></div>

  {{-- Mobile (cards) --}}
  <div class="grid gap-3 md:hidden">
    @forelse($repairs as $repair)
      <div class="card reveal-item">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-xs text-zinc-500">Codigo</div>
              <div class="font-black text-zinc-900">{{ $repair->code }}</div>

              @php
                $rcv = $repair->received_at ?: $repair->created_at;
                $rcvText = $rcv ? $rcv->format('d/m/Y H:i') : '-';
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
                  {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '-' }}
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
                  <span class="badge-rose" title="Mas de {{ $urgentHoursRepairs }}h sin cerrar">URGENTE</span>
                @endif

                @if(!$repair->wa_url)
                  <span class="badge-amber">Sin telefono</span>
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

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a class="btn-outline btn-sm h-10 w-full justify-center" href="{{ route('admin.repairs.show', $repair) }}">Ver</a>

              @if($repair->wa_url)
                <a href="{{ $repair->wa_url }}" target="_blank" rel="noopener"
                  class="btn-outline btn-sm h-10 w-full justify-center border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  WhatsApp
                </a>
              @endif

              <div class="dropdown col-span-2">
                <button type="button" class="btn-ghost btn-sm h-10 w-full justify-center" data-menu="repairMoreDesk-{{ $repair->id }}" aria-expanded="false">Mas acciones</button>
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
      <div class="card reveal-item"><div class="card-body text-sm text-zinc-600">No hay reparaciones.</div></div>
    @endforelse
  </div>

  {{-- Desktop (table) --}}
  <div class="card reveal-item hidden md:block">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Codigo</th>
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
                  $rcvText = $rcv ? $rcv->format('d/m/Y H:i') : '-';
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
              <td class="text-zinc-700">{{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '-' }}</td>
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
                    <span class="badge-rose" title="Mas de {{ $urgentHoursRepairs }}h sin cerrar">URGENTE</span>
                  @endif
                </div>
              </td>

              
              <td class="text-right font-black">{{ $money($repair->final_price) }}</td>
              <td class="text-right">
                <div class="inline-flex items-center gap-2">
                  <a class="btn-outline btn-sm h-10" href="{{ route('admin.repairs.show', $repair) }}">Ver</a>

                  @if($repair->wa_url)
                    <a href="{{ $repair->wa_url }}"
                      target="_blank"
                      rel="noopener"
                      class="btn-outline btn-sm h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      WhatsApp
                    </a>
                  @endif

                  <div class="dropdown">
                    <button type="button" class="btn-ghost btn-sm h-10" data-menu="repairMoreDeskTable-{{ $repair->id }}" aria-expanded="false">Mas</button>
                    <div id="repairMoreDeskTable-{{ $repair->id }}" class="dropdown-menu hidden">
                      <a class="dropdown-item" href="{{ route('admin.repairs.print', $repair) }}" target="_blank" rel="noopener">Imprimir</a>
                      <a class="dropdown-item" href="{{ route('admin.repairs.ticket', $repair) }}?autoprint=1" target="_blank" rel="noopener">Ticket</a>
                    </div>
                  </div>
                </div>

                <div class="mt-2 inline-flex items-center gap-2">
                  @if(!$repair->wa_url)
                    <span class="badge-amber">Sin telefono</span>
                  @elseif(!($repair->wa_notified_current ?? false))
                    <span class="badge-amber">WA pendiente</span>
                  @endif

                  @if($isUrgentRepair)
                    <span class="badge-rose" title="Mas de {{ $urgentHoursRepairs }}h sin cerrar">URGENTE</span>
                  @endif
                </div>
              </td>
            </tr>
          @empty
            <tr><td colspan="6" class="py-8 text-center text-zinc-500">No hay reparaciones.</td></tr>
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





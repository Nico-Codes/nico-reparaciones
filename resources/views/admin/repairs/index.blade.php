@extends('layouts.app')

@section('title', 'Admin - Reparaciones')

@section('content')
@php
  $q = request()->query('q', '');
  $current = request()->query('status', '');

  // Ajustá/extendé estos estados si en tu modelo tenés otros.
  $statuses = [
    '' => 'Todas',
    'received' => 'Recibida',
    'diagnosing' => 'Diagnosticando',
    'waiting_approval' => 'Esperando aprobación',
    'repairing' => 'Reparando',
    'ready_pickup' => 'Listo para retirar',
    'delivered' => 'Entregada',
    'cancelled' => 'Cancelada',
  ];

  $badgeFor = function ($status) {
    return match ((string)$status) {
      'received' => 'badge-blue',
      'diagnosing', 'waiting_approval' => 'badge-amber',
      'repairing' => 'badge-blue',
      'ready_pickup', 'delivered' => 'badge-green',
      'cancelled' => 'badge-red',
      default => 'badge-zinc',
    };
  };

  $labelFor = function ($status) use ($statuses) {
    return $statuses[$status] ?? ucfirst(str_replace('_',' ', (string)$status));
  };

  $money = function ($n) {
    return '$' . number_format((float)($n ?? 0), 0, ',', '.');
  };

  $payBadge = function ($final, $paid) {
    $final = (float)($final ?? 0);
    $paid  = (float)($paid ?? 0);

    if ($final <= 0) return ['badge-zinc', 'Sin precio'];
    if ($paid >= $final) return ['badge-green', 'Pagado'];
    if ($paid > 0) return ['badge-amber', 'Parcial'];
    return ['badge-red', 'Debe'];
  };
@endphp

  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="page-title">Reparaciones</h1>
      <p class="muted mt-1">Operación del taller: estados, pagos, impresión y WhatsApp.</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      @if(\Illuminate\Support\Facades\Route::has('admin.repairs.create'))
        <a class="btn-primary" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
      @endif
      <a class="btn-outline" href="{{ route('admin.dashboard') }}">Dashboard</a>
    </div>
  </div>

  {{-- Filtros --}}
  <div class="mt-4 card">
    <div class="card-body">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div class="section-title">Búsqueda y filtros</div>

        <form method="GET" action="{{ route('admin.repairs.index') }}" class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            name="q"
            value="{{ $q }}"
            class="input sm:w-[320px]"
            placeholder="Buscar: código, nombre, teléfono, marca, modelo…"
          />

          <select name="status" class="select sm:w-[220px]">
            @foreach($statuses as $key => $label)
              <option value="{{ $key }}" {{ $current === $key ? 'selected' : '' }}>{{ $label }}</option>
            @endforeach
          </select>

          <button class="btn-primary" type="submit">Aplicar</button>

          @if($q || $current)
            <a class="btn-ghost" href="{{ route('admin.repairs.index') }}">Limpiar</a>
          @endif
        </form>
      </div>

      {{-- Chips (rápido en mobile) --}}
      <div class="mt-3 flex gap-2 overflow-x-auto pb-1 tap">
        @foreach($statuses as $key => $label)
          @php
            $active = ($current === $key) || (!$current && $key === '');
            $params = array_filter([
              'status' => $key ?: null,
              'q' => $q ?: null,
            ], fn($v) => !is_null($v) && $v !== '');
          @endphp
          <a
            href="{{ $key === '' ? route('admin.repairs.index', ['q' => $q]) : route('admin.repairs.index', $params) }}"
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
  @if($repairs->isEmpty())
    <div class="mt-6 card">
      <div class="card-body">
        <div class="font-bold text-lg">No hay reparaciones</div>
        <div class="muted mt-1">Probá con otro filtro o cargá una nueva reparación.</div>
        @if(\Illuminate\Support\Facades\Route::has('admin.repairs.create'))
          <div class="mt-4">
            <a class="btn-primary" href="{{ route('admin.repairs.create') }}">+ Crear reparación</a>
          </div>
        @endif
      </div>
    </div>
  @else
    {{-- Mobile cards --}}
    <div class="mt-6 grid grid-cols-1 md:hidden gap-3">
      @foreach($repairs as $repair)
        @php
          [$pb, $pl] = $payBadge($repair->final_price, $repair->paid_amount);
          $customer = $repair->customer_name ?? '—';
          $phone = $repair->customer_phone ?? '';
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-extrabold tracking-tight">
                  {{ $repair->code ?? ('#'.$repair->id) }}
                </div>
                <div class="muted mt-1">
                  {{ $customer }} @if($phone)· {{ $phone }}@endif
                </div>
              </div>

              <div class="flex flex-col items-end gap-1">
                <span class="{{ $badgeFor($repair->status) }}">{{ $labelFor($repair->status) }}</span>
                <span class="{{ $pb }}">{{ $pl }}</span>
              </div>
            </div>

            <div class="mt-3 text-sm text-zinc-700">
              <div class="font-semibold">
                {{ $repair->device_brand ?? 'Equipo' }} {{ $repair->device_model ?? '' }}
              </div>
              <div class="muted mt-1">
                Problema: {{ \Illuminate\Support\Str::limit($repair->issue_reported ?? '—', 70) }}
              </div>
            </div>

            <div class="mt-4 flex items-end justify-between gap-3">
              <div>
                <div class="muted">Precio</div>
                <div class="text-xl font-extrabold">{{ $money($repair->final_price) }}</div>
              </div>

              <div class="flex gap-2">
                @if(\Illuminate\Support\Facades\Route::has('admin.repairs.show'))
                  <a class="btn-primary" href="{{ route('admin.repairs.show', $repair->id) }}">Ver</a>
                @endif

                @if(\Illuminate\Support\Facades\Route::has('admin.repairs.print'))
                  <a class="btn-outline" href="{{ route('admin.repairs.print', $repair->id) }}">Imprimir</a>
                @endif
              </div>
            </div>

          </div>
        </div>
      @endforeach
    </div>

    {{-- Desktop table --}}
    <div class="mt-6 hidden md:block card overflow-hidden">
      <div class="card-header flex items-center justify-between">
        <div class="section-title">Listado</div>
        <div class="muted">{{ $repairs->count() }} en esta página</div>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="th">Código</th>
              <th class="th">Cliente</th>
              <th class="th">Equipo</th>
              <th class="th">Estado</th>
              <th class="th">Pago</th>
              <th class="th text-right">Precio</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @foreach($repairs as $repair)
              @php
                [$pb, $pl] = $payBadge($repair->final_price, $repair->paid_amount);
              @endphp

              <tr class="row-hover">
                <td class="td">
                  <div class="font-semibold">{{ $repair->code ?? ('#'.$repair->id) }}</div>
                  <div class="muted">
                    {{ optional($repair->received_at ?? $repair->created_at)->format('d/m/Y') }}
                  </div>
                </td>

                <td class="td">
                  <div class="font-semibold">{{ $repair->customer_name ?? '—' }}</div>
                  @if(!empty($repair->customer_phone))
                    <div class="muted">{{ $repair->customer_phone }}</div>
                  @endif
                </td>

                <td class="td">
                  <div class="font-semibold">
                    {{ $repair->device_brand ?? 'Equipo' }} {{ $repair->device_model ?? '' }}
                  </div>
                  <div class="muted">
                    {{ \Illuminate\Support\Str::limit($repair->issue_reported ?? '—', 50) }}
                  </div>
                </td>

                <td class="td">
                  <span class="{{ $badgeFor($repair->status) }}">{{ $labelFor($repair->status) }}</span>
                </td>

                <td class="td">
                  <span class="{{ $pb }}">{{ $pl }}</span>
                </td>

                <td class="td text-right font-extrabold">
                  {{ $money($repair->final_price) }}
                </td>

                <td class="td text-right">
                  <div class="flex items-center justify-end gap-2">
                    @if(\Illuminate\Support\Facades\Route::has('admin.repairs.show'))
                      <a class="btn-outline" href="{{ route('admin.repairs.show', $repair->id) }}">Ver</a>
                    @endif

                    @if(\Illuminate\Support\Facades\Route::has('admin.repairs.edit'))
                      <a class="btn-ghost" href="{{ route('admin.repairs.edit', $repair->id) }}">Editar</a>
                    @endif

                    @if(\Illuminate\Support\Facades\Route::has('admin.repairs.print'))
                      <a class="btn-ghost" href="{{ route('admin.repairs.print', $repair->id) }}">Imprimir</a>
                    @endif
                  </div>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>

      <div class="card-body">
        {{ $repairs->appends(request()->query())->links() }}
      </div>
    </div>
  @endif
@endsection

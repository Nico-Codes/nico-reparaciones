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
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Reparaciones</div>
      <div class="page-subtitle">Gestioná estados, impresión y WhatsApp. Todo 100% mobile-first.</div>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-primary" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
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
          <input name="q" value="{{ $q }}" placeholder="Código, nombre, teléfono…" />
        </div>

        <div class="sm:col-span-2">
          <label>Estado</label>
          <select name="status">
            <option value="">Todos</option>
            @foreach($statuses as $key => $label)
              <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div class="sm:col-span-2">
          <label>WhatsApp</label>
          <select name="wa">
            <option value="">Todos</option>
            <option value="pending" @selected($wa === 'pending')>Pendiente</option>
            <option value="sent" @selected($wa === 'sent')>Enviado (OK)</option>
          </select>
        </div>

        <div class="sm:col-span-6 flex flex-col sm:flex-row gap-2">
          <button class="btn-outline sm:w-40" type="submit">Aplicar</button>
          @if($q !== '' || $status !== '' || $wa !== '')
            <a class="btn-ghost sm:w-40" href="{{ route('admin.repairs.index') }}">Limpiar</a>
          @endif
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
              <span class="{{ $badge($repair->status) }}">
                {{ $statuses[$repair->status] ?? $repair->status }}
              </span>
              <span class="{{ $waChip($repair) }}">
                WA: {{ ($repair->wa_notified_current ?? false) ? 'OK' : 'Pend.' }}
              </span>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between gap-2">
            <div>
              <div class="text-xs text-zinc-500">Precio final</div>
              <div class="text-lg font-black">{{ $money($repair->final_price) }}</div>
            </div>

            <div class="flex items-center gap-2">
              <a class="btn-outline btn-sm" href="{{ route('admin.repairs.show', $repair) }}">Ver</a>
              @if($repair->wa_url)
                <a href="{{ $repair->wa_url }}" target="_blank" rel="noopener"
                   class="btn-sm inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[.99]">
                  WhatsApp
                </a>
              @endif
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
            <th>WA</th>
            <th class="text-right">Final</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse($repairs as $repair)
            <tr>
              <td class="font-black">{{ $repair->code }}</td>
              <td>
                <div class="font-semibold text-zinc-900">{{ $repair->customer_name }}</div>
                <div class="text-xs text-zinc-500">{{ $repair->customer_phone }}</div>
              </td>
              <td class="text-zinc-700">{{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}</td>
              <td><span class="{{ $badge($repair->status) }}">{{ $statuses[$repair->status] ?? $repair->status }}</span></td>
              <td><span class="{{ $waChip($repair) }}">{{ ($repair->wa_notified_current ?? false) ? 'OK' : 'Pendiente' }}</span></td>
              <td class="text-right font-black">{{ $money($repair->final_price) }}</td>
              <td class="text-right">
                <div class="inline-flex items-center gap-2">
                  <a class="btn-outline btn-sm" href="{{ route('admin.repairs.show', $repair) }}">Ver</a>
                  @if($repair->wa_url)
                    <a href="{{ $repair->wa_url }}" target="_blank" rel="noopener"
                       class="btn-sm inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[.99]">
                      WhatsApp
                    </a>
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

@extends('layouts.app')

@section('title', 'Admin — Reparaciones')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $badge = function(string $st) {
    return match($st) {
      'received' => 'bg-sky-100 text-sky-800 border-sky-200',
      'diagnosing' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'waiting_approval' => 'bg-amber-100 text-amber-900 border-amber-200',
      'repairing' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'ready_pickup' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'delivered' => 'bg-zinc-100 text-zinc-800 border-zinc-200',
      'cancelled' => 'bg-rose-100 text-rose-800 border-rose-200',
      default => 'bg-zinc-100 text-zinc-800 border-zinc-200',
    };
  };

  $waChip = function($r) {
    // wa_notified_current viene desde el select del controller (1/NULL)
    $sent = (bool) ($r->wa_notified_current ?? false);
    return $sent
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-amber-100 text-amber-900 border-amber-200';
  };
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-xl font-black tracking-tight">Reparaciones</h1>
      <p class="mt-1 text-sm text-zinc-600">Gestioná estados, impresión y WhatsApp. Todo pensado para usar desde el celu.</p>
    </div>

    <a href="{{ route('admin.repairs.create') }}"
       class="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[.99]">
      + Nueva reparación
    </a>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if ($errors->any())
    <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-bold">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- Filtros --}}
  <form method="GET" class="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
    <div class="grid gap-3 sm:grid-cols-6">
      <div class="sm:col-span-2">
        <label class="text-xs font-semibold text-zinc-700">Buscar</label>
        <input name="q" value="{{ $q ?? '' }}" placeholder="Código, nombre, teléfono…"
               class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
      </div>

      <div class="sm:col-span-2">
        <label class="text-xs font-semibold text-zinc-700">Estado</label>
        <select name="status"
                class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
          <option value="">Todos</option>
          @foreach($statuses as $key => $label)
            <option value="{{ $key }}" @selected(($status ?? '') === $key)>{{ $label }}</option>
          @endforeach
        </select>
      </div>

      <div class="sm:col-span-1">
        <label class="text-xs font-semibold text-zinc-700">WhatsApp</label>
        <select name="wa"
                class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
          <option value="">Todos</option>
          <option value="pending" @selected(($wa ?? '') === 'pending')>Pendiente</option>
          <option value="sent" @selected(($wa ?? '') === 'sent')>Enviado</option>
        </select>
      </div>

      <div class="sm:col-span-1 flex items-end gap-2">
        <button class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
          Filtrar
        </button>
      </div>
    </div>
  </form>

  {{-- Mobile cards --}}
  <div class="mt-5 grid gap-3 md:hidden">
    @forelse($repairs as $repair)
      <div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs text-zinc-500">Código</div>
            <div class="font-black">{{ $repair->code }}</div>
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
            <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold {{ $badge($repair->status) }}">
              {{ $statuses[$repair->status] ?? $repair->status }}
            </span>

            <span class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold {{ $waChip($repair) }}">
              WA: {{ ($repair->wa_notified_current ?? false) ? 'OK' : 'Pend.' }}
            </span>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="text-sm">
            <div class="text-xs text-zinc-500">Precio final</div>
            <div class="font-black">{{ $money($repair->final_price) }}</div>
          </div>

          <div class="flex items-center gap-2">
            <a href="{{ route('admin.repairs.show', $repair) }}"
               class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
              Ver
            </a>

            @if($repair->wa_url)
              <a href="{{ $repair->wa_url }}" target="_blank" rel="noopener"
                 class="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                WhatsApp
              </a>
            @endif
          </div>
        </div>
      </div>
    @empty
      <div class="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        No hay reparaciones todavía.
      </div>
    @endforelse
  </div>

  {{-- Desktop table --}}
  <div class="mt-5 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th class="px-4 py-3 text-left">Código</th>
            <th class="px-4 py-3 text-left">Cliente</th>
            <th class="px-4 py-3 text-left">Equipo</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-left">WA</th>
            <th class="px-4 py-3 text-left">Final</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100">
          @forelse($repairs as $repair)
            <tr class="hover:bg-zinc-50/70">
              <td class="px-4 py-3 font-black">{{ $repair->code }}</td>
              <td class="px-4 py-3">
                <div class="font-semibold">{{ $repair->customer_name }}</div>
                <div class="text-xs text-zinc-500">{{ $repair->customer_phone }}</div>
              </td>
              <td class="px-4 py-3 text-zinc-700">
                {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($repair->status) }}">
                  {{ $statuses[$repair->status] ?? $repair->status }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $waChip($repair) }}">
                  {{ ($repair->wa_notified_current ?? false) ? 'OK' : 'Pendiente' }}
                </span>
              </td>
              <td class="px-4 py-3 font-black">{{ $money($repair->final_price) }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <a href="{{ route('admin.repairs.show', $repair) }}"
                     class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
                    Ver
                  </a>
                  @if($repair->wa_url)
                    <a href="{{ $repair->wa_url }}" target="_blank" rel="noopener"
                       class="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      WhatsApp
                    </a>
                  @endif
                </div>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="7" class="px-4 py-8 text-center text-zinc-500">No hay reparaciones.</td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
  </div>

  <div class="mt-6">
    {{ $repairs->links() }}
  </div>
</div>
@endsection

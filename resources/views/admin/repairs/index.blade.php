@extends('layouts.app')

@section('title', 'Admin — Reparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $statusBadge = fn($s) => match($s) {
    'received' => 'badge badge-sky',
    'diagnosing' => 'badge badge-amber',
    'waiting_approval' => 'badge badge-purple',
    'repairing' => 'badge badge-amber',
    'ready_pickup' => 'badge badge-emerald',
    'delivered' => 'badge bg-zinc-900 text-white ring-zinc-900/10',
    'cancelled' => 'badge badge-rose',
    default => 'badge badge-zinc',
  };

  $waBadge = fn($ok) => $ok ? 'badge badge-emerald' : 'badge badge-amber';

  $activeStatus = (string)($status ?? '');
  $activeWa = (string)($wa ?? '');
  $qv = (string)($q ?? '');
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="page-title">Reparaciones</h1>
      <p class="page-subtitle">Listado, filtros rápidos, WhatsApp y acciones.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a href="{{ route('admin.repairs.create') }}" class="btn-primary">+ Nueva reparación</a>
      <a href="{{ route('admin.dashboard') }}" class="btn-outline">Volver al panel</a>
    </div>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  {{-- Filtros --}}
  <div class="mt-6 card">
    <div class="card-body">
      <form method="GET" action="{{ route('admin.repairs.index') }}" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div class="md:col-span-3">
          <label class="label">Estado</label>
          <select name="status" class="select">
            <option value="">Todos</option>
            @foreach($statuses as $k => $label)
              <option value="{{ $k }}" {{ $activeStatus === $k ? 'selected' : '' }}>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div class="md:col-span-3">
          <label class="label">WhatsApp</label>
          <select name="wa" class="select">
            <option value="">Todos</option>
            <option value="pending" {{ $activeWa === 'pending' ? 'selected' : '' }}>🟡 Pendiente</option>
            <option value="sent" {{ $activeWa === 'sent' ? 'selected' : '' }}>✅ Avisado</option>
          </select>
        </div>

        <div class="md:col-span-4">
          <label class="label">Buscar</label>
          <input class="input" type="text" name="q" value="{{ $qv }}" placeholder="Código, cliente o teléfono">
        </div>

        <div class="md:col-span-2 flex gap-2">
          <button class="btn-primary flex-1" type="submit">Filtrar</button>
          <a class="btn-outline flex-1" href="{{ route('admin.repairs.index') }}">Limpiar</a>
        </div>
      </form>

      {{-- Chips de estado (rápido) --}}
      <div class="mt-4 flex flex-wrap gap-2">
        <a href="{{ route('admin.repairs.index', array_filter(['wa'=>$activeWa ?: null, 'q'=>$qv ?: null])) }}"
           class="{{ $activeStatus==='' ? 'btn-primary' : 'btn-outline' }}">
          Todos
        </a>

        @foreach($statuses as $k => $label)
          <a href="{{ route('admin.repairs.index', array_filter(['status'=>$k, 'wa'=>$activeWa ?: null, 'q'=>$qv ?: null])) }}"
             class="{{ $activeStatus===$k ? 'btn-primary' : 'btn-outline' }}">
            {{ $label }}
          </a>
        @endforeach
      </div>
    </div>
  </div>

  @if($repairs->isEmpty())
    <div class="mt-6 card">
      <div class="card-body text-sm text-zinc-600">
        No hay reparaciones para los filtros seleccionados.
      </div>
    </div>
  @else
    {{-- Mobile cards --}}
    <div class="mt-6 grid grid-cols-1 md:hidden gap-3">
      @foreach($repairs as $r)
        @php
          $waOk = !empty($r->wa_notified_current);
          $waAt = $r->wa_notified_at ? \Illuminate\Support\Carbon::parse($r->wa_notified_at)->format('d/m/Y H:i') : null;

          $canWa = !empty($r->wa_url) && !empty($r->wa_log_url);
          $showWaBtn = $canWa && !$waOk;

          $device = trim(($r->device_brand ?? '').' '.($r->device_model ?? ''));
          $code = $r->code ?? ('#'.$r->id);
        @endphp

        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="text-sm font-extrabold text-zinc-900">{{ $code }}</div>
                  <span class="{{ $statusBadge($r->status) }}">{{ $statuses[$r->status] ?? $r->status }}</span>
                </div>

                <div class="mt-2 text-sm text-zinc-800">
                  <span class="font-semibold">{{ $r->customer_name }}</span>
                  <span class="text-zinc-500">· {{ $r->customer_phone }}</span>
                </div>

                <div class="mt-1 text-xs text-zinc-500">
                  {{ $device ?: '—' }}
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs text-zinc-500">Final</div>
                <div class="text-base font-extrabold text-zinc-900">
                  {{ $r->final_price !== null ? $money($r->final_price) : '—' }}
                </div>
                <div class="mt-1 text-xs text-zinc-500">Saldo: {{ $money($r->balance_due ?? 0) }}</div>
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between gap-2">
              <span id="wa-pill-{{ $r->id }}" class="{{ $waBadge($waOk) }}">
                {{ $waOk ? ('✅ Avisado'.($waAt ? ' · '.$waAt : '')) : '🟡 WA Pendiente' }}
              </span>

              @if($r->in_warranty ?? false)
                <span class="badge badge-emerald">En garantía</span>
              @elseif(!empty($r->warranty_expires_at))
                <span class="badge badge-rose">Garantía vencida</span>
              @endif
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              @if($showWaBtn)
                <a id="wa-btn-{{ $r->id }}"
                   class="btn-outline"
                   href="{{ $r->wa_url }}"
                   target="_blank"
                   rel="noopener"
                   onclick="waQuickLog('{{ $r->id }}','{{ $r->wa_log_url }}')">
                  💬 WhatsApp
                </a>
              @else
                <button class="btn-outline opacity-60" type="button" disabled>
                  {{ $waOk ? '✅ WhatsApp' : '— WhatsApp' }}
                </button>
              @endif

              <a class="btn-primary" href="{{ route('admin.repairs.show', $r) }}">Ver</a>

              <a class="btn-outline col-span-2" href="{{ route('admin.repairs.print', $r) }}" target="_blank" rel="noopener">
                🖨️ Imprimir orden
              </a>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    {{-- Desktop table --}}
    <div class="mt-6 hidden md:block card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-100">
            <tr class="text-left">
              <th class="px-4 py-3 font-semibold text-zinc-700">Código</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Cliente</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Equipo</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">Estado</th>
              <th class="px-4 py-3 font-semibold text-zinc-700">WA</th>
              <th class="px-4 py-3 font-semibold text-zinc-700 text-right">Final</th>
              <th class="px-4 py-3 font-semibold text-zinc-700 text-right">Saldo</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody class="divide-y divide-zinc-100">
            @foreach($repairs as $r)
              @php
                $waOk = !empty($r->wa_notified_current);
                $waAt = $r->wa_notified_at ? \Illuminate\Support\Carbon::parse($r->wa_notified_at)->format('d/m H:i') : null;

                $canWa = !empty($r->wa_url) && !empty($r->wa_log_url);
                $showWaBtn = $canWa && !$waOk;

                $device = trim(($r->device_brand ?? '').' '.($r->device_model ?? ''));
                $code = $r->code ?? ('#'.$r->id);
              @endphp

              <tr class="hover:bg-zinc-50/70">
                <td class="px-4 py-3">
                  <div class="font-extrabold text-zinc-900">{{ $code }}</div>
                  <div class="text-xs text-zinc-500">{{ $r->created_at?->format('d/m/Y H:i') ?? '—' }}</div>
                </td>

                <td class="px-4 py-3">
                  <div class="font-semibold text-zinc-900">{{ $r->customer_name }}</div>
                  <div class="text-xs text-zinc-500">{{ $r->customer_phone }}</div>
                </td>

                <td class="px-4 py-3">
                  <div class="text-zinc-900">{{ $device ?: '—' }}</div>
                  <div class="text-xs text-zinc-500 line-clamp-1">{{ $r->issue_reported }}</div>
                </td>

                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="{{ $statusBadge($r->status) }}">{{ $statuses[$r->status] ?? $r->status }}</span>
                    @if($r->in_warranty ?? false)
                      <span class="badge badge-emerald">Garantía</span>
                    @elseif(!empty($r->warranty_expires_at))
                      <span class="badge badge-rose">Vencida</span>
                    @endif
                  </div>
                </td>

                <td class="px-4 py-3">
                  <div id="wa-pill-{{ $r->id }}" class="{{ $waBadge($waOk) }}">
                    {{ $waOk ? ('✅ Avisado'.($waAt ? ' · '.$waAt : '')) : '🟡 Pendiente' }}
                  </div>
                </td>

                <td class="px-4 py-3 text-right font-extrabold text-zinc-900">
                  {{ $r->final_price !== null ? $money($r->final_price) : '—' }}
                </td>

                <td class="px-4 py-3 text-right font-semibold text-zinc-800">
                  {{ $money($r->balance_due ?? 0) }}
                </td>

                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-2">
                    @if($showWaBtn)
                      <a id="wa-btn-{{ $r->id }}"
                         class="btn-outline"
                         href="{{ $r->wa_url }}"
                         target="_blank"
                         rel="noopener"
                         onclick="waQuickLog('{{ $r->id }}','{{ $r->wa_log_url }}')">
                        💬
                      </a>
                    @else
                      <span class="btn-outline opacity-60 select-none" title="{{ $waOk ? 'Ya avisado' : 'No disponible' }}">—</span>
                    @endif

                    <a class="btn-primary" href="{{ route('admin.repairs.show', $r) }}">Ver</a>
                    <a class="btn-outline" href="{{ route('admin.repairs.print', $r) }}" target="_blank" rel="noopener">Imprimir</a>
                  </div>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4">
      {{ $repairs->links() }}
    </div>
  @endif
</div>

<script>
  function waQuickLog(repairId, logUrl) {
    const token = @json(csrf_token());

    fetch(logUrl, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source: 'list_quick' }),
      keepalive: true
    })
    .then(r => r.json().catch(() => null))
    .then(data => {
      if (!data || !data.ok) return;

      const pill = document.getElementById('wa-pill-' + repairId);
      if (pill) {
        pill.className = 'badge badge-emerald';
        pill.textContent = '✅ Avisado';
      }

      const btn = document.getElementById('wa-btn-' + repairId);
      if (btn) {
        btn.classList.add('opacity-60');
        btn.setAttribute('aria-disabled', 'true');
      }
    })
    .catch(() => {});
  }
</script>
@endsection

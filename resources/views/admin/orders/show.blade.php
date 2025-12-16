@extends('layouts.app')

@section('title', 'Admin — Pedido #' . $order->id)

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusMap = $statuses ?? [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado'     => 'Entregado',
    'cancelado'     => 'Cancelado',
  ];

  $paymentMap = \App\Models\Order::PAYMENT_METHODS;

  $badge = function(string $st) {
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

  $status = (string)($order->status ?? 'pendiente');
  $isCanceled = ($status === 'cancelado');

  $steps = [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo',
    'entregado'     => 'Entregado',
  ];

  $stepKeys = array_keys($steps);
  $currentIndex = array_search($status, $stepKeys, true);
  if ($currentIndex === false) $currentIndex = 0;

  $customerName = $order->pickup_name ?: ($order->user?->name ?? '—');
  $customerEmail = $order->user?->email ?? '—';
  $customerPhoneRaw = (string)($order->pickup_phone ?? '');

  $histories = $order->statusHistories ?? collect();
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  {{-- Header --}}
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div class="text-xs text-zinc-500">
        <a href="{{ route('admin.orders.index') }}" class="font-semibold hover:text-zinc-700">Pedidos</a>
        <span class="text-zinc-300">/</span>
        <span>Pedido #{{ $order->id }}</span>
      </div>

      <div class="mt-1 flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-black tracking-tight">Pedido #{{ $order->id }}</h1>
        <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($status) }}">
          {{ $statusMap[$status] ?? $status }}
        </span>
      </div>

      <p class="mt-1 text-sm text-zinc-600">
        {{ $order->created_at?->format('d/m/Y H:i') }}
        <span class="text-zinc-400">·</span>
        Total: <span class="font-black text-zinc-900">{{ $money($order->total) }}</span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.orders.index') }}"
         class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
        Volver
      </a>

      <a href="{{ route('admin.orders_whatsapp_templates.index') }}"
         class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
        Plantillas WA (Pedidos)
      </a>
    </div>
  </div>

  {{-- Stepper --}}
  <div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <div class="text-sm font-black">Progreso del pedido</div>
      @if($isCanceled)
        <span class="text-xs font-bold text-rose-700">Estado final: Cancelado</span>
      @else
        <span class="text-xs text-zinc-500">Basado en el estado actual</span>
      @endif
    </div>

    <div class="mt-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        @foreach($steps as $k => $label)
          @php
            $i = array_search($k, $stepKeys, true);
            $done = (!$isCanceled && $i !== false && $i < $currentIndex);
            $current = (!$isCanceled && $i !== false && $i === $currentIndex);

            $dot = $done ? 'bg-emerald-600' : ($current ? 'bg-zinc-900' : 'bg-zinc-200');
            $text = $done ? 'text-emerald-700' : ($current ? 'text-zinc-900' : 'text-zinc-500');
          @endphp

          <div class="flex items-center gap-3">
            <div class="h-3 w-3 rounded-full {{ $dot }}"></div>
            <div class="text-sm font-bold {{ $text }}">{{ $label }}</div>
          </div>

          @if(!$loop->last)
            <div class="hidden sm:block flex-1 h-px bg-zinc-200 mx-3"></div>
          @endif
        @endforeach
      </div>

      @if($isCanceled)
        <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Este pedido fue marcado como <span class="font-black">cancelado</span>.
        </div>
      @endif
    </div>
  </div>

  <div class="mt-5 grid gap-4 lg:grid-cols-3">
    {{-- LEFT --}}
    <div class="space-y-4 lg:col-span-1">
      {{-- Cliente --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Cliente</div>

        <div class="mt-3 text-sm text-zinc-700 space-y-2">
          <div class="flex justify-between gap-3">
            <span class="text-zinc-500">Nombre</span>
            <span class="font-semibold text-zinc-900">{{ $customerName }}</span>
          </div>

          <div class="flex justify-between gap-3">
            <span class="text-zinc-500">Teléfono</span>
            <span class="font-semibold text-zinc-900">{{ $customerPhoneRaw ?: '—' }}</span>
          </div>

          <div class="flex justify-between gap-3">
            <span class="text-zinc-500">Email</span>
            <span class="font-semibold text-zinc-900">{{ $customerEmail }}</span>
          </div>

          <div class="flex justify-between gap-3">
            <span class="text-zinc-500">Pago</span>
            <span class="font-semibold text-zinc-900">
              {{ $paymentMap[$order->payment_method] ?? ($order->payment_method ?: '—') }}
            </span>
          </div>
        </div>

        @if($order->notes)
          <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
            <div class="text-xs font-bold text-zinc-500 uppercase">Notas</div>
            <div class="mt-1 whitespace-pre-wrap">{{ $order->notes }}</div>
          </div>
        @endif
      </div>

      {{-- Cambiar estado --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Cambiar estado</div>

        <form id="statusForm" method="POST" action="{{ route('admin.orders.updateStatus', $order) }}" class="mt-3 space-y-3">
          @csrf

          <select id="statusSelect" name="status" required
                  class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            @foreach($statusMap as $k => $label)
              <option value="{{ $k }}" @selected($status === $k)>{{ $label }}</option>
            @endforeach
          </select>

          <textarea name="comment" rows="3" placeholder="Comentario interno (opcional)"
                    class="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"></textarea>

          <button class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Guardar
          </button>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <button type="button" class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                    onclick="setStatusAndSubmit('confirmado')">
              Confirmar
            </button>
            <button type="button" class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                    onclick="setStatusAndSubmit('preparando')">
              Preparando
            </button>
            <button type="button" class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                    onclick="setStatusAndSubmit('listo_retirar')">
              Listo retirar
            </button>
            <button type="button" class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                    onclick="setStatusAndSubmit('entregado')">
              Entregado
            </button>
          </div>

          <button type="button"
                  class="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
                  onclick="setStatusAndSubmit('cancelado')">
            Cancelar pedido
          </button>
        </form>
      </div>

      {{-- WhatsApp --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-sm font-black">WhatsApp</div>
            <div class="text-sm text-zinc-600">
              Estado actual: <span class="font-semibold">{{ $statusMap[$status] ?? $status }}</span>
              @if($waNotifiedAt)
                <span class="text-zinc-400">·</span> Último registro: <span class="font-semibold">{{ \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('d/m/Y H:i') }}</span>
              @endif
            </div>
          </div>

          <div class="flex gap-2">
            <button type="button" onclick="navigator.clipboard.writeText(@js($waMessage ?? ''))"
                    class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
              Copiar
            </button>

            @if($waUrl)
              <a id="waOpenBtn" href="{{ $waUrl }}" target="_blank" rel="noopener"
                 class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                 data-log-url="{{ route('admin.orders.whatsappLogAjax', $order) }}">
                Abrir WhatsApp
              </a>
            @endif
          </div>
        </div>

        <div class="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 whitespace-pre-wrap">
          {{ $waMessage }}
        </div>

        <div id="waToast" class="mt-3 hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Registro de WhatsApp guardado ✅
        </div>

        @if($waLogs && $waLogs->count())
          <div class="mt-4">
            <div class="text-xs font-bold text-zinc-500 uppercase">Historial</div>
            <div class="mt-2 space-y-2">
              @foreach($waLogs->take(10) as $log)
                <div class="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="font-semibold">
                      {{ $statusMap[$log->notified_status] ?? $log->notified_status }}
                      <span class="text-zinc-400">·</span> {{ $log->sent_at?->format('d/m/Y H:i') ?? '—' }}
                    </div>
                    <div class="text-xs text-zinc-500">
                      {{ $log->sentBy?->name ?? 'Sistema' }}
                    </div>
                  </div>
                  <div class="mt-2 whitespace-pre-wrap text-xs text-zinc-700">{{ $log->message }}</div>
                </div>
              @endforeach
            </div>
          </div>
        @endif
      </div>
    </div>

    {{-- RIGHT --}}
    <div class="lg:col-span-2 space-y-4">
      {{-- Items --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-black">Items del pedido</div>
          <div class="text-sm font-black">{{ $money($order->total) }}</div>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th class="px-3 py-2 text-left">Producto</th>
                <th class="px-3 py-2 text-right">Precio</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100">
              @forelse($order->items as $it)
                <tr class="hover:bg-zinc-50/70">
                  <td class="px-3 py-2">
                    <div class="font-semibold text-zinc-900">{{ $it->product_name }}</div>
                    <div class="text-xs text-zinc-500">ID producto: {{ $it->product_id }}</div>
                  </td>
                  <td class="px-3 py-2 text-right">{{ $money($it->price) }}</td>
                  <td class="px-3 py-2 text-right font-semibold">{{ (int)$it->quantity }}</td>
                  <td class="px-3 py-2 text-right font-black">{{ $money($it->subtotal) }}</td>
                </tr>
              @empty
                <tr>
                  <td colspan="4" class="px-3 py-6 text-center text-zinc-500">Pedido sin items.</td>
                </tr>
              @endforelse
            </tbody>
          </table>
        </div>

        <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Total</span>
            <span class="font-black">{{ $money($order->total) }}</span>
          </div>
        </div>
      </div>

      {{-- Historial de estados --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-black">Historial de estados</div>
          <div class="text-xs text-zinc-500">{{ $histories->count() }} cambios</div>
        </div>

        @if($histories->isEmpty())
          <div class="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Todavía no hay historial guardado para este pedido.
          </div>
        @else
          <div class="mt-4 space-y-3">
            @foreach($histories as $h)
              @php
                $from = $h->from_status ?: '—';
                $to = $h->to_status ?: '—';
                $who = $h->changer?->name ?: ($h->changer?->email ?: 'Sistema');
              @endphp

              <div class="rounded-2xl border border-zinc-200 bg-white p-4">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div class="text-sm">
                    <div class="font-black text-zinc-900">
                      {{ $statusMap[$to] ?? $to }}
                      <span class="text-zinc-400">·</span>
                      <span class="text-xs text-zinc-500">por {{ $who }}</span>
                    </div>

                    <div class="mt-1 text-xs text-zinc-500">
                      {{ $h->changed_at?->format('d/m/Y H:i') }}
                      @if($h->from_status)
                        <span class="text-zinc-300">·</span>
                        {{ $statusMap[$from] ?? $from }} → {{ $statusMap[$to] ?? $to }}
                      @endif
                    </div>

                    @if($h->comment)
                      <div class="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 whitespace-pre-wrap">
                        {{ $h->comment }}
                      </div>
                    @endif
                  </div>

                  <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($to) }}">
                    {{ $statusMap[$to] ?? $to }}
                  </span>
                </div>
              </div>
            @endforeach
          </div>
        @endif
      </div>
    </div>
  </div>
</div>

<script>
  function setStatusAndSubmit(status) {
    const select = document.getElementById('statusSelect');
    const form = document.getElementById('statusForm');
    if (!select || !form) return;
    select.value = status;
    form.submit();
  }

  // Log automático por AJAX al abrir WhatsApp (sin recargar)
  (function () {
    const btn = document.getElementById('waOpenBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-log-url');
      if (!url) return;

      fetch(url, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': @js(csrf_token()),
          'Accept': 'application/json'
        },
        body: new URLSearchParams()
      })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(() => {
        const toast = document.getElementById('waToast');
        if (!toast) return;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2500);
      })
      .catch(() => {});
    });
  })();
</script>
@endsection

@extends('layouts.app')

@section('title', 'Admin — Pedido #' . $order->id)

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

  $paymentMap = [
    'local'         => 'Pago en el local',
    'mercado_pago'  => 'Mercado Pago',
    'transferencia' => 'Transferencia',
  ];

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

  $customerName = $order->pickup_name ?: ($order->user?->name ?? '—');
  $customerEmail = $order->user?->email ?? '—';
  $customerPhoneRaw = (string)($order->pickup_phone ?? '');

  // Normalización simple para WA (ARG): deja solo dígitos y antepone 54 si no está.
  $digits = preg_replace('/\D+/', '', $customerPhoneRaw);
  $waPhone = $digits;
  if ($waPhone && !str_starts_with($waPhone, '54')) {
    $waPhone = '54' . $waPhone;
  }

  // Mensaje sugerido según estado
  $brand = 'NicoReparaciones';
  $status = (string)($order->status ?? 'pendiente');

  $msg = match($status) {
    'pendiente' =>
      "Hola {$customerName}! 👋\nRecibimos tu pedido #{$order->id} en {$brand}.\nEn breve te confirmamos el estado.\n\nTotal: {$money($order->total)}",
    'confirmado' =>
      "Hola {$customerName}! ✅\nTu pedido #{$order->id} fue confirmado.\nTe avisamos cuando pase a preparación.\n\nTotal: {$money($order->total)}",
    'preparando' =>
      "Hola {$customerName}! 🔧\nEstamos preparando tu pedido #{$order->id}.\nEn breve te avisamos cuando esté listo para retirar.\n\nTotal: {$money($order->total)}",
    'listo_retirar' =>
      "Hola {$customerName}! 🎉\nTu pedido #{$order->id} ya está listo para retirar en el local.\n\nTotal: {$money($order->total)}",
    'entregado' =>
      "Hola {$customerName}! 🙌\nPedido #{$order->id} entregado.\nGracias por tu compra en {$brand}.\n\nTotal: {$money($order->total)}",
    'cancelado' =>
      "Hola {$customerName}.\nTu pedido #{$order->id} fue cancelado.\nSi querés lo revisamos juntos por WhatsApp.\n\n{$brand}",
    default =>
      "Hola {$customerName}! 👋\nTe escribimos por tu pedido #{$order->id}.\n\n{$brand}",
  };

  $msgEncoded = rawurlencode($msg);
  $waLinkWithPhone = $waPhone ? "https://wa.me/{$waPhone}?text={$msgEncoded}" : null;
  $waLinkNoPhone = "https://wa.me/?text={$msgEncoded}";

  // Stepper (sin historial, muestra progreso estimado por estado actual)
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

  $isCanceled = ($status === 'cancelado');
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

      <button type="button"
              class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
              onclick="copyText('orderIdText')">
        Copiar ID
      </button>

      @if($waLinkWithPhone)
        <a href="{{ $waLinkWithPhone }}" target="_blank"
           class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          WhatsApp cliente
        </a>
      @else
        <a href="{{ $waLinkNoPhone }}" target="_blank"
           class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          WhatsApp (elegir contacto)
        </a>
      @endif
    </div>
  </div>

  {{-- Alerts --}}
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

  {{-- Stepper --}}
  <div class="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <div class="text-sm font-black">Progreso del pedido</div>
      @if($isCanceled)
        <span class="text-xs font-bold text-rose-700">Estado final: Cancelado</span>
      @else
        <span class="text-xs text-zinc-500">Vista rápida (sin historial)</span>
      @endif
    </div>

    <div class="mt-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        @foreach($steps as $k => $label)
          @php
            $i = array_search($k, $stepKeys, true);
            $done = (!$isCanceled && $i !== false && $i < $currentIndex);
            $current = (!$isCanceled && $i !== false && $i === $currentIndex);
            $upcoming = (!$isCanceled && $i !== false && $i > $currentIndex);

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

          <button class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Guardar estado
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

      {{-- Mensaje al cliente --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-black">Mensaje sugerido</div>
          <button type="button"
                  class="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                  onclick="copyText('msgBox')">
            Copiar
          </button>
        </div>

        <textarea id="msgBox" rows="7"
                  class="mt-3 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  readonly>{{ $msg }}</textarea>

        <div class="mt-3 grid gap-2">
          @if($waLinkWithPhone)
            <a href="{{ $waLinkWithPhone }}" target="_blank"
               class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 text-center">
              Abrir WhatsApp con cliente
            </a>
          @endif

          <a href="{{ $waLinkNoPhone }}" target="_blank"
             class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 text-center">
            Abrir WhatsApp (sin número)
          </a>

          <div class="text-xs text-zinc-500">
            Nota: si el botón “WhatsApp cliente” no abre el chat, revisá el formato del número (código de país).
          </div>
        </div>
      </div>

      {{-- Texto invisible para copiar ID --}}
      <textarea id="orderIdText" class="sr-only">Pedido #{{ $order->id }}</textarea>
    </div>

    {{-- RIGHT: Items --}}
    <div class="lg:col-span-2">
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
    </div>
  </div>
</div>

<script>
  function copyText(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const text = el.value || el.innerText || el.textContent || '';
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }

    // Fallback
    try {
      el.select();
      document.execCommand('copy');
    } catch (e) {
      window.prompt('Copiá este texto:', text);
    }
  }

  function setStatusAndSubmit(status) {
    const select = document.getElementById('statusSelect');
    const form = document.getElementById('statusForm');
    if (!select || !form) return;
    select.value = status;
    form.submit();
  }
</script>
@endsection

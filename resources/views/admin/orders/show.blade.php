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

  $customerName  = $order->pickup_name ?: ($order->user?->name ?? '—');
  $customerPhone = $order->pickup_phone ?: ($order->user?->phone ?? '—');

  $waUrl          = $waUrl ?? null;
  $waPhone        = $waPhone ?? null;
  $waLastForStatus = $waLastForStatus ?? null;
@endphp

@section('content')
<div class="container-page py-6"
     data-admin-order-card
     data-order-id="{{ $order->id }}"
     data-status="{{ (string)($order->status ?? 'pendiente') }}">

  <div class="flex items-start justify-between gap-4 mb-4">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <a href="{{ route('admin.orders.index') }}" class="btn-ghost">← Volver</a>
        <div class="min-w-0">
          <div class="text-xl font-black text-zinc-900">Pedido #{{ $order->id }}</div>
          <div class="text-sm text-zinc-500">
            Creado {{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}
            @if($order->user)
              · Usuario: <span class="font-semibold">{{ $order->user->email }}</span>
            @endif
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 text-right">
      <div class="inline-flex items-center gap-2 justify-end">
        <span class="{{ $badge($order->status) }}" data-admin-order-status-badge>
          {{ $statusMap[$order->status] ?? $order->status }}
        </span>

        {{-- Botón fijo Estado + dropdown (cambio rápido) --}}
        <div class="dropdown">
          <button
            type="button"
            class="btn-primary btn-sm"
            data-menu="orderStatusMenu-{{ $order->id }}"
            data-admin-order-status-btn
          >
            Estado
          </button>

          <div id="orderStatusMenu-{{ $order->id }}" class="dropdown-menu hidden">
            @foreach($statusMap as $k => $label)
              <button
                type="button"
                class="dropdown-item {{ $k === (string)($order->status ?? 'pendiente') ? 'bg-zinc-100' : '' }}"
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

      <div class="mt-1 text-sm text-zinc-500">Total</div>
      <div class="text-xl font-black text-zinc-900">{{ $money($order->total) }}</div>
    </div>

  </div>

  @if (session('success'))
    <div class="alert-success mb-4">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="alert-error mb-4">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5 font-semibold">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Columna izquierda --}}
    <div class="space-y-4 lg:col-span-1">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Cliente</div>
          <span class="badge-zinc">{{ $order->payment_method ?: '—' }}</span>
        </div>
        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Nombre</span>
              <span class="font-extrabold text-right">{{ $customerName }}</span>
            </div>

            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Teléfono</span>
              <span class="font-extrabold text-right">{{ $customerPhone }}</span>
            </div>

            @if($order->pickup_delegate_name || $order->pickup_delegate_phone)
              <div class="flex items-start justify-between gap-3">
                <span class="text-zinc-500">Retira</span>
                <span class="font-extrabold text-right">
                  {{ $order->pickup_delegate_name ?: '—' }}
                  @if($order->pickup_delegate_phone)
                    <span class="text-zinc-500 font-normal">({{ $order->pickup_delegate_phone }})</span>
                  @endif
                </span>
              </div>
            @endif

            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Email</span>
              <span class="font-extrabold text-right">{{ $order->user?->email ?? '—' }}</span>
            </div>
          </div>

          @if($order->notes)
            <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div class="text-xs font-black uppercase text-zinc-500">Notas</div>
              <div class="mt-1 whitespace-pre-wrap font-semibold text-zinc-800">{{ $order->notes }}</div>
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Actualizar estado</div>
          <span class="{{ $badge($order->status) }}" data-admin-order-status-badge>
            {{ $statusMap[$order->status] ?? $order->status }}
          </span>

        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.orders.updateStatus', $order->id) }}" class="space-y-3">
            @csrf

            <div>
              <label for="status" class="block mb-1">Nuevo estado</label>
              <select id="status" name="status">
                @foreach($statusMap as $k => $label)
                  <option value="{{ $k }}" @selected(old('status', $order->status) === $k)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <div>
              <label for="comment" class="block mb-1">Comentario (opcional)</label>
              <textarea id="comment" name="comment" rows="3" placeholder="Ej: Avisado por WhatsApp, paga al retirar, etc.">{{ old('comment') }}</textarea>
            </div>

            <button class="btn-primary w-full" type="submit">Guardar estado</button>

            <p class="text-xs text-zinc-500">
              Tip: “Listo para retirar” es ideal para avisar al cliente.
            </p>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">WhatsApp</div>
          @if($waLastForStatus)
            <span class="badge-zinc">Último: {{ $waLastForStatus->sent_at?->format('d/m/Y H:i') ?? '—' }}</span>
          @else
            <span class="badge-zinc">Sin log</span>
          @endif
        </div>

        <div class="card-body">
          @if($waUrl)
            <a
              href="{{ $waUrl }}"
              target="_blank"
              rel="noopener"
              class="btn-outline w-full"
              data-admin-order-wa-link
              data-admin-order-wa-open
            >
              Abrir WhatsApp (y registrar log)
            </a>

              {{-- texto oculto para copiar --}}
            <textarea id="nrAdminOrderWaText" class="hidden" readonly data-admin-order-wa-message>{{ $waMessage }}</textarea>

            <button type="button"
                    class="btn-ghost w-full mt-2"
                    data-copy-target="#nrAdminOrderWaText"
                    data-copy-toast="Mensaje copiado ✅">
              Copiar mensaje
            </button>

            <details class="mt-3">
              <summary class="text-xs font-black text-zinc-600 cursor-pointer select-none">
                Ver mensaje
              </summary>
              <textarea readonly rows="8" class="mt-2" data-admin-order-wa-message>{{ $waMessage }}</textarea>
            </details>

            <div class="mt-3 text-xs text-zinc-500">
              Plantillas:
              <a class="underline font-bold"
                href="{{ route('admin.orders_whatsapp_templates.index') }}">
                Editar WhatsApp pedidos
              </a>
            </div>

            <p class="mt-2 text-xs text-zinc-500">
              Se registra el envío (audit). El botón abre WhatsApp en otra pestaña.
            </p>
          @else
            <div class="text-sm text-zinc-600">
              No hay teléfono válido para WhatsApp. Cargá <span class="font-bold">pickup_phone</span> o un teléfono en el usuario.
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Historial</div>
          <span class="badge-zinc">{{ $order->statusHistories?->count() ?? 0 }} cambios</span>
        </div>

        <div class="card-body">
          @if(($order->statusHistories?->count() ?? 0) > 0)
            <ol class="space-y-3">
              @foreach($order->statusHistories as $h)
                <li class="flex items-start gap-3">
                  <span class="mt-2 h-2 w-2 rounded-full bg-sky-500"></span>
                  <div class="min-w-0">
                    <div class="font-extrabold text-zinc-900">
                      {{ $statusMap[$h->from_status] ?? $h->from_status }}
                      →
                      {{ $statusMap[$h->to_status] ?? $h->to_status }}
                    </div>
                    <div class="text-xs text-zinc-500">
                      {{ $h->changed_at?->format('d/m/Y H:i') ?? '—' }}
                      @if($h->changer)
                        · {{ $h->changer->name ?? $h->changer->email }}
                      @endif
                    </div>
                    @if($h->comment)
                      <div class="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">{{ $h->comment }}</div>
                    @endif
                  </div>
                </li>
              @endforeach
            </ol>
          @else
            <div class="text-sm text-zinc-600">Todavía no hay historial registrado.</div>
          @endif
        </div>
      </div>
    </div>

    {{-- Columna derecha: items --}}
    <div class="lg:col-span-2">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Items del pedido</div>
          <div class="font-black">{{ $money($order->total) }}</div>
        </div>

        <div class="card-body">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Cant.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @forelse($order->items as $it)
                  <tr>
                    <td>
                      <div class="font-extrabold">{{ $it->product_name }}</div>
                    </td>
                    <td class="text-right font-semibold">{{ $money($it->price) }}</td>
                    <td class="text-right font-extrabold">{{ (int)$it->quantity }}</td>
                    <td class="text-right font-black">{{ $money($it->subtotal) }}</td>
                  </tr>
                @empty
                  <tr>
                    <td colspan="4" class="py-8 text-center text-zinc-500">Pedido sin items.</td>
                  </tr>
                @endforelse
              </tbody>
            </table>
          </div>

          <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-zinc-600 font-semibold">Total</span>
              <span class="font-black">{{ $money($order->total) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{{-- Toast simple (solo para el log de WhatsApp) --}}
<div id="waToast" class="fixed bottom-4 right-4 z-[80] hidden rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-xl"></div>

<script>
(function () {
  const waBtn = document.querySelector('[data-wa-ajax]');
  if (!waBtn) return;

  const toast = document.getElementById('waToast');
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 1800);
  };

  waBtn.addEventListener('click', () => {
    const url = waBtn.getAttribute('data-wa-ajax');
    if (!url) return;

    fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': '{{ csrf_token() }}',
        'Accept': 'application/json',
      },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(() => showToast('Log de WhatsApp registrado ✅'))
      .catch(() => showToast('No se pudo registrar el log ⚠️'));
  });
})();
</script>
@endsection

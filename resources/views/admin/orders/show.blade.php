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

  $currentStatus = (string)($order->status ?? 'pendiente');
  $allowedStatusTransitions = \App\Models\Order::allowedNextStatuses($currentStatus);

  $isFinal = in_array((string)($order->status ?? ''), ['entregado','cancelado'], true);
  $canQuickDelivered = \App\Models\Order::canTransition($currentStatus, 'entregado');
  $canQuickCancel = \App\Models\Order::canTransition($currentStatus, 'cancelado');
@endphp


@section('content')
<div class="container-page py-6"
     data-admin-order-card
     data-order-id="{{ $order->id }}"
     data-status="{{ (string)($order->status ?? 'pendiente') }}"
     data-admin-order-transitions='@json(\App\Models\Order::TRANSITIONS)'>

  <div class="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div class="min-w-0">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <a href="{{ route('admin.orders.index') }}" class="btn-ghost h-11 w-full justify-center sm:h-auto sm:w-auto">← Volver</a>
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

      <div class="mt-2 flex gap-2 overflow-x-auto pb-1 sm:hidden">
        <a href="#order_actions" class="nav-pill whitespace-nowrap">Acciones</a>
        <a href="#order_customer" class="nav-pill whitespace-nowrap">Cliente</a>
        <a href="#order_items" class="nav-pill whitespace-nowrap">Items</a>
        <a href="#order_whatsapp" class="nav-pill whitespace-nowrap">WhatsApp</a>
      </div>
    </div>

    <div class="w-full rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm lg:w-auto lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:justify-end">
        <a href="{{ route('admin.orders.print', $order->id) }}"
          target="_blank"
          rel="noopener"
          class="btn-outline btn-sm h-11 w-full justify-center lg:h-auto lg:w-auto">
          Imprimir
        </a>

        <a href="{{ route('admin.orders.ticket', $order->id) }}?autoprint=1"
          target="_blank"
          rel="noopener"
          class="btn-outline btn-sm h-11 w-full justify-center lg:h-auto lg:w-auto">
          Ticket
        </a>


        <span class="{{ $badge($order->status) }} inline-flex h-11 w-full items-center justify-center lg:h-auto lg:w-auto" data-admin-order-status-badge>
          {{ $statusMap[$order->status] ?? $order->status }}
        </span>


          {{-- Botón fijo Estado + dropdown (cambio rápido) --}}
          <div class="dropdown w-full lg:w-auto">
            <button
              type="button"
              class="btn-primary btn-sm h-11 w-full justify-center lg:h-auto lg:w-auto {{ $isFinal ? 'opacity-60 cursor-not-allowed' : '' }}"
              data-menu="orderStatusMenu-{{ $order->id }}"
              data-admin-order-status-btn
              {{ $isFinal ? 'disabled' : '' }}
            >
              Estado
            </button>


          <div id="orderStatusMenu-{{ $order->id }}" class="dropdown-menu hidden">
            @foreach($statusMap as $k => $label)
              @php
                $isCurrentStatus = ($k === $currentStatus);
                $canPickStatus = $isCurrentStatus || in_array($k, $allowedStatusTransitions, true);
              @endphp
              <button
                type="button"
                class="dropdown-item {{ $isCurrentStatus ? 'bg-zinc-100' : '' }} {{ $canPickStatus ? '' : 'opacity-60 cursor-not-allowed' }}"
                data-admin-order-set-status
                data-status="{{ $k }}"
                @disabled(!$canPickStatus || $isCurrentStatus)
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

      <div class="mt-2 text-sm text-zinc-500 lg:text-right">Total</div>
      <div class="text-xl font-black text-zinc-900 lg:text-right">{{ $money($order->total) }}</div>
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
      

      <div class="card" id="order_actions">
        <div class="card-head">
          <div class="font-black">Acciones rápidas</div>
          <span class="badge-zinc">Pedido #{{ $order->id }}</span>
        </div>

        <div class="card-body space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a class="btn-outline h-11 w-full justify-center"
              href="{{ route('admin.orders.print', $order->id) }}"
              target="_blank"
              rel="noopener">
              Imprimir
            </a>

            <a class="btn-outline h-11 w-full justify-center"
              href="{{ route('admin.orders.ticket', $order->id) }}?autoprint=1"
              target="_blank"
              rel="noopener">
              Ticket
            </a>
          </div>

          @if($waUrl)
            <a class="btn-outline h-11 w-full justify-center"
              href="{{ $waUrl }}"
              target="_blank"
              rel="noopener"
              data-admin-order-wa-open>
              Abrir WhatsApp
            </a>
          @else
            <button type="button" class="btn-outline h-11 w-full justify-center opacity-50" disabled>
              WhatsApp (sin teléfono)
            </button>
          @endif

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-200">
            <form method="POST" action="{{ route('admin.orders.updateStatus', $order->id) }}"
                  onsubmit="return confirm('¿Marcar como ENTREGADO el pedido #{{ $order->id }}?');">
              @csrf
              <input type="hidden" name="status" value="entregado">
              <input type="hidden" name="comment" value="Acción rápida: marcado como entregado">
              <button class="btn-primary h-11 w-full justify-center {{ ($canQuickDelivered && !$isFinal) ? '' : 'opacity-60 cursor-not-allowed' }}" type="submit" {{ ($canQuickDelivered && !$isFinal) ? '' : 'disabled' }}>
                Marcar entregado
              </button>
            </form>

            <form method="POST" action="{{ route('admin.orders.updateStatus', $order->id) }}"
                  onsubmit="return confirm('¿Cancelar el pedido #{{ $order->id }}? Esto devuelve stock.');">
              @csrf
              <input type="hidden" name="status" value="cancelado">
              <input type="hidden" name="comment" value="Acción rápida: pedido cancelado">
              <button class="btn-outline h-11 w-full justify-center {{ ($canQuickCancel && !$isFinal) ? '' : 'opacity-60 cursor-not-allowed' }}" type="submit" {{ ($canQuickCancel && !$isFinal) ? '' : 'disabled' }}>
                Cancelar pedido
              </button>
            </form>
          </div>

          @if($isFinal)
            <p class="text-xs text-zinc-500">
              Este pedido ya está en un estado final (entregado/cancelado).
            </p>
          @endif
        </div>
      </div>

      <div class="card" id="order_customer">
        <div class="card-head">
          <div class="font-black">Cliente</div>
          <span class="badge-zinc">{{ $order->payment_method ?: '—' }}</span>
        </div>
        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Nombre</span>
              <span class="font-extrabold text-right">{{ $customerName }}</span>
            </div>

            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Teléfono</span>
              <span class="font-extrabold text-right">{{ $customerPhone ?: '—' }}</span>
            </div>

            @if($order->pickup_delegate_name || $order->pickup_delegate_phone)
              <div class="pt-2 border-t border-zinc-200">
                <div class="text-xs font-black text-zinc-700">Retira otra persona</div>
                <div class="mt-2 space-y-1">
                  @if($order->pickup_delegate_name)
                    <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span class="text-zinc-500">Nombre</span>
                      <span class="font-extrabold text-right">{{ $order->pickup_delegate_name }}</span>
                    </div>
                  @endif
                  @if($order->pickup_delegate_phone)
                    <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span class="text-zinc-500">Teléfono</span>
                      <span class="font-extrabold text-right">{{ $order->pickup_delegate_phone }}</span>
                    </div>
                  @endif
                </div>
              </div>
            @endif

            @if($order->notes)
              <div class="pt-2 border-t border-zinc-200">
                <div class="text-xs font-black text-zinc-700">Notas</div>
                <div class="mt-1 text-sm text-zinc-700 whitespace-pre-line">{{ $order->notes }}</div>
              </div>
            @endif
          </div>
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
              <label class="label">Estado</label>
              <select name="status" class="h-11 w-full">
                @foreach($statusMap as $key => $label)
                  @php
                    $isCurrentOption = ($key === $currentStatus);
                    $canPickOption = $isCurrentOption || in_array($key, $allowedStatusTransitions, true);
                  @endphp
                  <option value="{{ $key }}" @selected(old('status', $order->status) === $key) @disabled(!$canPickOption)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <div>
              <label class="label">Comentario (opcional)</label>
              <input type="text" name="comment" placeholder="Ej: listo para retirar" class="h-11" />
            </div>

            <button class="btn-primary h-11 w-full justify-center" type="submit">Guardar estado</button>
          </form>
        </div>
      </div>

      <div class="card" id="order_whatsapp">
        <div class="card-head">
          <div class="font-black">WhatsApp</div>
          <span class="badge-zinc">{{ $waPhone ?: '—' }}</span>
        </div>

        <div class="card-body space-y-3">
          <div class="text-sm text-zinc-700">
            <div class="text-xs text-zinc-500 font-black mb-1">Mensaje</div>
            <div class="whitespace-pre-line leading-relaxed">{{ $waMessage ?: '—' }}</div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            @if($waUrl)
              <a class="btn-outline h-11 w-full justify-center"
                href="{{ $waUrl }}"
                target="_blank"
                rel="noopener"
                data-admin-order-wa-open>
                Abrir WhatsApp
              </a>
            @else
              <button type="button" class="btn-outline h-11 w-full justify-center opacity-50" disabled>
                Sin teléfono
              </button>
            @endif

            <form method="POST" action="{{ route('admin.orders.whatsappLog', $order->id) }}"
                  class="space-y-0"
                  data-admin-order-wa-log
                  data-wa-log-url="{{ route('admin.orders.whatsappLogAjax', $order->id) }}"
                  data-wa-phone="{{ $waPhone }}"
                  data-wa-message="{{ $waMessage }}">
              @csrf
              <button class="btn-primary h-11 w-full justify-center" type="submit" {{ $waUrl ? '' : 'disabled' }}>
                Marcar como enviado
              </button>
            </form>
          </div>

          <div>
            <div class="text-xs text-zinc-500 font-black mb-2">Historial de envíos</div>

            <div class="space-y-2">
              @if($waLogs->count())
                <ol class="space-y-2">
                  @foreach($waLogs as $log)
                    <li class="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                      <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div class="text-xs font-black text-zinc-900">
                          {{ $statusMap[$log->notified_status] ?? $log->notified_status }}
                        </div>
                        <div class="text-xs text-zinc-500">
                          {{ optional($log->sent_at)->format('d/m/Y H:i') }}
                        </div>
                      </div>

                      <div class="mt-1 text-xs text-zinc-600">
                        <span class="font-bold">Tel:</span> {{ $log->phone }}
                        @if($log->sent_by)
                          <span class="text-zinc-300">•</span>
                          <span class="font-bold">Por:</span> {{ $log->sent_by?->name ?? '—' }}
                        @endif
                      </div>

                      @if($log->message)
                        <div class="mt-2 text-xs text-zinc-700 whitespace-pre-line">
                          {{ $log->message }}
                        </div>
                      @endif
                    </li>
                  @endforeach
                </ol>
              @else
                <div class="text-sm text-zinc-500">Sin envíos registrados para este pedido.</div>
              @endif
            </div>
          </div>
        </div>
      </div>
    </div>

    {{-- Columna derecha: items --}}
    <div class="lg:col-span-2" id="order_items">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Items del pedido</div>
          <div class="font-black">{{ $money($order->total) }}</div>
        </div>

        <div class="card-body">
          <div class="space-y-2 md:hidden">
            @forelse($order->items as $it)
              <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div class="font-extrabold text-zinc-900">{{ $it->product_name }}</div>
                <div class="mt-2 grid grid-cols-3 gap-2 text-xs text-zinc-600">
                  <div>
                    <div class="font-black uppercase text-zinc-500">Precio</div>
                    <div class="mt-0.5 font-semibold text-zinc-900">{{ $money($it->price) }}</div>
                  </div>
                  <div>
                    <div class="font-black uppercase text-zinc-500">Cant.</div>
                    <div class="mt-0.5 font-extrabold text-zinc-900">{{ (int)$it->quantity }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-black uppercase text-zinc-500">Subtotal</div>
                    <div class="mt-0.5 font-black text-zinc-900">{{ $money($it->subtotal) }}</div>
                  </div>
                </div>
              </div>
            @empty
              <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                Pedido sin items.
              </div>
            @endforelse
          </div>

          <div class="table-wrap hidden md:block">
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

<div data-react-order-show-whatsapp-log data-root-selector="#order_whatsapp"></div>
@endsection

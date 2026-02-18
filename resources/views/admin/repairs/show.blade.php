@extends('layouts.app')

@section('title', 'Admin — Reparación ' . ($repair->code ?? ''))

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusKey = (string)($repair->status ?? '');
  $statusLabel = $statuses[$statusKey] ?? ($statusKey !== '' ? $statusKey : '—');
  $currentStatus = (string)($repair->status ?? 'received');
  $allowedStatusTransitions = \App\Models\Repair::allowedNextStatuses($currentStatus);

  $device = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
  $device = $device !== '' ? $device : null;

  // ✅ IMPORTANTE: tolera null (evita TypeError)
  $badge = function($st) {
    $st = (string)($st ?? '');
    return match($st) {
      'received'         => 'badge-sky',
      'diagnosing'       => 'badge-indigo',
      'waiting_approval' => 'badge-amber',
      'repairing'        => 'badge-indigo',
      'ready_pickup'     => 'badge-emerald',
      'delivered'        => 'badge-zinc',
      'cancelled'        => 'badge-rose',
      default            => 'badge-zinc',
    };
  };

  $final = (float)($repair->final_price ?? 0);
  $paid  = (float)($repair->paid_amount ?? 0);
  $due   = max(0, $final - $paid);

  $wExp = null;
  if ($repair->delivered_at && (int)($repair->warranty_days ?? 0) > 0) {
    $wExp = $repair->delivered_at->copy()->addDays((int)$repair->warranty_days);
  }
  $wActive = $wExp ? now()->lte($wExp) : false;
@endphp

@section('content')
<div class="container-page store-shell">
  <div class="page-head store-hero reveal-item">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="page-title">{{ $repair->code ?? '—' }}</h1>
        <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>

        @if($repair->delivered_at && $wExp)
          <span class="{{ $wActive ? 'badge-emerald' : 'badge-rose' }}">
            Garantía {{ $wActive ? 'vigente' : 'vencida' }} ({{ $wExp->format('d/m/Y') }})
          </span>
        @endif
        @if($repair->refunded_total)
          <span class="badge-rose">Reembolsada {{ $money((int)($repair->refunded_amount ?? 0)) }}</span>
        @endif
      </div>

      <p class="page-subtitle mt-1">
        <span class="font-extrabold">{{ $repair->customer_name ?? '—' }}</span>
        <span class="text-zinc-400">·</span>
        <span class="font-semibold">{{ $repair->customer_phone ?? '—' }}</span>
        <span class="text-zinc-400">·</span>
        <span>{{ $device ?: '—' }}</span>
      </p>

      <div class="mt-2 flex gap-2 overflow-x-auto pb-1 sm:hidden">
        <a href="#repair_actions" class="nav-pill whitespace-nowrap">Acciones</a>
        <a href="#repair_summary" class="nav-pill whitespace-nowrap">Resumen</a>
        <a href="#repair_status" class="nav-pill whitespace-nowrap">Estado</a>
        <a href="#repair_edit" class="nav-pill whitespace-nowrap">Editar</a>
      </div>
    </div>

    <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
      <a href="{{ route('admin.repairs.index') }}" class="btn-ghost btn-sm h-11 w-full justify-center sm:h-auto sm:w-auto">Volver</a>
      <a href="{{ route('admin.warranty_incidents.create', ['repair_id' => $repair->id]) }}" class="btn-outline btn-sm h-11 w-full justify-center sm:h-auto sm:w-auto">Registrar garantia</a>
      <a href="{{ route('admin.repairs.print', $repair) }}" class="btn-outline btn-sm h-11 w-full justify-center sm:h-auto sm:w-auto" target="_blank" rel="noopener">Imprimir</a>
      <a href="{{ route('admin.repairs.ticket', $repair) }}" class="btn-outline btn-sm h-11 w-full justify-center sm:h-auto sm:w-auto" target="_blank" rel="noopener">Ticket</a>


      @if(!empty($waUrl))
        <a href="{{ $waUrl }}" class="btn-primary btn-sm h-11 w-full justify-center sm:h-auto sm:w-auto" target="_blank" rel="noopener"
           data-wa-open
           data-wa-ajax="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
          WhatsApp
        </a>
      @endif
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

  {{-- WA toast --}}
  <div id="waToast"
       class="fixed left-1/2 top-4 z-50 hidden -translate-x-1/2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-900 shadow-lg
              opacity-0 translate-y-[-6px] transition-all duration-200">
    Listo.
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Columna izquierda: resumen + estado + whatsapp --}}
    <div class="space-y-4 lg:col-span-1">
      @php
        $isFinal = in_array((string)$repair->status, ['delivered','cancelled'], true);
        $canQuickDelivered = \App\Models\Repair::canTransition($currentStatus, 'delivered');
        $canQuickCancel = \App\Models\Repair::canTransition($currentStatus, 'cancelled');
      @endphp

      {{-- Acciones rápidas --}}
      <div class="card reveal-item" id="repair_actions">
        <div class="card-head">
          <div class="font-black">Acciones rápidas</div>
          <span class="badge-zinc">{{ $repair->code ?? '—' }}</span>
        </div>

        <div class="card-body space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a class="btn-outline h-11 w-full justify-center"
              href="{{ route('admin.repairs.print', $repair) }}"
              target="_blank"
              rel="noopener">
              Imprimir
            </a>

            <a class="btn-outline h-11 w-full justify-center"
              href="{{ route('admin.repairs.ticket', $repair) }}?autoprint=1"
              target="_blank"
              rel="noopener">
              Ticket
            </a>
          </div>

          @if(!empty($waUrl))
            <a href="{{ $waUrl }}" class="btn-outline h-11 w-full justify-center" target="_blank" rel="noopener"
              data-wa-open
              data-wa-ajax="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
              Abrir WhatsApp
            </a>
          @else
            <button type="button" class="btn-outline h-11 w-full justify-center opacity-50" disabled>
              WhatsApp (sin teléfono)
            </button>
          @endif

          @if(!empty($approvalUrl))
            <div class="rounded-2xl border border-sky-200 bg-sky-50 p-3">
              <div class="text-xs font-black uppercase text-sky-700">Aprobación cliente</div>
              <div class="mt-1 text-xs text-sky-900">Link firmado válido por 7 días.</div>

              <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input type="text" readonly value="{{ $approvalUrl }}" class="h-11 text-xs font-semibold" onclick="this.select()">
                <a href="{{ $approvalUrl }}" target="_blank" rel="noopener" class="btn-outline h-11 w-full justify-center sm:w-auto">
                  Abrir
                </a>
              </div>
            </div>
          @endif

          <div class="pt-2 border-t border-zinc-200">
            <button type="button"
              class="btn-ghost btn-sm h-10 w-full justify-center"
              data-toggle-collapse="repair_quick_status"
              data-toggle-collapse-label="acciones de estado"
              aria-expanded="false">Ver acciones de estado</button>

            <div class="mt-2 hidden" data-collapse="repair_quick_status">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" data-disable-on-submit
                      onsubmit="return confirm('¿Marcar como ENTREGADA la reparación {{ $repair->code ?? '' }}?');">
                  @csrf
                  <input type="hidden" name="status" value="delivered">
                  <input type="hidden" name="comment" value="Acción rápida: marcada como entregada">
                  <button class="btn-primary h-11 w-full justify-center {{ ($canQuickDelivered && !$isFinal) ? '' : 'opacity-60 cursor-not-allowed' }}" type="submit" {{ ($canQuickDelivered && !$isFinal) ? '' : 'disabled' }}>
                    Marcar entregada
                  </button>
                </form>

                <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" data-disable-on-submit
                      onsubmit="return confirm('¿Cancelar la reparación {{ $repair->code ?? '' }}?');">
                  @csrf
                  <input type="hidden" name="status" value="cancelled">
                  <input type="hidden" name="comment" value="Acción rápida: reparación cancelada">
                  <button class="btn-outline h-11 w-full justify-center {{ ($canQuickCancel && !$isFinal) ? '' : 'opacity-60 cursor-not-allowed' }}" type="submit" {{ ($canQuickCancel && !$isFinal) ? '' : 'disabled' }}>
                    Cancelar
                  </button>
                </form>
              </div>

              @if($isFinal)
                <p class="text-xs text-zinc-500 mt-2">
                  Esta reparación ya está en un estado final (entregada/cancelada).
                </p>
              @endif
            </div>
          </div>

          <div class="pt-2 border-t border-zinc-200">
            <button type="button"
              class="btn-ghost btn-sm h-10 w-full justify-center"
              data-toggle-collapse="repair_refund_total"
              data-toggle-collapse-label="reembolso total"
              aria-expanded="false">
              {{ $repair->refunded_total ? 'Ver reembolso registrado' : 'Registrar reembolso total' }}
            </button>

            <div class="mt-2 hidden" data-collapse="repair_refund_total">
              @if($repair->refunded_total)
                <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm">
                  <div class="font-black text-rose-800">Reembolso ya aplicado</div>
                  <div class="mt-1 text-rose-900">Monto: {{ $money((int)($repair->refunded_amount ?? 0)) }}</div>
                  <div class="mt-1 text-rose-900">Motivo: {{ $repair->refund_reason ?: '-' }}</div>
                  <div class="mt-1 text-rose-900">Fecha: {{ $repair->refunded_at?->format('d/m/Y H:i') ?: '-' }}</div>
                </div>
              @else
                <form method="POST" action="{{ route('admin.repairs.refundTotal', $repair) }}" class="space-y-2" data-disable-on-submit
                      onsubmit="return confirm('Se registrara un reembolso total y una perdida en garantias. ¿Continuar?');">
                  @csrf
                  <div>
                    <label for="refund_reason" class="block mb-1 text-sm">Motivo *</label>
                    <input id="refund_reason" name="refund_reason" class="h-11" required
                           value="{{ old('refund_reason') }}" placeholder="Ej: no se consigue el modulo / falla recurrente">
                  </div>
                  <div>
                    <label for="refunded_amount" class="block mb-1 text-sm">Monto a devolver *</label>
                    <input id="refunded_amount" name="refunded_amount" class="h-11" inputmode="numeric" required
                           value="{{ old('refunded_amount', (int)($repair->final_price ?? 0)) }}">
                  </div>
                  <div>
                    <label for="refund_notes" class="block mb-1 text-sm">Notas (opcional)</label>
                    <textarea id="refund_notes" name="notes" rows="2" placeholder="Detalle interno para auditoria">{{ old('notes') }}</textarea>
                  </div>
                  <button class="btn-outline h-11 w-full justify-center text-rose-700 border-rose-300" type="submit">
                    Confirmar reembolso total
                  </button>
                </form>
              @endif
            </div>
          </div>

        </div>
      </div>

      <div class="card reveal-item" id="repair_summary">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-zinc">Código: {{ $repair->code ?? '—' }}</span>
        </div>

        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Recibido</span>
              <span class="font-extrabold text-right">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Entregado</span>
              <span class="font-extrabold text-right">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Precio final</span>
              <span class="font-black text-right">{{ $money($final) }}</span>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Pagado</span>
              <span class="font-black text-right">{{ $money($paid) }}</span>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Debe</span>
              <span class="{{ $due > 0 ? 'font-black text-rose-700' : 'font-black text-emerald-700' }} text-right">
                {{ $money($due) }}
              </span>
            </div>
            <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <span class="text-zinc-500">Reembolso total</span>
              <span class="{{ $repair->refunded_total ? 'font-black text-rose-700' : 'font-black text-zinc-600' }} text-right">
                {{ $repair->refunded_total ? $money((int)($repair->refunded_amount ?? 0)) : 'No' }}
              </span>
            </div>

            <div class="pt-2 border-t border-zinc-100">
              <div class="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <span class="text-zinc-500">Usuario asociado</span>
                <span class="font-extrabold text-right">{{ $linkedUserEmail ?? '—' }}</span>
              </div>
            </div>
          </div>

          @if(!empty($repair->notes))
            <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div class="text-xs font-black uppercase text-zinc-500">Notas internas</div>
              <div class="mt-1 whitespace-pre-wrap font-semibold text-zinc-800">{{ $repair->notes }}</div>
            </div>
          @endif
        </div>
      </div>

      <div class="card reveal-item" id="repair_status">
        <div class="card-head">
          <div class="font-black">Cambiar estado</div>
          <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>
          
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" data-disable-on-submit class="space-y-3">
            @csrf

            <div>
              <label for="status" class="block mb-1">Nuevo estado</label>
              <select id="status" name="status" class="h-11" @disabled($isFinal)>
                @foreach($statuses as $k => $label)
                  @php
                    $isCurrentOption = ($k === $currentStatus);
                    $canPickOption = $isCurrentOption || in_array($k, $allowedStatusTransitions, true);
                  @endphp
                  <option value="{{ $k }}" @selected(old('status', $repair->status) === $k) @disabled(!$canPickOption)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <button class="btn-primary h-11 w-full justify-center" @disabled($isFinal)>Guardar estado</button>

            @if($isFinal)
              <p class="text-xs text-zinc-500 mt-2">
                Este estado es final y no puede modificarse.
              </p>
            @endif

            <p class="text-xs text-zinc-500">
              Si marcás “Entregado”, la garantía (si tiene días) se calcula desde la fecha de entrega.
            </p>
          </form>
        </div>
      </div>

      <div class="card reveal-item">
        <div class="card-head">
          <div class="font-black">Historial</div>

          <div class="flex items-center gap-2">
            <span class="badge-zinc">{{ $history->count() }} cambios</span>
            <button type="button"
            class="btn-ghost btn-sm h-10"
            data-toggle-collapse="repair_history"
            data-toggle-collapse-label="historial"
            aria-expanded="false">Ver historial</button>

          </div>
        </div>

        <div class="card-body hidden" data-collapse="repair_history">
          @if($history->count())
            <ol class="space-y-3">
              @foreach($history as $h)
                <li class="flex items-start gap-3">
                  <div class="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-300"></div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="{{ $badge($h->status) }}">{{ $statuses[(string)($h->status ?? '')] ?? ((string)($h->status ?? '—')) }}</span>
                      <span class="text-xs text-zinc-500 font-semibold">
                        {{ $h->created_at?->format('d/m/Y H:i') ?? '—' }}
                      </span>
                    </div>
                    @if(!empty($h->note))
                      <div class="mt-1 text-sm font-semibold text-zinc-800 whitespace-pre-wrap">{{ $h->note }}</div>
                    @endif
                  </div>
                </li>
              @endforeach
            </ol>
          @else
            <div class="text-sm text-zinc-500">Sin historial aún.</div>
          @endif
        </div>
      </div>


      {{-- Logs de WhatsApp --}}
      <div class="card reveal-item">
        <div class="card-head">
          <div class="font-black">Logs WhatsApp</div>

          <div class="flex items-center gap-2">
            <span class="badge-zinc">{{ $waLogs->count() }}</span>
            <button type="button"
            class="btn-ghost btn-sm h-10"
            data-toggle-collapse="repair_wa_logs"
            data-toggle-collapse-label="logs"
            aria-expanded="false">Ver logs</button>

          </div>
        </div>

        <div class="card-body hidden" data-collapse="repair_wa_logs">
          @if($waLogs->count())
            <div class="space-y-2 text-sm">
              @foreach($waLogs as $l)
                <div class="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3">
                  <div class="min-w-0">
                    <div class="font-extrabold text-zinc-900">
                      {{ $statuses[(string)($l->notified_status ?? '')] ?? ((string)($l->notified_status ?? '—')) }}
                    </div>
                    <div class="text-xs text-zinc-500 font-semibold">
                      {{ $l->sent_at?->format('d/m/Y H:i') ?? ($l->created_at?->format('d/m/Y H:i') ?? '—') }}
                    </div>
                  </div>
                  <span class="badge-zinc">OK</span>
                </div>
              @endforeach
            </div>
          @else
            <div class="text-sm text-zinc-500">Aún no se registraron envíos.</div>
          @endif
        </div>
      </div>

    </div>

    {{-- Columna derecha: edición completa --}}
    <div class="lg:col-span-2 space-y-4" id="repair_edit">
      <div class="card reveal-item">
        <div class="card-head">
          <div class="font-black">Editar reparación</div>
          <span class="badge-zinc">Se guarda en el momento</span>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" data-disable-on-submit class="space-y-5">
            @csrf
            @method('PUT')

            <div class="grid gap-3 md:grid-cols-2" data-repair-issue-catalog data-catalog-mode="edit">

              <div class="space-y-3">
                <div>
                  <label class="block mb-1">Falla principal *</label>

                  <input type="text"
                        placeholder="Buscar falla…"
                        class="h-11"
                        data-issue-search
                        disabled>

                  <select name="device_issue_type_id"
                          class="h-11"
                          required
                          data-issue-select
                          data-selected="{{ old('device_issue_type_id', $repair->device_issue_type_id) }}"
                          disabled>
                    <option value="">Elegí una falla…</option>
                  </select>

                  <div class="mt-2 flex items-center gap-2">
                    <button type="button" class="btn-outline btn-sm h-10 w-full justify-center sm:w-auto" data-add-issue disabled>
                      + Agregar falla
                    </button>
                  </div>

                </div>

                <div>
                  <label for="issue_detail" class="block mb-1">Detalle (opcional)</label>
                  <textarea id="issue_detail"
                            name="issue_detail"
                            rows="3"
                            placeholder="Ej: no carga, se apaga, se calentó, etc.">{{ old('issue_detail', $repair->issue_detail) }}</textarea>
                </div>
              </div>

              <div>
                <label for="diagnosis" class="block mb-1">Diagnóstico</label>
                <textarea id="diagnosis" name="diagnosis" rows="4">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
              </div>
            </div>


            <hr>

            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label for="customer_name" class="block mb-1">Nombre cliente</label>
                <input id="customer_name" name="customer_name" class="h-11" value="{{ old('customer_name', $repair->customer_name) }}">
              </div>
              <div>
                <label for="customer_phone" class="block mb-1">Teléfono cliente</label>
                <input id="customer_phone" name="customer_phone" class="h-11" value="{{ old('customer_phone', $repair->customer_phone) }}">
              </div>
              <div class="md:col-span-2">
                <label for="supplier_id" class="block mb-1">Proveedor asociado</label>
                <select id="supplier_id" name="supplier_id" class="h-11">
                  <option value="">Sin asociar</option>
                  @foreach($suppliers as $supplier)
                    <option value="{{ $supplier->id }}" @selected((string) old('supplier_id', $repair->supplier_id) === (string) $supplier->id)>
                      {{ $supplier->name }}@if(!$supplier->active) (inactivo)@endif
                    </option>
                  @endforeach
                </select>
              </div>
              <div>
                <label for="supplier_part_name" class="block mb-1">Repuesto elegido</label>
                <input id="supplier_part_name" name="supplier_part_name" class="h-11" value="{{ old('supplier_part_name', $repair->supplier_part_name) }}" placeholder="Ej: modulo samsung a30">
              </div>
              <div>
                <label for="purchase_reference" class="block mb-1">Referencia de compra</label>
                <input id="purchase_reference" name="purchase_reference" class="h-11" value="{{ old('purchase_reference', $repair->purchase_reference) }}" placeholder="URL o referencia">
              </div>

              <div class="md:col-span-2">
                @php
                  $typeName = optional($deviceTypes->firstWhere('id', $repair->device_type_id))->name;
                  $deviceSummary = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
                  $deviceSummary = trim(($typeName ? ($typeName . ' — ') : '') . $deviceSummary);
                  if ($deviceSummary === '') $deviceSummary = '—';

                  $devOpen = (bool)(
                    $errors->has('device_type_id') ||
                    $errors->has('device_brand_id') ||
                    $errors->has('device_model_id') ||
                    old('device_type_id') ||
                    old('device_brand_id') ||
                    old('device_model_id')
                  );
                @endphp

                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold">Equipo</div>
                    <div class="text-sm text-zinc-600">{{ $deviceSummary }}</div>
                  </div>

                  <button type="button"
                    class="btn-ghost btn-sm h-10"
                    data-toggle-collapse="repair_device_catalog"
                    data-toggle-collapse-label="equipo"
                    aria-expanded="{{ $devOpen ? 'true' : 'false' }}">
                    {{ $devOpen ? 'Ocultar equipo' : 'Ver equipo' }}
                  </button>

                </div>

                <div class="mt-3 {{ $devOpen ? '' : 'hidden' }}" data-collapse="repair_device_catalog">
                  <div class="space-y-3" data-repair-device-catalog data-catalog-mode="edit">

                    <div class="grid gap-3 md:grid-cols-2">

                      <div>
                        <label for="device_type_id" class="block mb-1">Tipo de dispositivo</label>
                        <select id="device_type_id" name="device_type_id" class="h-11" data-device-type>
                          <option value="">— Elegí un tipo —</option>
                          @foreach($deviceTypes as $t)
                            <option value="{{ $t->id }}" @selected((string)old('device_type_id', $repair->device_type_id) === (string)$t->id)>
                              {{ $t->name }}
                            </option>
                          @endforeach
                        </select>
                      </div>

                      <div>
                        <label for="device_brand_id" class="block mb-1">Marca</label>

                        <input type="text" class="mt-2 h-11" placeholder="Buscar marca…" data-brand-search disabled>

                        <select
                          id="device_brand_id"
                          name="device_brand_id"
                          class="h-11"
                          data-device-brand
                          disabled
                          data-selected="{{ old('device_brand_id', $repair->device_brand_id) }}"
                        >
                          <option value="">— Elegí un tipo primero —</option>
                        </select>

                        <button type="button" class="btn-ghost btn-sm mt-2 h-10 w-full justify-center sm:w-auto" data-add-brand disabled>+ Agregar marca</button>

                        <div class="hidden mt-2 flex-col gap-2 sm:flex-row" data-add-brand-form>
                          <input type="text" class="h-11 w-full sm:flex-1" placeholder="Nueva marca…" data-add-brand-input>
                          <button type="button" class="btn-primary btn-sm h-10 w-full justify-center sm:w-auto" data-save-brand>Guardar</button>
                          <button type="button" class="btn-ghost btn-sm h-10 w-full justify-center sm:w-auto" data-cancel-brand>Cancelar</button>
                        </div>
                      </div>

                      <div class="md:col-span-2">
                        <label for="device_model_id" class="block mb-1">Modelo</label>

                        <input type="text" class="mt-2 h-11" placeholder="Buscar modelo…" data-model-search disabled>

                        <select
                          id="device_model_id"
                          name="device_model_id"
                          class="h-11"
                          data-device-model
                          disabled
                          data-selected="{{ old('device_model_id', $repair->device_model_id) }}"
                        >
                          <option value="">— Elegí una marca primero —</option>
                        </select>

                        <button type="button" class="btn-ghost btn-sm mt-2 h-10 w-full justify-center sm:w-auto" data-add-model disabled>+ Agregar modelo</button>

                        <div class="hidden mt-2 flex-col gap-2 sm:flex-row" data-add-model-form>
                          <input type="text" class="h-11 w-full sm:flex-1" placeholder="Nuevo modelo…" data-add-model-input>
                          <button type="button" class="btn-primary btn-sm h-10 w-full justify-center sm:w-auto" data-save-model>Guardar</button>
                          <button type="button" class="btn-ghost btn-sm h-10 w-full justify-center sm:w-auto" data-cancel-model>Cancelar</button>
                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              </div>


            </div>



            <hr>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="space-y-1" data-repair-pricing-auto
                data-pricing-create-base="{{ route('admin.pricing.create') }}"
                data-pricing-edit-base="{{ url('/admin/precios') }}">

                <label for="parts_cost" class="text-sm font-semibold">Costo repuesto</label>
                <input
                  id="parts_cost"
                  name="parts_cost"
                  class="h-11"
                  inputmode="decimal"
                  value="{{ old('parts_cost', $repair->parts_cost) }}"
                  placeholder="0"
                  data-parts-cost
                />
              </div>

              <div class="space-y-1">
                <label for="final_price" class="text-sm font-semibold flex items-center justify-between gap-2">
                  <span>Precio final</span>

                  <span class="inline-flex items-center gap-2 text-xs text-zinc-600">
                    <input type="checkbox" class="h-4 w-4" checked data-final-auto />
                    Auto
                  </span>
                </label>

                <input
                  id="final_price"
                  name="final_price"
                  class="h-11"
                  inputmode="decimal"
                  value="{{ old('final_price', $repair->final_price) }}"
                  placeholder="0"
                  data-final-price
                />
              </div>

              <div class="flex items-end justify-end">
                <button type="button"
                  class="btn-ghost btn-sm h-10"
                  data-toggle-collapse="repair_show_finance"
                  data-toggle-collapse-label="cálculo"
                  aria-expanded="false">Ver cálculo
                </button>

              </div>

              <div class="sm:col-span-3 hidden" data-collapse="repair_show_finance">
                <div class="grid gap-4 sm:grid-cols-3">
                  <div class="space-y-1">
                    <label class="text-sm font-semibold">Envío</label>

                    <div class="flex items-center gap-2">
                      <label class="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" class="h-4 w-4" data-shipping-enabled />
                        <span>Sumar</span>
                      </label>

                      <input
                        inputmode="numeric"
                        value="{{ old('shipping_amount') }}"
                        placeholder="0"
                        class="h-11 w-full sm:w-32"
                        data-shipping-amount
                      />
                    </div>

                    <div class="flex items-center justify-between text-xs text-zinc-500">
                      <span data-pricing-rule-label>Regla: —</span>

                      <a
                        href="{{ route('admin.pricing.create') }}"
                        target="_blank"
                        rel="noopener"
                        class="underline hover:text-zinc-700"
                        data-pricing-rule-action
                      >
                        Crear regla
                      </a>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="text-sm font-semibold">Ganancia sugerida</label>
                    <input class="h-11" inputmode="numeric" value="" placeholder="0" readonly data-profit-display />
                  </div>

                  <div class="space-y-1">
                    <label for="labor_cost" class="text-sm font-semibold">Mano de obra</label>
                    <input
                      id="labor_cost"
                      name="labor_cost"
                      class="h-11"
                      inputmode="decimal"
                      value="{{ old('labor_cost', $repair->labor_cost) }}"
                      placeholder="0"
                      data-labor-cost
                    />
                  </div>

                  <div class="space-y-1 sm:col-span-3">
                    <label class="text-sm font-semibold">Total sugerido</label>
                    <input class="h-11" inputmode="numeric" value="" placeholder="0" readonly data-total-display />
                  </div>
                </div>
              </div>
            </div>



            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold text-zinc-800">Pagos y notas</div>

              <button type="button"
              class="btn-ghost btn-sm h-10"
              data-toggle-collapse="repair_show_extras"
              data-toggle-collapse-label="pagos"
              aria-expanded="false">Ver pagos</button>

            </div>

            <div class="hidden" data-collapse="repair_show_extras">
              <div class="grid gap-3 md:grid-cols-3">
                <div>
                  <label for="paid_amount" class="block mb-1">Pagado</label>
                  <input id="paid_amount" name="paid_amount" class="h-11" inputmode="decimal" value="{{ old('paid_amount', $repair->paid_amount) }}">
                </div>

                <div>
                  <label for="payment_method" class="block mb-1">Método</label>
                  <select id="payment_method" name="payment_method" class="h-11">
                    <option value="">—</option>
                    @foreach($paymentMethods as $k => $label)
                      <option value="{{ $k }}" @selected(old('payment_method', $repair->payment_method) === $k)>{{ $label }}</option>
                    @endforeach
                  </select>
                </div>

                <div>
                  <label for="warranty_days" class="block mb-1">Garantía (días)</label>
                  <input id="warranty_days" name="warranty_days" class="h-11" inputmode="numeric" value="{{ old('warranty_days', $repair->warranty_days) }}">
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-2 mt-3">
                <div>
                  <label for="payment_notes" class="block mb-1">Notas de pago</label>
                  <textarea id="payment_notes" name="payment_notes" rows="3">{{ old('payment_notes', $repair->payment_notes) }}</textarea>
                </div>
                <div>
                  <label for="notes" class="block mb-1">Notas internas</label>
                  <textarea id="notes" name="notes" rows="3">{{ old('notes', $repair->notes) }}</textarea>
                </div>
              </div>
            </div>


            <div class="flex flex-col sm:flex-row gap-2">
              <button class="btn-primary h-11 w-full justify-center sm:w-auto">Guardar cambios</button>
              <a href="{{ route('admin.repairs.show', $repair) }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Cancelar</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<div data-react-repair-show-whatsapp-log data-root-selector="body" data-csrf-token="{{ csrf_token() }}"></div>
<div data-react-repair-catalog-enhancements></div>
@endsection





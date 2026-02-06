@extends('layouts.app')

@section('title', 'Admin — Reparación ' . ($repair->code ?? ''))

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusKey = (string)($repair->status ?? '');
  $statusLabel = $statuses[$statusKey] ?? ($statusKey !== '' ? $statusKey : '—');

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
<div class="container-page py-6">
  <div class="page-head">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="page-title">{{ $repair->code ?? '—' }}</h1>
        <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>

        @if($repair->delivered_at && $wExp)
          <span class="{{ $wActive ? 'badge-emerald' : 'badge-rose' }}">
            Garantía {{ $wActive ? 'vigente' : 'vencida' }} ({{ $wExp->format('d/m/Y') }})
          </span>
        @endif
      </div>

      <p class="page-subtitle mt-1">
        <span class="font-extrabold">{{ $repair->customer_name ?? '—' }}</span>
        <span class="text-zinc-400">·</span>
        <span class="font-semibold">{{ $repair->customer_phone ?? '—' }}</span>
        <span class="text-zinc-400">·</span>
        <span>{{ $device ?: '—' }}</span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.repairs.index') }}" class="btn-ghost btn-sm">Volver</a>
      <a href="{{ route('admin.repairs.print', $repair) }}" class="btn-outline btn-sm" target="_blank" rel="noopener">Imprimir</a>
      <a href="{{ route('admin.repairs.ticket', $repair) }}" class="btn-outline btn-sm" target="_blank" rel="noopener">Ticket</a>


      @if(!empty($waUrl))
        <a href="{{ $waUrl }}" class="btn-primary btn-sm" target="_blank" rel="noopener"
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
      @endphp

      {{-- Acciones rápidas --}}
      <div class="card">
        <div class="card-head">
          <div class="font-black">Acciones rápidas</div>
          <span class="badge-zinc">{{ $repair->code ?? '—' }}</span>
        </div>

        <div class="card-body space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a class="btn-outline w-full"
              href="{{ route('admin.repairs.print', $repair) }}"
              target="_blank"
              rel="noopener">
              Imprimir
            </a>

            <a class="btn-outline w-full"
              href="{{ route('admin.repairs.ticket', $repair) }}?autoprint=1"
              target="_blank"
              rel="noopener">
              Ticket
            </a>
          </div>

          @if(!empty($waUrl))
            <a href="{{ $waUrl }}" class="btn-outline w-full" target="_blank" rel="noopener"
              data-wa-open
              data-wa-ajax="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
              Abrir WhatsApp
            </a>
          @else
            <button type="button" class="btn-outline w-full opacity-50" disabled>
              WhatsApp (sin teléfono)
            </button>
          @endif

          <div class="pt-2 border-t border-zinc-200">
            <button type="button"
              class="btn-ghost btn-sm w-full"
              data-toggle-collapse="repair_quick_status"
              data-toggle-collapse-label="acciones de estado"
              aria-expanded="false">Ver acciones de estado</button>

            <div class="mt-2 hidden" data-collapse="repair_quick_status">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}"
                      onsubmit="return confirm('¿Marcar como ENTREGADA la reparación {{ $repair->code ?? '' }}?');">
                  @csrf
                  <input type="hidden" name="status" value="delivered">
                  <input type="hidden" name="comment" value="Acción rápida: marcada como entregada">
                  <button class="btn-primary w-full" type="submit" {{ $isFinal ? 'disabled' : '' }}>
                    Marcar entregada
                  </button>
                </form>

                <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}"
                      onsubmit="return confirm('¿Cancelar la reparación {{ $repair->code ?? '' }}?');">
                  @csrf
                  <input type="hidden" name="status" value="cancelled">
                  <input type="hidden" name="comment" value="Acción rápida: reparación cancelada">
                  <button class="btn-outline w-full" type="submit" {{ $isFinal ? 'disabled' : '' }}>
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

        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-zinc">Código: {{ $repair->code ?? '—' }}</span>
        </div>

        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Recibido</span>
              <span class="font-extrabold text-right">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Entregado</span>
              <span class="font-extrabold text-right">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Precio final</span>
              <span class="font-black text-right">{{ $money($final) }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Pagado</span>
              <span class="font-black text-right">{{ $money($paid) }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Debe</span>
              <span class="{{ $due > 0 ? 'font-black text-rose-700' : 'font-black text-emerald-700' }} text-right">
                {{ $money($due) }}
              </span>
            </div>

            <div class="pt-2 border-t border-zinc-100">
              <div class="flex items-start justify-between gap-3">
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

      <div class="card">
        <div class="card-head">
          <div class="font-black">Cambiar estado</div>
          <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>
          
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" class="space-y-3">
            @csrf

            <div>
              <label for="status" class="block mb-1">Nuevo estado</label>
              <select id="status" name="status" @disabled($isFinal)>
                @foreach($statuses as $k => $label)
                  <option value="{{ $k }}" @selected(old('status', $repair->status) === $k)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <button class="btn-primary w-full" @disabled($isFinal)>Guardar estado</button>

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

      <div class="card">
        <div class="card-head">
          <div class="font-black">Historial</div>

          <div class="flex items-center gap-2">
            <span class="badge-zinc">{{ $history->count() }} cambios</span>
            <button type="button"
            class="btn-ghost btn-sm"
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
      <div class="card">
        <div class="card-head">
          <div class="font-black">Logs WhatsApp</div>

          <div class="flex items-center gap-2">
            <span class="badge-zinc">{{ $waLogs->count() }}</span>
            <button type="button"
            class="btn-ghost btn-sm"
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
    <div class="lg:col-span-2 space-y-4">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Editar reparación</div>
          <span class="badge-zinc">Se guarda en el momento</span>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" class="space-y-5">
            @csrf
            @method('PUT')

            <div class="grid gap-3 md:grid-cols-2" data-repair-issue-catalog data-catalog-mode="edit">

              <div class="space-y-3">
                <div>
                  <label class="block mb-1">Falla principal *</label>

                  <input type="text"
                        placeholder="Buscar falla…"
                        data-issue-search
                        disabled>

                  <select name="device_issue_type_id"
                          required
                          data-issue-select
                          data-selected="{{ old('device_issue_type_id', $repair->device_issue_type_id) }}"
                          disabled>
                    <option value="">Elegí una falla…</option>
                  </select>

                  <div class="mt-2 flex items-center gap-2">
                    <button type="button" class="btn btn-secondary" data-add-issue disabled>
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
                <input id="customer_name" name="customer_name" value="{{ old('customer_name', $repair->customer_name) }}">
              </div>
              <div>
                <label for="customer_phone" class="block mb-1">Teléfono cliente</label>
                <input id="customer_phone" name="customer_phone" value="{{ old('customer_phone', $repair->customer_phone) }}">
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
                    class="btn-ghost btn-sm"
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
                        <select id="device_type_id" name="device_type_id" data-device-type>
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

                        <input type="text" class="mt-2" placeholder="Buscar marca…" data-brand-search disabled>

                        <select
                          id="device_brand_id"
                          name="device_brand_id"
                          data-device-brand
                          disabled
                          data-selected="{{ old('device_brand_id', $repair->device_brand_id) }}"
                        >
                          <option value="">— Elegí un tipo primero —</option>
                        </select>

                        <button type="button" class="btn-ghost btn-sm mt-2" data-add-brand disabled>+ Agregar marca</button>

                        <div class="hidden mt-2 gap-2" data-add-brand-form>
                          <input type="text" class="flex-1" placeholder="Nueva marca…" data-add-brand-input>
                          <button type="button" class="btn-primary btn-sm" data-save-brand>Guardar</button>
                          <button type="button" class="btn-ghost btn-sm" data-cancel-brand>Cancelar</button>
                        </div>
                      </div>

                      <div class="md:col-span-2">
                        <label for="device_model_id" class="block mb-1">Modelo</label>

                        <input type="text" class="mt-2" placeholder="Buscar modelo…" data-model-search disabled>

                        <select
                          id="device_model_id"
                          name="device_model_id"
                          data-device-model
                          disabled
                          data-selected="{{ old('device_model_id', $repair->device_model_id) }}"
                        >
                          <option value="">— Elegí una marca primero —</option>
                        </select>

                        <button type="button" class="btn-ghost btn-sm mt-2" data-add-model disabled>+ Agregar modelo</button>

                        <div class="hidden mt-2 gap-2" data-add-model-form>
                          <input type="text" class="flex-1" placeholder="Nuevo modelo…" data-add-model-input>
                          <button type="button" class="btn-primary btn-sm" data-save-model>Guardar</button>
                          <button type="button" class="btn-ghost btn-sm" data-cancel-model>Cancelar</button>
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
                  inputmode="decimal"
                  value="{{ old('final_price', $repair->final_price) }}"
                  placeholder="0"
                  data-final-price
                />
              </div>

              <div class="flex items-end justify-end">
                <button type="button"
                  class="btn-ghost btn-sm"
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
                        class="w-32"
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
                    <input inputmode="numeric" value="" placeholder="0" readonly data-profit-display />
                  </div>

                  <div class="space-y-1">
                    <label for="labor_cost" class="text-sm font-semibold">Mano de obra</label>
                    <input
                      id="labor_cost"
                      name="labor_cost"
                      inputmode="decimal"
                      value="{{ old('labor_cost', $repair->labor_cost) }}"
                      placeholder="0"
                      data-labor-cost
                    />
                  </div>

                  <div class="space-y-1 sm:col-span-3">
                    <label class="text-sm font-semibold">Total sugerido</label>
                    <input inputmode="numeric" value="" placeholder="0" readonly data-total-display />
                  </div>
                </div>
              </div>
            </div>



            <div class="flex items-center justify-between gap-3">
              <div class="text-sm font-semibold text-zinc-800">Pagos y notas</div>

              <button type="button"
              class="btn-ghost btn-sm"
              data-toggle-collapse="repair_show_extras"
              data-toggle-collapse-label="pagos"
              aria-expanded="false">Ver pagos</button>

            </div>

            <div class="hidden" data-collapse="repair_show_extras">
              <div class="grid gap-3 md:grid-cols-3">
                <div>
                  <label for="paid_amount" class="block mb-1">Pagado</label>
                  <input id="paid_amount" name="paid_amount" inputmode="decimal" value="{{ old('paid_amount', $repair->paid_amount) }}">
                </div>

                <div>
                  <label for="payment_method" class="block mb-1">Método</label>
                  <select id="payment_method" name="payment_method">
                    <option value="">—</option>
                    @foreach($paymentMethods as $k => $label)
                      <option value="{{ $k }}" @selected(old('payment_method', $repair->payment_method) === $k)>{{ $label }}</option>
                    @endforeach
                  </select>
                </div>

                <div>
                  <label for="warranty_days" class="block mb-1">Garantía (días)</label>
                  <input id="warranty_days" name="warranty_days" inputmode="numeric" value="{{ old('warranty_days', $repair->warranty_days) }}">
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
              <button class="btn-primary">Guardar cambios</button>
              <a href="{{ route('admin.repairs.show', $repair) }}" class="btn-outline">Cancelar</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
(function () {
  const toast = document.getElementById('waToast');
  function showToast(text, isError) {
    if (!toast) return;
    toast.textContent = text || 'Listo.';
    toast.classList.toggle('border-emerald-200', !isError);
    toast.classList.toggle('bg-emerald-50', !isError);
    toast.classList.toggle('text-emerald-900', !isError);

    toast.classList.toggle('border-rose-200', !!isError);
    toast.classList.toggle('bg-rose-50', !!isError);
    toast.classList.toggle('text-rose-900', !!isError);

    toast.classList.remove('hidden');
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-[-6px]');
      toast.classList.add('opacity-100', 'translate-y-0');
    });

    clearTimeout(window.__waToastT);
    window.__waToastT = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-6px]');
      toast.classList.remove('opacity-100', 'translate-y-0');
      setTimeout(() => toast.classList.add('hidden'), 200);
    }, 2600);
  }

  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-wa-open]');
    if (!a) return;
    e.preventDefault();

    const url = a.getAttribute('href');
    if (url) window.open(url, '_blank', 'noopener');

    const ajaxUrl = a.dataset.waAjax;
    if (!ajaxUrl) return;

    try {
      const res = await fetch(ajaxUrl, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': '{{ csrf_token() }}',
          'Accept': 'application/json'
        }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        showToast('No se pudo registrar el envío.', true);
        return;
      }

      showToast(data.created ? 'Envío registrado.' : 'Ya estaba registrado recientemente.');
    } catch (err) {
      showToast('No se pudo registrar el envío.', true);
    }
  });
})();
</script>
@endsection

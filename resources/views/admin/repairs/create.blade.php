@extends('layouts.app')

@section('title', 'Admin — Nueva reparación')

@php
  $oldStatus = old('status', 'received');

  // Si hubo errores o el usuario ya cargó campos opcionales, abrimos el panel opcional.
  $advOpen = (bool) (
    old('user_email') ||
    old('diagnosis') ||
    old('paid_amount') ||
    old('payment_method') ||
    old('warranty_days') ||
    old('payment_notes') ||
    old('notes')
  );
@endphp


@section('content')
<div class="mx-auto w-full max-w-4xl">
  <div class="flex items-start justify-between gap-3 mb-5">
    <div class="page-head mb-0">
      <div class="page-title">Nueva reparación</div>
      <div class="page-subtitle">Cargá lo básico. Después podés editar todo desde el detalle.</div>
    </div>

    <a href="{{ route('admin.repairs.index') }}" class="btn-outline">Volver</a>
  </div>

  <form method="POST" action="{{ route('admin.repairs.store') }}" class="space-y-4">
    @csrf

    {{-- Resumen en vivo (UX) --}}
    <div class="card" data-repair-create-summary>
      <div class="card-head">
        <div class="flex items-center gap-2">
          <div class="font-black">Resumen</div>
          <span class="badge-amber" data-sum-state>Incompleto</span>
        </div>

        <button type="button"
          class="btn-ghost btn-sm"
          data-toggle-collapse="repair_create_summary"
          aria-expanded="false">Ver</button>
      </div>

      <div class="card-body hidden" data-collapse="repair_create_summary">
        <div class="grid gap-3 sm:grid-cols-4">
          <div class="sm:col-span-2">
            <div class="text-xs text-zinc-500">Cliente</div>
            <div class="font-extrabold" data-sum-customer>—</div>
            <div class="text-sm text-zinc-600" data-sum-phone>—</div>
          </div>

          <div class="sm:col-span-2">
            <div class="text-xs text-zinc-500">Equipo</div>
            <div class="font-extrabold" data-sum-device>—</div>
            <div class="text-sm text-zinc-600" data-sum-issue>—</div>
          </div>

          <div class="sm:col-span-4 flex flex-wrap items-center gap-2 pt-1">
            <span class="badge-zinc" data-sum-status>Estado: —</span>

            <a href="#" target="_blank" rel="noopener"
              class="btn-ghost btn-sm hidden"
              data-sum-wa>
              Abrir WhatsApp
            </a>

            <div class="text-xs text-zinc-500">El código se genera al crear.</div>
          </div>
        </div>
      </div>
    </div>

    {{-- (botón de opcionales movido al final para mantener la pantalla limpia) --}}


    <div class="card">
      <div class="card-head">
        <div class="font-black">Cliente y equipo</div>
        <span class="badge-zinc">Datos</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1">
            <label>Nombre del cliente *</label>
            <input name="customer_name" data-repair-customer-name value="{{ old('customer_name') }}" required placeholder="Nombre y apellido" />
          </div>

          <div class="space-y-1">
            <label>Teléfono (WhatsApp) *</label>
            <input name="customer_phone"
              data-repair-customer-phone
              data-phone-normalize
              value="{{ old('customer_phone') }}"
              required
              inputmode="numeric"
              autocomplete="tel"
              placeholder="Ej: 341xxxxxxx" />
             {{-- (tip removido para reducir ruido visual) --}}

          </div>



          <div class="sm:col-span-2" data-repair-device-catalog>
            <div class="grid gap-4 sm:grid-cols-3">
              {{-- Tipo --}}
              <div class="space-y-1 min-w-0">
                <label>Tipo de dispositivo *</label>
                <select id="device_type_id" name="device_type_id" data-device-type required>
                  <option value="">— Elegí un tipo —</option>
                  @foreach($deviceTypes as $t)
                    <option value="{{ $t->id }}" @selected(old('device_type_id') == $t->id)>{{ $t->name }}</option>
                  @endforeach
                </select>
                {{-- (ayuda removida) --}}

              </div>

              {{-- Marca --}}
              <div class="space-y-1 min-w-0">
                <label>Marca *</label>

                <input type="text" placeholder="Buscar marca… (Enter)"
                  data-brand-search disabled>

                <select id="device_brand_id" name="device_brand_id"
                  data-device-brand disabled
                  required
                  data-selected="{{ old('device_brand_id') }}">
                  <option value="">— Elegí un tipo primero —</option>
                </select>

                <button type="button" class="btn-ghost btn-sm mt-2" data-add-brand disabled>+ Agregar marca</button>

                <div class="hidden mt-2 gap-2 flex-col sm:flex-row" data-add-brand-form>
                  <input type="text" class="flex-1" placeholder="Nueva marca…" data-add-brand-input>
                  <button type="button" class="btn-primary btn-sm w-full sm:w-auto" data-save-brand>Guardar</button>
                  <button type="button" class="btn-ghost btn-sm w-full sm:w-auto" data-cancel-brand>Cancelar</button>
                </div>
              </div>


              {{-- Modelo --}}
              <div class="space-y-1 min-w-0">
                <label>Modelo *</label>

                <input type="text" placeholder="Buscar modelo… (Enter)"
                  data-model-search disabled>

                <select id="device_model_id" name="device_model_id"
                  data-device-model disabled required
                  data-selected="{{ old('device_model_id') }}">
                  <option value="">— Elegí una marca primero —</option>
                </select>

                <button type="button" class="btn-ghost btn-sm mt-2" data-add-model disabled>+ Agregar modelo</button>

                <div class="hidden mt-2 gap-2 flex-col sm:flex-row" data-add-model-form>
                  <input type="text" class="flex-1" placeholder="Nuevo modelo…" data-add-model-input>
                  <button type="button" class="btn-primary btn-sm w-full sm:w-auto" data-save-model>Guardar</button>
                  <button type="button" class="btn-ghost btn-sm w-full sm:w-auto" data-cancel-model>Cancelar</button>
                </div>
              </div>

            </div>
          </div>


        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-black">Falla y diagnóstico</div>
        <span class="badge-zinc">Taller</span>
      </div>
      <div class="card-body">
        <div class="space-y-3" data-repair-issue-catalog>
          <div class="space-y-1">
            <label>Falla principal *</label>

            <input type="text"
              placeholder="Buscar falla… (Enter para crear)"

              data-issue-search
              disabled>

            {{-- lo dejamos para guardar el ID, pero NO lo mostramos (simplicidad) --}}
            <select
              name="device_issue_type_id"
              required
              class="hidden"
              data-issue-select
              data-selected="{{ old('device_issue_type_id') }}"
            >
              <option value="">—</option>
              @foreach($issueTypes as $it)
                <option value="{{ $it->id }}" @selected(old('device_issue_type_id') == $it->id)>{{ $it->name }}</option>
              @endforeach
            </select>

            {{-- Crear falla inline (sin prompt) --}}
            <div class="hidden mt-2 gap-2 flex-col sm:flex-row" data-issue-create-row>
              <input type="text" class="flex-1" placeholder="Nueva falla…" data-issue-create-input>
              <button type="button" class="btn-primary btn-sm w-full sm:w-auto" data-issue-create-save>Guardar</button>
              <button type="button" class="btn-ghost btn-sm w-full sm:w-auto" data-issue-create-cancel>Cancelar</button>
            </div>


          </div>

          <div class="space-y-1">
            <label class="text-sm font-semibold">Reparación final *</label>
            <select name="repair_type_id" required data-repair-type-final>
              <option value="">Elegí una reparación…</option>
              @foreach($repairTypes as $rt)
                <option value="{{ $rt->id }}" @selected(old('repair_type_id') == $rt->id)>{{ $rt->name }}</option>
              @endforeach
            </select>
            <div class="text-xs text-zinc-500">
              Esto dispara el cálculo automático (módulo, batería, mantenimiento, etc).
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Detalle (opcional)</label>
            <textarea name="issue_detail" rows="3"
              placeholder="Ej: ‘se reinicia’, ‘no carga’, ‘pantalla con manchas’…">{{ old('issue_detail') }}</textarea>
          </div>

          <div class="text-xs text-zinc-500">
            Tip: empezá por “No enciende”, “Módulo roto”, “Batería”, “Joystick drift”… después detallás arriba.
          </div>
        </div>


      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-black">Costos, cobro y estado</div>
        <span class="badge-zinc">Finanzas</span>
      </div>
      <div class="card-body" data-repair-pricing-auto
        data-pricing-create-base="{{ route('admin.pricing.create') }}"
        data-pricing-edit-base="{{ url('/admin/precios') }}">
        <div class="grid gap-4 sm:grid-cols-3">

          <div class="space-y-1">
            <label class="text-sm font-semibold">Costo repuesto</label>
            <input name="parts_cost" inputmode="numeric" value="{{ old('parts_cost') }}" placeholder="0" data-parts-cost />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-semibold flex items-center justify-between gap-2">
              <span>Precio final al cliente</span>
              <span class="inline-flex items-center gap-2 text-xs text-zinc-600">
                <input type="checkbox" class="h-4 w-4" checked data-final-auto />
                Auto
              </span>
            </label>
            <input name="final_price" inputmode="numeric" value="{{ old('final_price') }}" placeholder="0" data-final-price />
          </div>

          <div class="space-y-1">
            <label>Estado *</label>
            <select name="status" data-repair-status required>
              @foreach($statuses as $k => $label)
                <option value="{{ $k }}" @selected($oldStatus === $k)>{{ $label }}</option>
              @endforeach
            </select>

            <div class="text-xs text-zinc-500">
              Si marcás <span class="font-black">Entregado</span>, se guarda la fecha de entrega.
            </div>
          </div>

          <div class="sm:col-span-3">
            <button type="button" class="btn-ghost btn-sm" data-toggle-finance aria-expanded="false">
              Ver detalle de cálculo
            </button>
          </div>

          <div class="sm:col-span-3 hidden" data-finance-advanced>
            <div class="grid gap-4 sm:grid-cols-3">

              <div class="space-y-1">
                <label class="text-sm font-semibold">Envío</label>
                <div class="flex items-center gap-2">
                  <label class="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" class="h-4 w-4" data-shipping-enabled />
                    <span>Sumar</span>
                  </label>
                  <input inputmode="numeric" value="{{ old('shipping_amount') }}" placeholder="0" class="w-32" data-shipping-amount />
                </div>

                <div class="flex items-center justify-between text-xs text-zinc-500">
                  <span data-pricing-rule-label>Regla: —</span>

                  <a href="{{ route('admin.pricing.create') }}"
                    target="_blank" rel="noopener"
                    class="underline hover:text-zinc-700"
                    data-pricing-rule-action>
                    Crear regla
                  </a>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-sm font-semibold">Ganancia sugerida</label>
                <input inputmode="numeric" value="" placeholder="0" readonly data-profit-display />
              </div>

              <div class="space-y-1">
                <label class="text-sm font-semibold">Mano de obra (opcional)</label>
                <input name="labor_cost" inputmode="numeric" value="{{ old('labor_cost') }}" placeholder="0" data-labor-cost />
              </div>

              <div class="space-y-1 sm:col-span-3">
                <label class="text-sm font-semibold">Total sugerido</label>
                <input inputmode="numeric" value="" placeholder="0" readonly data-total-display />
                <div class="text-xs text-zinc-500">Repuesto + ganancia + (mano de obra) + (envío).</div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>

      <div class="card {{ $advOpen ? '' : 'hidden' }}" data-advanced-fields>
        <div class="card-head">
          <div class="font-black">Campos opcionales</div>
          <span class="badge-zinc">Podés ignorarlos</span>
        </div>

        <div class="card-body">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2 space-y-1">
              <label>Email de usuario (opcional, para asociar)</label>
              <input name="user_email" value="{{ old('user_email') }}" placeholder="cliente@email.com" />
              <div class="text-xs text-zinc-500">Si lo dejás vacío, queda como reparación “sin cuenta”.</div>
            </div>

            <div class="sm:col-span-2 space-y-1">
              <label class="text-sm font-medium">Diagnóstico (opcional)</label>
              <textarea name="diagnosis" rows="5"
                placeholder="Diagnóstico técnico / notas internas…">{{ old('diagnosis') }}</textarea>
            </div>

            <div class="space-y-1">
              <label>Pagado</label>
              <input name="paid_amount" value="{{ old('paid_amount') }}" inputmode="decimal" placeholder="0" />
            </div>

            <div class="space-y-1">
              <label>Método de pago</label>
              <select name="payment_method">
                <option value="">—</option>
                @foreach($paymentMethods as $k => $label)
                  <option value="{{ $k }}" @selected(old('payment_method') === $k)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <div class="space-y-1">
              <label>Garantía (días)</label>
              <input name="warranty_days" value="{{ old('warranty_days', 0) }}" inputmode="numeric" placeholder="0" />
            </div>

            <div class="sm:col-span-2 space-y-1">
              <label>Notas de pago</label>
              <input name="payment_notes" value="{{ old('payment_notes') }}" placeholder="Ej: señal, transferencia, etc." />
            </div>

            <div class="sm:col-span-2 space-y-1">
              <label>Notas internas (opcional)</label>
              <textarea name="notes" rows="3" placeholder="Cualquier dato extra para vos…">{{ old('notes') }}</textarea>
            </div>
          </div>
        </div>
      </div>


    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <button type="button"
        class="btn-ghost btn-sm self-start"
        data-toggle-advanced
        aria-expanded="{{ $advOpen ? 'true' : 'false' }}">
        {{ $advOpen ? 'Ocultar campos opcionales' : 'Mostrar campos opcionales' }}
      </button>

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <a href="{{ route('admin.repairs.index') }}" class="btn-outline">Cancelar</a>
        <button class="btn-primary" type="submit" data-repair-submit>Crear reparación</button>
      </div>
    </div>

  </form>
</div>
@endsection

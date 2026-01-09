@extends('layouts.app')

@section('title', 'Admin — Nueva reparación')

@php
  $oldStatus = old('status', 'received');
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

    <div class="card">
      <div class="card-head">
        <div class="font-black">Cliente y equipo</div>
        <span class="badge-zinc">Datos</span>
      </div>
      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Email de usuario (opcional, para asociar)</label>
            <input name="user_email" value="{{ old('user_email') }}" placeholder="cliente@email.com" />
            <div class="text-xs text-zinc-500">Si lo dejás vacío, queda como reparación “sin cuenta”.</div>
          </div>

          <div class="space-y-1">
            <label>Nombre del cliente *</label>
            <input name="customer_name" value="{{ old('customer_name') }}" required placeholder="Nombre y apellido" />
          </div>

          <div class="space-y-1">
            <label>Teléfono (WhatsApp) *</label>
            <input name="customer_phone" value="{{ old('customer_phone') }}" required inputmode="numeric" placeholder="Ej: 341xxxxxxx" />
            <div class="text-xs text-zinc-500">Tip: podés pegarlo con o sin +54, se normaliza solo.</div>
          </div>

          <div class="space-y-3" data-repair-device-catalog>
            <div class="space-y-1">
              <label>Tipo de dispositivo</label>
              <select id="device_type_id" name="device_type_id" data-device-type>
                <option value="">— Elegí un tipo —</option>
                @foreach($deviceTypes as $t)
                  <option value="{{ $t->id }}" @selected(old('device_type_id') == $t->id)>{{ $t->name }}</option>
                @endforeach
              </select>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label>Marca</label>
                <button type="button" class="btn-outline btn-sm" data-add-brand disabled>+ Agregar</button>
              </div>

              <input type="text" class="mt-2" placeholder="Buscar marca…" data-brand-search disabled>

              <select id="device_brand_id" name="device_brand_id" data-device-brand disabled data-selected="{{ old('device_brand_id') }}">
                <option value="">— Elegí un tipo primero —</option>
              </select>


              <div class="hidden mt-2 gap-2" data-add-brand-form>
                <input type="text" class="flex-1" placeholder="Nueva marca…" data-add-brand-input>
                <button type="button" class="btn-primary btn-sm" data-save-brand>Guardar</button>
                <button type="button" class="btn-ghost btn-sm" data-cancel-brand>Cancelar</button>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <label>Modelo</label>
                <button type="button" class="btn-outline btn-sm" data-add-model disabled>+ Agregar</button>
              </div>

              <input type="text" class="mt-2" placeholder="Buscar modelo…" data-model-search disabled>

              <select id="device_model_id" name="device_model_id" data-device-model disabled data-selected="{{ old('device_model_id') }}">
                <option value="">— Elegí una marca primero —</option>
              </select>


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

    <div class="card">
      <div class="card-head">
        <div class="font-black">Falla y diagnóstico</div>
        <span class="badge-zinc">Taller</span>
      </div>
      <div class="card-body">
        <div class="grid gap-4 md:grid-cols-2" data-repair-issue-catalog>
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Falla principal *</label>

              <input type="text" class="w-full input"
                placeholder="Buscar falla…"
                data-issue-search
                disabled>

              <select name="device_issue_type_id" class="w-full input"
                required
                data-issue-select
                data-selected="{{ old('device_issue_type_id') }}"
                disabled>
                <option value="">Elegí una falla…</option>
              </select>

              <div class="mt-2 flex items-center gap-2">
                <button type="button" class="btn btn-secondary"
                  data-add-issue
                  disabled>
                  + Agregar falla
                </button>
              </div>

              <div class="mt-2 hidden items-center gap-2" data-issue-form>
                <input type="text" class="w-full input" placeholder="Nueva falla…" data-issue-input>
                <button type="button" class="btn btn-primary" data-issue-save>Guardar</button>
                <button type="button" class="btn btn-ghost" data-issue-cancel>Cancelar</button>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Detalle (opcional)</label>
              <textarea name="issue_detail" class="w-full input" rows="3"
                placeholder="Ej: ‘se reinicia’, ‘no carga’, ‘pantalla con manchas’…">{{ old('issue_detail') }}</textarea>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Diagnóstico</label>
            <textarea name="diagnosis" class="w-full input" rows="6"
              placeholder="Diagnóstico técnico / notas internas…">{{ old('diagnosis') }}</textarea>
          </div>
</div>

      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-black">Costos, cobro y estado</div>
        <span class="badge-zinc">Finanzas</span>
      </div>
      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-1">
            <label>Costo repuestos</label>
            <input name="parts_cost" value="{{ old('parts_cost') }}" inputmode="decimal" placeholder="0" />
          </div>

          <div class="space-y-1">
            <label>Mano de obra</label>
            <input name="labor_cost" value="{{ old('labor_cost') }}" inputmode="decimal" placeholder="0" />
          </div>

          <div class="space-y-1">
            <label>Precio final al cliente</label>
            <input name="final_price" value="{{ old('final_price') }}" inputmode="decimal" placeholder="0" />
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

          <div class="sm:col-span-3 space-y-1">
            <label>Notas de pago</label>
            <input name="payment_notes" value="{{ old('payment_notes') }}" placeholder="Ej: señal, transferencia, etc." />
          </div>

          <div class="sm:col-span-3">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1">
                <label>Estado *</label>
                <select name="status" required>
                  @foreach($statuses as $k => $label)
                    <option value="{{ $k }}" @selected($oldStatus === $k)>{{ $label }}</option>
                  @endforeach
                </select>
              </div>

              <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div class="text-sm font-black">Tip rápido</div>
                <div class="mt-1 text-sm text-zinc-700">
                  Si ponés <span class="font-black">Entregado</span>, se guarda la fecha de entrega y la garantía empieza a contar desde ahí.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a href="{{ route('admin.repairs.index') }}" class="btn-outline">Cancelar</a>
      <button class="btn-primary" type="submit">Crear reparación</button>
    </div>
  </form>
</div>
@endsection

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

          <div class="space-y-1">
            <label>Marca</label>
            <input name="device_brand" value="{{ old('device_brand') }}" placeholder="Samsung / iPhone / Xiaomi…" />
          </div>

          <div class="space-y-1">
            <label>Modelo</label>
            <input name="device_model" value="{{ old('device_model') }}" placeholder="A13 / 12 Pro Max / Note…" />
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
        <div class="grid gap-4">
          <div class="space-y-1">
            <label>Falla reportada *</label>
            <textarea name="issue_reported" required rows="3" placeholder="Qué le pasa al equipo (según el cliente)…">{{ old('issue_reported') }}</textarea>
          </div>

          <div class="space-y-1">
            <label>Diagnóstico (opcional)</label>
            <textarea name="diagnosis" rows="3" placeholder="Diagnóstico técnico (si ya lo tenés)…">{{ old('diagnosis') }}</textarea>
          </div>

          <div class="space-y-1">
            <label>Notas internas</label>
            <textarea name="notes" rows="3" placeholder="Notas para el taller (no visibles para el cliente)…">{{ old('notes') }}</textarea>
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

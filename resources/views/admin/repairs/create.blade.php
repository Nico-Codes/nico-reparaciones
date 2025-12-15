@extends('layouts.app')

@section('title', 'Admin — Nueva reparación')

@section('content')
@php
  $prefill = [
    'user_email'      => request('user_email'),
    'customer_name'   => request('customer_name'),
    'customer_phone'  => request('customer_phone'),
    'device_brand'    => request('device_brand'),
    'device_model'    => request('device_model'),
    'issue_reported'  => request('issue_reported'),
    'diagnosis'       => request('diagnosis'),

    'parts_cost'      => request('parts_cost'),
    'labor_cost'      => request('labor_cost'),
    'final_price'     => request('final_price'),

    'paid_amount'     => request('paid_amount'),
    'payment_method'  => request('payment_method'),
    'payment_notes'   => request('payment_notes'),

    'status'          => request('status', 'received'),
    'warranty_days'   => request('warranty_days'),
    'notes'           => request('notes'),
  ];
@endphp

<div class="container-page py-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="page-title">Nueva reparación</h1>
      <p class="page-subtitle">Cargá los datos básicos + finanzas + pago + garantía.</p>
    </div>
    <a href="{{ route('admin.repairs.index') }}" class="btn-outline">← Volver</a>
  </div>

  @if($errors->any())
    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Revisá estos errores:</div>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        @foreach($errors->all() as $error)
          <li>{{ $error }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('admin.repairs.store') }}" class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    @csrf

    {{-- Columna principal --}}
    <div class="lg:col-span-2 space-y-6">

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Cliente</div>
          <div class="text-xs text-zinc-500">Nombre y teléfono (obligatorio).</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre *</label>
            <input class="input" type="text" name="customer_name" required value="{{ old('customer_name', $prefill['customer_name']) }}">
          </div>
          <div>
            <label class="label">Teléfono *</label>
            <input class="input" type="text" name="customer_phone" required value="{{ old('customer_phone', $prefill['customer_phone']) }}" placeholder="Ej: 341xxxxxxx">
            <p class="helper">Se normaliza a solo números al guardar.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Equipo y trabajo</div>
          <div class="text-xs text-zinc-500">Marca/modelo + falla/diagnóstico.</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Marca</label>
            <input class="input" type="text" name="device_brand" value="{{ old('device_brand', $prefill['device_brand']) }}">
          </div>
          <div>
            <label class="label">Modelo</label>
            <input class="input" type="text" name="device_model" value="{{ old('device_model', $prefill['device_model']) }}">
          </div>

          <div class="md:col-span-2">
            <label class="label">Problema reportado *</label>
            <textarea class="textarea" rows="3" name="issue_reported" required>{{ old('issue_reported', $prefill['issue_reported']) }}</textarea>
          </div>

          <div class="md:col-span-2">
            <label class="label">Diagnóstico</label>
            <textarea class="textarea" rows="3" name="diagnosis">{{ old('diagnosis', $prefill['diagnosis']) }}</textarea>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Finanzas</div>
          <div class="text-xs text-zinc-500">Costos, precio y cálculo automático.</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="label">Repuestos</label>
            <input id="parts_cost" class="input" type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $prefill['parts_cost']) }}">
          </div>
          <div>
            <label class="label">Mano de obra</label>
            <input id="labor_cost" class="input" type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $prefill['labor_cost']) }}">
          </div>
          <div>
            <label class="label">Precio final</label>
            <input id="final_price" class="input" type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $prefill['final_price']) }}">
          </div>

          <div class="md:col-span-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div class="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div class="text-zinc-500">Costo total</div>
                <div class="font-extrabold text-zinc-900">$ <span id="ui_total_cost">0</span></div>
              </div>
              <div>
                <div class="text-zinc-500">Ganancia</div>
                <div class="font-extrabold text-zinc-900">$ <span id="ui_profit">0</span></div>
              </div>
              <div>
                <div class="text-zinc-500">Saldo</div>
                <div class="font-extrabold text-zinc-900">$ <span id="ui_balance_due">0</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Pago</div>
          <div class="text-xs text-zinc-500">Pagado, método y notas.</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Pagado</label>
            <input id="paid_amount" class="input" type="number" step="0.01" min="0" name="paid_amount" value="{{ old('paid_amount', $prefill['paid_amount']) }}">
          </div>
          <div>
            <label class="label">Método</label>
            <select class="select" name="payment_method">
              <option value="">—</option>
              @foreach(($paymentMethods ?? []) as $k => $label)
                <option value="{{ $k }}" {{ old('payment_method', $prefill['payment_method']) === $k ? 'selected' : '' }}>
                  {{ $label }}
                </option>
              @endforeach
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="label">Notas de pago</label>
            <textarea class="textarea" rows="2" name="payment_notes">{{ old('payment_notes', $prefill['payment_notes']) }}</textarea>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Notas internas</div>
          <div class="text-xs text-zinc-500">Lo que querés guardar para vos.</div>
        </div>
        <div class="card-body">
          <textarea class="textarea" rows="3" name="notes">{{ old('notes', $prefill['notes']) }}</textarea>
        </div>
      </div>
    </div>

    {{-- Sidebar --}}
    <div class="space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Vincular usuario</div>
          <div class="text-xs text-zinc-500">Opcional (por email).</div>
        </div>
        <div class="card-body">
          <label class="label">Email del usuario</label>
          <input class="input" type="email" name="user_email" value="{{ old('user_email', $prefill['user_email']) }}" placeholder="cliente@email.com">
          <p class="helper">Si existe en users, queda vinculado.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Estado y garantía</div>
          <div class="text-xs text-zinc-500">Seteá el flujo de trabajo.</div>
        </div>
        <div class="card-body space-y-4">
          <div>
            <label class="label">Estado *</label>
            @php $selected = old('status', $prefill['status'] ?? 'received'); @endphp
            <select class="select" name="status" required>
              @foreach($statuses as $key => $label)
                <option value="{{ $key }}" {{ $selected === $key ? 'selected' : '' }}>{{ $label }}</option>
              @endforeach
            </select>
          </div>

          <div>
            <label class="label">Garantía (días)</label>
            <input class="input" type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $prefill['warranty_days']) }}" placeholder="Ej: 30">
          </div>

          <button class="btn-primary w-full" type="submit">Crear reparación</button>
          <a class="btn-outline w-full text-center" href="{{ route('admin.repairs.index') }}">Cancelar</a>
        </div>
      </div>
    </div>
  </form>
</div>

<script>
(function(){
  function n(v){ v = parseFloat(v); return isNaN(v) ? 0 : v; }
  function fmt(v){ return Math.round(v).toLocaleString('es-AR'); }

  function recalc(){
    const parts = n(document.getElementById('parts_cost')?.value);
    const labor = n(document.getElementById('labor_cost')?.value);
    const finalp = n(document.getElementById('final_price')?.value);
    const paid  = n(document.getElementById('paid_amount')?.value);

    const total = parts + labor;
    const profit = finalp - total;
    const balance = Math.max(0, finalp - paid);

    const tc = document.getElementById('ui_total_cost');
    const pr = document.getElementById('ui_profit');
    const bd = document.getElementById('ui_balance_due');

    if (tc) tc.textContent = fmt(total);
    if (pr) pr.textContent = fmt(profit);
    if (bd) bd.textContent = fmt(balance);
  }

  ['parts_cost','labor_cost','final_price','paid_amount'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', recalc);
  });

  recalc();
})();
</script>
@endsection

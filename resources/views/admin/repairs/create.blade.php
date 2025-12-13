@extends('layouts.app')

@section('title', 'Admin - Nueva reparación')

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

<h1>Nueva reparación</h1>

<p>
  <a href="{{ route('admin.repairs.index') }}">← Volver a reparaciones</a>
</p>

@if($errors->any())
  <div style="padding:10px;border:1px solid #f99;background:#fff5f5;margin-bottom:12px;">
    <b>Revisá estos errores:</b>
    <ul>
      @foreach($errors->all() as $error)
        <li>{{ $error }}</li>
      @endforeach
    </ul>
  </div>
@endif

<form method="POST" action="{{ route('admin.repairs.store') }}">
  @csrf

  <h3>Vincular a usuario (opcional)</h3>
  <label>Email del usuario</label><br>
  <input type="email" name="user_email" value="{{ old('user_email', $prefill['user_email']) }}" style="width:320px;max-width:100%;">
  <p style="margin-top:6px;color:#666;">Si existe ese email en la tabla users, la reparación queda vinculada.</p>

  <hr>

  <h3>Cliente</h3>
  <label>Nombre del cliente *</label><br>
  <input type="text" name="customer_name" value="{{ old('customer_name', $prefill['customer_name']) }}" required style="width:320px;max-width:100%;"><br><br>

  <label>Teléfono del cliente *</label><br>
  <input type="text" name="customer_phone" value="{{ old('customer_phone', $prefill['customer_phone']) }}" required style="width:320px;max-width:100%;">
  <p style="margin-top:6px;color:#666;">Se normaliza a solo números al guardar.</p>

  <hr>

  <h3>Equipo</h3>
  <label>Marca</label><br>
  <input type="text" name="device_brand" value="{{ old('device_brand', $prefill['device_brand']) }}" style="width:320px;max-width:100%;"><br><br>

  <label>Modelo</label><br>
  <input type="text" name="device_model" value="{{ old('device_model', $prefill['device_model']) }}" style="width:320px;max-width:100%;">

  <hr>

  <h3>Trabajo</h3>
  <label>Problema reportado *</label><br>
  <textarea name="issue_reported" rows="3" required style="width:520px;max-width:100%;">{{ old('issue_reported', $prefill['issue_reported']) }}</textarea><br><br>

  <label>Diagnóstico (opcional)</label><br>
  <textarea name="diagnosis" rows="3" style="width:520px;max-width:100%;">{{ old('diagnosis', $prefill['diagnosis']) }}</textarea>

  <hr>

  <h3>Costos / Precio</h3>
  <label>Costo repuestos</label><br>
  <input id="parts_cost" type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $prefill['parts_cost']) }}" style="width:200px;"><br><br>

  <label>Costo mano de obra</label><br>
  <input id="labor_cost" type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $prefill['labor_cost']) }}" style="width:200px;"><br><br>

  <label>Precio final (opcional)</label><br>
  <input id="final_price" type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $prefill['final_price']) }}" style="width:200px;">

  <p style="margin-top:10px;">
    <b>Costo total:</b> $<span id="ui_total_cost">0</span> &nbsp;|&nbsp;
    <b>Ganancia:</b> $<span id="ui_profit">0</span>
  </p>

  <hr>

  <h3>Pagos</h3>
  <label>Pagado</label><br>
  <input id="paid_amount" type="number" step="0.01" min="0" name="paid_amount" value="{{ old('paid_amount', $prefill['paid_amount']) }}" style="width:200px;"><br><br>

  <label>Método de pago</label><br>
  <select name="payment_method" style="width:220px;">
    <option value="">—</option>
    @foreach(($paymentMethods ?? []) as $k => $label)
      <option value="{{ $k }}" {{ old('payment_method', $prefill['payment_method']) === $k ? 'selected' : '' }}>
        {{ $label }}
      </option>
    @endforeach
  </select><br><br>

  <label>Notas de pago (opcional)</label><br>
  <textarea name="payment_notes" rows="2" style="width:520px;max-width:100%;">{{ old('payment_notes', $prefill['payment_notes']) }}</textarea>

  <p style="margin-top:10px;">
    <b>Saldo:</b> $<span id="ui_balance_due">0</span>
  </p>

  <hr>

  <h3>Garantía / Estado</h3>
  <label>Garantía (días)</label><br>
  <input type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $prefill['warranty_days']) }}" style="width:200px;"><br><br>

  <label>Estado *</label><br>
  @php $selected = old('status', $prefill['status'] ?? 'received'); @endphp
  <select name="status" required style="width:260px;">
    @foreach($statuses as $key => $label)
      <option value="{{ $key }}" {{ $selected === $key ? 'selected' : '' }}>{{ $label }}</option>
    @endforeach
  </select>

  <hr>

  <h3>Notas (opcional)</h3>
  <textarea name="notes" rows="3" style="width:520px;max-width:100%;">{{ old('notes', $prefill['notes']) }}</textarea>

  <br><br>
  <button type="submit">Crear reparación</button>
</form>

<script>
(function(){
  function n(v){ v = parseFloat(v); return isNaN(v) ? 0 : v; }
  function fmt(v){ return Math.round(v).toLocaleString('es-AR'); }

  function recalc(){
    const parts = n(document.getElementById('parts_cost').value);
    const labor = n(document.getElementById('labor_cost').value);
    const finalp = n(document.getElementById('final_price').value);
    const paid  = n(document.getElementById('paid_amount').value);

    const total = parts + labor;
    const profit = finalp - total;
    const balance = Math.max(0, finalp - paid);

    document.getElementById('ui_total_cost').textContent = fmt(total);
    document.getElementById('ui_profit').textContent = fmt(profit);
    document.getElementById('ui_balance_due').textContent = fmt(balance);
  }

  ['parts_cost','labor_cost','final_price','paid_amount'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', recalc);
  });

  recalc();
})();
</script>
@endsection

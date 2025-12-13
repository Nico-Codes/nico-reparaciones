@extends('layouts.app')

@section('content')
@if(session('success'))
  <div style="padding:10px;border:1px solid #9f9;background:#f5fff5;margin-bottom:12px;">
    {{ session('success') }}
  </div>
@endif

@if($errors->any())
  <div style="padding:10px;border:1px solid #f99;background:#fff5f5;margin-bottom:12px;">
    <b>Hay errores:</b>
    <ul>
      @foreach($errors->all() as $e)
        <li>{{ $e }}</li>
      @endforeach
    </ul>
  </div>
@endif

<h1>Reparación</h1>
<h3 style="margin-top:6px;">
  {{ $repair->code ?? ('#'.$repair->id) }}
  — {{ $statuses[$repair->status] ?? $repair->status }}
</h3>

<p style="margin-top:10px;">
  <a href="{{ route('admin.repairs.index') }}">⬅ Volver</a>
  &nbsp;|&nbsp;
  <a href="{{ route('admin.repairs.print', $repair) }}">🖨️ Imprimir</a>
  &nbsp;|&nbsp;
  @if(!empty($waUrl))
    <a href="{{ $waUrl }}" target="_blank">WhatsApp</a>
  @else
    WhatsApp —
  @endif
</p>

<hr>

<h3>Resumen</h3>

<div style="display:flex;gap:16px;flex-wrap:wrap;">
  <div style="min-width:260px;border:1px solid #ddd;padding:12px;border-radius:8px;">
    <h4>Cliente</h4>
    <div><b>Nombre:</b> {{ $repair->customer_name }}</div>
    <div><b>Tel:</b> {{ $repair->customer_phone }}</div>
    <div><b>Usuario:</b> {{ $linkedUserEmail ?? '—' }}</div>
  </div>

  <div style="min-width:260px;border:1px solid #ddd;padding:12px;border-radius:8px;">
    <h4>Equipo</h4>
    <div><b>Marca/Modelo:</b> {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}</div>
    <div><b>Falla:</b> {{ $repair->issue_reported }}</div>
  </div>

  <div style="min-width:300px;border:1px solid #ddd;padding:12px;border-radius:8px;">
    <h4>Finanzas</h4>
    <div><b>Repuestos:</b> ${{ number_format((float)$repair->parts_cost, 0, ',', '.') }}</div>
    <div><b>Mano de obra:</b> ${{ number_format((float)$repair->labor_cost, 0, ',', '.') }}</div>
    <div><b>Costo total:</b> ${{ number_format((float)$repair->total_cost, 0, ',', '.') }}</div>
    <div><b>Precio final:</b> {{ $repair->final_price !== null ? ('$'.number_format((float)$repair->final_price, 0, ',', '.')) : '—' }}</div>
    <div><b>Ganancia:</b> ${{ number_format((float)$repair->profit, 0, ',', '.') }}</div>
    <hr>
    <div><b>Pagado:</b> ${{ number_format((float)($repair->paid_amount ?? 0), 0, ',', '.') }}</div>
    <div><b>Saldo:</b> ${{ number_format((float)$repair->balance_due, 0, ',', '.') }}</div>
    <div><b>Método:</b>
      @php
        $pm = $repair->payment_method;
        $pmLabel = $pm && isset($paymentMethods[$pm]) ? $paymentMethods[$pm] : ($pm ?: '—');
      @endphp
      {{ $pmLabel }}
    </div>
    <div><b>Notas:</b> {{ $repair->payment_notes ?: '—' }}</div>
  </div>

  <div style="min-width:260px;border:1px solid #ddd;padding:12px;border-radius:8px;">
    <h4>Garantía</h4>
    <div><b>Días:</b> {{ ($repair->warranty_days ?? 0) ? ($repair->warranty_days.' días') : '—' }}</div>
    <div><b>Entregado:</b> {{ $repair->delivered_at ? $repair->delivered_at->format('Y-m-d H:i') : '—' }}</div>
    <div><b>Vence:</b>
      @if($repair->warranty_expires_at)
        {{ $repair->warranty_expires_at->format('Y-m-d') }}
        {!! $repair->in_warranty ? '<span style="color:green;font-weight:bold;">(EN GARANTÍA)</span>' : '<span style="color:#b00;font-weight:bold;">(VENCIDA)</span>' !!}
      @else
        —
      @endif
    </div>
  </div>
</div>

<hr>

<h3>Actualizar estado</h3>
<form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}">
  @csrf
  <label>Estado</label><br>
  <select name="status" style="width:260px;">
    @foreach($statuses as $k => $label)
      <option value="{{ $k }}" {{ $repair->status === $k ? 'selected' : '' }}>{{ $label }}</option>
    @endforeach
  </select>
  <br><br>

  <label>Comentario (opcional)</label><br>
  <input type="text" name="comment" style="width:520px;max-width:100%;" maxlength="500">
  <br><br>

  <button type="submit">Guardar estado</button>
</form>

@if(session('wa_after') && !empty(session('wa_after.url')))
  <div style="margin-top:10px;">
    <b>Acción rápida:</b>
    <a href="{{ session('wa_after.url') }}" target="_blank">Abrir WhatsApp con mensaje del nuevo estado</a>
  </div>
@endif

<hr>

<h3>WhatsApp</h3>
<div><b>Estado actual:</b> {{ $statuses[$repair->status] ?? $repair->status }}</div>
<div>
  <b>Notificación:</b>
  @if(!empty($waNotifiedCurrent))
    ✅ Avisado
    @if(!empty($waNotifiedAt))
      ({{ \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('Y-m-d H:i') }})
    @endif
  @else
    Pendiente
  @endif
</div>

@if(!empty($waUrl))
  <p style="margin-top:8px;">
    <a href="{{ $waUrl }}" target="_blank">Abrir WhatsApp</a>
  </p>

  <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}">
    @csrf
    <button type="submit">Registrar envío (manual)</button>
  </form>
@endif

<h4 style="margin-top:14px;">Mensaje armado</h4>
<pre style="white-space:pre-wrap;border:1px solid #ddd;padding:10px;border-radius:8px;">{{ $waMessage ?? '' }}</pre>

<h4>Historial de WhatsApp</h4>
@if($waLogs->isEmpty())
  <p>No hay envíos registrados.</p>
@else
  <ul>
    @foreach($waLogs as $log)
      <li>
        {{ $log->sent_at ? $log->sent_at->format('Y-m-d H:i') : '—' }}
        — {{ $statuses[$log->notified_status] ?? $log->notified_status }}
        — {{ $log->sentBy->name ?? '—' }}
        — {{ $log->phone ?? '—' }}
      </li>
    @endforeach
  </ul>
@endif

<hr>

<h3>Historial de estados (timeline)</h3>
@if($history->isEmpty())
  <p>Sin movimientos aún.</p>
@else
  <div style="border-left:3px solid #ddd;padding-left:12px;">
    @foreach($history as $h)
      <div style="margin:10px 0;">
        <div style="color:#555;font-size:12px;">
          {{ $h->changed_at ? \Illuminate\Support\Carbon::parse($h->changed_at)->format('Y-m-d H:i') : '—' }}
        </div>
        <div>
          <b>
            {{ $h->from_status ? ($statuses[$h->from_status] ?? $h->from_status) : '—' }}
            →
            {{ $statuses[$h->to_status] ?? $h->to_status }}
          </b>
        </div>
        <div style="color:#333;">
          {{ $h->comment ?? '—' }}
        </div>
      </div>
    @endforeach
  </div>
@endif

<hr>

<h3>Editar datos</h3>
<form method="POST" action="{{ route('admin.repairs.update', $repair) }}">
  @csrf
  @method('PUT')

  <h4>Vincular a usuario (opcional)</h4>
  <label>Email del usuario</label><br>
  <input type="email" name="user_email" value="{{ old('user_email', $linkedUserEmail) }}" style="width:320px;max-width:100%;"><br><br>

  <label>
    <input type="checkbox" name="unlink_user" value="1" {{ old('unlink_user') ? 'checked' : '' }}>
    Desvincular usuario
  </label>
  <p style="margin-top:6px;color:#666;">Si marcás “Desvincular”, se borra el vínculo aunque pongas un email.</p>

  <hr>

  <h4>Cliente</h4>
  <label>Nombre</label><br>
  <input type="text" name="customer_name" value="{{ old('customer_name', $repair->customer_name) }}" required style="width:320px;max-width:100%;"><br><br>

  <label>Teléfono</label><br>
  <input type="text" name="customer_phone" value="{{ old('customer_phone', $repair->customer_phone) }}" required style="width:320px;max-width:100%;">

  <hr>

  <h4>Equipo</h4>
  <label>Marca</label><br>
  <input type="text" name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}" style="width:320px;max-width:100%;"><br><br>

  <label>Modelo</label><br>
  <input type="text" name="device_model" value="{{ old('device_model', $repair->device_model) }}" style="width:320px;max-width:100%;">

  <hr>

  <h4>Trabajo</h4>
  <label>Falla reportada</label><br>
  <textarea name="issue_reported" rows="3" required style="width:520px;max-width:100%;">{{ old('issue_reported', $repair->issue_reported) }}</textarea><br><br>

  <label>Diagnóstico</label><br>
  <textarea name="diagnosis" rows="3" style="width:520px;max-width:100%;">{{ old('diagnosis', $repair->diagnosis) }}</textarea>

  <hr>

  <h4>Costos / Precio</h4>
  <label>Repuestos</label><br>
  <input type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}" style="width:200px;"><br><br>

  <label>Mano de obra</label><br>
  <input type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}" style="width:200px;"><br><br>

  <label>Precio final</label><br>
  <input type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $repair->final_price) }}" style="width:200px;"><br><br>

  <label>Garantía (días)</label><br>
  <input type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}" style="width:200px;">

  <hr>

  <h4>Pagos</h4>
  <label>Pagado</label><br>
  <input type="number" step="0.01" min="0" name="paid_amount" value="{{ old('paid_amount', $repair->paid_amount) }}" style="width:200px;"><br><br>

  <label>Método</label><br>
  <select name="payment_method" style="width:220px;">
    <option value="">—</option>
    @foreach(($paymentMethods ?? []) as $k => $label)
      <option value="{{ $k }}" {{ old('payment_method', $repair->payment_method) === $k ? 'selected' : '' }}>
        {{ $label }}
      </option>
    @endforeach
  </select><br><br>

  <label>Notas de pago</label><br>
  <textarea name="payment_notes" rows="2" style="width:520px;max-width:100%;">{{ old('payment_notes', $repair->payment_notes) }}</textarea>

  <hr>

  <h4>Notas</h4>
  <textarea name="notes" rows="3" style="width:520px;max-width:100%;">{{ old('notes', $repair->notes) }}</textarea>

  <br><br>
  <button type="submit">Guardar cambios</button>
</form>
@endsection

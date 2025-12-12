@extends('layouts.app')

@section('title', 'Admin - Nueva reparación')

@section('content')
@php
    $prefill = [
        'user_email' => request('user_email'),
        'customer_name' => request('customer_name'),
        'customer_phone' => request('customer_phone'),
        'device_brand' => request('device_brand'),
        'device_model' => request('device_model'),
        'issue_reported' => request('issue_reported'),
        'diagnosis' => request('diagnosis'),
        'parts_cost' => request('parts_cost'),
        'labor_cost' => request('labor_cost'),
        'final_price' => request('final_price'),
        'status' => request('status', 'received'),
        'warranty_days' => request('warranty_days'),
        'notes' => request('notes'),
    ];
@endphp

<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
    <h1 style="margin:0;">Nueva reparación</h1>
    <a href="{{ route('admin.repairs.index') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #eee; border-radius:12px;">
        ← Volver a reparaciones
    </a>
</div>

@if($errors->any())
    <div style="margin-top:12px; padding:12px; border:1px solid #fecaca; background:#fef2f2; border-radius:12px;">
        <strong>Revisá estos errores:</strong>
        <ul style="margin:8px 0 0; padding-left:18px;">
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<form method="POST" action="{{ route('admin.repairs.store') }}" style="margin-top:14px; display:flex; flex-direction:column; gap:14px;">
    @csrf

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <h3 style="margin:0 0 10px;">Vincular a usuario (opcional)</h3>
        <label>Email del usuario</label><br>
        <input type="email" name="user_email" value="{{ old('user_email', $prefill['user_email']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" placeholder="cliente@email.com">
        <div style="opacity:.75; margin-top:6px; font-size:13px;">Si existe ese email en la tabla users, la reparación queda vinculada.</div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
        <div>
            <label>Nombre del cliente *</label><br>
            <input type="text" name="customer_name" required value="{{ old('customer_name', $prefill['customer_name']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Teléfono del cliente *</label><br>
            <input type="text" name="customer_phone" required value="{{ old('customer_phone', $prefill['customer_phone']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" placeholder="Ej: 341xxxxxxx">
            <div style="opacity:.75; margin-top:6px; font-size:13px;">Se normaliza a solo números al guardar.</div>
        </div>

        <div>
            <label>Marca del equipo</label><br>
            <input type="text" name="device_brand" value="{{ old('device_brand', $prefill['device_brand']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" placeholder="Samsung / iPhone / Xiaomi...">
        </div>

        <div>
            <label>Modelo del equipo</label><br>
            <input type="text" name="device_model" value="{{ old('device_model', $prefill['device_model']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" placeholder="A52 / 11 Pro Max / Redmi Note...">
        </div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <label>Problema reportado *</label><br>
        <textarea name="issue_reported" required rows="4" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">{{ old('issue_reported', $prefill['issue_reported']) }}</textarea>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <label>Diagnóstico (opcional)</label><br>
        <textarea name="diagnosis" rows="3" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">{{ old('diagnosis', $prefill['diagnosis']) }}</textarea>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
        <div>
            <label>Costo repuestos</label><br>
            <input type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $prefill['parts_cost']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Costo mano de obra</label><br>
            <input type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $prefill['labor_cost']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Precio final (opcional)</label><br>
            <input type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $prefill['final_price']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Garantía (días)</label><br>
            <input type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $prefill['warranty_days']) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
        <div>
            <label>Estado *</label><br>
            @php $selected = old('status', $prefill['status'] ?? 'received'); @endphp
            <select name="status" required style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
                @foreach($statuses as $key => $label)
                    <option value="{{ $key }}" {{ $selected === $key ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
            </select>
        </div>

        <div>
            <label>Notas (opcional)</label><br>
            <textarea name="notes" rows="3" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">{{ old('notes', $prefill['notes']) }}</textarea>
        </div>
    </div>

    <button type="submit" style="padding:12px 14px; border-radius:12px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">
        Crear reparación
    </button>
</form>
@endsection

@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Nueva reparación</h1>

    @if ($errors->any())
        <div style="margin:12px 0; padding:10px; border:1px solid #f2c; border-radius:8px;">
            <ul style="margin:0; padding-left:18px;">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('admin.repairs.store') }}" style="display:flex; flex-direction:column; gap:10px; max-width:560px;">
        @csrf

        <label>Cliente</label>
        <input name="customer_name" value="{{ old('customer_name') }}" required>

        <label>Teléfono</label>
        <input name="customer_phone" value="{{ old('customer_phone') }}" required>

        <label>Marca</label>
        <input name="device_brand" value="{{ old('device_brand') }}">

        <label>Modelo</label>
        <input name="device_model" value="{{ old('device_model') }}">

        <label>Problema reportado</label>
        <textarea name="issue_reported" required>{{ old('issue_reported') }}</textarea>

        <label>Diagnóstico</label>
        <textarea name="diagnosis">{{ old('diagnosis') }}</textarea>

        <label>Costo repuestos</label>
        <input name="parts_cost" type="number" step="0.01" value="{{ old('parts_cost', 0) }}">

        <label>Costo mano de obra</label>
        <input name="labor_cost" type="number" step="0.01" value="{{ old('labor_cost', 0) }}">

        <label>Precio final</label>
        <input name="final_price" type="number" step="0.01" value="{{ old('final_price') }}">

        <label>Estado</label>
        <select name="status" required>
            @foreach($statuses as $k => $label)
                <option value="{{ $k }}" @selected(old('status', 'received') === $k)>{{ $label }}</option>
            @endforeach
        </select>

        <label>Garantía (días)</label>
        <input name="warranty_days" type="number" value="{{ old('warranty_days', 0) }}">

        <label>Notas</label>
        <textarea name="notes">{{ old('notes') }}</textarea>

        <button type="submit">Crear</button>
    </form>
</div>
@endsection

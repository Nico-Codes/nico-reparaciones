@extends('layouts.app')

@section('content')
<div class="container">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Reparación {{ $repair->code }}</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <a href="{{ route('admin.repairs.print', $repair) }}" target="_blank" style="text-decoration:none;">
                🖨️ Imprimir comprobante
            </a>

            <a href="{{ route('admin.repairs.index') }}" style="text-decoration:none;">
                ← Volver
            </a>
        </div>
    </div>

    @if (session('success'))
        <div style="margin:12px 0; padding:10px; border:1px solid #7c7; border-radius:8px;">
            {{ session('success') }}
        </div>
    @endif

    @if ($errors->any())
        <div style="margin:12px 0; padding:10px; border:1px solid #f2c; border-radius:8px;">
            <ul style="margin:0; padding-left:18px;">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- NUEVO: Banner post-cambio de estado --}}
    @if(session('wa_after'))
        @php
            $waAfter = session('wa_after');
        @endphp
        <div style="margin:12px 0; padding:12px; border:1px solid #cfe9cf; background:#f3fff3; border-radius:12px;">
            <b>¿Avisar por WhatsApp?</b>
            <div style="margin-top:8px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                @if(!empty($waAfter['url']))
                    <a href="{{ $waAfter['url'] }}" target="_blank" style="text-decoration:none; border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff;">
                        💬 Abrir WhatsApp ({{ $waAfter['phone'] }})
                    </a>
                @else
                    <span style="border:1px solid #f2c; padding:8px 12px; border-radius:10px; background:#fff;">
                        No se pudo armar el link (revisar teléfono)
                    </span>
                @endif

                <button type="button" onclick="copyTextToClipboard(@json($waAfter['message'] ?? ''))"
                        style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
                    📋 Copiar mensaje
                </button>
            </div>
        </div>
    @endif

    <p><b>Cliente:</b> {{ $repair->customer_name }} ({{ $repair->customer_phone }})</p>
    <p><b>Vinculada a usuario:</b>
        @if($repair->user_id)
            Sí (user_id: {{ $repair->user_id }}) @if($linkedUserEmail) - {{ $linkedUserEmail }} @endif
        @else
            No
        @endif
    </p>

    <p><b>Equipo:</b> {{ $repair->device_brand }} {{ $repair->device_model }}</p>
    <p><b>Estado:</b> {{ $statuses[$repair->status] ?? $repair->status }}</p>

    <hr>

    <h3>WhatsApp</h3>

    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">
        @if($waUrl)
            <a href="{{ $waUrl }}" target="_blank" style="text-decoration:none; border:1px solid #ddd; padding:8px 12px; border-radius:10px;">
                💬 Abrir WhatsApp ({{ $waPhone }})
            </a>
        @else
            <div style="border:1px solid #f2c; padding:8px 12px; border-radius:10px;">
                No se pudo armar el link de WhatsApp (revisar teléfono).
            </div>
        @endif

        <button type="button" onclick="copyWaMessage()"
                style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
            📋 Copiar mensaje
        </button>
    </div>

    <textarea id="waMessage" style="width:100%; max-width:900px; min-height:140px; padding:10px; border:1px solid #eee; border-radius:10px;">{{ $waMessage }}</textarea>

    <script>
        function copyWaMessage() {
            const el = document.getElementById('waMessage');
            el.select();
            el.setSelectionRange(0, 999999);
            document.execCommand('copy');
            alert('Mensaje copiado ✅');
        }

        // NUEVO: copiar texto directo (para el banner post-estado)
        function copyTextToClipboard(text) {
            const tmp = document.createElement('textarea');
            tmp.value = text || '';
            document.body.appendChild(tmp);
            tmp.select();
            tmp.setSelectionRange(0, 999999);
            document.execCommand('copy');
            document.body.removeChild(tmp);
            alert('Mensaje copiado ✅');
        }
    </script>

    <hr>

    <h3>Editar datos</h3>
    <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" style="display:flex; flex-direction:column; gap:10px; max-width:680px;">
        @csrf
        @method('PUT')

        <div style="border:1px solid #eee; padding:10px; border-radius:10px;">
            <h4 style="margin:0 0 8px;">Vincular a usuario (opcional)</h4>

            <label>Email del usuario</label>
            <input name="user_email" value="{{ old('user_email', $linkedUserEmail) }}" placeholder="cliente@email.com">

            <label style="display:flex; gap:8px; align-items:center; margin-top:8px;">
                <input type="checkbox" name="unlink_user" value="1" @checked(old('unlink_user') == '1')>
                Desvincular usuario
            </label>

            <small style="color:#666;">
                Si cargás un email existente, la reparación aparecerá en <b>/mis-reparaciones</b>.
            </small>
        </div>

        <div style="border:1px solid #eee; padding:10px; border-radius:10px;">
            <h4 style="margin:0 0 8px;">Cliente</h4>

            <label>Nombre</label>
            <input name="customer_name" value="{{ old('customer_name', $repair->customer_name) }}" required>

            <label>Teléfono</label>
            <input name="customer_phone" value="{{ old('customer_phone', $repair->customer_phone) }}" required>
        </div>

        <div style="border:1px solid #eee; padding:10px; border-radius:10px;">
            <h4 style="margin:0 0 8px;">Equipo</h4>

            <label>Marca</label>
            <input name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}">

            <label>Modelo</label>
            <input name="device_model" value="{{ old('device_model', $repair->device_model) }}">
        </div>

        <div style="border:1px solid #eee; padding:10px; border-radius:10px;">
            <h4 style="margin:0 0 8px;">Problema / Diagnóstico</h4>

            <label>Problema reportado</label>
            <textarea name="issue_reported" required>{{ old('issue_reported', $repair->issue_reported) }}</textarea>

            <label>Diagnóstico</label>
            <textarea name="diagnosis">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
        </div>

        <div style="border:1px solid #eee; padding:10px; border-radius:10px;">
            <h4 style="margin:0 0 8px;">Costos</h4>

            <label>Costo repuestos</label>
            <input name="parts_cost" type="number" step="0.01" value="{{ old('parts_cost', $repair->parts_cost) }}">

            <label>Costo mano de obra</label>
            <input name="labor_cost" type="number" step="0.01" value="{{ old('labor_cost', $repair->labor_cost) }}">

            <label>Precio final</label>
            <input name="final_price" type="number" step="0.01" value="{{ old('final_price', $repair->final_price) }}">

            <label>Garantía (días)</label>
            <input name="warranty_days" type="number" value="{{ old('warranty_days', $repair->warranty_days) }}">

            <label>Notas</label>
            <textarea name="notes">{{ old('notes', $repair->notes) }}</textarea>

            <button type="submit">Guardar cambios</button>
        </div>
    </form>

    <hr>

    <h3>Cambiar estado</h3>
    <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        @csrf
        <select name="status">
            @foreach($statuses as $k => $label)
                <option value="{{ $k }}" @selected($repair->status === $k)>{{ $label }}</option>
            @endforeach
        </select>
        <input name="comment" placeholder="Comentario (opcional)" style="min-width:240px;">
        <button type="submit">Actualizar estado</button>
    </form>

    <hr>

    <h3>Historial</h3>
    <ul>
        @forelse($history as $h)
            <li>
                {{ $h->changed_at?->format('Y-m-d H:i') ?? $h->changed_at }}:
                {{ $statuses[$h->from_status] ?? ($h->from_status ?? '—') }}
                →
                {{ $statuses[$h->to_status] ?? $h->to_status }}
                @if($h->comment) ({{ $h->comment }}) @endif
            </li>
        @empty
            <li>Sin historial.</li>
        @endforelse
    </ul>
</div>
@endsection

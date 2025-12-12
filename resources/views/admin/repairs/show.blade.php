@extends('layouts.app')

@section('content')
<div class="container">

    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Reparación {{ $repair->code }}</h1>

        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <a href="{{ route('admin.repairs.print', $repair) }}" target="_blank" rel="noopener">🖨️ Imprimir comprobante</a>
            <a href="{{ route('admin.repairs.index') }}">← Volver</a>
        </div>
    </div>

    @if (session('success'))
        <div style="padding:10px; border:1px solid #cfe9cf; background:#eef9ee; margin:10px 0; border-radius:10px;">
            {{ session('success') }}
        </div>
    @endif

    @if ($errors->any())
        <div style="padding:10px; border:1px solid #f0c2c2; background:#ffecec; margin:10px 0; border-radius:10px;">
            <ul style="margin:0; padding-left:18px;">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- ✅ 1) Bloque post-cambio de estado --}}
    @if(session('wa_after'))
        @php $waAfter = session('wa_after'); @endphp

        <div style="padding:12px; border:1px solid #ddd; background:#fafafa; margin:14px 0; border-radius:12px;">
            <strong>¿Avisar por WhatsApp?</strong>
            <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                @if(!empty($waAfter['url']))
                    <a href="{{ $waAfter['url'] }}"
                       target="_blank"
                       rel="noopener"
                       onclick="waQuickLog()"
                       style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; text-decoration:none;">
                        💬 Abrir WhatsApp + Registrar
                    </a>
                @else
                    <span style="border:1px solid #f0c2c2; padding:8px 12px; border-radius:10px; background:#fff;">
                        No se pudo armar el link (revisar teléfono)
                    </span>
                @endif

                <button type="button" onclick="copyText('wa_after_message')"
                        style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
                    📋 Copiar mensaje
                </button>

                <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}" style="display:inline;">
                    @csrf
                    <button type="submit"
                            style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
                        ✅ Registrar envío (manual)
                    </button>
                </form>
            </div>

            <textarea id="wa_after_message" rows="6" style="width:100%; margin-top:10px; padding:10px; border:1px solid #eee; border-radius:10px;">{{ $waAfter['message'] }}</textarea>
        </div>

    {{-- ✅ 2) Banner inteligente (solo si NO venís del wa_after) --}}
    @else
        @if($waNotifiedCurrent)
            <div style="padding:12px; border:1px solid #cfe9cf; background:#eef9ee; margin:14px 0; border-radius:12px;">
                ✅ WhatsApp ya registrado para este estado:
                <strong>{{ $statuses[$repair->status] ?? $repair->status }}</strong>
                @if($waNotifiedAt)
                    — {{ \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('Y-m-d H:i') }}
                @endif
            </div>
        @else
            <div style="padding:12px; border:1px solid #f1e1a6; background:#fff8d9; margin:14px 0; border-radius:12px;">
                <strong>⚠️ Pendiente de avisar por WhatsApp</strong>
                <div style="margin-top:6px; color:#444;">
                    Estado actual: <strong>{{ $statuses[$repair->status] ?? $repair->status }}</strong>
                </div>

                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    @if($waUrl)
                        <a href="{{ $waUrl }}"
                           target="_blank"
                           rel="noopener"
                           onclick="waQuickLog()"
                           style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; text-decoration:none;">
                            💬 Abrir WhatsApp + Registrar
                        </a>
                    @else
                        <span style="border:1px solid #f0c2c2; padding:8px 12px; border-radius:10px; background:#fff;">
                            No se pudo armar el link (revisar teléfono)
                        </span>
                    @endif

                    <button type="button" onclick="copyText('wa_message')"
                            style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
                        📋 Copiar mensaje
                    </button>

                    <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}" style="display:inline;">
                        @csrf
                        <button type="submit"
                                style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
                            ✅ Registrar envío (manual)
                        </button>
                    </form>
                </div>
            </div>
        @endif
    @endif

    <div style="margin-top:10px;">
        <p><strong>Cliente:</strong> {{ $repair->customer_name }} ({{ $repair->customer_phone }})</p>

        <p>
            <strong>Vinculada a usuario:</strong>
            @if($repair->user_id)
                Sí (user_id: {{ $repair->user_id }}) @if($linkedUserEmail) - {{ $linkedUserEmail }} @endif
            @else
                No
            @endif
        </p>

        <p><strong>Equipo:</strong> {{ $repair->device_brand }} {{ $repair->device_model }}</p>
        <p><strong>Estado:</strong> {{ $statuses[$repair->status] ?? $repair->status }}</p>
    </div>

    <hr>

    <h3>WhatsApp</h3>

    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        @if($waUrl)
            <a href="{{ $waUrl }}"
               target="_blank"
               rel="noopener"
               onclick="waQuickLog()"
               style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; text-decoration:none;">
                💬 Abrir WhatsApp + Registrar
            </a>
        @else
            <span style="border:1px solid #f0c2c2; padding:8px 12px; border-radius:10px; background:#fff;">
                No se pudo armar el link de WhatsApp (revisar teléfono).
            </span>
        @endif

        <button type="button" onclick="copyText('wa_message')"
                style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
            📋 Copiar mensaje
        </button>

        <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}" style="display:inline;">
            @csrf
            <button type="submit"
                    style="border:1px solid #ddd; padding:8px 12px; border-radius:10px; background:#fff; cursor:pointer;">
                ✅ Registrar envío (manual)
            </button>
        </form>
    </div>

    <textarea id="wa_message" rows="6" style="width:100%; margin-top:10px; padding:10px; border:1px solid #eee; border-radius:10px;">{{ $waMessage }}</textarea>

    <div style="margin-top:14px;">
        <h4>Historial WhatsApp</h4>

        <ul style="margin:0; padding-left:18px;">
            @forelse($waLogs as $log)
                <li style="margin:6px 0;">
                    <strong>{{ $log->sent_at?->format('Y-m-d H:i') ?? $log->sent_at }}</strong>
                    — Estado: <strong>{{ $statuses[$log->notified_status] ?? $log->notified_status }}</strong>
                    — Tel: {{ $log->phone ?? '—' }}
                    @if($log->sentBy)
                        — Por: {{ $log->sentBy->name ?? ('ID '.$log->sent_by) }}
                    @endif
                </li>
            @empty
                <li>Sin envíos registrados todavía.</li>
            @endforelse
        </ul>
    </div>

    <hr>

    <h3>Editar datos</h3>

    <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" style="display:flex; flex-direction:column; gap:12px;">
        @csrf
        @method('PUT')

        <div style="border:1px solid #eee; padding:12px; border-radius:12px;">
            <h4 style="margin:0 0 8px;">Vincular a usuario (opcional)</h4>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div style="flex:1; min-width:260px;">
                    <label>Email del usuario</label><br>
                    <input type="email" name="user_email" value="{{ old('user_email', $linkedUserEmail) }}" style="width:100%;">
                </div>

                <div style="display:flex; align-items:end; gap:8px;">
                    <label style="display:flex; gap:8px; align-items:center;">
                        <input type="checkbox" name="unlink_user" value="1" {{ old('unlink_user') ? 'checked' : '' }}>
                        Desvincular usuario
                    </label>
                </div>
            </div>

            <p style="margin:8px 0 0; color:#666;">
                Si cargás un email existente, la reparación aparecerá en <code>/mis-reparaciones</code>.
            </p>
        </div>

        <div style="border:1px solid #eee; padding:12px; border-radius:12px;">
            <h4 style="margin:0 0 8px;">Cliente</h4>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div style="flex:1; min-width:260px;">
                    <label>Nombre</label><br>
                    <input type="text" name="customer_name" value="{{ old('customer_name', $repair->customer_name) }}" style="width:100%;" required>
                </div>
                <div style="flex:1; min-width:260px;">
                    <label>Teléfono</label><br>
                    <input type="text" name="customer_phone" value="{{ old('customer_phone', $repair->customer_phone) }}" style="width:100%;" required>
                </div>
            </div>
        </div>

        <div style="border:1px solid #eee; padding:12px; border-radius:12px;">
            <h4 style="margin:0 0 8px;">Equipo</h4>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div style="flex:1; min-width:260px;">
                    <label>Marca</label><br>
                    <input type="text" name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}" style="width:100%;">
                </div>
                <div style="flex:1; min-width:260px;">
                    <label>Modelo</label><br>
                    <input type="text" name="device_model" value="{{ old('device_model', $repair->device_model) }}" style="width:100%;">
                </div>
            </div>
        </div>

        <div style="border:1px solid #eee; padding:12px; border-radius:12px;">
            <h4 style="margin:0 0 8px;">Problema / Diagnóstico</h4>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div style="flex:1; min-width:260px;">
                    <label>Problema reportado</label><br>
                    <textarea name="issue_reported" rows="4" style="width:100%;" required>{{ old('issue_reported', $repair->issue_reported) }}</textarea>
                </div>
                <div style="flex:1; min-width:260px;">
                    <label>Diagnóstico</label><br>
                    <textarea name="diagnosis" rows="4" style="width:100%;">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
                </div>
            </div>
        </div>

        <div style="border:1px solid #eee; padding:12px; border-radius:12px;">
            <h4 style="margin:0 0 8px;">Costos</h4>

            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <div style="flex:1; min-width:220px;">
                    <label>Costo repuestos</label><br>
                    <input type="number" step="0.01" name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}" style="width:100%;">
                </div>
                <div style="flex:1; min-width:220px;">
                    <label>Costo mano de obra</label><br>
                    <input type="number" step="0.01" name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}" style="width:100%;">
                </div>
                <div style="flex:1; min-width:220px;">
                    <label>Precio final</label><br>
                    <input type="number" step="0.01" name="final_price" value="{{ old('final_price', $repair->final_price) }}" style="width:100%;">
                </div>
                <div style="flex:1; min-width:220px;">
                    <label>Garantía (días)</label><br>
                    <input type="number" name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}" style="width:100%;">
                </div>
            </div>

            <div style="margin-top:10px;">
                <label>Notas</label><br>
                <textarea name="notes" rows="3" style="width:100%;">{{ old('notes', $repair->notes) }}</textarea>
            </div>

            <div style="margin-top:12px;">
                <button type="submit">Guardar cambios</button>
            </div>
        </div>
    </form>

    <hr>

    <h3>Cambiar estado</h3>

    <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}">
        @csrf

        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:end;">
            <div>
                <label>Nuevo estado</label><br>
                <select name="status">
                    @foreach($statuses as $k => $label)
                        <option value="{{ $k }}" {{ $repair->status === $k ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>
            </div>

            <div style="flex:1; min-width:260px;">
                <label>Comentario (opcional)</label><br>
                <input type="text" name="comment" value="{{ old('comment') }}" style="width:100%;">
            </div>

            <div>
                <button type="submit">Actualizar estado</button>
            </div>
        </div>
    </form>

    <hr>

    <h3>Historial de estados</h3>

    <ul style="margin:0; padding-left:18px;">
        @forelse($history as $h)
            <li style="margin:6px 0;">
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

<script>
    function copyText(id) {
        const el = document.getElementById(id);
        if (!el) return;

        const text = el.value || el.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
            alert('Copiado ✅');
            return;
        }

        el.select && el.select();
        document.execCommand && document.execCommand('copy');
        alert('Copiado ✅');
    }

    // ✅ 1-click: registra el envío en segundo plano
    function waQuickLog() {
        const url = @json(route('admin.repairs.whatsappLogAjax', $repair));
        const token = @json(csrf_token());

        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ source: 'open_whatsapp' }),
            keepalive: true
        }).catch(() => {});
    }
</script>
@endsection

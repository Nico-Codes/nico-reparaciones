@extends('layouts.app')

@section('content')
<div class="container" style="max-width:1100px;">

    {{-- Flash messages --}}
    @if(session('success'))
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;padding:10px 12px;border-radius:10px;margin-bottom:12px;">
            {{ session('success') }}
        </div>
    @endif

    @if($errors->any())
        <div style="background:#fef2f2;border:1px solid #fecaca;color:#7f1d1d;padding:10px 12px;border-radius:10px;margin-bottom:12px;">
            <strong>Hay errores:</strong>
            <ul style="margin:8px 0 0; padding-left:18px;">
                @foreach($errors->all() as $e)
                    <li>{{ $e }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- Header + acciones --}}
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;">
        <div>
            <h1 style="margin:0;">Reparación</h1>
            <div style="color:#666;margin-top:4px;">
                <strong>{{ $repair->code ?? ('#'.$repair->id) }}</strong>
                — {{ $statuses[$repair->status] ?? $repair->status }}
            </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <a href="{{ route('admin.repairs.index') }}">⬅ Volver</a>

            <a href="{{ route('admin.repairs.print', $repair) }}" target="_blank" rel="noopener">
                🖨️ Imprimir
            </a>

            @if(!empty($waUrl))
                <a
                    href="{{ $waUrl }}"
                    target="_blank"
                    rel="noopener"
                    onclick="waQuickLog('{{ $repair->id }}','{{ route('admin.repairs.whatsappLogAjax', $repair) }}');"
                    title="Abrir WhatsApp + Registrar"
                >
                    💬 WhatsApp
                </a>
            @else
                <span title="No se pudo armar WhatsApp (revisar teléfono)" style="color:#999;">💬 WhatsApp —</span>
            @endif
        </div>
    </div>

    {{-- Resumen --}}
    <div style="margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:12px;">
            <h3 style="margin:0 0 10px;">Cliente</h3>
            <div style="color:#444;"><strong>Nombre:</strong> {{ $repair->customer_name }}</div>
            <div style="color:#444;"><strong>Tel:</strong> {{ $repair->customer_phone }}</div>
            <div style="color:#444;"><strong>Usuario:</strong> {{ $linkedUserEmail ?? '—' }}</div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:12px;">
            <h3 style="margin:0 0 10px;">Equipo</h3>
            <div style="color:#444;">
                <strong>Marca/Modelo:</strong>
                {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}
            </div>
            <div style="color:#444;"><strong>Falla:</strong> {{ $repair->issue_reported }}</div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:12px;">
            <h3 style="margin:0 0 10px;">Costos</h3>
            <div style="color:#444;"><strong>Repuestos:</strong> {{ number_format((float)$repair->parts_cost, 0, ',', '.') }}</div>
            <div style="color:#444;"><strong>Mano de obra:</strong> {{ number_format((float)$repair->labor_cost, 0, ',', '.') }}</div>
            <div style="color:#444;"><strong>Precio final:</strong>
                {{ $repair->final_price !== null ? number_format((float)$repair->final_price, 0, ',', '.') : '—' }}
            </div>
            <div style="color:#444;"><strong>Garantía:</strong> {{ ($repair->warranty_days ?? 0) ? ($repair->warranty_days.' días') : '—' }}</div>
        </div>
    </div>

    {{-- Cambiar estado --}}
    <div style="margin-top:14px;border:1px solid #eee;border-radius:12px;padding:12px;">
        <h3 style="margin:0 0 10px;">Actualizar estado</h3>

        <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;">
            @csrf

            <div>
                <label>Estado</label><br>
                <select name="status">
                    @foreach($statuses as $k => $label)
                        <option value="{{ $k }}" {{ $repair->status === $k ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>
            </div>

            <div style="flex:1;min-width:260px;">
                <label>Comentario (opcional)</label><br>
                <input type="text" name="comment" placeholder="Ej: listo para retirar" style="width:100%;">
            </div>

            <button type="submit">Guardar estado</button>
        </form>

        @if(session('wa_after') && !empty(session('wa_after.url')))
            <div style="margin-top:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;">
                <div style="font-weight:700;margin-bottom:6px;">Acción rápida</div>
                <a href="{{ session('wa_after.url') }}" target="_blank" rel="noopener">💬 Abrir WhatsApp con mensaje del nuevo estado</a>
            </div>
        @endif
    </div>

    {{-- WhatsApp info + logs --}}
    <div style="margin-top:14px;border:1px solid #eee;border-radius:12px;padding:12px;">
        <h3 style="margin:0 0 10px;">WhatsApp</h3>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
            <div style="border:1px solid #f2f2f2;border-radius:12px;padding:12px;">
                <div style="color:#666;font-size:12px;">Estado actual</div>
                <div style="font-weight:800;">
                    {{ $statuses[$repair->status] ?? $repair->status }}
                </div>
                <div style="margin-top:8px;">
                    @if(!empty($waNotifiedCurrent))
                        <span title="Ya avisado" style="font-weight:700;">✅ Avisado</span>
                        @if(!empty($waNotifiedAt))
                            <span style="color:#666;font-size:12px;">( {{ \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('Y-m-d H:i') }} )</span>
                        @endif
                    @else
                        <span title="Pendiente" style="font-weight:700;">🟡 Pendiente</span>
                    @endif
                </div>

                @if(!empty($waUrl))
                    <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
                        <a href="{{ $waUrl }}" target="_blank" rel="noopener"
                           onclick="waQuickLog('{{ $repair->id }}','{{ route('admin.repairs.whatsappLogAjax', $repair) }}');">
                            💬 Abrir WhatsApp + registrar
                        </a>

                        <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}">
                            @csrf
                            <button type="submit">Registrar (manual)</button>
                        </form>
                    </div>
                @endif
            </div>

            <div style="border:1px solid #f2f2f2;border-radius:12px;padding:12px;">
                <div style="color:#666;font-size:12px;">Mensaje armado</div>
                <textarea readonly style="width:100%;min-height:140px;margin-top:6px;">{{ $waMessage ?? '' }}</textarea>
            </div>
        </div>

        <div style="margin-top:12px;">
            <h4 style="margin:0 0 8px;">Historial de WhatsApp</h4>

            @if($waLogs->isEmpty())
                <div style="color:#666;">No hay envíos registrados.</div>
            @else
                <div style="overflow:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Fecha</th>
                                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Estado avisado</th>
                                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Por</th>
                                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Tel</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($waLogs as $log)
                                <tr>
                                    <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                        {{ $log->sent_at ? $log->sent_at->format('Y-m-d H:i') : '—' }}
                                    </td>
                                    <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                        {{ $statuses[$log->notified_status] ?? $log->notified_status }}
                                    </td>
                                    <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                        {{ $log->sentBy->name ?? '—' }}
                                    </td>
                                    <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                        {{ $log->phone ?? '—' }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>
    </div>

    {{-- Historial de estados --}}
    <div style="margin-top:14px;border:1px solid #eee;border-radius:12px;padding:12px;">
        <h3 style="margin:0 0 10px;">Historial de estados</h3>

        @if($history->isEmpty())
            <div style="color:#666;">Sin movimientos aún.</div>
        @else
            <div style="overflow:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Fecha</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">De</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">A</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Comentario</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($history as $h)
                            <tr>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $h->changed_at ? \Illuminate\Support\Carbon::parse($h->changed_at)->format('Y-m-d H:i') : '—' }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $h->from_status ? ($statuses[$h->from_status] ?? $h->from_status) : '—' }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $statuses[$h->to_status] ?? $h->to_status }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $h->comment ?? '—' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    {{-- Editar datos --}}
    <div style="margin-top:14px;border:1px solid #eee;border-radius:12px;padding:12px;">
        <h3 style="margin:0 0 10px;">Editar datos</h3>

        <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" style="display:flex;flex-direction:column;gap:12px;">
            @csrf
            @method('PUT')

            <div style="border:1px solid #f2f2f2;padding:12px;border-radius:12px;">
                <h4 style="margin:0 0 8px;">Vincular a usuario (opcional)</h4>

                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:260px;">
                        <label>Email del usuario</label><br>
                        <input type="email" name="user_email" value="{{ old('user_email', $linkedUserEmail) }}" style="width:100%;">
                    </div>

                    <div style="display:flex;align-items:end;gap:8px;">
                        <label style="display:flex;gap:8px;align-items:center;margin:0;">
                            <input type="checkbox" name="unlink_user" value="1">
                            Desvincular usuario
                        </label>
                    </div>
                </div>
                <div style="color:#666;font-size:12px;margin-top:6px;">
                    Si marcás “Desvincular”, se borra el vínculo aunque pongas un email.
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
                <div style="border:1px solid #f2f2f2;padding:12px;border-radius:12px;">
                    <h4 style="margin:0 0 8px;">Cliente</h4>

                    <label>Nombre</label><br>
                    <input type="text" name="customer_name" value="{{ old('customer_name', $repair->customer_name) }}" style="width:100%;"><br><br>

                    <label>Teléfono</label><br>
                    <input type="text" name="customer_phone" value="{{ old('customer_phone', $repair->customer_phone) }}" style="width:100%;">
                </div>

                <div style="border:1px solid #f2f2f2;padding:12px;border-radius:12px;">
                    <h4 style="margin:0 0 8px;">Equipo</h4>

                    <label>Marca</label><br>
                    <input type="text" name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}" style="width:100%;"><br><br>

                    <label>Modelo</label><br>
                    <input type="text" name="device_model" value="{{ old('device_model', $repair->device_model) }}" style="width:100%;">
                </div>

                <div style="border:1px solid #f2f2f2;padding:12px;border-radius:12px;">
                    <h4 style="margin:0 0 8px;">Trabajo</h4>

                    <label>Falla reportada</label><br>
                    <textarea name="issue_reported" style="width:100%;min-height:90px;">{{ old('issue_reported', $repair->issue_reported) }}</textarea><br><br>

                    <label>Diagnóstico</label><br>
                    <textarea name="diagnosis" style="width:100%;min-height:70px;">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
                </div>

                <div style="border:1px solid #f2f2f2;padding:12px;border-radius:12px;">
                    <h4 style="margin:0 0 8px;">Costos</h4>

                    <label>Repuestos</label><br>
                    <input type="number" step="0.01" name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}" style="width:100%;"><br><br>

                    <label>Mano de obra</label><br>
                    <input type="number" step="0.01" name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}" style="width:100%;"><br><br>

                    <label>Precio final</label><br>
                    <input type="number" step="0.01" name="final_price" value="{{ old('final_price', $repair->final_price) }}" style="width:100%;"><br><br>

                    <label>Garantía (días)</label><br>
                    <input type="number" name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}" style="width:100%;">
                </div>
            </div>

            <div style="border:1px solid #f2f2f2;padding:12px;border-radius:12px;">
                <h4 style="margin:0 0 8px;">Notas</h4>
                <textarea name="notes" style="width:100%;min-height:80px;">{{ old('notes', $repair->notes) }}</textarea>
            </div>

            <div>
                <button type="submit">Guardar cambios</button>
            </div>
        </form>
    </div>

</div>

<script>
function waQuickLog(repairId, logUrl) {
    const token = @json(csrf_token());

    fetch(logUrl, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: 'show_quick' }),
        keepalive: true
    }).catch(() => {});
}
</script>
@endsection

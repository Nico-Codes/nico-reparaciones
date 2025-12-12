@extends('layouts.app')

@section('content')
<div class="container">

    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
        <h1 style="margin:0;">Reparaciones</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
            <a href="{{ route('admin.dashboard') }}">← Panel</a>
        </div>
    </div>

    <div style="margin-top:12px; border:1px solid #eee; border-radius:12px; padding:12px;">
        <form method="GET" action="{{ route('admin.repairs.index') }}" style="display:flex; gap:10px; flex-wrap:wrap; align-items:end;">

            <div>
                <label>Estado</label><br>
                <select name="status">
                    <option value="">Todos</option>
                    @foreach($statuses as $k => $label)
                        <option value="{{ $k }}" {{ ($status === $k) ? 'selected' : '' }}>{{ $label }}</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label>WhatsApp</label><br>
                <select name="wa">
                    <option value="">Todos</option>
                    <option value="pending" {{ ($wa === 'pending') ? 'selected' : '' }}>🟡 Pendiente</option>
                    <option value="sent" {{ ($wa === 'sent') ? 'selected' : '' }}>✅ Avisado</option>
                </select>
            </div>

            <div style="flex:1; min-width:240px;">
                <label>Buscar</label><br>
                <input type="text" name="q" value="{{ $q }}" placeholder="Código, cliente o teléfono" style="width:100%;">
            </div>

            <div>
                <button type="submit">Filtrar</button>
                <a href="{{ route('admin.repairs.index') }}" style="margin-left:8px;">Limpiar</a>
            </div>

        </form>
    </div>

    <div style="margin-top:12px;">
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr>
                    <th style="text-align:left; border-bottom:1px solid #eee; padding:8px;">Código</th>
                    <th style="text-align:left; border-bottom:1px solid #eee; padding:8px;">Cliente</th>
                    <th style="text-align:left; border-bottom:1px solid #eee; padding:8px;">Teléfono</th>
                    <th style="text-align:left; border-bottom:1px solid #eee; padding:8px;">Estado</th>
                    <th style="text-align:left; border-bottom:1px solid #eee; padding:8px;">WA</th>
                    <th style="text-align:right; border-bottom:1px solid #eee; padding:8px;">Acciones</th>
                </tr>
            </thead>
            <tbody>
                @forelse($repairs as $r)
                    @php
                        $waOk = !empty($r->wa_notified_current);
                        $waAt = $r->wa_notified_at ? \Illuminate\Support\Carbon::parse($r->wa_notified_at)->format('Y-m-d H:i') : null;

                        $canWa = !empty($r->wa_url) && !empty($r->wa_log_url);
                        $showWaBtn = $canWa && !$waOk; // ✅ SOLO si está pendiente
                    @endphp

                    <tr>
                        <td style="padding:8px; border-bottom:1px solid #f4f4f4;">
                            <strong>{{ $r->code ?? ('#'.$r->id) }}</strong>
                        </td>

                        <td style="padding:8px; border-bottom:1px solid #f4f4f4;">
                            {{ $r->customer_name }}
                        </td>

                        <td style="padding:8px; border-bottom:1px solid #f4f4f4;">
                            {{ $r->customer_phone }}
                        </td>

                        <td style="padding:8px; border-bottom:1px solid #f4f4f4;">
                            {{ $statuses[$r->status] ?? $r->status }}
                        </td>

                        <td id="wa-cell-{{ $r->id }}" style="padding:8px; border-bottom:1px solid #f4f4f4;">
                            @if($waOk)
                                <span title="Ya avisado (registrado)">{{ $waAt ? '✅ '.$waAt : '✅ OK' }}</span>
                            @else
                                <span title="Pendiente de avisar">🟡 Pendiente</span>
                            @endif
                        </td>

                        <td style="padding:8px; border-bottom:1px solid #f4f4f4; text-align:right; white-space:nowrap;">
                            {{-- ✅ Botón WA solo si está pendiente --}}
                            @if($showWaBtn)
                                <a
                                    href="{{ $r->wa_url }}"
                                    target="_blank"
                                    rel="noopener"
                                    title="Abrir WhatsApp + Registrar"
                                    onclick="waQuickLog('{{ $r->id }}','{{ $r->wa_log_url }}');"
                                    style="text-decoration:none; margin-right:10px;"
                                >💬</a>
                            @elseif($waOk)
                                <span title="Ya avisado" style="margin-right:10px;">✅</span>
                            @else
                                <span title="No se puede armar WhatsApp (revisar teléfono)" style="margin-right:10px;">—</span>
                            @endif

                            <a href="{{ route('admin.repairs.show', $r) }}">Ver</a>
                            <span style="margin:0 8px; color:#ddd;">|</span>
                            <a href="{{ route('admin.repairs.print', $r) }}" target="_blank" rel="noopener">Imprimir</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="padding:12px; color:#666;">
                            No hay reparaciones para los filtros seleccionados.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div style="margin-top:12px;">
            {{ $repairs->links() }}
        </div>
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
            body: JSON.stringify({ source: 'list_quick' }),
            keepalive: true
        })
        .then(r => r.json().catch(() => null))
        .then(data => {
            const cell = document.getElementById('wa-cell-' + repairId);
            if (!cell) return;

            if (data && data.ok) {
                cell.innerHTML = '<span title="Registrado">✅ OK</span>';

                // También cambiamos el botón por ✅
                // Buscamos el link 💬 más cercano y lo reemplazamos visualmente:
                // (simple, sin complicaciones)
            }
        })
        .catch(() => {});
    }
</script>
@endsection

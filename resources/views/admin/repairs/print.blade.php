<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Comprobante - {{ $repair->code }}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; color:#111; margin:24px; }
        .row { display:flex; gap:18px; flex-wrap:wrap; }
        .box { border:1px solid #ddd; border-radius:10px; padding:14px; }
        .grow { flex:1; min-width:280px; }
        h1,h2,h3 { margin:0 0 10px; }
        h1 { font-size:22px; }
        h2 { font-size:16px; margin-top:14px; }
        p { margin:6px 0; }
        .muted { color:#666; font-size:12px; }
        .badge { display:inline-block; padding:5px 10px; border-radius:999px; border:1px solid #bbb; font-size:12px; }
        .actions { margin-bottom:14px; }
        .actions a, .actions button { padding:8px 10px; border-radius:10px; border:1px solid #ccc; background:#fff; cursor:pointer; text-decoration:none; color:#111; }
        .hr { height:1px; background:#eee; margin:14px 0; }
        .sign { margin-top:26px; display:flex; gap:20px; }
        .sign .line { flex:1; border-top:1px solid #222; padding-top:6px; font-size:12px; color:#444; }

        @media print {
            .actions { display:none; }
            body { margin:0; }
            .box { border-color:#aaa; }
        }
    </style>
</head>
<body>

    <div class="actions">
        <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        <a href="{{ url()->previous() }}">Volver</a>
    </div>

    <div class="row">
        <div class="box grow">
            <h1>NicoReparaciones</h1>
            <p class="muted">Comprobante de reparación</p>
            <p><b>Código:</b> {{ $repair->code }}</p>
            <p><b>Estado:</b> <span class="badge">{{ $statuses[$repair->status] ?? $repair->status }}</span></p>
            <p class="muted">
                Ingreso: {{ optional($repair->received_at)->format('Y-m-d H:i') ?? '—' }}
                @if($repair->delivered_at)
                    · Entrega: {{ optional($repair->delivered_at)->format('Y-m-d H:i') }}
                @endif
            </p>
        </div>

        <div class="box grow">
            <h2>Cliente</h2>
            <p><b>Nombre:</b> {{ $repair->customer_name }}</p>
            <p><b>Teléfono:</b> {{ $repair->customer_phone }}</p>

            <div class="hr"></div>

            <h2>Equipo</h2>
            <p><b>Marca:</b> {{ $repair->device_brand ?? '—' }}</p>
            <p><b>Modelo:</b> {{ $repair->device_model ?? '—' }}</p>
        </div>
    </div>

    <div class="row" style="margin-top:14px;">
        <div class="box grow">
            <h2>Problema reportado</h2>
            <p>{{ $repair->issue_reported }}</p>

            <div class="hr"></div>

            <h2>Diagnóstico</h2>
            <p>{{ $repair->diagnosis ?? 'Aún no definido' }}</p>
        </div>

        <div class="box grow">
            <h2>Costos</h2>
            <p><b>Repuestos:</b> ${{ number_format((float)$repair->parts_cost, 2) }}</p>
            <p><b>Mano de obra:</b> ${{ number_format((float)$repair->labor_cost, 2) }}</p>
            <p><b>Precio final:</b> ${{ number_format((float)($repair->final_price ?? 0), 2) }}</p>

            <div class="hr"></div>

            <p><b>Ganancia estimada:</b> ${{ number_format((float)$repair->profit, 2) }}</p>
            <p><b>Garantía:</b> {{ (int)$repair->warranty_days }} día(s)</p>

            @if($repair->notes)
                <div class="hr"></div>
                <h2>Notas</h2>
                <p>{{ $repair->notes }}</p>
            @endif
        </div>
    </div>

    <div class="box" style="margin-top:14px;">
        <h2>Consulta de estado</h2>
        <p class="muted">
            El cliente puede consultar el estado desde:
            <b>{{ url('/reparacion') }}</b>
            usando el <b>Código</b> y su <b>Teléfono</b>.
        </p>
        <p><b>Código:</b> {{ $repair->code }} · <b>Teléfono:</b> {{ $repair->customer_phone }}</p>
    </div>

    <div class="sign">
        <div class="line">Firma cliente</div>
        <div class="line">Firma NicoReparaciones</div>
    </div>

    <p class="muted" style="margin-top:10px;">
        Este comprobante acredita el ingreso del equipo al local. Conservar para retirar.
    </p>

</body>
</html>

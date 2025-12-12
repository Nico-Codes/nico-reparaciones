<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Imprimir reparación #{{ $repair->id }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color:#111; }
        .row { display:flex; gap:18px; flex-wrap:wrap; }
        .box { border:1px solid #ddd; border-radius:12px; padding:14px; flex:1; min-width:280px; }
        h1 { margin:0 0 10px; }
        h3 { margin:0 0 10px; }
        .kv { display:grid; grid-template-columns: 170px 1fr; gap:8px 12px; font-size:14px; }
        .k { opacity:.75; }
        .v { font-weight:600; }
        .muted { opacity:.7; font-size:12px; }
        .actions { display:flex; gap:10px; margin-bottom:16px; }
        .btn { border:1px solid #ddd; padding:10px 12px; border-radius:12px; text-decoration:none; color:#111; display:inline-block; }
        .btn-primary { border-color:#111; }
        @media print {
            .actions { display:none !important; }
            body { margin: 0; }
        }
    </style>
</head>
<body>

    <div class="actions">
        <a class="btn" href="{{ route('admin.repairs.show', $repair) }}">← Volver</a>
        <a class="btn btn-primary" href="#" onclick="window.print(); return false;">🖨️ Imprimir</a>
    </div>

    <h1>Reparación #{{ $repair->id }}</h1>
    <div class="muted">
        Creada: {{ optional($repair->created_at)->format('d/m/Y H:i') ?? '-' }}
        · Estado: <b>{{ $repair->status ?? '-' }}</b>
    </div>

    <div style="height:12px;"></div>

    <div class="row">
        <div class="box">
            <h3>Cliente</h3>
            <div class="kv">
                <div class="k">Nombre</div><div class="v">{{ $repair->customer_name ?? '-' }}</div>
                <div class="k">Teléfono</div><div class="v">{{ $repair->customer_phone ?? '-' }}</div>
                <div class="k">Email</div><div class="v">{{ $repair->customer_email ?? '-' }}</div>
                <div class="k">Usuario vinculado</div><div class="v">{{ $repair->user_id ?? '-' }}</div>
            </div>
        </div>

        <div class="box">
            <h3>Equipo</h3>
            <div class="kv">
                <div class="k">Tipo</div><div class="v">{{ $repair->device_type ?? '-' }}</div>
                <div class="k">Marca</div><div class="v">{{ $repair->device_brand ?? '-' }}</div>
                <div class="k">Modelo</div><div class="v">{{ $repair->device_model ?? '-' }}</div>
                <div class="k">IMEI / Serie</div><div class="v">{{ $repair->device_imei ?? $repair->serial_number ?? '-' }}</div>
            </div>
        </div>
    </div>

    <div style="height:12px;"></div>

    <div class="box">
        <h3>Detalle</h3>
        <div class="kv">
            <div class="k">Falla</div><div class="v">{{ $repair->problem ?? $repair->issue ?? '-' }}</div>
            <div class="k">Notas</div><div class="v">{{ $repair->notes ?? '-' }}</div>
            <div class="k">Contraseña / PIN</div><div class="v">{{ $repair->device_passcode ?? $repair->passcode ?? '-' }}</div>
            <div class="k">Accesorios</div><div class="v">{{ $repair->accessories ?? '-' }}</div>
        </div>
    </div>

    <div style="height:12px;"></div>

    <div class="row">
        <div class="box">
            <h3>Costos</h3>
            <div class="kv">
                <div class="k">Costo repuestos</div><div class="v">{{ $repair->parts_cost ?? '-' }}</div>
                <div class="k">Costo mano de obra</div><div class="v">{{ $repair->labor_cost ?? '-' }}</div>
                <div class="k">Precio al cliente</div><div class="v">{{ $repair->price ?? $repair->total ?? '-' }}</div>
                <div class="k">Seña</div><div class="v">{{ $repair->deposit ?? '-' }}</div>
            </div>
        </div>

        <div class="box">
            <h3>Garantía</h3>
            <div class="kv">
                <div class="k">Días de garantía</div><div class="v">{{ $repair->warranty_days ?? '-' }}</div>
                <div class="k">Vence</div><div class="v">{{ $repair->warranty_until ?? '-' }}</div>
            </div>
        </div>
    </div>

    <div style="height:16px;"></div>
    <div class="muted">
        {{ config('app.name', 'NicoReparaciones') }} · Documento interno / comprobante de reparación
    </div>

</body>
</html>

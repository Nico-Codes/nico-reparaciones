<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ticket Reparación - {{ $repair->code ?? ('#'.$repair->id) }}</title>

    <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f3f4f6}
        .sheet{max-width:800px;margin:18px auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px}
        .top{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed #cbd5e1;padding-bottom:10px;margin-bottom:10px}
        h1{margin:0;font-size:18px}
        .muted{color:#6b7280;font-size:12px;margin:4px 0 0}
        .meta{text-align:right;font-size:12px}
        .code{font-weight:800;font-size:14px}
        .box{border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-top:10px}
        .row{display:flex;justify-content:space-between;gap:12px;padding:3px 0;font-size:12px}
        .k{color:#6b7280;min-width:140px}
        .v{color:#111827;text-align:right;flex:1}
        .big{font-weight:800;font-size:13px}
        .signs{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
        .line{border-top:1px solid #111827;margin-top:26px;padding-top:6px;font-size:11px;text-align:center}
        .actions{display:flex;gap:8px;margin-top:12px}
        .btn{border:1px solid #111827;background:#111827;color:#fff;padding:8px 10px;border-radius:8px;font-size:12px;text-decoration:none;cursor:pointer}
        .btn.secondary{background:#fff;color:#111827}
        @media print{body{background:#fff}.sheet{border:none;border-radius:0;margin:0;max-width:none}.actions{display:none}}
    </style>
</head>
<body>
@php
    $statusLabel = $statuses[$repair->status] ?? $repair->status;
    $money = fn($n) => ($n === null || $n === '') ? '-' : ('$ ' . number_format((float)$n, 0, ',', '.'));
@endphp

<div class="sheet">
    <div class="top">
        <div>
            <h1>NicoReparaciones</h1>
            <div class="muted">Ticket / Comprobante de reparación</div>
        </div>
        <div class="meta">
            <div class="code">Código: {{ $repair->code ?? ('#'.$repair->id) }}</div>
            <div>Estado: <strong>{{ $statusLabel }}</strong></div>
            <div>Ingreso: {{ $repair->received_at ? $repair->received_at->format('d/m/Y H:i') : '-' }}</div>
        </div>
    </div>

    <div class="box">
        <div class="row"><div class="k">Cliente</div><div class="v">{{ $repair->customer_name }}</div></div>
        <div class="row"><div class="k">Teléfono</div><div class="v">{{ $repair->customer_phone }}</div></div>
    </div>

    <div class="box">
        <div class="row"><div class="k">Equipo</div><div class="v">{{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '-' }}</div></div>
        <div class="row"><div class="k">Falla reportada</div><div class="v" style="text-align:left">{{ $repair->issue_reported }}</div></div>
        <div class="row"><div class="k">Diagnóstico</div><div class="v" style="text-align:left">{{ $repair->diagnosis ?? '-' }}</div></div>
        <div class="row"><div class="k">Notas</div><div class="v" style="text-align:left">{{ $repair->notes ?? '-' }}</div></div>
    </div>

    <div class="box">
        <div class="row"><div class="k">Costo repuestos</div><div class="v">{{ $money($repair->parts_cost) }}</div></div>
        <div class="row"><div class="k">Mano de obra</div><div class="v">{{ $money($repair->labor_cost) }}</div></div>
        <div class="row"><div class="k">Precio final</div><div class="v big">{{ $repair->final_price !== null ? $money($repair->final_price) : '-' }}</div></div>
        <div class="row"><div class="k">Garantía</div><div class="v">{{ ($repair->warranty_days ?? 0) ? ($repair->warranty_days.' días') : '-' }}</div></div>
    </div>

    <div class="signs">
        <div class="line">Firma del cliente</div>
        <div class="line">Firma / sello del técnico</div>
    </div>

    <div class="actions">
        <button class="btn" onclick="window.print()">Imprimir</button>
        <a class="btn secondary" href="javascript:history.back()">Volver</a>
    </div>
</div>
</body>
</html>

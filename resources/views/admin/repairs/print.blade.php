@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $device = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
  $device = $device !== '' ? $device : null;

  $final = (float)($repair->final_price ?? 0);
  $paid  = (float)($repair->paid_amount ?? 0);
  $due   = max(0, $final - $paid);

  $shopAddress = \App\Models\BusinessSetting::getValue('shop_address', '');
  $shopHours   = \App\Models\BusinessSetting::getValue('shop_hours', '');

  $autoprint = (string)request('autoprint', '') === '1';
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orden de reparacion - {{ $repair->code }}</title>
  @include('layouts.partials.standalone_vite_assets')
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color:#111; margin:0; padding:24px; }
    .wrap { max-width: 920px; margin: 0 auto; }
    .screen-actions { display:flex; justify-content:flex-end; gap:8px; margin-bottom:10px; }
    .btn { border:1px solid #d4d4d8; background:#fff; border-radius:10px; padding:9px 12px; font-size:13px; font-weight:700; text-decoration:none; color:#111; }
    .btn-primary { background:#0ea5e9; border-color:#0ea5e9; color:#fff; }
    .box { border:1px solid #ddd; border-radius:12px; padding:16px; }
    .row { display:flex; gap:16px; }
    .col { flex:1; min-width:0; }
    h1 { margin:0; font-size:18px; }
    .muted { color:#666; font-size:12px; line-height:1.4; }
    .kv { margin-top:10px; font-size:13px; line-height:1.35; }
    .hr { height:1px; background:#eee; margin:14px 0; }
    .tag { display:inline-block; padding:4px 10px; border-radius:999px; border:1px solid #ddd; font-size:12px; font-weight:700; background:#fafafa; }
    .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .area { border:1px solid #eee; border-radius:10px; padding:12px; }
    .area h2 { margin:0 0 6px; font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:#666; }
    .pre { white-space: pre-wrap; }
    .signs { display:flex; gap:16px; margin-top:22px; }
    .sign { flex:1; }
    .line { border-top:1px solid #aaa; padding-top:6px; font-size:12px; color:#555; }
    @media print {
      body { padding:0; }
      .screen-actions { display:none !important; }
      .box { border:0; }
    }
  </style>
</head>
<body>
<div class="wrap">
  <div class="screen-actions">
    <button class="btn btn-primary" type="button" onclick="window.print()">Imprimir</button>
    <a class="btn" href="{{ route('admin.repairs.show', $repair) }}">Volver</a>
  </div>

  <div class="box">
    <div class="row" style="align-items:flex-start; justify-content:space-between;">
      <div class="col">
        <h1>{{ config('app.name', 'NicoReparaciones') }}</h1>
        <div class="muted">
          Orden de reparacion
          @if($shopAddress) · {{ $shopAddress }} @endif
          @if($shopHours) · {{ $shopHours }} @endif
        </div>
      </div>
      <div class="col" style="text-align:right;">
        <div class="tag">Codigo: {{ $repair->code }}</div>
        <div class="muted" style="margin-top:6px;">Fecha: {{ now()->format('d/m/Y H:i') }}</div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="grid2">
      <div class="area">
        <h2>Cliente</h2>
        <div class="kv"><b>Nombre:</b> {{ $repair->customer_name }}</div>
        <div class="kv"><b>Telefono:</b> {{ $repair->customer_phone }}</div>
        <div class="kv"><b>Equipo:</b> {{ $device ?: '-' }}</div>
      </div>

      <div class="area">
        <h2>Estado</h2>
        <div class="kv"><b>Estado actual:</b> {{ \App\Models\Repair::STATUSES[$repair->status] ?? $repair->status }}</div>
        <div class="kv"><b>Recibido:</b> {{ $repair->received_at?->format('d/m/Y H:i') ?? '-' }}</div>
        <div class="kv"><b>Entregado:</b> {{ $repair->delivered_at?->format('d/m/Y H:i') ?? '-' }}</div>
        <div class="kv"><b>Garantia (dias):</b> {{ (int)($repair->warranty_days ?? 0) }}</div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="grid2">
      <div class="area">
        <h2>Problema reportado</h2>
        <div class="kv pre">{{ $repair->issue_reported ?: '-' }}</div>
      </div>
      <div class="area">
        <h2>Diagnostico</h2>
        <div class="kv pre">{{ $repair->diagnosis ?: '-' }}</div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="area">
      <h2>Finanzas</h2>
      <div class="grid2">
        <div class="kv"><b>Repuestos:</b> {{ $money($repair->parts_cost) }}</div>
        <div class="kv"><b>Mano de obra:</b> {{ $money($repair->labor_cost) }}</div>
        <div class="kv"><b>Precio final:</b> {{ $money($final) }}</div>
        <div class="kv"><b>Pagado:</b> {{ $money($paid) }}</div>
        <div class="kv"><b>Debe:</b> {{ $money($due) }}</div>
        <div class="kv"><b>Metodo:</b> {{ $repair->payment_method ?: '-' }}</div>
      </div>

      @if($repair->payment_notes)
        <div class="kv"><b>Notas de pago:</b> <span class="pre">{{ $repair->payment_notes }}</span></div>
      @endif
    </div>

    @if($repair->notes)
      <div class="hr"></div>
      <div class="area">
        <h2>Notas internas</h2>
        <div class="kv pre">{{ $repair->notes }}</div>
      </div>
    @endif

    <div class="hr"></div>

    <div class="muted">
      <b>Aclaraciones:</b> Este comprobante acredita el ingreso del equipo. El presupuesto puede requerir aprobacion del cliente.
      Se recomienda retirar el equipo dentro de un plazo razonable una vez notificado.
    </div>

    <div class="signs">
      <div class="sign"><div style="height:32px;"></div><div class="line">Firma cliente</div></div>
      <div class="sign"><div style="height:32px;"></div><div class="line">Firma / sello del local</div></div>
    </div>
  </div>
</div>
<div data-react-auto-print data-enabled="{{ $autoprint ? '1' : '0' }}" data-delay-ms="120"></div>
</body>
</html>

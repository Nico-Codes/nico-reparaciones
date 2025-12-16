<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orden de reparación — {{ $repair->code }}</title>
  <style>
    *{ box-sizing:border-box; }
    body{ font-family: Arial, Helvetica, sans-serif; color:#111; margin:0; padding:24px; }
    .box{ border:1px solid #ddd; border-radius:12px; padding:16px; }
    .row{ display:flex; gap:16px; }
    .col{ flex:1; }
    h1{ margin:0; font-size:18px; }
    .muted{ color:#666; font-size:12px; }
    .kv{ margin-top:10px; font-size:13px; }
    .kv b{ display:inline-block; min-width:140px; }
    .hr{ height:1px; background:#eee; margin:14px 0; }
    .sign{ margin-top:28px; display:flex; gap:18px; }
    .line{ flex:1; border-top:1px solid #aaa; padding-top:6px; font-size:12px; color:#333; text-align:center; }
    .mini{ font-size:11px; color:#666; }
    .logo{ height:36px; width:auto; }
    @media print { body{ padding:0; } .box{ border:none; } }
  </style>
</head>
<body>
@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $device = trim(($repair->device_brand ?? '').' '.($repair->device_model ?? ''));
  $totalCost = (float) ($repair->total_cost ?? ((float)($repair->parts_cost ?? 0) + (float)($repair->labor_cost ?? 0)));
  $balance = (float) ($repair->balance_due ?? ((float)($repair->final_price ?? 0) - (float)($repair->paid_amount ?? 0)));
  if ($balance < 0) $balance = 0;
@endphp

<div class="box">
  <div class="row" style="align-items:center; justify-content:space-between;">
    <div class="row" style="align-items:center; gap:12px;">
      <img src="{{ asset('brand/logo.png') }}" class="logo" alt="NicoReparaciones">
      <div>
        <h1>Orden de reparación</h1>
        <div class="muted">Código: <b>{{ $repair->code }}</b> · Fecha: {{ now()->format('d/m/Y H:i') }}</div>
      </div>
    </div>
    <div class="mini">NicoReparaciones · Taller & Tienda</div>
  </div>

  <div class="hr"></div>

  <div class="row">
    <div class="col">
      <div class="kv"><b>Cliente:</b> {{ $repair->customer_name }}</div>
      <div class="kv"><b>Teléfono:</b> {{ $repair->customer_phone }}</div>
      <div class="kv"><b>Equipo:</b> {{ $device ?: '—' }}</div>
    </div>
    <div class="col">
      <div class="kv"><b>Estado:</b> {{ \App\Models\Repair::STATUSES[$repair->status] ?? $repair->status }}</div>
      <div class="kv"><b>Recibido:</b> {{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</div>
      <div class="kv"><b>Garantía (días):</b> {{ (int)($repair->warranty_days ?? 0) }}</div>
    </div>
  </div>

  <div class="hr"></div>

  <div class="kv"><b>Falla reportada:</b><br>{{ $repair->issue_reported }}</div>

  @if($repair->diagnosis)
    <div class="kv" style="margin-top:12px;"><b>Diagnóstico:</b><br>{{ $repair->diagnosis }}</div>
  @endif

  <div class="hr"></div>

  <div class="row">
    <div class="col">
      <div class="kv"><b>Repuestos:</b> {{ $money($repair->parts_cost) }}</div>
      <div class="kv"><b>Mano de obra:</b> {{ $money($repair->labor_cost) }}</div>
      <div class="kv"><b>Costo total:</b> {{ $money($totalCost) }}</div>
    </div>
    <div class="col">
      <div class="kv"><b>Precio final:</b> {{ $money($repair->final_price) }}</div>
      <div class="kv"><b>Pagado:</b> {{ $money($repair->paid_amount) }}</div>
      <div class="kv"><b>Saldo:</b> {{ $money($balance) }}</div>
    </div>
  </div>

  <div class="sign">
    <div class="line">Firma cliente</div>
    <div class="line">Firma responsable</div>
  </div>

  <div class="mini" style="margin-top:10px;">
    * Guardá este comprobante. Para consultar el estado: ingresá a la web y usá el código <b>{{ $repair->code }}</b>.
  </div>
</div>

<script>
  window.print();
</script>
</body>
</html>

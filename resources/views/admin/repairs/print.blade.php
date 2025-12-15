<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orden de reparación #{{ $repair->code }}</title>
  <style>
    *{ box-sizing:border-box; }
    body{ font-family: Arial, Helvetica, sans-serif; margin:0; background:#f5f5f5; color:#111; }
    .page{ max-width: 860px; margin: 24px auto; background:#fff; border:1px solid #e5e5e5; border-radius:14px; padding:20px; }
    .row{ display:flex; gap:16px; }
    .col{ flex:1; }
    .muted{ color:#666; font-size:12px; }
    .h{ font-size:12px; color:#444; font-weight:700; margin:0 0 6px; }
    .v{ font-size:14px; margin:0; white-space:pre-line; }
    .box{ border:1px solid #e6e6e6; border-radius:12px; padding:12px; }
    .top{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
    .brand{ display:flex; gap:12px; align-items:center; }
    .logo{ width:56px; height:56px; object-fit:contain; }
    .title{ font-size:18px; font-weight:800; margin:0; }
    .pill{ display:inline-block; padding:6px 10px; border-radius:999px; background:#0f172a; color:#fff; font-size:12px; font-weight:700; }
    .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .grid3{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; }
    .hr{ height:1px; background:#eee; margin:16px 0; }
    .sign{ display:flex; gap:16px; margin-top:16px; }
    .line{ flex:1; border-top:1px solid #bbb; padding-top:8px; font-size:12px; color:#555; text-align:center; }
    @media print{
      body{ background:#fff; }
      .page{ border:none; margin:0; border-radius:0; padding:0; }
    }
  </style>
</head>
<body>
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
  $parts = (float) ($repair->parts_cost ?? 0);
  $labor = (float) ($repair->labor_cost ?? 0);
  $totalCost = $parts + $labor;
  $final = $repair->final_price !== null ? (float)$repair->final_price : null;
  $paid = (float) ($repair->paid_amount ?? 0);
  $balance = ($final ?? 0) - $paid;
@endphp

<div class="page">
  <div class="top">
    <div class="brand">
      {{-- Poné tu logo en: public/brand/logo.png --}}
      <img class="logo" src="{{ asset('brand/logo.png') }}" alt="NicoReparaciones" onerror="this.style.display='none'">
      <div>
        <p class="title">NicoReparaciones</p>
        <p class="muted" style="margin:4px 0 0;">Orden de reparación — Comprobante</p>
      </div>
    </div>

    <div style="text-align:right;">
      <div class="pill">#{{ $repair->code }}</div>
      <p class="muted" style="margin:8px 0 0;">Fecha: {{ now()->format('d/m/Y H:i') }}</p>
    </div>
  </div>

  <div class="hr"></div>

  <div class="grid">
    <div class="box">
      <p class="h">Cliente</p>
      <p class="v">{{ $repair->customer_name }}</p>
      <p class="muted" style="margin:8px 0 0;">Tel: {{ $repair->customer_phone }}</p>
    </div>

    <div class="box">
      <p class="h">Equipo</p>
      <p class="v">{{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) ?: '—' }}</p>
      <p class="muted" style="margin:8px 0 0;">Estado: {{ $repair->status }}</p>
    </div>
  </div>

  <div class="hr"></div>

  <div class="box">
    <p class="h">Falla reportada</p>
    <p class="v">{{ $repair->issue_reported }}</p>

    <div class="hr"></div>

    <p class="h">Diagnóstico</p>
    <p class="v">{{ $repair->diagnosis ?: '—' }}</p>
  </div>

  <div class="hr"></div>

  <div class="grid3">
    <div class="box">
      <p class="h">Repuestos</p>
      <p class="v">{{ $money($parts) }}</p>
    </div>
    <div class="box">
      <p class="h">Mano de obra</p>
      <p class="v">{{ $money($labor) }}</p>
    </div>
    <div class="box">
      <p class="h">Precio final</p>
      <p class="v">{{ $final !== null ? $money($final) : '—' }}</p>
    </div>
  </div>

  <div class="grid3" style="margin-top:12px;">
    <div class="box">
      <p class="h">Pagado</p>
      <p class="v">{{ $money($paid) }}</p>
      <p class="muted" style="margin:6px 0 0;">Método: {{ $repair->payment_method ?: '—' }}</p>
    </div>
    <div class="box">
      <p class="h">Saldo</p>
      <p class="v">{{ $final !== null ? $money($balance) : '—' }}</p>
      <p class="muted" style="margin:6px 0 0;">Costo total: {{ $money($totalCost) }}</p>
    </div>
    <div class="box">
      <p class="h">Garantía</p>
      <p class="v">{{ (int)($repair->warranty_days ?? 0) }} días</p>
      <p class="muted" style="margin:6px 0 0;">(Inicia al entregar)</p>
    </div>
  </div>

  <div class="hr"></div>

  <div class="box">
    <p class="h">Notas</p>
    <p class="v">{{ $repair->notes ?: '—' }}</p>
  </div>

  <div class="sign">
    <div class="line">Firma cliente</div>
    <div class="line">Firma NicoReparaciones</div>
  </div>

  <p class="muted" style="margin-top:12px;">
    * Este comprobante es un registro interno de la reparación. Consultas por WhatsApp o en el local.
  </p>
</div>
</body>
</html>

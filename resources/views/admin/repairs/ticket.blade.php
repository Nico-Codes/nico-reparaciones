@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $companyName = $settings->get('company_name', config('app.name'));
  $companyAddress = $settings->get('shop_address', '');
  $companyHours   = $settings->get('shop_hours', '');
  $companyPhone   = $settings->get('shop_phone', '');

  $device = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
  $device = $device !== '' ? $device : '—';

  $statusLabel = \App\Models\Repair::STATUSES[$repair->status] ?? (string)($repair->status ?? '—');

  $final = (float)($repair->final_price ?? 0);
  $paid  = (float)($repair->paid_amount ?? 0);
  $due   = max(0, $final - $paid);

  $autoprint = (string)request('autoprint', '') === '1';
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket Reparación {{ $repair->code }}</title>
  @include('layouts.partials.standalone_vite_assets')
  <style>
    :root { --muted:#71717a; --border:#e4e4e7; }
    *{ box-sizing:border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111827; background:#fff; }
    .paper { width: 72mm; padding: 4mm; margin: 0 auto; }
    .center { text-align:center; }
    .h1 { font-weight: 900; font-size: 14px; margin: 0; }
    .muted { color: var(--muted); font-size: 10px; }
    .sep { border-top: 1px dashed var(--border); margin: 8px 0; }
    .row { display:flex; justify-content:space-between; gap:8px; font-size: 11px; }
    .row b { font-weight: 900; text-align:right; }
    .block-title { font-size: 10px; color: var(--muted); font-weight: 900; margin-bottom: 4px; }
    .block { font-size: 11px; font-weight: 800; white-space: pre-wrap; }
    .total { display:flex; justify-content:space-between; align-items:center; font-weight: 900; font-size: 13px; margin-top: 6px; }
    .actions { display:flex; gap:6px; justify-content:center; margin-top: 8px; }
    .btn { border:1px solid var(--border); background:#fff; padding:8px 10px; border-radius:10px; font-weight:900; cursor:pointer; font-size: 12px; text-decoration:none; color:#111827; }
    .btn-primary { background:#0ea5e9; border-color:#0ea5e9; color:#fff; }

    @page { size: 80mm auto; margin: 4mm; }
    @media print {
      .actions { display:none !important; }
      .paper { width: 72mm; padding: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="center">
      <div class="h1">{{ $companyName }}</div>
      @if($companyAddress)<div class="muted">{{ $companyAddress }}</div>@endif
      @if($companyHours)<div class="muted">{{ $companyHours }}</div>@endif
      @if($companyPhone)<div class="muted">Tel: {{ $companyPhone }}</div>@endif
    </div>

    <div class="sep"></div>

    <div class="row"><span>Reparación</span><b>{{ $repair->code }}</b></div>
    <div class="row"><span>Recibido</span><b>{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</b></div>
    <div class="row"><span>Estado</span><b>{{ $statusLabel }}</b></div>
    @if($repair->warranty_days)
      <div class="row"><span>Garantía</span><b>{{ (int)$repair->warranty_days }} días</b></div>
    @endif

    <div class="sep"></div>

    <div class="row"><span>Cliente</span><b>{{ $repair->customer_name }}</b></div>
    <div class="row"><span>Tel</span><b>{{ $repair->customer_phone }}</b></div>
    <div class="row"><span>Equipo</span><b>{{ $device }}</b></div>

    <div class="sep"></div>

    <div class="block-title">Falla reportada</div>
    <div class="block">{{ $repair->issue_reported ?: '—' }}</div>

    @if($repair->diagnosis)
      <div class="sep"></div>
      <div class="block-title">Diagnóstico</div>
      <div class="block">{{ $repair->diagnosis }}</div>
    @endif

    <div class="sep"></div>

    <div class="row"><span>Repuestos</span><b>{{ $money($repair->parts_cost) }}</b></div>
    <div class="row"><span>Mano de obra</span><b>{{ $money($repair->labor_cost) }}</b></div>
    <div class="sep"></div>
    <div class="row"><span>Final</span><b>{{ $money($final) }}</b></div>
    <div class="row"><span>Pagado</span><b>{{ $money($paid) }}</b></div>
    <div class="total"><span>Debe</span><span>{{ $money($due) }}</span></div>

    @if($repair->payment_method)
      <div class="sep"></div>
      <div class="row"><span>Método</span><b>{{ \App\Models\Repair::PAYMENT_METHODS[$repair->payment_method] ?? $repair->payment_method }}</b></div>
    @endif

    @if($repair->payment_notes)
      <div class="sep"></div>
      <div class="block-title">Notas de pago</div>
      <div class="block">{{ $repair->payment_notes }}</div>
    @endif

    <div class="sep"></div>
    <div class="center muted" style="font-weight:900">
      Con este comprobante retirás tu equipo.<br>
      Conservá el código: {{ $repair->code }}
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
      <a class="btn" href="{{ route('admin.repairs.show', $repair) }}">Volver</a>
    </div>
  </div>

  <div data-react-auto-print data-enabled="{{ $autoprint ? '1' : '0' }}" data-delay-ms="120"></div>
</body>
</html>

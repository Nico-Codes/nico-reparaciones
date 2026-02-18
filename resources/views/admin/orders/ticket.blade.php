@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $statusMap = [
    'pendiente'     => 'Pendiente',
    'confirmado'    => 'Confirmado',
    'preparando'    => 'Preparando',
    'listo_retirar' => 'Listo para retirar',
    'entregado'     => 'Entregado',
    'cancelado'     => 'Cancelado',
  ];

  $companyName = $settings->get('company_name', config('app.name'));
  $companyAddress = $settings->get('shop_address', '');
  $companyPhone   = $settings->get('shop_phone', '');


  $customerName  = $order->pickup_name ?: ($order->user?->name ?? '—');
  $customerPhone = $order->pickup_phone ?: ($order->user?->phone ?? '—');

  $st = (string)($order->status ?? 'pendiente');
  $stLabel = $statusMap[$st] ?? $st;

  $autoprint = (string)request('autoprint', '') === '1';
  $paperDefault = (string) ($settings->get('default_ticket_paper', '80') ?? '80');
  if (!in_array($paperDefault, ['58', '80'], true)) {
    $paperDefault = '80';
  }
  $paper = (string)request('paper', $paperDefault);
  $is58 = $paper === '58';
  $pageWidth = $is58 ? '58mm' : '80mm';
  $contentWidth = $is58 ? '50mm' : '72mm';
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket Pedido #{{ $order->id }}</title>
  @include('layouts.partials.standalone_vite_assets')
  <style>
    :root { --muted:#71717a; --border:#e4e4e7; }
    *{ box-sizing:border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111827; background:#fff; }
    .paper { width: {{ $contentWidth }}; padding: 4mm; margin: 0 auto; }
    .center { text-align:center; }
    .h1 { font-weight: 900; font-size: 14px; margin: 0; }
    .muted { color: var(--muted); font-size: 10px; }
    .sep { border-top: 1px dashed var(--border); margin: 8px 0; }
    .row { display:flex; justify-content:space-between; gap:8px; font-size: 11px; }
    .row b { font-weight: 900; }
    .items { margin-top: 6px; }
    .item { display:flex; justify-content:space-between; gap:8px; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; }
    .item:last-child { border-bottom: 0; }
    .item .name { font-weight: 800; max-width: 48mm; }
    .item .sub { font-weight: 900; }
    .subline { font-size: 10px; color: var(--muted); margin-top: 2px; }
    .total { display:flex; justify-content:space-between; align-items:center; font-weight: 900; font-size: 13px; margin-top: 6px; }
    .actions { display:flex; gap:6px; justify-content:center; margin-top: 8px; }
    .btn { border:1px solid var(--border); background:#fff; padding:8px 10px; border-radius:10px; font-weight:900; cursor:pointer; font-size: 12px; }
    .btn-primary { background:#0ea5e9; border-color:#0ea5e9; color:#fff; }

    @page { size: {{ $pageWidth }} auto; margin: 4mm; }
    @media print {
      .actions { display:none !important; }
      .paper { width: {{ $contentWidth }}; padding: 0; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="center">
      <div class="h1">{{ $companyName }}</div>
      @if($companyAddress)<div class="muted">{{ $companyAddress }}</div>@endif
      @if($companyPhone)<div class="muted">Tel: {{ $companyPhone }}</div>@endif
    </div>

    <div class="sep"></div>

    <div class="row"><span>Pedido</span><b>#{{ $order->id }}</b></div>
    <div class="row"><span>Fecha</span><b>{{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}</b></div>
    <div class="row"><span>Estado</span><b>{{ $stLabel }}</b></div>
    @if($order->payment_method)
      <div class="row"><span>Pago</span><b>{{ $order->payment_method }}</b></div>
    @endif

    <div class="sep"></div>

    <div class="row"><span>Cliente</span><b style="text-align:right">{{ $customerName }}</b></div>
    <div class="row"><span>Tel</span><b>{{ $customerPhone }}</b></div>

    @if($order->notes)
      <div class="sep"></div>
      <div class="muted" style="font-weight:900">Notas:</div>
      <div style="font-size:11px; font-weight:700; white-space:pre-wrap">{{ $order->notes }}</div>
    @endif

    <div class="sep"></div>

    <div class="muted" style="font-weight:900">Items</div>
    <div class="items">
      @foreach($order->items as $it)
        @php
          $name = $it->product_name ?: ($it->product?->name ?? 'Producto');
          $qty  = (int)($it->quantity ?? 1);
          $price = (float)($it->price ?? 0);
          $sub = $qty * $price;
        @endphp

        <div class="item">
          <div>
            <div class="name">{{ $qty }} × {{ $name }}</div>
            <div class="subline">Unit: {{ $money($price) }}</div>
          </div>
          <div class="sub">{{ $money($sub) }}</div>
        </div>
      @endforeach
    </div>

    <div class="sep"></div>

    <div class="total">
      <span>Total</span>
      <span>{{ $money($order->total) }}</span>
    </div>

    <div class="sep"></div>

    <div class="center muted" style="font-weight:900">Gracias por tu compra</div>

    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
      <a class="btn" href="{{ route('admin.orders.ticket', ['order' => $order->id, 'paper' => '80']) }}">Ticket 80mm</a>
      <a class="btn" href="{{ route('admin.orders.ticket', ['order' => $order->id, 'paper' => '58']) }}">Ticket 58mm</a>
      <a class="btn" href="{{ route('admin.orders.print', ['order' => $order->id]) }}">A4</a>
      <a class="btn" href="{{ route('admin.orders.show', $order->id) }}">Volver</a>
    </div>
  </div>

  <div data-react-auto-print data-enabled="{{ $autoprint ? '1' : '0' }}" data-delay-ms="120"></div>
</body>
</html>

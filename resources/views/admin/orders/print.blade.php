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
  $customerEmail = $order->user?->email ?? '—';

  $st = (string)($order->status ?? 'pendiente');
  $stLabel = $statusMap[$st] ?? $st;
  $autoprint = (string)request('autoprint', '') === '1';
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pedido #{{ $order->id }} — Imprimir</title>
  <style>
    :root { --border:#e4e4e7; --muted:#71717a; }
    *{ box-sizing:border-box; }
    body { margin:0; padding:24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111827; background:#fff; }
    .wrap { max-width: 860px; margin: 0 auto; }
    .top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .h1 { font-size: 22px; font-weight: 900; margin: 0; }
    .muted { color: var(--muted); font-size: 12px; }
    .card { border:1px solid var(--border); border-radius:14px; padding:14px; margin-top:12px; }
    .row { display:flex; gap:14px; flex-wrap:wrap; }
    .col { flex: 1 1 220px; }
    .label { font-size: 11px; color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: .02em; }
    .value { margin-top:4px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid var(--border); padding: 10px 8px; text-align: left; vertical-align: top; }
    th { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .02em; }
    td { font-size: 13px; font-weight: 600; }
    .right { text-align:right; }
    .total { display:flex; justify-content:flex-end; gap:10px; margin-top:10px; }
    .total .k { color: var(--muted); font-weight: 900; text-transform: uppercase; font-size: 12px; }
    .total .v { font-weight: 900; font-size: 18px; }
    .actions { display:flex; gap:8px; justify-content:flex-end; margin-top: 10px; }
    .btn { border:1px solid var(--border); background:#fff; padding:10px 12px; border-radius:12px; font-weight:800; cursor:pointer; text-decoration:none; color:#111827; }
    .btn-primary { background:#0ea5e9; border-color:#0ea5e9; color:#fff; }
    pre { white-space: pre-wrap; font-family: inherit; margin: 8px 0 0; }
    @page { margin: 12mm; }
    @media print {
      body { padding:0; }
      .actions { display:none !important; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1 class="h1">{{ $companyName }}</h1>
        @if($companyAddress)<div class="muted">{{ $companyAddress }}</div>@endif
        @if($companyPhone)<div class="muted">Tel: {{ $companyPhone }}</div>@endif
      </div>

      <div class="right">
        <div class="h1" style="font-size:20px">Pedido #{{ $order->id }}</div>
        <div class="muted">Estado: <b>{{ $stLabel }}</b></div>
        <div class="muted">Creado: {{ $order->created_at?->format('d/m/Y H:i') ?? '—' }}</div>
        @if($order->payment_method)
          <div class="muted">Pago: <b>{{ $order->payment_method }}</b></div>
        @endif

        <div class="actions">
          <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
          <a class="btn" href="{{ route('admin.orders.show', $order->id) }}">Volver</a>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row">
        <div class="col">
          <div class="label">Cliente</div>
          <div class="value">{{ $customerName }}</div>
        </div>
        <div class="col">
          <div class="label">Teléfono</div>
          <div class="value">{{ $customerPhone }}</div>
        </div>
        <div class="col">
          <div class="label">Email</div>
          <div class="value">{{ $customerEmail }}</div>
        </div>
      </div>

      @if($order->notes)
        <div style="margin-top:10px">
          <div class="label">Notas</div>
          <pre>{{ $order->notes }}</pre>
        </div>
      @endif
    </div>

    <div class="card">
      <div class="label">Items</div>

      <table>
        <thead>
          <tr>
            <th style="width:90px">Cant</th>
            <th>Producto</th>
            <th class="right" style="width:140px">Unit</th>
            <th class="right" style="width:140px">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          @foreach($order->items as $it)
            @php
              $name = $it->product_name ?: ($it->product?->name ?? 'Producto');
                $qty = (int)($it->quantity ?? 1);
                $price = (float)($it->price ?? 0);

              $sub = $qty * $price;
            @endphp
            <tr>
              <td>{{ $qty }}</td>
              <td>{{ $name }}</td>
              <td class="right">{{ $money($price) }}</td>
              <td class="right">{{ $money($sub) }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>

      <div class="total">
        <div class="k">Total</div>
        <div class="v">{{ $money($order->total) }}</div>
      </div>
    </div>

    <div class="muted" style="margin-top:12px">
      Generado desde Admin — {{ config('app.name') }}
    </div>
  </div>
</body>
@if($autoprint)
  <script>
    window.addEventListener('load', () => {
      window.print();
    });
  </script>
@endif
</html>

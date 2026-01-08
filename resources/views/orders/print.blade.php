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
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pedido #{{ $order->id }} — Imprimir</title>
  <style>
    :root { --muted:#71717a; --border:#e4e4e7; }
    *{ box-sizing:border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111827; background:#fff; }
    .page { max-width: 900px; margin: 24px auto; padding: 0 16px; }
    .card { border:1px solid var(--border); border-radius: 14px; padding: 16px; }
    .top { display:flex; justify-content:space-between; gap:16px; }
    .h1 { font-size: 18px; font-weight: 900; margin:0; }
    .muted { color: var(--muted); }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
    .kv { border:1px dashed var(--border); border-radius: 12px; padding: 10px; }
    .k { font-size: 11px; color: var(--muted); }
    .v { font-weight: 800; margin-top: 3px; }
    table { width:100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border-bottom: 1px solid var(--border); padding: 10px 0; text-align: left; }
    th { font-size: 12px; color: var(--muted); font-weight: 800; }
    td { font-size: 13px; }
    .right { text-align:right; }
    .total { display:flex; justify-content:space-between; margin-top: 12px; padding-top: 10px; border-top: 2px solid var(--border); }
    .actions { display:flex; gap:10px; margin-top: 14px; }
    .btn { border:1px solid var(--border); background:#fff; padding: 10px 12px; border-radius: 12px; font-weight: 900; cursor:pointer; text-decoration:none; color:#111827; text-align:center; }
    .btn-primary { background:#0ea5e9; color:#fff; border-color:#0ea5e9; }
    @media print { .actions { display:none !important; } body { background:#fff; } .page { margin:0; max-width:none; } .card { border:none; padding:0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="top">
        <div>
          <h1 class="h1">{{ $companyName }}</h1>
          <div class="muted" style="font-size:12px">{{ $companyAddress }}</div>
          <div class="muted" style="font-size:12px">{{ $companyPhone }}</div>
        </div>

        <div style="text-align:right">
          <div class="muted" style="font-size:12px">Pedido</div>
          <div class="h1">#{{ $order->id }}</div>
          <div class="muted" style="font-size:12px">{{ optional($order->created_at)->format('d/m/Y H:i') }}</div>
        </div>
      </div>

      <div class="grid">
        <div class="kv">
          <div class="k">Cliente</div>
          <div class="v">{{ $customerName }}</div>
        </div>
        <div class="kv">
          <div class="k">Teléfono</div>
          <div class="v">{{ $customerPhone }}</div>
        </div>
        <div class="kv">
          <div class="k">Estado</div>
          <div class="v">{{ $stLabel }}</div>
        </div>
        <div class="kv">
          <div class="k">Pago</div>
          <div class="v">{{ $order->payment_method ? ucfirst(str_replace('_',' ', $order->payment_method)) : '—' }}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="right">Precio</th>
            <th class="right">Cant</th>
            <th class="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          @foreach($order->items as $it)
            <tr>
              <td>{{ $it->product_name }}</td>
              <td class="right">{{ $money($it->price) }}</td>
              <td class="right">{{ (int)$it->quantity }}</td>
              <td class="right">{{ $money($it->subtotal) }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>

      <div class="total">
        <div class="v">Total</div>
        <div class="v">{{ $money($order->total) }}</div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
        <a class="btn" href="{{ route('orders.show', $order->id) }}">Volver</a>
      </div>
    </div>
  </div>
</body>
</html>

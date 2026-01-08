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
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket Pedido #{{ $order->id }}</title>
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
    .items { font-size: 11px; width:100%; border-collapse: collapse; }
    .items td { padding: 3px 0; vertical-align: top; }
    .items .qty { width: 18mm; }
    .items .price { width: 18mm; text-align:right; }
    .total { display:flex; justify-content:space-between; font-weight:900; font-size: 12px; }
    .actions { display:flex; gap:8px; margin-top: 10px; }
    .btn { flex:1; border: 1px solid var(--border); background:#fff; padding: 8px; border-radius: 8px; font-weight: 800; cursor:pointer; }
    .btn-primary { background:#0ea5e9; border-color:#0ea5e9; color:#fff; }
    @media print { .actions { display:none !important; } .paper { width:auto; padding:0; } }
  </style>
</head>
<body>
  <div class="paper">
    <div class="center">
      <p class="h1">{{ $companyName }}</p>
      @if($companyAddress)<div class="muted">{{ $companyAddress }}</div>@endif
      @if($companyPhone)<div class="muted">{{ $companyPhone }}</div>@endif
    </div>

    <div class="sep"></div>

    <div class="row"><div>Pedido</div><div>#{{ $order->id }}</div></div>
    <div class="row"><div>Estado</div><div>{{ $stLabel }}</div></div>
    <div class="row"><div>Fecha</div><div>{{ optional($order->created_at)->format('d/m/Y H:i') }}</div></div>

    <div class="sep"></div>

    <div class="row"><div>Cliente</div><div style="text-align:right">{{ $customerName }}</div></div>
    <div class="row"><div>Tel</div><div style="text-align:right">{{ $customerPhone }}</div></div>

    <div class="sep"></div>

    <table class="items">
      <tbody>
        @foreach($order->items as $it)
          <tr>
            <td class="qty">{{ (int)$it->quantity }}x</td>
            <td>{{ $it->product_name }}</td>
            <td class="price">{{ $money((float)$it->subtotal) }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <div class="sep"></div>

    <div class="total">
      <div>Total</div>
      <div>{{ $money((float)$order->total) }}</div>
    </div>

    <div class="center muted" style="margin-top:10px">Gracias por tu compra 🙌</div>

    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
      <a class="btn" href="{{ route('orders.show', $order->id) }}" style="text-align:center; text-decoration:none; line-height: 18px;">Volver</a>
    </div>
  </div>

  @if($autoprint)
    <script>
      window.addEventListener('load', () => window.print());
    </script>
  @endif
</body>
</html>

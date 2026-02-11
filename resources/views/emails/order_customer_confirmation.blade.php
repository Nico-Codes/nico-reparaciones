@php
  $money = static fn (int|float $amount): string => '$' . number_format((float) $amount, 0, ',', '.');
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Confirmacion de pedido</title>
</head>
<body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
    <tr>
      <td>
        <h1 style="margin:0 0 8px 0;font-size:22px;line-height:1.25;">Pedido confirmado #{{ $order->id }}</h1>
        <p style="margin:0 0 16px 0;font-size:14px;color:#334155;">
          Hola {{ $order->pickup_name }}, recibimos tu compra correctamente.
        </p>

        <p style="margin:0 0 8px 0;font-size:13px;color:#475569;"><strong>Estado:</strong> {{ \App\Models\Order::STATUSES[$order->status] ?? $order->status }}</p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#475569;"><strong>Metodo de pago:</strong> {{ \App\Models\Order::PAYMENT_METHODS[$order->payment_method] ?? $order->payment_method }}</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;border-collapse:collapse;">
          <thead>
            <tr>
              <th align="left" style="font-size:12px;padding:8px;border-bottom:1px solid #e2e8f0;color:#334155;">Producto</th>
              <th align="center" style="font-size:12px;padding:8px;border-bottom:1px solid #e2e8f0;color:#334155;">Cant.</th>
              <th align="right" style="font-size:12px;padding:8px;border-bottom:1px solid #e2e8f0;color:#334155;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @foreach ($order->items as $item)
              <tr>
                <td style="font-size:13px;padding:8px;border-bottom:1px solid #f1f5f9;">{{ $item->product_name }}</td>
                <td align="center" style="font-size:13px;padding:8px;border-bottom:1px solid #f1f5f9;">{{ (int) $item->quantity }}</td>
                <td align="right" style="font-size:13px;padding:8px;border-bottom:1px solid #f1f5f9;">{{ $money((int) $item->subtotal) }}</td>
              </tr>
            @endforeach
          </tbody>
        </table>

        <p style="margin:16px 0 0 0;font-size:15px;color:#0f172a;"><strong>Total: {{ $money((int) $order->total) }}</strong></p>
        <p style="margin:16px 0 0 0;font-size:13px;color:#475569;">Gracias por comprar en NicoReparaciones.</p>
      </td>
    </tr>
  </table>
</body>
</html>


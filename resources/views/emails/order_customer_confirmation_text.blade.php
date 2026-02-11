@php
  $money = static fn (int|float $amount): string => '$' . number_format((float) $amount, 0, ',', '.');
@endphp
Pedido confirmado #{{ $order->id }}

Hola {{ $order->pickup_name }}, recibimos tu compra correctamente.

Estado: {{ \App\Models\Order::STATUSES[$order->status] ?? $order->status }}
Metodo de pago: {{ \App\Models\Order::PAYMENT_METHODS[$order->payment_method] ?? $order->payment_method }}

Items:
@foreach ($order->items as $item)
- {{ (int) $item->quantity }}x {{ $item->product_name }} - {{ $money((int) $item->subtotal) }}
@endforeach

Total: {{ $money((int) $order->total) }}

Gracias por comprar en NicoReparaciones.


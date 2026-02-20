Alertas operativas NicoReparaciones

Resumen:
- Pedidos demorados: {{ (int) $ordersCount }} (umbral: {{ (int) $orderThresholdHours }}h)
- Reparaciones demoradas: {{ (int) $repairsCount }} (umbral: {{ (int) $repairThresholdDays }} dias)

@if((int) $ordersCount > 0)
Pedidos con alerta:
@foreach($orders as $order)
- Pedido #{{ $order['id'] ?? '-' }} | Estado: {{ $order['status_label'] ?? ($order['status'] ?? '-') }} | {{ $order['age_human'] ?? '-' }} | Cliente: {{ $order['pickup_name'] ?? '-' }}
@endforeach
@endif

@if((int) $repairsCount > 0)
Reparaciones con alerta:
@foreach($repairs as $repair)
- Reparacion {{ $repair['code'] ?? ('#'.($repair['id'] ?? '-')) }} | Estado: {{ $repair['status_label'] ?? ($repair['status'] ?? '-') }} | {{ $repair['age_human'] ?? '-' }} | Cliente: {{ $repair['customer_name'] ?? '-' }}
@endforeach
@endif

Panel admin:
{{ rtrim((string) config('app.url'), '/') }}/admin/dashboard


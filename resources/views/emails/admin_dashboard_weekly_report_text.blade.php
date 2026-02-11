Reporte semanal dashboard NicoReparaciones

Rango: {{ $fromRange->format('d/m/Y') }} a {{ $toRange->format('d/m/Y') }} ({{ $rangeDays }} dias)

Resumen KPI:
- Pedidos en rango: {{ (int)($kpis['orders_in_range'] ?? 0) }}
- Ventas en rango (entregados): $ {{ number_format((float)($kpis['sales_in_range'] ?? 0), 0, ',', '.') }}
- Ticket promedio: $ {{ number_format((float)($kpis['avg_ticket'] ?? 0), 2, ',', '.') }}
- Tasa de entrega: {{ $kpis['delivery_rate'] !== null ? number_format((float)$kpis['delivery_rate'], 2, ',', '.') . '%' : 'sin datos' }}
- Reparaciones en rango: {{ (int)($kpis['repairs_in_range'] ?? 0) }}
- Turnaround promedio reparaciones: {{ $kpis['avg_repair_turnaround_hours'] !== null ? number_format((float)$kpis['avg_repair_turnaround_hours'], 2, ',', '.') . ' h' : 'sin datos' }}
- Waiting approval: {{ (int)($kpis['waiting_approval_count'] ?? 0) }}
- Waiting approval >48h: {{ (int)($kpis['waiting_approval_over_48h'] ?? 0) }}

Adjunto: CSV con detalle de KPIs y top productos.

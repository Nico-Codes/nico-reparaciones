import {
  formatDateTime,
  money,
  orderCode,
  orderStatusLabel,
  orderStatusSummary,
  orderStatusTone,
  paymentMethodLabel,
} from './order-ui';
import type { OrderItem } from './types';

export function resolveOrderDetailLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No se pudo cargar el pedido.';
}

export function buildOrderDetailTotalItems(order: OrderItem | null) {
  return order?.items.reduce((accumulator, line) => accumulator + line.quantity, 0) ?? 0;
}

export function resolveOrderDetailAlertTone(status: string) {
  if (status === 'CANCELADO') return 'danger';
  if (status === 'LISTO_RETIRO') return 'success';
  return 'info';
}

export function buildOrderDetailSummaryFacts(order: OrderItem) {
  return [
    { label: 'Codigo', value: orderCode(order.id) },
    { label: 'Fecha de compra', value: formatDateTime(order.createdAt) },
    { label: 'Ultima actualizacion', value: formatDateTime(order.updatedAt) },
    { label: 'Estado', value: orderStatusLabel(order.status) },
    { label: 'Pago', value: paymentMethodLabel(order.paymentMethod) },
    { label: 'Canal', value: order.isQuickSale ? 'Venta rapida' : 'Compra web' },
  ];
}

export function buildOrderDetailStatusMeta(order: OrderItem) {
  return {
    code: orderCode(order.id),
    statusLabel: orderStatusLabel(order.status),
    statusTone: orderStatusTone(order.status),
    statusSummary: orderStatusSummary(order.status),
    paymentLabel: paymentMethodLabel(order.paymentMethod),
  };
}

export function buildOrderDetailLinesMeta(order: OrderItem) {
  return {
    lines: order.items.length,
    totalItems: buildOrderDetailTotalItems(order),
    total: money(order.total),
  };
}

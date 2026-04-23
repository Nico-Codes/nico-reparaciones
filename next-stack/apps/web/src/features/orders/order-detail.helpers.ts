import {
  formatDateTime,
  money,
  orderCode,
  orderStatusLabel,
  orderStatusSummary,
  orderStatusTone,
  paymentMethodLabel,
} from './order-ui';
import type { CheckoutTransferDetails, OrderItem } from './types';

export function resolveOrderDetailLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No se pudo cargar el pedido.';
}

export function orderUsesTransferPayment(method: string | null | undefined) {
  return (method ?? '').trim().toLowerCase() === 'transferencia';
}

export function buildOrderDetailTotalItems(order: OrderItem | null) {
  return order?.items.reduce((accumulator, line) => accumulator + line.quantity, 0) ?? 0;
}

export function orderHasSpecialOrderLines(order: OrderItem | null) {
  return order?.items.some((line) => line.fulfillmentMode === 'SPECIAL_ORDER') ?? false;
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

export function buildOrderTransferWhatsappUrl(
  order: OrderItem,
  transferDetails: CheckoutTransferDetails | null,
) {
  const phone = normalizeWhatsappPhone(transferDetails?.supportWhatsappPhone);
  if (!phone || !orderUsesTransferPayment(order.paymentMethod)) return null;

  const message = [
    'Hola, quiero enviar el comprobante de transferencia de mi pedido.',
    `Pedido: ${orderCode(order.id)}`,
    `Total: ${money(order.total)}`,
  ].join('\n');

  const params = new URLSearchParams({
    phone,
    text: message,
  });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

function normalizeWhatsappPhone(value?: string | null) {
  const digits = (value ?? '').replace(/\D+/g, '');
  if (digits.length < 10 || digits.length > 18) return null;
  return digits;
}

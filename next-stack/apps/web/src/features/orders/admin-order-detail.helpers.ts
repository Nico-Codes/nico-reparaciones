import { ORDER_STATUS_OPTIONS, orderPrintHref, orderTicketHref } from './admin-orders.helpers';
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

export {
  ORDER_STATUS_OPTIONS,
  formatDateTime,
  money,
  orderCode,
  orderPrintHref,
  orderStatusLabel,
  orderStatusSummary,
  orderStatusTone,
  orderTicketHref,
  paymentMethodLabel,
};

export type AdminOrderDetailFact = {
  label: string;
  value: string;
};

export type AdminOrderDetailMetric = {
  label: string;
  value: string;
  meta: string;
};

export type AdminOrderDetailView = {
  totalItems: number;
  statusLabel: string;
  statusTone: ReturnType<typeof orderStatusTone>;
  statusSummary: string;
  customerLabel: string;
  contactLabel: string;
  channelLabel: string;
  paymentLabel: string;
  subtitle: string;
  printHref: string;
  ticketHref: string;
  statusAlertClassName: string;
  metrics: AdminOrderDetailMetric[];
  facts: AdminOrderDetailFact[];
};

export function buildAdminOrderDetailView(item: OrderItem): AdminOrderDetailView {
  const totalItems = item.items.reduce((accumulator, line) => accumulator + line.quantity, 0);
  const statusLabel = orderStatusLabel(item.status);
  const statusTone = orderStatusTone(item.status);
  const statusSummary = orderStatusSummary(item.status);
  const customerLabel = item.user?.name || 'Venta rápida';
  const contactLabel = item.user?.email || 'Sin contacto registrado';
  const channelLabel = item.isQuickSale ? 'Venta rápida' : 'Compra web';
  const paymentLabel = paymentMethodLabel(item.paymentMethod);

  return {
    totalItems,
    statusLabel,
    statusTone,
    statusSummary,
    customerLabel,
    contactLabel,
    channelLabel,
    paymentLabel,
    subtitle: `${customerLabel} · ${formatDateTime(item.createdAt)}`,
    printHref: orderPrintHref(item.id),
    ticketHref: orderTicketHref(item.id),
    statusAlertClassName: getOrderStatusAlertClassName(item.status),
    metrics: [
      {
        label: 'Total',
        value: money(item.total),
        meta: 'Importe confirmado del pedido.',
      },
      {
        label: 'Ítems',
        value: String(totalItems),
        meta: `${item.items.length} líneas en la operación.`,
      },
      {
        label: 'Canal',
        value: channelLabel,
        meta: paymentLabel,
      },
    ],
    facts: [
      { label: 'Código', value: orderCode(item.id) },
      { label: 'Cliente', value: customerLabel },
      { label: 'Contacto', value: contactLabel },
      { label: 'Creado', value: formatDateTime(item.createdAt) },
      { label: 'Última actualización', value: formatDateTime(item.updatedAt) },
      { label: 'Pago', value: paymentLabel },
      { label: 'Canal', value: channelLabel },
    ],
  };
}

export function getOrderStatusAlertClassName(status: string) {
  if (status === 'CANCELADO') return 'ui-alert--danger';
  if (status === 'LISTO_RETIRO') return 'ui-alert--success';
  return 'ui-alert--info';
}

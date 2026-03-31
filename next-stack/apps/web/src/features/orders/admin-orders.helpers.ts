import type { OrderItem } from './types';
import { formatDateTime, money, orderStatusLabel, orderStatusTone } from './order-ui';

export { formatDateTime, money, orderStatusLabel, orderStatusTone };

export const ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;

export const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: orderStatusLabel(status),
}));

export const ORDER_FILTER_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...ORDER_STATUS_OPTIONS];

export const STATUS_TABS = [
  { value: '', label: 'Todos', countKey: 'all' },
  { value: 'PENDIENTE', label: 'Pendiente', countKey: 'PENDIENTE' },
  { value: 'CONFIRMADO', label: 'Confirmado', countKey: 'CONFIRMADO' },
  { value: 'PREPARANDO', label: 'Preparando', countKey: 'PREPARANDO' },
  { value: 'LISTO_RETIRO', label: 'Listo para retirar', countKey: 'LISTO_RETIRO' },
  { value: 'ENTREGADO', label: 'Entregado', countKey: 'ENTREGADO' },
  { value: 'CANCELADO', label: 'Cancelado', countKey: 'CANCELADO' },
] as const;

export function orderPrintHref(orderId: string) {
  return `/admin/orders/${encodeURIComponent(orderId)}/print`;
}

export function orderTicketHref(orderId: string) {
  return `/admin/orders/${encodeURIComponent(orderId)}/ticket`;
}

export function timeAgo(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} dia${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
}

export function buildOrderTotals(items: OrderItem[]) {
  return {
    count: items.length,
    total: items.reduce((accumulator, item) => accumulator + item.total, 0),
  };
}

export function buildOrderStatusCounts(items: OrderItem[]) {
  const counts: Record<string, number> = { all: items.length };
  for (const status of ORDER_STATUSES) counts[status] = 0;
  for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;
  return counts;
}

export function buildWhatsappCounters(items: OrderItem[]) {
  return {
    all: items.length,
    pending: items.filter((order) => order.status === 'PENDIENTE').length,
    inFlow: items.filter((order) => order.status === 'CONFIRMADO' || order.status === 'PREPARANDO' || order.status === 'LISTO_RETIRO').length,
    withoutEmail: items.filter((order) => !order.user?.email).length,
  };
}

export function hasOrderFilters(q: string, statusFilter: string) {
  return q.trim().length > 0 || statusFilter.length > 0;
}

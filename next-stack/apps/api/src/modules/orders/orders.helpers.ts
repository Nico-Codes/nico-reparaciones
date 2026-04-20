import { BadRequestException } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';

export const ORDER_WALKIN_EMAIL = 'walkin@nico.local';

export const ORDER_CHECKOUT_PAYMENT_METHODS = {
  efectivo: 'Pago en el local',
  transferencia: 'Transferencia',
  debito: 'Debito',
  credito: 'Credito',
} as const;

export const ORDER_PAYMENT_METHODS = {
  local: 'Pago en el local',
  mercado_pago: 'Mercado Pago',
  transferencia: 'Transferencia',
} as const;

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['PREPARANDO', 'CANCELADO'],
  PREPARANDO: ['LISTO_RETIRO', 'CANCELADO'],
  LISTO_RETIRO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export function normalizeOrderStatus(statusRaw?: string): OrderStatus | null {
  const value = (statusRaw ?? '').trim().toUpperCase();
  if (!value) return null;
  const allowed = new Set<OrderStatus>(['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO']);
  return allowed.has(value as OrderStatus) ? (value as OrderStatus) : null;
}

export function assertValidOrderStatusTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return;
  const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(`No se puede cambiar un pedido de ${current} a ${next}`);
  }
}

export function normalizeCheckoutPaymentMethod(raw?: string | null) {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return null;
  const aliases: Record<string, keyof typeof ORDER_CHECKOUT_PAYMENT_METHODS> = {
    efectivo: 'efectivo',
    cash: 'efectivo',
    local: 'efectivo',
    transferencia: 'transferencia',
    transfer: 'transferencia',
    debito: 'debito',
    debit: 'debito',
    credito: 'credito',
    credit: 'credito',
  };
  const normalized = aliases[value];
  return normalized && normalized in ORDER_CHECKOUT_PAYMENT_METHODS ? normalized : null;
}

export function normalizePaymentMethod(raw?: string | null) {
  const value = (raw ?? '').trim().toLowerCase();
  return value in ORDER_PAYMENT_METHODS ? value : null;
}

export function normalizePaymentFilter(raw?: string) {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return '';
  return value in ORDER_PAYMENT_METHODS ? value : '';
}

export function paymentMethods() {
  return Object.entries(ORDER_PAYMENT_METHODS).map(([key, label]) => ({ key, label }));
}

export function normalizePhone(value?: string | null) {
  return (value ?? '').replace(/\D+/g, '');
}

export function normalizeWhatsappPhone(value?: string | null) {
  const digits = normalizePhone(value);
  if (digits.length < 10 || digits.length > 18) return null;
  return digits;
}

export function buildWhatsappManualUrl(phone?: string | null, message?: string | null) {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  const cleanMessage = (message ?? '').trim();
  if (!normalizedPhone || !cleanMessage) return null;
  const params = new URLSearchParams({
    phone: normalizedPhone,
    text: cleanMessage,
  });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

export function resolveQuickSalesRange(fromRaw?: string, toRaw?: string) {
  const now = new Date();
  const fallback = now.toISOString().slice(0, 10);
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  const from = valid(fromRaw ?? '') ? (fromRaw as string) : fallback;
  const to = valid(toRaw ?? '') ? (toRaw as string) : fallback;
  const fromStart = new Date(`${from}T00:00:00.000`);
  const toEnd = new Date(`${to}T23:59:59.999`);

  if (fromStart.getTime() > toEnd.getTime()) {
    return {
      from: to,
      to: from,
      fromStart: new Date(`${to}T00:00:00.000`),
      toEnd: new Date(`${from}T23:59:59.999`),
    };
  }

  return { from, to, fromStart, toEnd };
}

export function orderStatusTemplateKey(status: OrderStatus) {
  if (status === 'PENDIENTE') return 'pendiente';
  if (status === 'CONFIRMADO') return 'confirmado';
  if (status === 'PREPARANDO') return 'preparando';
  if (status === 'LISTO_RETIRO') return 'listo_retirar';
  if (status === 'ENTREGADO') return 'entregado';
  if (status === 'CANCELADO') return 'cancelado';
  return 'pendiente';
}

export function orderStatusLabel(status: OrderStatus) {
  if (status === 'LISTO_RETIRO') return 'Listo para retirar';
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function defaultOrderWhatsappTemplate(statusKey: string) {
  const base = [
    'Hola {customer_name}',
    'Tu pedido *#{order_id}* esta en estado: *{status_label}*.',
    'Total: {total}',
    'Items: {items_count}',
    '',
    '{items_summary}',
    '',
    'Ver tus pedidos: {my_orders_url}',
    'Tienda: {store_url}',
  ];
  if (statusKey === 'listo_retirar') base.push('', 'Direccion: {shop_address}', 'Horarios: {shop_hours}', 'Telefono: {shop_phone}');
  if (statusKey === 'entregado') base.push('', 'Gracias por tu compra.');
  if (statusKey === 'cancelado') base.push('', 'Si queres, lo revisamos por WhatsApp.');
  return base.join('\n');
}

export function applyTemplateVars(template: string, vars: Record<string, string>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => vars[key] ?? '');
}

export function getOrdersWebBaseUrl() {
  return (((process.env.WEB_URL ?? '').trim() || 'http://localhost:5174')).replace(/\/+$/, '');
}

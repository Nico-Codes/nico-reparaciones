import type { OrderItem } from './types';

export const SPECIAL_ORDER_RESERVATION_DEPOSIT_PERCENT = 10;
export const SPECIAL_ORDER_RESERVATION_DAYS = 7;

export function calculateSpecialOrderReservationDeposit(total: number) {
  return Math.round(Math.max(0, Number(total) || 0) * (SPECIAL_ORDER_RESERVATION_DEPOSIT_PERCENT / 100));
}

export function buildSpecialOrderReservationDeadline(createdAt: string | Date) {
  const base = createdAt instanceof Date ? new Date(createdAt) : new Date(createdAt);
  const validBase = Number.isNaN(base.getTime()) ? new Date() : base;
  const deadline = new Date(validBase);
  deadline.setDate(deadline.getDate() + SPECIAL_ORDER_RESERVATION_DAYS);
  return deadline;
}

export function isSpecialOrderReservationExpired(createdAt: string | Date, now: Date = new Date()) {
  return now.getTime() > buildSpecialOrderReservationDeadline(createdAt).getTime();
}

export function orderHasSpecialOrderReservation(order: OrderItem | null) {
  return order?.items.some((line) => line.fulfillmentMode === 'SPECIAL_ORDER') ?? false;
}

export function buildSpecialOrderReservationItemsSummary(order: OrderItem) {
  return order.items
    .filter((line) => line.fulfillmentMode === 'SPECIAL_ORDER')
    .map((line) => {
      const color = line.selectedColorLabel ? ` - Color ${line.selectedColorLabel}` : '';
      return `${line.quantity} x ${line.name}${color}`;
    })
    .join('\n');
}

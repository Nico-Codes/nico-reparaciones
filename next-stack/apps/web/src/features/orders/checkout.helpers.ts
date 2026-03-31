import type { CartLocalItem, CartQuoteLine } from '@/features/cart/types';

export const CHECKOUT_PAYMENT_OPTIONS = [
  { value: 'efectivo', title: 'Pago en el local', subtitle: 'Pagás al retirar.' },
  { value: 'transferencia', title: 'Transferencia', subtitle: 'Te enviamos los datos después de confirmar.' },
  { value: 'debito', title: 'Débito', subtitle: 'Pagás al retirar con tarjeta.' },
  { value: 'credito', title: 'Crédito', subtitle: 'Pagás al retirar con tarjeta.' },
] as const;

type PaymentOption = (typeof CHECKOUT_PAYMENT_OPTIONS)[number];

export type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export function formatCheckoutMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function emailVerificationTone(verified: boolean | undefined): BadgeTone {
  return verified ? 'success' : 'warning';
}

export function buildValidCheckoutLines(items: CartQuoteLine[]) {
  return items.filter((item) => item.valid);
}

export function buildCheckoutItems(lines: CartQuoteLine[]): CartLocalItem[] {
  return lines.map((item) => ({ productId: item.productId, quantity: item.quantity }));
}

export function sameCartItems(left: CartLocalItem[], right: CartLocalItem[]) {
  return (
    left.length === right.length &&
    left.every((item, index) => right[index]?.productId === item.productId && right[index]?.quantity === item.quantity)
  );
}

export function hasInvalidCheckoutItems(items: CartQuoteLine[]) {
  return items.some((item) => !item.valid);
}

export function resolveSelectedPayment(paymentMethod: string): PaymentOption {
  return CHECKOUT_PAYMENT_OPTIONS.find((option) => option.value === paymentMethod) ?? CHECKOUT_PAYMENT_OPTIONS[0];
}

export function buildCheckoutEmptyState(hasCartItems: boolean) {
  if (hasCartItems) {
    return {
      title: 'Hay productos para revisar',
      description: 'Volvé al carrito para ajustar cantidades o quitar productos sin stock antes de confirmar la compra.',
      subtitle: 'Todavía no podemos confirmar el pedido con el stock actual.',
    };
  }

  return {
    title: 'Tu carrito está vacío',
    description: 'Necesitás productos válidos en el carrito para confirmar la compra.',
    subtitle: 'Necesitás productos válidos en el carrito para confirmar la compra.',
  };
}

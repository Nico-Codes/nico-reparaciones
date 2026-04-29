import type { CartLocalItem, CartQuoteLine } from '@/features/cart/types';
import type {
  CheckoutConfig,
  CheckoutPaymentMethodConfig,
  CheckoutTransferDetails,
} from './types';

export const DEFAULT_CHECKOUT_PAYMENT_OPTIONS: CheckoutPaymentMethodConfig[] = [
  {
    value: 'efectivo',
    title: 'Pago en el local',
    subtitle: 'Pagas al retirar en el local.',
    iconUrl: '/icons/payment-local.svg',
  },
  {
    value: 'transferencia',
    title: 'Transferencia',
    subtitle: 'Confirmas el pedido y luego veras los datos para pagar.',
    iconUrl: '/icons/payment-transfer.svg',
  },
];

export const DEFAULT_CHECKOUT_TRANSFER_DETAILS: CheckoutTransferDetails = {
  title: 'Datos para transferencia',
  description: 'Si eliges transferencia, usa estos datos y conserva el comprobante para presentarlo al retirar.',
  note: 'Si tienes dudas, contactanos antes de confirmar el pago.',
  available: false,
  supportWhatsappPhone: null,
  fields: [],
};

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
  return lines.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
  }));
}

export function buildSpecialOrderCheckoutItems(search: string | URLSearchParams) {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const mode = (params.get('mode') ?? '').trim();
  const isSpecialOrderMode = mode === 'special-order';
  if (!isSpecialOrderMode) {
    return { isSpecialOrderMode: false, items: [] as CartLocalItem[], error: '' };
  }

  const productId = (params.get('productId') ?? '').trim();
  const variantId = (params.get('variantId') ?? '').trim() || null;
  const quantity = Math.max(1, Math.min(999, Number(params.get('quantity')) || 1));

  if (!productId) {
    return {
      isSpecialOrderMode: true,
      items: [] as CartLocalItem[],
      error: 'Falta el producto por encargue. Volve a la tienda y elegi el producto nuevamente.',
    };
  }

  return {
    isSpecialOrderMode: true,
    items: [{ productId, variantId, quantity }],
    error: '',
  };
}

export function sameCartItems(left: CartLocalItem[], right: CartLocalItem[]) {
  return (
    left.length === right.length &&
    left.every(
      (item, index) =>
        right[index]?.productId === item.productId &&
        (right[index]?.variantId ?? null) === (item.variantId ?? null) &&
        right[index]?.quantity === item.quantity,
    )
  );
}

export function hasInvalidCheckoutItems(items: CartQuoteLine[]) {
  return items.some((item) => !item.valid);
}

export function resolveCheckoutPaymentMethods(config?: CheckoutConfig | null) {
  return config?.paymentMethods?.length ? config.paymentMethods : DEFAULT_CHECKOUT_PAYMENT_OPTIONS;
}

export function resolveCheckoutTransferDetails(config?: CheckoutConfig | null) {
  return config?.transferDetails ?? DEFAULT_CHECKOUT_TRANSFER_DETAILS;
}

export function resolveSelectedPayment(
  paymentMethod: string,
  options?: CheckoutPaymentMethodConfig[],
) {
  const source = options?.length ? options : DEFAULT_CHECKOUT_PAYMENT_OPTIONS;
  return source.find((option) => option.value === paymentMethod) ?? source[0];
}

export function buildCheckoutEmptyState(hasCartItems: boolean) {
  if (hasCartItems) {
    return {
      title: 'Hay productos para revisar',
      description: 'Volve al carrito para ajustar cantidades o quitar productos sin stock antes de confirmar la compra.',
      subtitle: 'Todavia no podemos confirmar el pedido con el stock actual.',
    };
  }

  return {
    title: 'Tu carrito esta vacio',
    description: 'Necesitas productos validos en el carrito para confirmar la compra.',
    subtitle: 'Necesitas productos validos en el carrito para confirmar la compra.',
  };
}

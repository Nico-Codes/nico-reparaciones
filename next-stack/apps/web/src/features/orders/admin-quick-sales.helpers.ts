import type { AdminProduct } from '@/features/catalogAdmin/api';

export type CartLine = {
  product: AdminProduct;
  quantity: number;
};

export const QUICK_SALE_PAYMENT_METHODS = [
  { key: 'local', label: 'Pago en el local' },
  { key: 'mercado_pago', label: 'Mercado Pago' },
  { key: 'transferencia', label: 'Transferencia' },
] as const;

export function quickSalePaymentOptions() {
  return QUICK_SALE_PAYMENT_METHODS.map((method) => ({ value: method.key, label: method.label }));
}

export function clampQuickSaleQty(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(999, Math.trunc(value)));
}

export function normalizeQuickSalePhone(value: string) {
  return value.replace(/\D+/g, '');
}

export function validateQuickSalePhone(value: string) {
  if (!value.trim()) return '';
  const digits = normalizeQuickSalePhone(value);
  if (digits.length < 6) return 'Ingresa un telefono valido con al menos 6 digitos.';
  if (digits.length > 20) return 'El telefono no puede superar los 20 digitos.';
  return '';
}

export function isQuickSaleProductAvailable(product: AdminProduct) {
  return product.active && product.stock > 0;
}

export function filterQuickSaleProducts(products: AdminProduct[]) {
  return products.filter(isQuickSaleProductAvailable).slice(0, 50);
}

export function findQuickSaleProductByCode(products: AdminProduct[], rawCode: string) {
  const code = rawCode.trim().toLowerCase();
  if (!code) return null;
  return (
    products.find((product) => {
      const sku = (product.sku ?? '').trim().toLowerCase();
      const barcode = (product.barcode ?? '').trim().toLowerCase();
      return sku === code || barcode === code;
    }) ?? null
  );
}

export function addQuickSaleLine(
  cart: CartLine[],
  product: AdminProduct,
  quantityRaw = 1,
): { ok: true; cart: CartLine[] } | { ok: false; message: string } {
  const quantity = clampQuickSaleQty(quantityRaw);
  if (!isQuickSaleProductAvailable(product)) {
    return { ok: false, message: 'El producto esta inactivo o no tiene stock disponible.' };
  }

  const currentLine = cart.find((line) => line.product.id === product.id);
  if (currentLine && currentLine.quantity >= product.stock) {
    return { ok: false, message: 'Ya alcanzaste el stock disponible para este producto.' };
  }

  if (!currentLine) {
    return {
      ok: true,
      cart: [...cart, { product, quantity: Math.min(quantity, product.stock) }],
    };
  }

  return {
    ok: true,
    cart: cart.map((line) =>
      line.product.id === product.id
        ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) }
        : line,
    ),
  };
}

export function updateQuickSaleLineQty(cart: CartLine[], productId: string, value: number) {
  const next = Math.max(0, Math.min(999, Math.trunc(value)));
  return cart
    .map((line) =>
      line.product.id === productId
        ? { ...line, quantity: Math.min(line.product.stock, next) }
        : line,
    )
    .filter((line) => line.quantity > 0);
}

export function removeQuickSaleLine(cart: CartLine[], productId: string) {
  return cart.filter((line) => line.product.id !== productId);
}

export function isQuickSaleCartLineInvalid(line: CartLine) {
  return !line.product.active || line.product.stock <= 0 || line.quantity <= 0 || line.quantity > line.product.stock;
}

export function hasInvalidQuickSaleCart(cart: CartLine[]) {
  return cart.some(isQuickSaleCartLineInvalid);
}

export function buildQuickSaleTotals(cart: CartLine[]) {
  const itemsCount = cart.reduce((acc, line) => acc + line.quantity, 0);
  const total = cart.reduce((acc, line) => acc + line.quantity * Number(line.product.price || 0), 0);
  return { itemsCount, total };
}

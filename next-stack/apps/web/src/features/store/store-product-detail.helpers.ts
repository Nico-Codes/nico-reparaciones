import type { StoreProduct } from './types';

export type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export function formatStoreProductMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function resolveStoreProductStockTone(item: StoreProduct | null): BadgeTone {
  if (!item) return 'neutral';
  if (item.stock <= 0) return 'danger';
  if (item.stock <= 3) return 'warning';
  return 'success';
}

export function clampStoreProductQuantity(rawValue: number, stock: number | undefined) {
  const maxQty = Math.max(1, stock ?? 1);
  return Math.min(maxQty, Math.max(1, Number(rawValue) || 1));
}

export function getStoreProductAvailabilityLabel(item: StoreProduct | null) {
  if (!item || item.stock <= 0) return 'Consultar disponibilidad';
  return `${item.stock} unidades`;
}

export function getStoreProductFallbackDescription(item: StoreProduct | null) {
  if (item?.description) return item.description;
  return 'Producto listo para compra directa. Si necesitas mas contexto tecnico, podes contactarte desde la tienda o consultarnos por reparacion.';
}

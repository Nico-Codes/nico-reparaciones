import type { StoreProduct } from './types';

export type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export function formatStoreProductMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function isStoreProductSpecialOrder(item: StoreProduct | null) {
  return item?.fulfillmentMode === 'SPECIAL_ORDER';
}

export function canPurchaseStoreProduct(item: StoreProduct | null) {
  if (!item) return false;
  if (isStoreProductSpecialOrder(item)) {
    if (item.hasColorOptions) {
      return item.colorOptions.some((option) => option.active && option.supplierAvailability === 'IN_STOCK');
    }
    return item.supplierAvailability !== 'OUT_OF_STOCK';
  }
  return item.stock > 0;
}

export function getStoreProductCtaLabel(item: StoreProduct | null) {
  if (!item) return 'Agregar al carrito';
  if (isStoreProductSpecialOrder(item)) return 'Encargar';
  return canPurchaseStoreProduct(item) ? 'Agregar al carrito' : 'Sin stock';
}

export function resolveStoreProductStockTone(item: StoreProduct | null): BadgeTone {
  if (!item) return 'neutral';
  if (isStoreProductSpecialOrder(item)) return item.supplierAvailability === 'IN_STOCK' ? 'accent' : 'neutral';
  if (item.stock <= 0) return 'danger';
  if (item.stock <= 3) return 'warning';
  return 'success';
}

export function clampStoreProductQuantity(rawValue: number, stock: number | undefined, fulfillmentMode?: StoreProduct['fulfillmentMode']) {
  const maxQty = fulfillmentMode === 'SPECIAL_ORDER' ? 999 : Math.max(1, stock ?? 1);
  return Math.min(maxQty, Math.max(1, Number(rawValue) || 1));
}

export function getStoreProductAvailabilityLabel(item: StoreProduct | null) {
  if (!item) return 'Consultar disponibilidad';
  if (isStoreProductSpecialOrder(item)) {
    if (item.hasColorOptions) {
      const availableCount = item.colorOptions.filter((option) => option.active && option.supplierAvailability === 'IN_STOCK').length;
      return availableCount > 0 ? `${availableCount} colores disponibles` : 'Sin colores disponibles';
    }
    return 'Disponible por encargue';
  }
  if (item.stock <= 0) return 'Consultar disponibilidad';
  return `${item.stock} unidades`;
}

export function getStoreProductFallbackDescription(item: StoreProduct | null) {
  if (item?.description) return item.description;
  if (isStoreProductSpecialOrder(item)) {
    return 'Producto disponible por encargue. Se confirma contra proveedor y entra al pedido sin depender de stock local.';
  }
  return 'Producto listo para compra directa. Si necesitas mas contexto tecnico, podes contactarte desde la tienda o consultarnos por reparacion.';
}

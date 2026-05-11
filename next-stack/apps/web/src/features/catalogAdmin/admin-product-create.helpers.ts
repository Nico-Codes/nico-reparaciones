import type { AdminCategory } from './api';
import { findCategoryPathLabel, money, slugify, validateProductNameLength } from './admin-product-form.helpers';

export type AdminProductCreateDraft = {
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  purchaseRef: string;
  costPrice: string;
  price: string;
  stock: string;
  description: string;
  featured: boolean;
  active: boolean;
  publishedToStore: boolean;
  repairUsageEnabled: boolean;
};

export type AdminProductCreateSupplier = {
  id: string;
  name: string;
};

export type AdminProductCreateSummaryItem = {
  label: string;
  value: string;
  tone?: 'default' | 'money';
};

export function validateAdminProductCreateDraft(
  draft: Pick<AdminProductCreateDraft, 'name' | 'slug' | 'costPrice' | 'price'> &
    Partial<Pick<AdminProductCreateDraft, 'stock' | 'repairUsageEnabled'>>,
  preventNegativeMargin: boolean,
) {
  const trimmedName = draft.name.trim();
  const nextSlug = slugify(draft.slug.trim() || trimmedName);
  if (!trimmedName || nextSlug.length < 2) {
    return 'Completa un nombre valido para generar el producto.';
  }
  const nameLengthError = validateProductNameLength(trimmedName);
  if (nameLengthError) return nameLengthError;

  const nextCost = Number(draft.costPrice || 0);
  const nextPrice = Number(draft.price || 0);
  if (preventNegativeMargin && Number.isFinite(nextCost) && Number.isFinite(nextPrice) && nextPrice < nextCost) {
    return 'El precio de venta no puede quedar por debajo del costo mientras el guard de margen este activo.';
  }
  const nextStock = Number(draft.stock || 0);
  if (draft.repairUsageEnabled && (!Number.isFinite(nextCost) || nextCost <= 0 || !Number.isFinite(nextStock) || nextStock < 1)) {
    return 'Un repuesto interno necesita costo y stock inicial mayor a cero.';
  }

  return null;
}

export function buildAdminProductCreatePayload(draft: AdminProductCreateDraft) {
  const trimmedName = draft.name.trim();
  return {
    name: trimmedName,
    slug: slugify(draft.slug.trim() || trimmedName),
    sku: draft.sku.trim() || null,
    barcode: draft.barcode.trim() || null,
    categoryId: draft.categoryId || null,
    supplierId: draft.supplierId || null,
    purchaseReference: draft.purchaseRef.trim() || null,
    costPrice: Number(draft.costPrice || 0),
    price: Number(draft.price || 0),
    stock: Math.max(0, Math.trunc(Number(draft.stock || 0))),
    description: draft.description.trim() || null,
    featured: draft.featured,
    active: draft.active,
    publishedToStore: draft.publishedToStore,
    repairUsageEnabled: draft.repairUsageEnabled,
  };
}

export function buildAdminProductCreateSummary(
  draft: Pick<AdminProductCreateDraft, 'name' | 'categoryId' | 'supplierId' | 'price'>,
  finalSlug: string,
  categories: AdminCategory[],
  suppliers: AdminProductCreateSupplier[],
): AdminProductCreateSummaryItem[] {
  return [
    {
      label: 'Nombre',
      value: draft.name.trim() || 'Sin completar',
    },
    {
      label: 'Slug final',
      value: finalSlug || 'Sin generar',
    },
    {
      label: 'Categoria',
      value: findCategoryPathLabel(categories, draft.categoryId, 'Sin categoria'),
    },
    {
      label: 'Proveedor',
      value: suppliers.find((supplier) => supplier.id === draft.supplierId)?.name || 'Sin proveedor',
    },
    {
      label: 'Venta',
      value: money(Number(draft.price || 0)),
      tone: 'money',
    },
  ];
}

import { authFetch, authJsonRequest } from '@/features/auth/http';

async function authMultipartRequest<T>(path: string, form: FormData): Promise<T> {
  const res = await authFetch(path, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as T;
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent: { id: string; name: string; slug: string } | null;
  depth: number;
  active: boolean;
  directProductsCount: number;
  totalProductsCount: number;
  productsCount: number;
  childrenCount: number;
  pathLabel: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  purchaseReference: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  sourcePriceUsd: number | null;
  active: boolean;
  featured: boolean;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: { id: string; name: string; slug: string } | null;
    pathLabel: string;
  } | null;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  specialOrderProfile: { id: string; name: string } | null;
  hasColorOptions: boolean;
  colorOptions: Array<{
    id: string;
    label: string;
    normalizedLabel: string;
    supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
    active: boolean;
    lastImportedAt: string | null;
    sourceSheetRow: number | null;
    sourceSheetKey: string | null;
  }>;
  lastImportedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SpecialOrderProfile = {
  id: string;
  name: string;
  active: boolean;
  supplier: { id: string; name: string };
  defaultUsdRate: number;
  defaultShippingUsd: number;
  fallbackMarginPercent: number;
  defaultColorSheetUrl: string | null;
  rememberColorSheet: boolean;
  lastBatch: { id: string; createdAt: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type SpecialOrderSectionMappingInput = {
  sectionKey: string;
  categoryId?: string | null;
  createCategoryName?: string | null;
};

export type SpecialOrderPreviewSection = {
  sectionKey: string;
  sectionName: string;
  categoryId: string | null;
  categoryName: string | null;
  createCategoryName: string | null;
  willCreateCategory: boolean;
  mappingSource: 'input' | 'profile' | 'existing' | 'new';
  included: boolean;
  rememberedExcluded: boolean;
};

export type SpecialOrderPreviewItem = {
  rowId: string;
  lineNumber: number;
  included: boolean;
  collapsedDuplicate: boolean;
  conflictReason: string | null;
  excludedBySection: boolean;
  excludedBySource: boolean;
  excludedByRow: boolean;
  rememberedExcludedBySection: boolean;
  rememberedExcludedBySource: boolean;
  resolvedStatus: 'new' | 'price_update' | 'availability_update' | 'unchanged' | 'missing_deactivate' | 'conflict';
  status: 'new' | 'price_update' | 'availability_update' | 'unchanged' | 'missing_deactivate' | 'conflict';
  sourceKey: string;
  sectionKey: string;
  sectionName: string;
  title: string;
  sourcePriceUsd: number | null;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  nextCostPrice: number;
  nextPrice: number;
  marginPercent: number;
  appliedRuleName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createCategoryName: string | null;
  willCreateCategory: boolean;
  mappingSource: 'input' | 'profile' | 'existing' | 'new';
  existingProductId: string | null;
  existingProduct: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    price: number;
    costPrice: number | null;
    supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
    category: {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      parent: { id: string; name: string; slug: string } | null;
      pathLabel: string;
    } | null;
  } | null;
};

export type SpecialOrderPreviewMissingItem = {
  rowId: string;
  productId: string;
  sourceKey: string;
  title: string;
  status: 'missing_deactivate';
  categoryName: string | null;
};

export type SpecialOrderImportPreview = {
  profile: SpecialOrderProfile;
  usdRate: number;
  shippingUsd: number;
  blocked: boolean;
  selection: {
    excludedSectionKeys: string[];
    excludedSourceKeys: string[];
    excludedRowIds: string[];
    rememberedSectionKeys: string[];
    rememberedSourceKeys: string[];
  };
  sections: SpecialOrderPreviewSection[];
  items: SpecialOrderPreviewItem[];
  colorImport: {
    enabled: boolean;
    sourceKind: 'google_sheet' | 'csv' | null;
    sourceLabel: string | null;
    sourceUrl: string | null;
    rowsParsed: number;
    matchedCount: number;
    unmatchedCount: number;
    outOfStockCount: number;
    newCount: number;
    updatedCount: number;
    unchangedCount: number;
    deactivatedCount: number;
    warnings: Array<{
      rowId: string;
      rowNumber: number;
      sectionKey: string;
      sectionName: string;
      rawTitle: string;
      reasonCode:
        | 'section_excluded'
        | 'product_excluded'
        | 'no_product_match'
        | 'ambiguous_match'
        | 'empty_color'
        | 'duplicate_variant';
      reason: string;
      suggestions: string[];
    }>;
    items: Array<{
      productSourceKey: string;
      productTitle: string;
      productRowId: string;
      sectionKey: string;
      sectionName: string;
      items: Array<{
        rowId: string;
        rowNumber: number;
        sectionKey: string;
        sectionName: string;
        rawTitle: string;
        productSourceKey: string;
        productTitle: string;
        productRowId: string;
        label: string;
        normalizedLabel: string;
        sourceSheetKey: string;
        supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
        status: 'new' | 'availability_update' | 'unchanged';
        existingVariantId: string | null;
        included: boolean;
      }>;
    }>;
  };
  missing: SpecialOrderPreviewMissingItem[];
  summary: {
    newCount: number;
    priceUpdatedCount: number;
    availabilityUpdatedCount: number;
    unchangedCount: number;
    conflictCount: number;
    supplierOutOfStockCount: number;
    deactivatedCount: number;
    updatedCount: number;
    parsedCount: number;
    includedCount: number;
    excludedCount: number;
  };
};

export const catalogAdminApi = {
  categories() {
    return authJsonRequest<{ items: AdminCategory[] }>('/catalog-admin/categories');
  },
  createCategory(input: { name: string; slug: string; parentId?: string | null; active?: boolean }) {
    return authJsonRequest<{ item: AdminCategory }>('/catalog-admin/categories', { method: 'POST', body: JSON.stringify(input) });
  },
  updateCategory(id: string, input: Partial<{ name: string; slug: string; parentId: string | null; active: boolean }>) {
    return authJsonRequest<{ item: AdminCategory }>(`/catalog-admin/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  deleteCategory(id: string) {
    return authJsonRequest<{ ok: boolean }>(`/catalog-admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  products(params?: { q?: string; categoryId?: string; active?: string; fulfillmentMode?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.categoryId) qs.set('categoryId', params.categoryId);
    if (params?.active) qs.set('active', params.active);
    if (params?.fulfillmentMode) qs.set('fulfillmentMode', params.fulfillmentMode);
    return authJsonRequest<{ items: AdminProduct[] }>('/catalog-admin/products' + (qs.size ? `?${qs.toString()}` : ''));
  },
  product(id: string) {
    return authJsonRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}`);
  },
  createProduct(input: unknown) {
    return authJsonRequest<{ item: AdminProduct }>('/catalog-admin/products', { method: 'POST', body: JSON.stringify(input) });
  },
  updateProduct(id: string, input: unknown) {
    return authJsonRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  uploadProductImage(id: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return authMultipartRequest<{ item: AdminProduct; upload: { path: string; url: string | null } }>(
      `/catalog-admin/products/${encodeURIComponent(id)}/image`,
      form,
    );
  },
  removeProductImage(id: string) {
    return authJsonRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}/image`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  },
  createProductColorVariant(
    id: string,
    input: { label: string; supplierAvailability?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'; active?: boolean },
  ) {
    return authJsonRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}/color-variants`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateProductColorVariant(
    id: string,
    variantId: string,
    input: Partial<{ label: string; supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'; active: boolean }>,
  ) {
    return authJsonRequest<{ item: AdminProduct }>(
      `/catalog-admin/products/${encodeURIComponent(id)}/color-variants/${encodeURIComponent(variantId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },
  specialOrderProfiles() {
    return authJsonRequest<{ items: SpecialOrderProfile[] }>('/catalog-admin/special-order-profiles');
  },
  createSpecialOrderProfile(input: {
    supplierId: string;
    name: string;
    active?: boolean;
    defaultUsdRate: number;
    defaultShippingUsd: number;
    fallbackMarginPercent: number;
    defaultColorSheetUrl?: string | null;
    rememberColorSheet?: boolean;
  }) {
    return authJsonRequest<{ item: SpecialOrderProfile }>('/catalog-admin/special-order-profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateSpecialOrderProfile(
    id: string,
    input: Partial<{
      supplierId: string;
      name: string;
      active: boolean;
      defaultUsdRate: number;
      defaultShippingUsd: number;
      fallbackMarginPercent: number;
      defaultColorSheetUrl: string | null;
      rememberColorSheet: boolean;
    }>,
  ) {
    return authJsonRequest<{ item: SpecialOrderProfile }>(`/catalog-admin/special-order-profiles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  previewSpecialOrderImport(input: {
    profileId: string;
    rawText: string;
    usdRate?: number | null;
    shippingUsd?: number | null;
    colorSheetUrl?: string | null;
    colorCsvText?: string | null;
    sectionMappings?: SpecialOrderSectionMappingInput[];
    excludedSectionKeys?: string[];
    excludedSourceKeys?: string[];
    excludedRowIds?: string[];
    rememberExclusions?: boolean;
  }) {
    return authJsonRequest<SpecialOrderImportPreview>('/catalog-admin/special-order-imports/preview', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  applySpecialOrderImport(input: {
    profileId: string;
    rawText: string;
    usdRate?: number | null;
    shippingUsd?: number | null;
    colorSheetUrl?: string | null;
    colorCsvText?: string | null;
    sectionMappings?: SpecialOrderSectionMappingInput[];
    excludedSectionKeys?: string[];
    excludedSourceKeys?: string[];
    excludedRowIds?: string[];
    rememberExclusions?: boolean;
  }) {
    return authJsonRequest<{
      ok: boolean;
      batchId: string;
      summary: SpecialOrderImportPreview['summary'];
      item: SpecialOrderProfile;
    }>('/catalog-admin/special-order-imports/apply', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

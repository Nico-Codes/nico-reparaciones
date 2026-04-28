import { Prisma } from '@prisma/client';

export type CategoryCreateInput = {
  name: string;
  slug: string;
  parentId?: string | null;
  active?: boolean;
};

export type CategoryUpdateInput = {
  name?: string;
  slug?: string;
  parentId?: string | null;
  active?: boolean;
};

export type ProductListParams = {
  q?: string;
  categoryId?: string;
  active?: string;
  fulfillmentMode?: string;
};

export type ProductCreateInput = {
  name: string;
  slug: string;
  description?: string | null;
  purchaseReference?: string | null;
  price?: number | null;
  costPrice?: number | null;
  stock?: number;
  active?: boolean;
  featured?: boolean;
  sku?: string | null;
  barcode?: string | null;
  supplierId?: string | null;
  categoryId?: string | null;
};

export type ProductUpdateInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  purchaseReference?: string | null;
  price?: number | null;
  costPrice?: number | null;
  stock?: number;
  active?: boolean;
  featured?: boolean;
  sku?: string | null;
  barcode?: string | null;
  supplierId?: string | null;
  categoryId?: string | null;
};

export type ProductColorVariantCreateInput = {
  label: string;
  supplierAvailability?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  active?: boolean;
};

export type ProductColorVariantUpdateInput = Partial<ProductColorVariantCreateInput>;

export type SpecialOrderProfileCreateInput = {
  supplierId: string;
  name: string;
  active?: boolean;
  defaultUsdRate: number;
  defaultShippingUsd: number;
  fallbackMarginPercent: number;
  defaultColorSheetUrl?: string | null;
  rememberColorSheet?: boolean;
  requiresColorVariants?: boolean;
};

export type SpecialOrderProfileUpdateInput = Partial<SpecialOrderProfileCreateInput>;

export type SpecialOrderSectionMappingInput = {
  sectionKey: string;
  categoryId?: string | null;
  createCategoryName?: string | null;
};

export type SpecialOrderImportPreviewInput = {
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
};

export type SpecialOrderImportApplyInput = SpecialOrderImportPreviewInput & {
  createdBy?: string | null;
};

export type ProductImageUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer | Uint8Array;
};

export type ProductPricingSettingsInput = {
  defaultMarginPercent: number;
  preventNegativeMargin: boolean;
};

export type ProductPricingRuleCreateInput = {
  name: string;
  categoryId?: string | null;
  productId?: string | null;
  costMin?: number | null;
  costMax?: number | null;
  marginPercent: number;
  priority?: number;
  active?: boolean;
};

export type ProductPricingRuleUpdateInput = Partial<ProductPricingRuleCreateInput>;

export type ResolveProductPricingInput = {
  categoryId: string;
  costPrice: number;
  productId?: string | null;
};

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
        parentId: true;
        parent: { select: { id: true; name: true; slug: true } };
      };
    };
    supplier: { select: { id: true; name: true } };
    specialOrderProfile: { select: { id: true; name: true; requiresColorVariants: true } };
    colorVariants: {
      select: {
        id: true;
        label: true;
        normalizedLabel: true;
        supplierAvailability: true;
        active: true;
        lastImportedAt: true;
        sourceSheetRow: true;
        sourceSheetKey: true;
      };
      orderBy: [{ active: 'desc' }, { label: 'asc' }];
    };
  };
}>;

export type ProductPricingRuleWithRelations = Prisma.ProductPricingRuleGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
        parentId: true;
        parent: { select: { id: true; name: true; slug: true } };
      };
    };
    product: { select: { id: true; name: true } };
  };
}>;

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    parent: { select: { id: true; name: true; slug: true } };
    children: { select: { id: true } };
    _count: { select: { products: true } };
  };
}>;

export type SpecialOrderImportProfileWithRelations = Prisma.SpecialOrderImportProfileGetPayload<{
  include: {
    supplier: { select: { id: true; name: true } };
  };
}>;

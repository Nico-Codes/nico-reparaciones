import { Prisma } from '@prisma/client';

export type CategoryCreateInput = {
  name: string;
  slug: string;
  active?: boolean;
};

export type CategoryUpdateInput = {
  name?: string;
  slug?: string;
  active?: boolean;
};

export type ProductListParams = {
  q?: string;
  categoryId?: string;
  active?: string;
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
    category: { select: { id: true; name: true; slug: true } };
    supplier: { select: { id: true; name: true } };
  };
}>;

export type ProductPricingRuleWithRelations = Prisma.ProductPricingRuleGetPayload<{
  include: {
    category: { select: { id: true; name: true } };
    product: { select: { id: true; name: true } };
  };
}>;

import { z } from 'zod';

export const createRepairSchema = z.object({
  customerName: z.string().trim().min(2).max(190),
  customerPhone: z.string().trim().max(60).optional().nullable(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  quotedPrice: z.number().nonnegative().optional().nullable(),
  finalPrice: z.number().nonnegative().optional().nullable(),
  userId: z.string().optional().nullable(),
  pricingSnapshotDraft: z.object({
    source: z.literal('SUPPLIER_PART'),
    status: z.literal('DRAFT'),
    supplierId: z.string().trim().min(1).max(191),
    supplierNameSnapshot: z.string().trim().min(2).max(190),
    supplierSearchQuery: z.string().trim().max(191).optional().nullable(),
    supplierEndpointSnapshot: z.string().trim().max(2048).optional().nullable(),
    externalPartId: z.string().trim().max(191).optional().nullable(),
    partSkuSnapshot: z.string().trim().max(191).optional().nullable(),
    partNameSnapshot: z.string().trim().min(2).max(300),
    partBrandSnapshot: z.string().trim().max(190).optional().nullable(),
    partUrlSnapshot: z.string().trim().max(2048).optional().nullable(),
    partAvailabilitySnapshot: z.enum(['in_stock', 'out_of_stock', 'unknown']).optional().nullable(),
    quantity: z.number().int().min(1).max(999),
    deviceTypeIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceBrandIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceModelGroupIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceModelIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceIssueTypeIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceBrandSnapshot: z.string().trim().max(120).optional().nullable(),
    deviceModelSnapshot: z.string().trim().max(120).optional().nullable(),
    issueLabelSnapshot: z.string().trim().max(190).optional().nullable(),
    baseCost: z.number().nonnegative(),
    extraCost: z.number().nonnegative(),
    shippingCost: z.number().nonnegative(),
    pricingRuleId: z.string().trim().min(1).max(191),
    pricingRuleNameSnapshot: z.string().trim().min(2).max(190),
    calcModeSnapshot: z.enum(['BASE_PLUS_MARGIN', 'FIXED_TOTAL']),
    marginPercentSnapshot: z.number().nonnegative(),
    minProfitSnapshot: z.number().nonnegative().optional().nullable(),
    minFinalPriceSnapshot: z.number().nonnegative().optional().nullable(),
    shippingFeeSnapshot: z.number().nonnegative().optional().nullable(),
    suggestedQuotedPrice: z.number().nonnegative().optional().nullable(),
    appliedQuotedPrice: z.number().nonnegative().optional().nullable(),
    manualOverridePrice: z.number().nonnegative().optional().nullable(),
  }).optional().nullable(),
});

export const updateStatusSchema = z.object({
  status: z.string().min(1),
  finalPrice: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateRepairSchema = z.object({
  customerName: z.string().trim().min(2).max(190).optional(),
  customerPhone: z.string().trim().max(60).optional().nullable(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  quotedPrice: z.number().nonnegative().optional().nullable(),
  finalPrice: z.number().nonnegative().optional().nullable(),
  status: z.string().min(1).optional(),
  pricingSnapshotDraft: createRepairSchema.shape.pricingSnapshotDraft,
});

export const publicLookupSchema = z.object({
  repairId: z.string().trim().min(6).max(191),
  customerPhone: z.string().trim().min(6).max(60),
});

export const publicQuoteTokenSchema = z.object({
  token: z.string().trim().min(10).max(4096),
});

import type { Prisma } from '@prisma/client';

export type RepairPricingSnapshotDraftInput = {
  source: 'SUPPLIER_PART';
  status: 'DRAFT';
  supplierId: string;
  supplierNameSnapshot: string;
  supplierSearchQuery?: string | null;
  supplierEndpointSnapshot?: string | null;
  externalPartId?: string | null;
  partSkuSnapshot?: string | null;
  partNameSnapshot: string;
  partBrandSnapshot?: string | null;
  partUrlSnapshot?: string | null;
  partAvailabilitySnapshot?: 'in_stock' | 'out_of_stock' | 'unknown' | null;
  quantity: number;
  deviceTypeIdSnapshot?: string | null;
  deviceBrandIdSnapshot?: string | null;
  deviceModelGroupIdSnapshot?: string | null;
  deviceModelIdSnapshot?: string | null;
  deviceIssueTypeIdSnapshot?: string | null;
  deviceBrandSnapshot?: string | null;
  deviceModelSnapshot?: string | null;
  issueLabelSnapshot?: string | null;
  baseCost: number;
  extraCost: number;
  shippingCost: number;
  pricingRuleId: string;
  pricingRuleNameSnapshot: string;
  calcModeSnapshot: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
  marginPercentSnapshot: number;
  minProfitSnapshot?: number | null;
  minFinalPriceSnapshot?: number | null;
  shippingFeeSnapshot?: number | null;
  suggestedQuotedPrice?: number | null;
  appliedQuotedPrice?: number | null;
  manualOverridePrice?: number | null;
};

export type CreateRepairInput = {
  customerName: string;
  customerPhone?: string | null;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  notes?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  userId?: string | null;
  pricingSnapshotDraft?: RepairPricingSnapshotDraftInput | null;
};

export type UpdateRepairInput = Partial<Omit<CreateRepairInput, 'userId'>> & {
  customerName?: string;
  status?: string;
};

export type RepairAdminListParams = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
};

export type RepairPricingDraftContext = {
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
};

export type RepairWithActiveSnapshot = Prisma.RepairGetPayload<{
  include: {
    activePricingSnapshot: true;
  };
}>;

export type QuoteApprovalTokenPayload = {
  type: 'repair_quote';
  repairId: string;
};

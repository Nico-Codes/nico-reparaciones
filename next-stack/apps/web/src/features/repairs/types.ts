export type RepairItem = {
  id: string;
  userId: string | null;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  customerName: string;
  customerPhone: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  issueLabel: string | null;
  status: string;
  quotedPrice: number | null;
  finalPrice: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicRepairLookupItem = {
  id: string;
  customerName: string;
  customerPhoneMasked: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  issueLabel: string | null;
  status: string;
  quotedPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RepairTimelineEvent = {
  id: string;
  eventType: string;
  message: string | null;
  meta: unknown;
  createdAt: string;
};

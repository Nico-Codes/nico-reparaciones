export type RepairItem = {
  id: string;
  userId: string | null;
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

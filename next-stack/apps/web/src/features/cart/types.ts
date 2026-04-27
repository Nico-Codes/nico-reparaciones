export type CartLocalItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type CartQuoteLine = {
  productId: string;
  variantId?: string | null;
  quantity: number;
  requestedQuantity?: number;
  valid: boolean;
  reason: string | null;
  name: string;
  selectedColorLabel: string | null;
  slug?: string;
  unitPrice: number;
  lineTotal: number;
  stockAvailable: number;
  fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  active: boolean;
  category: { id: string; name: string; slug: string } | null;
  requiresColorSelection: boolean;
  colorOptions: Array<{
    id: string;
    label: string;
    supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
    active: boolean;
  }>;
};

export type CartQuoteResponse = {
  items: CartQuoteLine[];
  totals: {
    subtotal: number;
    itemsCount: number;
  };
  errors?: Array<{ path: string; message: string }>;
};

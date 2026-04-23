export type CartLocalItem = {
  productId: string;
  quantity: number;
};

export type CartQuoteLine = {
  productId: string;
  quantity: number;
  requestedQuantity?: number;
  valid: boolean;
  reason: string | null;
  name: string;
  slug?: string;
  unitPrice: number;
  lineTotal: number;
  stockAvailable: number;
  fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  active: boolean;
  category: { id: string; name: string; slug: string } | null;
};

export type CartQuoteResponse = {
  items: CartQuoteLine[];
  totals: {
    subtotal: number;
    itemsCount: number;
  };
  errors?: Array<{ path: string; message: string }>;
};

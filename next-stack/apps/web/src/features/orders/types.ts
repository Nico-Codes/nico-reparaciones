export type OrderLine = {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderItem = {
  id: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  transferProofUrl: string | null;
  transferProofUploadedAt: string | null;
  isQuickSale: boolean;
  quickSaleAdminId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  items: OrderLine[];
};

export type QuickSaleHistoryItem = OrderItem & {
  itemsCount: number;
  admin?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type CheckoutPaymentMethodKey = 'efectivo' | 'transferencia';

export type CheckoutPaymentMethodConfig = {
  value: CheckoutPaymentMethodKey;
  title: string;
  subtitle: string;
  iconUrl: string | null;
};

export type CheckoutTransferField = {
  key: string;
  label: string;
  value: string;
};

export type CheckoutTransferDetails = {
  title: string;
  description: string;
  note: string;
  available: boolean;
  supportWhatsappPhone: string | null;
  fields: CheckoutTransferField[];
};

export type CheckoutConfig = {
  paymentMethods: CheckoutPaymentMethodConfig[];
  transferDetails: CheckoutTransferDetails;
};

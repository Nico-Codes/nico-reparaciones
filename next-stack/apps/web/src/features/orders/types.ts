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

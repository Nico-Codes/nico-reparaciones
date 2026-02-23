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
  createdAt: string;
  updatedAt: string;
  items: OrderLine[];
};

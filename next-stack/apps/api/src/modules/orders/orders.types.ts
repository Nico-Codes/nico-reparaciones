import type { Prisma } from '@prisma/client';

export type CheckoutInput = {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: string | null;
};

export type AdminListInput = {
  status?: string;
  q?: string;
};

export type QuickSaleConfirmInput = {
  adminUserId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
};

export type QuickSalesHistoryInput = {
  from?: string;
  to?: string;
  payment?: string;
  adminId?: string;
};

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export type OrderWithUserAndItems = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    items: true;
  };
}>;

export type SerializableOrder = OrderWithItems & {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

import { z } from 'zod';

export const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().min(1).optional(),
      quantity: z.number().int().min(1).max(999),
    }),
  ).min(1).max(200),
  paymentMethod: z.string().trim().min(1).max(60).optional(),
});

export const adminUpdateStatusSchema = z.object({
  status: z.string().trim().min(1),
});

export const adminQuickSaleConfirmSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(999),
    }),
  ).min(1).max(200),
  paymentMethod: z.string().trim().min(1).max(60),
  customerName: z.string().trim().max(120).optional(),
  customerPhone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
});

import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const upsertSettingsSchema = z.object({
  items: z.array(
    z.object({
      key: z.string().trim().min(1).max(190),
      value: z.string().optional().nullable(),
      group: z.string().trim().max(120).optional(),
      label: z.string().trim().max(190).optional().nullable(),
      type: z.string().trim().max(40).optional().nullable(),
    }),
  ).min(1).max(200),
});

export const upsertMailTemplatesSchema = z.object({
  items: z.array(
    z.object({
      templateKey: z.string().trim().min(1).max(120),
      subject: z.string().max(300),
      body: z.string().max(20000),
      enabled: z.boolean().optional(),
    }),
  ).min(1).max(50),
});

export const upsertWhatsappTemplatesSchema = z.object({
  channel: z.enum(['repairs', 'orders']).optional(),
  items: z.array(
    z.object({
      templateKey: z.string().trim().min(1).max(120),
      body: z.string().max(20000),
      enabled: z.boolean().optional(),
      channel: z.enum(['repairs', 'orders']).optional(),
    }),
  ).min(1).max(50),
});

export const createWhatsappLogSchema = z.object({
  channel: z.string().trim().max(60).optional(),
  templateKey: z.string().trim().max(120).optional().nullable(),
  targetType: z.string().trim().max(60).optional().nullable(),
  targetId: z.string().trim().max(191).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  recipient: z.string().trim().max(190).optional().nullable(),
  status: z.string().trim().max(60).optional(),
  message: z.string().trim().max(4000).optional().nullable(),
  meta: z.record(z.string(), z.any()).optional().nullable(),
});

export const helpFaqCreateSchema = z.object({
  question: z.string().trim().min(3).max(500),
  answer: z.string().trim().min(3).max(10000),
  category: z.string().trim().max(120).optional().nullable(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
});

export const helpFaqPatchSchema = helpFaqCreateSchema.partial();

export const twoFactorCodeSchema = z.object({
  code: z.string().trim().min(6).max(12),
});

export const twoFactorDisableSchema = z.object({
  code: z.string().trim().min(6).max(12).optional(),
});

export const sendWeeklyReportNowSchema = z.object({
  rangeDays: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional(),
});

export const smtpTestSchema = z.object({
  email: z.string().trim().email().max(190),
});

export const deviceTypeCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  active: z.boolean().optional(),
});

export const deviceTypeUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  active: z.boolean().optional(),
});

export const modelGroupCreateSchema = z.object({
  deviceBrandId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(2).max(100),
  active: z.boolean().optional(),
});

export const modelGroupUpdateSchema = z.object({
  deviceBrandId: z.string().trim().min(1).max(191),
  name: z.string().trim().min(2).max(100).optional(),
  active: z.boolean().optional(),
});

export const modelGroupAssignSchema = z.object({
  deviceBrandId: z.string().trim().min(1).max(191),
  deviceModelGroupId: z.string().trim().max(191).optional().nullable(),
});

export const providerCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(60).optional().nullable(),
  notes: z.string().trim().max(1500).optional().nullable(),
  searchPriority: z.number().int().min(1).max(99999).optional(),
  searchEnabled: z.boolean().optional(),
  searchMode: z.enum(['json', 'html']).optional(),
  searchEndpoint: z.string().trim().max(500).optional().nullable(),
  searchConfigJson: z.string().max(8000).optional().nullable(),
  active: z.boolean().optional(),
});

export const providerUpdateSchema = providerCreateSchema.partial();

export const providerReorderSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1).max(191)).min(1).max(500),
});

export const providerProbeSchema = z.object({
  q: z.string().trim().min(2).max(120).optional(),
});

export const providerSearchPartsSchema = z.object({
  q: z.string().trim().min(2).max(160),
  limit: z.number().int().min(1).max(30).optional(),
});

export const providerAggregateSearchPartsSchema = z.object({
  q: z.string().trim().min(2).max(160),
  supplierId: z.string().trim().min(1).max(191).optional().nullable(),
  limitPerSupplier: z.number().int().min(1).max(20).optional(),
  totalLimit: z.number().int().min(1).max(80).optional(),
});

export const createWarrantyIncidentSchema = z.object({
  sourceType: z.enum(['repair', 'product']),
  title: z.string().trim().min(3).max(120),
  reason: z.string().trim().max(255).optional().nullable(),
  repairId: z.string().trim().max(191).optional().nullable(),
  productId: z.string().trim().max(191).optional().nullable(),
  orderId: z.string().trim().max(191).optional().nullable(),
  supplierId: z.string().trim().max(191).optional().nullable(),
  quantity: z.number().int().min(1).max(999),
  unitCost: z.number().min(0).optional().nullable(),
  costOrigin: z.enum(['manual', 'repair', 'product']).optional(),
  extraCost: z.number().min(0).optional(),
  recoveredAmount: z.number().min(0).optional(),
  happenedAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

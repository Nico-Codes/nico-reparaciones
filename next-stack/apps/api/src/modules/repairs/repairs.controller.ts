import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { RepairsService } from './repairs.service.js';

const createRepairSchema = z.object({
  customerName: z.string().trim().min(2).max(190),
  customerPhone: z.string().trim().max(60).optional().nullable(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  quotedPrice: z.number().nonnegative().optional().nullable(),
  finalPrice: z.number().nonnegative().optional().nullable(),
  userId: z.string().optional().nullable(),
  pricingSnapshotDraft: z.object({
    source: z.literal('SUPPLIER_PART'),
    status: z.literal('DRAFT'),
    supplierId: z.string().trim().min(1).max(191),
    supplierNameSnapshot: z.string().trim().min(2).max(190),
    supplierSearchQuery: z.string().trim().max(191).optional().nullable(),
    supplierEndpointSnapshot: z.string().trim().max(2048).optional().nullable(),
    externalPartId: z.string().trim().max(191).optional().nullable(),
    partSkuSnapshot: z.string().trim().max(191).optional().nullable(),
    partNameSnapshot: z.string().trim().min(2).max(300),
    partBrandSnapshot: z.string().trim().max(190).optional().nullable(),
    partUrlSnapshot: z.string().trim().max(2048).optional().nullable(),
    partAvailabilitySnapshot: z.enum(['in_stock', 'out_of_stock', 'unknown']).optional().nullable(),
    quantity: z.number().int().min(1).max(999),
    deviceTypeIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceBrandIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceModelGroupIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceModelIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceIssueTypeIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceBrandSnapshot: z.string().trim().max(120).optional().nullable(),
    deviceModelSnapshot: z.string().trim().max(120).optional().nullable(),
    issueLabelSnapshot: z.string().trim().max(190).optional().nullable(),
    baseCost: z.number().nonnegative(),
    extraCost: z.number().nonnegative(),
    shippingCost: z.number().nonnegative(),
    pricingRuleId: z.string().trim().min(1).max(191),
    pricingRuleNameSnapshot: z.string().trim().min(2).max(190),
    calcModeSnapshot: z.enum(['BASE_PLUS_MARGIN', 'FIXED_TOTAL']),
    marginPercentSnapshot: z.number().nonnegative(),
    minProfitSnapshot: z.number().nonnegative().optional().nullable(),
    minFinalPriceSnapshot: z.number().nonnegative().optional().nullable(),
    shippingFeeSnapshot: z.number().nonnegative().optional().nullable(),
    suggestedQuotedPrice: z.number().nonnegative().optional().nullable(),
    appliedQuotedPrice: z.number().nonnegative().optional().nullable(),
    manualOverridePrice: z.number().nonnegative().optional().nullable(),
  }).optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
  finalPrice: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const updateRepairSchema = z.object({
  customerName: z.string().trim().min(2).max(190).optional(),
  customerPhone: z.string().trim().max(60).optional().nullable(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  quotedPrice: z.number().nonnegative().optional().nullable(),
  finalPrice: z.number().nonnegative().optional().nullable(),
  status: z.string().min(1).optional(),
  pricingSnapshotDraft: z.object({
    source: z.literal('SUPPLIER_PART'),
    status: z.literal('DRAFT'),
    supplierId: z.string().trim().min(1).max(191),
    supplierNameSnapshot: z.string().trim().min(2).max(190),
    supplierSearchQuery: z.string().trim().max(191).optional().nullable(),
    supplierEndpointSnapshot: z.string().trim().max(2048).optional().nullable(),
    externalPartId: z.string().trim().max(191).optional().nullable(),
    partSkuSnapshot: z.string().trim().max(191).optional().nullable(),
    partNameSnapshot: z.string().trim().min(2).max(300),
    partBrandSnapshot: z.string().trim().max(190).optional().nullable(),
    partUrlSnapshot: z.string().trim().max(2048).optional().nullable(),
    partAvailabilitySnapshot: z.enum(['in_stock', 'out_of_stock', 'unknown']).optional().nullable(),
    quantity: z.number().int().min(1).max(999),
    deviceTypeIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceBrandIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceModelGroupIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceModelIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceIssueTypeIdSnapshot: z.string().trim().max(191).optional().nullable(),
    deviceBrandSnapshot: z.string().trim().max(120).optional().nullable(),
    deviceModelSnapshot: z.string().trim().max(120).optional().nullable(),
    issueLabelSnapshot: z.string().trim().max(190).optional().nullable(),
    baseCost: z.number().nonnegative(),
    extraCost: z.number().nonnegative(),
    shippingCost: z.number().nonnegative(),
    pricingRuleId: z.string().trim().min(1).max(191),
    pricingRuleNameSnapshot: z.string().trim().min(2).max(190),
    calcModeSnapshot: z.enum(['BASE_PLUS_MARGIN', 'FIXED_TOTAL']),
    marginPercentSnapshot: z.number().nonnegative(),
    minProfitSnapshot: z.number().nonnegative().optional().nullable(),
    minFinalPriceSnapshot: z.number().nonnegative().optional().nullable(),
    shippingFeeSnapshot: z.number().nonnegative().optional().nullable(),
    suggestedQuotedPrice: z.number().nonnegative().optional().nullable(),
    appliedQuotedPrice: z.number().nonnegative().optional().nullable(),
    manualOverridePrice: z.number().nonnegative().optional().nullable(),
  }).optional().nullable(),
});

const publicLookupSchema = z.object({
  repairId: z.string().trim().min(6).max(191),
  customerPhone: z.string().trim().min(6).max(60),
});

const publicQuoteTokenSchema = z.object({
  token: z.string().trim().min(10).max(4096),
});

function zodBadRequest(parsed: z.SafeParseError<unknown>) {
  return new BadRequestException({
    message: 'Validacion invalida',
    errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
}

@Controller('repairs')
export class RepairsController {
  constructor(@Inject(RepairsService) private readonly repairsService: RepairsService) {}

  @Post('lookup')
  publicLookup(@Body() body: unknown) {
    const parsed = publicLookupSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicLookup(parsed.data.repairId, parsed.data.customerPhone);
  }

  @Get(':id/quote-approval')
  publicQuoteApproval(@Param('id') id: string, @Query() query: unknown) {
    const parsed = publicQuoteTokenSchema.safeParse(query);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicQuoteApproval(id, parsed.data.token);
  }

  @Post(':id/quote-approval/approve')
  publicQuoteApprove(@Param('id') id: string, @Body() body: unknown) {
    const parsed = publicQuoteTokenSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicQuoteApprove(id, parsed.data.token);
  }

  @Post(':id/quote-approval/reject')
  publicQuoteReject(@Param('id') id: string, @Body() body: unknown) {
    const parsed = publicQuoteTokenSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.publicQuoteReject(id, parsed.data.token);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myRepairs(@CurrentUser() user: AuthenticatedUser | null) {
    if (!user) return { items: [] };
    return this.repairsService.myRepairs(user.id);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  myRepairDetail(@CurrentUser() user: AuthenticatedUser | null, @Param('id') id: string) {
    if (!user) return { item: null };
    return this.repairsService.myRepairDetail(user.id, id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminList(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.repairsService.adminList({ status, q, from, to });
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminStats() {
    return this.repairsService.adminStats();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminDetail(@Param('id') id: string) {
    return this.repairsService.adminDetail(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminCreate(@Body() body: unknown) {
    const parsed = createRepairSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.create(parsed.data);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdateStatus(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.adminUpdateStatus(id, parsed.data.status, parsed.data.finalPrice, parsed.data.notes);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdate(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateRepairSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);
    return this.repairsService.adminUpdate(id, parsed.data);
  }
}

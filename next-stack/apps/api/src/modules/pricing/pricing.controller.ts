import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PricingService } from './pricing.service.js';

const repairRuleSchema = z.object({
  name: z.string().trim().min(2).max(190),
  active: z.boolean().optional(),
  priority: z.number().int().min(-9999).max(9999).optional(),
  deviceTypeId: z.string().trim().max(191).optional().nullable(),
  device_type_id: z.string().trim().max(191).optional().nullable(),
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  device_brand_id: z.string().trim().max(191).optional().nullable(),
  deviceModelGroupId: z.string().trim().max(191).optional().nullable(),
  device_model_group_id: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  device_model_id: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  device_issue_type_id: z.string().trim().max(191).optional().nullable(),
  repair_type_id: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  basePrice: z.number().nonnegative().optional(),
  profitPercent: z.number().min(0).max(1000).optional(),
  calcMode: z.enum(['BASE_PLUS_MARGIN', 'FIXED_TOTAL']).optional(),
  mode: z.enum(['margin', 'fixed']).optional(),
  multiplier: z.number().min(0).optional().nullable(),
  min_profit: z.number().min(0).optional().nullable(),
  fixed_total: z.number().min(0).optional().nullable(),
  shipping_default: z.number().min(0).optional().nullable(),
  minProfit: z.number().min(0).optional().nullable(),
  minFinalPrice: z.number().nonnegative().optional().nullable(),
  shippingFee: z.number().min(0).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const repairRulePatchSchema = repairRuleSchema.partial();

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PricingController {
  constructor(@Inject(PricingService) private readonly pricingService: PricingService) {}

  @Get('repairs/rules')
  listRepairRules() {
    return this.pricingService.listRepairRules();
  }

  @Post('repairs/rules')
  createRepairRule(@Body() body: unknown) {
    const parsed = repairRuleSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validación inválida', errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) };
    }
    return this.pricingService.createRepairRule(parsed.data);
  }

  @Patch('repairs/rules/:id')
  updateRepairRule(@Param('id') id: string, @Body() body: unknown) {
    const parsed = repairRulePatchSchema.safeParse(body);
    if (!parsed.success) {
      return { message: 'Validación inválida', errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) };
    }
    return this.pricingService.updateRepairRule(id, parsed.data);
  }

  @Delete('repairs/rules/:id')
  deleteRepairRule(@Param('id') id: string) {
    return this.pricingService.deleteRepairRule(id);
  }

  @Get('repairs/resolve')
  resolveRepairPrice(
    @Query('deviceBrandId') deviceBrandId?: string,
    @Query('device_brand_id') deviceBrandIdLegacy?: string,
    @Query('deviceTypeId') deviceTypeId?: string,
    @Query('device_type_id') deviceTypeIdLegacy?: string,
    @Query('deviceModelGroupId') deviceModelGroupId?: string,
    @Query('device_model_group_id') deviceModelGroupIdLegacy?: string,
    @Query('deviceModelId') deviceModelId?: string,
    @Query('device_model_id') deviceModelIdLegacy?: string,
    @Query('deviceIssueTypeId') deviceIssueTypeId?: string,
    @Query('device_issue_type_id') deviceIssueTypeIdLegacy?: string,
    @Query('repair_type_id') repairTypeIdLegacy?: string,
    @Query('deviceBrand') deviceBrand?: string,
    @Query('deviceModel') deviceModel?: string,
    @Query('issueLabel') issueLabel?: string,
  ) {
    return this.pricingService.resolveRepairPrice({
      deviceTypeId: deviceTypeId ?? deviceTypeIdLegacy,
      deviceBrandId: deviceBrandId ?? deviceBrandIdLegacy,
      deviceModelGroupId: deviceModelGroupId ?? deviceModelGroupIdLegacy,
      deviceModelId: deviceModelId ?? deviceModelIdLegacy,
      deviceIssueTypeId: deviceIssueTypeId ?? deviceIssueTypeIdLegacy ?? repairTypeIdLegacy,
      deviceBrand,
      deviceModel,
      issueLabel,
    });
  }
}

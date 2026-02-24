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
  deviceBrandId: z.string().trim().max(191).optional().nullable(),
  deviceModelId: z.string().trim().max(191).optional().nullable(),
  deviceIssueTypeId: z.string().trim().max(191).optional().nullable(),
  deviceBrand: z.string().trim().max(120).optional().nullable(),
  deviceModel: z.string().trim().max(120).optional().nullable(),
  issueLabel: z.string().trim().max(190).optional().nullable(),
  basePrice: z.number().nonnegative(),
  profitPercent: z.number().min(0).max(1000).optional(),
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
    @Query('deviceModelId') deviceModelId?: string,
    @Query('deviceIssueTypeId') deviceIssueTypeId?: string,
    @Query('deviceBrand') deviceBrand?: string,
    @Query('deviceModel') deviceModel?: string,
    @Query('issueLabel') issueLabel?: string,
  ) {
    return this.pricingService.resolveRepairPrice({ deviceBrandId, deviceModelId, deviceIssueTypeId, deviceBrand, deviceModel, issueLabel });
  }
}

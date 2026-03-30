import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { zodBadRequest, zodErrorBody } from '../../common/http/zod-bad-request.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PricingService } from './pricing.service.js';
import { repairProviderPartPreviewSchema, repairRulePatchSchema, repairRuleSchema } from './pricing.schemas.js';

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
    if (!parsed.success) return zodErrorBody(parsed);
    return this.pricingService.createRepairRule(parsed.data);
  }

  @Patch('repairs/rules/:id')
  updateRepairRule(@Param('id') id: string, @Body() body: unknown) {
    const parsed = repairRulePatchSchema.safeParse(body);
    if (!parsed.success) return zodErrorBody(parsed);
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

  @Post('repairs/provider-part-preview')
  previewRepairProviderPartPricing(@Body() body: unknown) {
    const parsed = repairProviderPartPreviewSchema.safeParse(body);
    if (!parsed.success) throw zodBadRequest(parsed);

    return this.pricingService.previewRepairProviderPartPricing({
      supplierId: parsed.data.supplierId,
      supplierSearchQuery: parsed.data.supplierSearchQuery ?? null,
      quantity: parsed.data.quantity ?? 1,
      extraCost: parsed.data.extraCost ?? null,
      shippingCost: parsed.data.shippingCost ?? null,
      deviceTypeId: parsed.data.deviceTypeId ?? parsed.data.device_type_id ?? null,
      deviceBrandId: parsed.data.deviceBrandId ?? parsed.data.device_brand_id ?? null,
      deviceModelGroupId: parsed.data.deviceModelGroupId ?? parsed.data.device_model_group_id ?? null,
      deviceModelId: parsed.data.deviceModelId ?? parsed.data.device_model_id ?? null,
      deviceIssueTypeId: parsed.data.deviceIssueTypeId ?? parsed.data.device_issue_type_id ?? parsed.data.repair_type_id ?? null,
      deviceBrand: parsed.data.deviceBrand ?? null,
      deviceModel: parsed.data.deviceModel ?? null,
      issueLabel: parsed.data.issueLabel ?? null,
      part: {
        externalPartId: parsed.data.part.externalPartId ?? null,
        name: parsed.data.part.name,
        sku: parsed.data.part.sku ?? null,
        brand: parsed.data.part.brand ?? null,
        price: parsed.data.part.price,
        availability: parsed.data.part.availability ?? 'unknown',
        url: parsed.data.part.url ?? null,
      },
    });
  }
}

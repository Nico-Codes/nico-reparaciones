import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type Repair, type RepairPricingSnapshot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { cleanNullable, maskPhone, repairStatusLabel } from './repairs.helpers.js';
import type { RepairWithActiveSnapshot } from './repairs.types.js';

@Injectable()
export class RepairsSupportService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async assertValidRepairReferences(input: {
    userId?: string | null;
    deviceTypeId?: string | null;
    deviceBrandId?: string | null;
    deviceModelId?: string | null;
    deviceIssueTypeId?: string | null;
  }) {
    const userId = cleanNullable(input.userId);
    const deviceTypeId = cleanNullable(input.deviceTypeId);
    const deviceBrandId = cleanNullable(input.deviceBrandId);
    const deviceModelId = cleanNullable(input.deviceModelId);
    const deviceIssueTypeId = cleanNullable(input.deviceIssueTypeId);

    const [user, deviceType, brand, model, issue] = await Promise.all([
      userId
        ? this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          })
        : Promise.resolve(null),
      deviceTypeId
        ? this.prisma.deviceType.findUnique({
            where: { id: deviceTypeId },
            select: { id: true },
          })
        : Promise.resolve(null),
      deviceBrandId
        ? this.prisma.deviceBrand.findUnique({
            where: { id: deviceBrandId },
            select: { id: true, deviceTypeId: true },
          })
        : Promise.resolve(null),
      deviceModelId
        ? this.prisma.deviceModel.findUnique({
            where: { id: deviceModelId },
            select: { id: true, brandId: true },
          })
        : Promise.resolve(null),
      deviceIssueTypeId
        ? this.prisma.deviceIssueType.findUnique({
            where: { id: deviceIssueTypeId },
            select: { id: true, deviceTypeId: true },
          })
        : Promise.resolve(null),
    ]);

    if (userId && !user) throw new BadRequestException('Usuario invalido para la reparacion');
    if (deviceTypeId && !deviceType) throw new BadRequestException('Tipo de equipo invalido');
    if (deviceBrandId && !brand) throw new BadRequestException('Marca de catalogo invalida');
    if (deviceModelId && !model) throw new BadRequestException('Modelo de catalogo invalido');
    if (deviceIssueTypeId && !issue) throw new BadRequestException('Falla de catalogo invalida');

    if (brand && deviceTypeId && brand.deviceTypeId && brand.deviceTypeId !== deviceTypeId) {
      throw new BadRequestException('La marca seleccionada no pertenece al tipo de equipo.');
    }

    if (model && deviceBrandId && model.brandId !== deviceBrandId) {
      throw new BadRequestException('El modelo seleccionado no pertenece a la marca elegida.');
    }

    if (issue && deviceTypeId && issue.deviceTypeId && issue.deviceTypeId !== deviceTypeId) {
      throw new BadRequestException('La falla seleccionada no corresponde al tipo de equipo.');
    }
  }

  serializeRepair(repair: Repair | RepairWithActiveSnapshot) {
    const activePricingSnapshot =
      'activePricingSnapshot' in repair && repair.activePricingSnapshot
        ? this.serializeRepairPricingSnapshot(repair.activePricingSnapshot)
        : null;

    return {
      id: repair.id,
      userId: repair.userId,
      deviceTypeId: repair.deviceTypeId ?? null,
      deviceBrandId: repair.deviceBrandId ?? null,
      deviceModelId: repair.deviceModelId ?? null,
      deviceIssueTypeId: repair.deviceIssueTypeId ?? null,
      activePricingSnapshotId: repair.activePricingSnapshotId ?? null,
      activePricingSnapshot,
      customerName: repair.customerName,
      customerPhone: repair.customerPhone,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notes: repair.notes,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }

  serializeRepairPricingSnapshot(snapshot: RepairPricingSnapshot) {
    return {
      id: snapshot.id,
      repairId: snapshot.repairId,
      pricingRuleId: snapshot.pricingRuleId ?? null,
      source: snapshot.source,
      status: snapshot.status,
      supplierId: snapshot.supplierId ?? null,
      supplierNameSnapshot: snapshot.supplierNameSnapshot ?? null,
      supplierSearchQuery: snapshot.supplierSearchQuery ?? null,
      supplierEndpointSnapshot: snapshot.supplierEndpointSnapshot ?? null,
      externalPartId: snapshot.externalPartId ?? null,
      partSkuSnapshot: snapshot.partSkuSnapshot ?? null,
      partNameSnapshot: snapshot.partNameSnapshot,
      partBrandSnapshot: snapshot.partBrandSnapshot ?? null,
      partUrlSnapshot: snapshot.partUrlSnapshot ?? null,
      partAvailabilitySnapshot: snapshot.partAvailabilitySnapshot ?? null,
      quantity: snapshot.quantity,
      deviceTypeIdSnapshot: snapshot.deviceTypeIdSnapshot ?? null,
      deviceBrandIdSnapshot: snapshot.deviceBrandIdSnapshot ?? null,
      deviceModelGroupIdSnapshot: snapshot.deviceModelGroupIdSnapshot ?? null,
      deviceModelIdSnapshot: snapshot.deviceModelIdSnapshot ?? null,
      deviceIssueTypeIdSnapshot: snapshot.deviceIssueTypeIdSnapshot ?? null,
      deviceBrandSnapshot: snapshot.deviceBrandSnapshot ?? null,
      deviceModelSnapshot: snapshot.deviceModelSnapshot ?? null,
      issueLabelSnapshot: snapshot.issueLabelSnapshot ?? null,
      baseCost: Number(snapshot.baseCost),
      extraCost: snapshot.extraCost != null ? Number(snapshot.extraCost) : null,
      shippingCost: snapshot.shippingCost != null ? Number(snapshot.shippingCost) : null,
      pricingRuleNameSnapshot: snapshot.pricingRuleNameSnapshot ?? null,
      calcModeSnapshot: snapshot.calcModeSnapshot ?? null,
      marginPercentSnapshot: snapshot.marginPercentSnapshot != null ? Number(snapshot.marginPercentSnapshot) : null,
      minProfitSnapshot: snapshot.minProfitSnapshot != null ? Number(snapshot.minProfitSnapshot) : null,
      minFinalPriceSnapshot: snapshot.minFinalPriceSnapshot != null ? Number(snapshot.minFinalPriceSnapshot) : null,
      shippingFeeSnapshot: snapshot.shippingFeeSnapshot != null ? Number(snapshot.shippingFeeSnapshot) : null,
      suggestedQuotedPrice: snapshot.suggestedQuotedPrice != null ? Number(snapshot.suggestedQuotedPrice) : null,
      appliedQuotedPrice: snapshot.appliedQuotedPrice != null ? Number(snapshot.appliedQuotedPrice) : null,
      manualOverridePrice: snapshot.manualOverridePrice != null ? Number(snapshot.manualOverridePrice) : null,
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString(),
      appliedAt: snapshot.appliedAt?.toISOString() ?? null,
    };
  }

  serializePublicLookup(repair: Repair) {
    return {
      id: repair.id,
      customerName: repair.customerName,
      customerPhoneMasked: repair.customerPhone ? maskPhone(repair.customerPhone) : null,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }

  serializePublicQuoteApproval(repair: Repair) {
    return {
      id: repair.id,
      customerName: repair.customerName,
      customerPhoneMasked: repair.customerPhone ? maskPhone(repair.customerPhone) : null,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      statusLabel: repairStatusLabel(repair.status),
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notes: repair.notes,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }
}

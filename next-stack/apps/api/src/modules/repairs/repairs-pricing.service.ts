import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, type RepairPricingSnapshot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  cleanNullable,
  normalizeComparableText,
  roundMoney,
  sameMoney,
} from './repairs.helpers.js';
import { RepairsSupportService } from './repairs-support.service.js';
import type { RepairPricingDraftContext, RepairPricingSnapshotDraftInput } from './repairs.types.js';

@Injectable()
export class RepairsPricingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RepairsSupportService) private readonly repairsSupportService: RepairsSupportService,
  ) {}

  async listSnapshots(repairId: string, take = 12) {
    const snapshots = await this.prisma.repairPricingSnapshot.findMany({
      where: { repairId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
    return snapshots.map((snapshot) => this.repairsSupportService.serializeRepairPricingSnapshot(snapshot));
  }

  async applyPricingSnapshotDraft(
    tx: Prisma.TransactionClient,
    input: {
      repairId: string;
      previousActiveSnapshotId: string | null;
      draft: RepairPricingSnapshotDraftInput;
      effectiveQuotedPrice: number | null;
      context: RepairPricingDraftContext;
    },
  ) {
    const draft = input.draft;
    if (draft.source !== 'SUPPLIER_PART' || draft.status !== 'DRAFT') {
      throw new BadRequestException('Snapshot de pricing invalido');
    }

    const appliedQuotedPrice = input.effectiveQuotedPrice != null ? roundMoney(input.effectiveQuotedPrice) : null;
    if (appliedQuotedPrice == null) {
      throw new BadRequestException('Define un presupuesto antes de aplicar el snapshot de pricing');
    }

    const suggestedQuotedPrice = draft.suggestedQuotedPrice != null ? roundMoney(draft.suggestedQuotedPrice) : null;
    if (suggestedQuotedPrice == null) {
      throw new BadRequestException('El snapshot no trae un presupuesto sugerido valido');
    }

    await this.assertValidRepairSnapshotDraft(tx, draft);
    this.assertSnapshotDraftMatchesContext(input.context, draft);

    const manualOverridePrice = appliedQuotedPrice !== suggestedQuotedPrice ? appliedQuotedPrice : null;
    const previousActiveSnapshot = input.previousActiveSnapshotId
      ? await tx.repairPricingSnapshot.findUnique({ where: { id: input.previousActiveSnapshotId } })
      : null;

    if (
      previousActiveSnapshot &&
      previousActiveSnapshot.repairId === input.repairId &&
      this.isEquivalentAppliedSnapshot(previousActiveSnapshot, draft, appliedQuotedPrice, manualOverridePrice)
    ) {
      if (previousActiveSnapshot.status !== 'APPLIED' || !previousActiveSnapshot.appliedAt) {
        await tx.repairPricingSnapshot.update({
          where: { id: previousActiveSnapshot.id },
          data: { status: 'APPLIED', appliedAt: previousActiveSnapshot.appliedAt ?? new Date() },
        });
      }
      await tx.repair.update({
        where: { id: input.repairId },
        data: { activePricingSnapshotId: previousActiveSnapshot.id },
      });
      return previousActiveSnapshot.id;
    }

    if (input.previousActiveSnapshotId) {
      await tx.repairPricingSnapshot.updateMany({
        where: { repairId: input.repairId, id: input.previousActiveSnapshotId, status: 'APPLIED' },
        data: { status: 'SUPERSEDED' },
      });
    }

    const created = await tx.repairPricingSnapshot.create({
      data: {
        repairId: input.repairId,
        source: draft.source,
        status: 'APPLIED',
        supplierId: cleanNullable(draft.supplierId),
        supplierNameSnapshot: cleanNullable(draft.supplierNameSnapshot),
        supplierSearchQuery: cleanNullable(draft.supplierSearchQuery),
        supplierEndpointSnapshot: cleanNullable(draft.supplierEndpointSnapshot),
        externalPartId: cleanNullable(draft.externalPartId),
        partSkuSnapshot: cleanNullable(draft.partSkuSnapshot),
        partNameSnapshot: draft.partNameSnapshot.trim(),
        partBrandSnapshot: cleanNullable(draft.partBrandSnapshot),
        partUrlSnapshot: cleanNullable(draft.partUrlSnapshot),
        partAvailabilitySnapshot: cleanNullable(draft.partAvailabilitySnapshot) ?? 'unknown',
        quantity: Math.max(1, Math.min(999, Math.round(draft.quantity))),
        deviceTypeIdSnapshot: cleanNullable(draft.deviceTypeIdSnapshot),
        deviceBrandIdSnapshot: cleanNullable(draft.deviceBrandIdSnapshot),
        deviceModelGroupIdSnapshot: cleanNullable(draft.deviceModelGroupIdSnapshot),
        deviceModelIdSnapshot: cleanNullable(draft.deviceModelIdSnapshot),
        deviceIssueTypeIdSnapshot: cleanNullable(draft.deviceIssueTypeIdSnapshot),
        deviceBrandSnapshot: cleanNullable(draft.deviceBrandSnapshot),
        deviceModelSnapshot: cleanNullable(draft.deviceModelSnapshot),
        issueLabelSnapshot: cleanNullable(draft.issueLabelSnapshot),
        baseCost: new Prisma.Decimal(roundMoney(draft.baseCost)),
        extraCost: new Prisma.Decimal(roundMoney(draft.extraCost)),
        shippingCost: new Prisma.Decimal(roundMoney(draft.shippingCost)),
        pricingRuleId: cleanNullable(draft.pricingRuleId),
        pricingRuleNameSnapshot: cleanNullable(draft.pricingRuleNameSnapshot),
        calcModeSnapshot: draft.calcModeSnapshot,
        marginPercentSnapshot: new Prisma.Decimal(roundMoney(draft.marginPercentSnapshot)),
        minProfitSnapshot: draft.minProfitSnapshot != null ? new Prisma.Decimal(roundMoney(draft.minProfitSnapshot)) : null,
        minFinalPriceSnapshot: draft.minFinalPriceSnapshot != null ? new Prisma.Decimal(roundMoney(draft.minFinalPriceSnapshot)) : null,
        shippingFeeSnapshot: draft.shippingFeeSnapshot != null ? new Prisma.Decimal(roundMoney(draft.shippingFeeSnapshot)) : null,
        suggestedQuotedPrice: new Prisma.Decimal(suggestedQuotedPrice),
        appliedQuotedPrice: new Prisma.Decimal(appliedQuotedPrice),
        manualOverridePrice: manualOverridePrice != null ? new Prisma.Decimal(manualOverridePrice) : null,
        appliedAt: new Date(),
      },
    });

    await tx.repair.update({
      where: { id: input.repairId },
      data: { activePricingSnapshotId: created.id },
    });

    return created.id;
  }

  private async assertValidRepairSnapshotDraft(tx: Prisma.TransactionClient, draft: RepairPricingSnapshotDraftInput) {
    const supplierId = cleanNullable(draft.supplierId);
    const pricingRuleId = cleanNullable(draft.pricingRuleId);
    if (!supplierId) throw new BadRequestException('Proveedor invalido para el snapshot de pricing');
    if (!pricingRuleId) throw new BadRequestException('Regla de pricing invalida para el snapshot');

    const [supplier, pricingRule] = await Promise.all([
      tx.supplier.findUnique({ where: { id: supplierId }, select: { id: true } }),
      tx.repairPricingRule.findUnique({ where: { id: pricingRuleId }, select: { id: true } }),
    ]);

    if (!supplier) throw new BadRequestException('Proveedor invalido para el snapshot de pricing');
    if (!pricingRule) throw new BadRequestException('Regla de pricing invalida para el snapshot');
    if (!draft.partNameSnapshot.trim() || draft.partNameSnapshot.trim().length < 2) {
      throw new BadRequestException('Selecciona un repuesto valido antes de aplicar el snapshot');
    }
    if (!Number.isFinite(draft.quantity) || draft.quantity < 1 || draft.quantity > 999) {
      throw new BadRequestException('La cantidad del repuesto es invalida');
    }
    if (draft.baseCost < 0 || draft.extraCost < 0 || draft.shippingCost < 0) {
      throw new BadRequestException('Los costos del snapshot no pueden ser negativos');
    }
  }

  private assertSnapshotDraftMatchesContext(context: RepairPricingDraftContext, draft: RepairPricingSnapshotDraftInput) {
    this.assertMatchingNullableId('tipo de equipo', context.deviceTypeId ?? null, draft.deviceTypeIdSnapshot ?? null);
    this.assertMatchingNullableId('marca de catalogo', context.deviceBrandId ?? null, draft.deviceBrandIdSnapshot ?? null);
    this.assertMatchingNullableId('modelo de catalogo', context.deviceModelId ?? null, draft.deviceModelIdSnapshot ?? null);
    this.assertMatchingNullableId('falla de catalogo', context.deviceIssueTypeId ?? null, draft.deviceIssueTypeIdSnapshot ?? null);
    this.assertMatchingNullableText('marca del equipo', context.deviceBrand ?? null, draft.deviceBrandSnapshot ?? null);
    this.assertMatchingNullableText('modelo del equipo', context.deviceModel ?? null, draft.deviceModelSnapshot ?? null);
    this.assertMatchingNullableText('falla reportada', context.issueLabel ?? null, draft.issueLabelSnapshot ?? null);
  }

  private assertMatchingNullableId(label: string, current: string | null, snapshot: string | null) {
    const currentValue = cleanNullable(current);
    const snapshotValue = cleanNullable(snapshot);
    if (currentValue && snapshotValue && currentValue !== snapshotValue) {
      throw new BadRequestException(`El snapshot de pricing no coincide con ${label}`);
    }
  }

  private assertMatchingNullableText(label: string, current: string | null, snapshot: string | null) {
    const currentValue = normalizeComparableText(current);
    const snapshotValue = normalizeComparableText(snapshot);
    if (currentValue && snapshotValue && currentValue !== snapshotValue) {
      throw new BadRequestException(`El snapshot de pricing no coincide con ${label}`);
    }
  }

  private isEquivalentAppliedSnapshot(
    current: RepairPricingSnapshot,
    draft: RepairPricingSnapshotDraftInput,
    appliedQuotedPrice: number,
    manualOverridePrice: number | null,
  ) {
    return (
      current.source === 'SUPPLIER_PART' &&
      current.supplierId === cleanNullable(draft.supplierId) &&
      (current.externalPartId ?? null) === cleanNullable(draft.externalPartId) &&
      current.partNameSnapshot === draft.partNameSnapshot.trim() &&
      (current.partSkuSnapshot ?? null) === cleanNullable(draft.partSkuSnapshot) &&
      (current.partBrandSnapshot ?? null) === cleanNullable(draft.partBrandSnapshot) &&
      current.quantity === Math.max(1, Math.min(999, Math.round(draft.quantity))) &&
      sameMoney(current.baseCost, draft.baseCost) &&
      sameMoney(current.extraCost, draft.extraCost) &&
      sameMoney(current.shippingCost, draft.shippingCost) &&
      current.pricingRuleId === cleanNullable(draft.pricingRuleId) &&
      sameMoney(current.suggestedQuotedPrice, draft.suggestedQuotedPrice) &&
      sameMoney(current.appliedQuotedPrice, appliedQuotedPrice) &&
      sameMoney(current.manualOverridePrice, manualOverridePrice)
    );
  }
}

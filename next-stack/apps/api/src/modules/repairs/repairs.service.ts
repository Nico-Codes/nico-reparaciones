import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type Repair, type RepairPricingSnapshot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';

type RepairPricingSnapshotDraftInput = {
  source: 'SUPPLIER_PART';
  status: 'DRAFT';
  supplierId: string;
  supplierNameSnapshot: string;
  supplierSearchQuery?: string | null;
  supplierEndpointSnapshot?: string | null;
  externalPartId?: string | null;
  partSkuSnapshot?: string | null;
  partNameSnapshot: string;
  partBrandSnapshot?: string | null;
  partUrlSnapshot?: string | null;
  partAvailabilitySnapshot?: 'in_stock' | 'out_of_stock' | 'unknown' | null;
  quantity: number;
  deviceTypeIdSnapshot?: string | null;
  deviceBrandIdSnapshot?: string | null;
  deviceModelGroupIdSnapshot?: string | null;
  deviceModelIdSnapshot?: string | null;
  deviceIssueTypeIdSnapshot?: string | null;
  deviceBrandSnapshot?: string | null;
  deviceModelSnapshot?: string | null;
  issueLabelSnapshot?: string | null;
  baseCost: number;
  extraCost: number;
  shippingCost: number;
  pricingRuleId: string;
  pricingRuleNameSnapshot: string;
  calcModeSnapshot: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
  marginPercentSnapshot: number;
  minProfitSnapshot?: number | null;
  minFinalPriceSnapshot?: number | null;
  shippingFeeSnapshot?: number | null;
  suggestedQuotedPrice?: number | null;
  appliedQuotedPrice?: number | null;
  manualOverridePrice?: number | null;
};

type CreateRepairInput = {
  customerName: string;
  customerPhone?: string | null;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  notes?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  userId?: string | null;
  pricingSnapshotDraft?: RepairPricingSnapshotDraftInput | null;
};

type UpdateRepairInput = Partial<Omit<CreateRepairInput, 'userId'>> & {
  customerName?: string;
  status?: string;
};

type RepairWithActiveSnapshot = Prisma.RepairGetPayload<{
  include: {
    activePricingSnapshot: true;
  };
}>;

type QuoteApprovalTokenPayload = {
  type: 'repair_quote';
  repairId: string;
};

@Injectable()
export class RepairsService {
  private static readonly STATUS_TRANSITIONS: Record<Repair['status'], Repair['status'][]> = {
    RECEIVED: ['DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'CANCELLED'],
    DIAGNOSING: ['WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'CANCELLED'],
    WAITING_APPROVAL: ['REPAIRING', 'CANCELLED'],
    REPAIRING: ['READY_PICKUP', 'CANCELLED'],
    READY_PICKUP: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(WhatsappService) private readonly whatsappService: WhatsappService,
  ) {}

  async publicLookup(repairIdRaw: string, customerPhoneRaw?: string | null) {
    const repairId = repairIdRaw.trim();
    const customerPhone = this.cleanNullable(customerPhoneRaw);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });

    if (!repair) {
      return { ok: false, found: false, message: 'ReparaciÃ³n no encontrada' };
    }

    if (customerPhone) {
      const inputPhoneNorm = this.normalizePhone(customerPhone);
      const repairPhoneNorm = this.normalizePhone(repair.customerPhone);
      if (!inputPhoneNorm || !repairPhoneNorm || inputPhoneNorm !== repairPhoneNorm) {
        return { ok: false, found: false, message: 'No coincide el telÃ©fono de la reparaciÃ³n' };
      }
    }

    return {
      ok: true,
      found: true,
      item: this.serializePublicLookup(repair),
    };
  }

  async publicQuoteApproval(repairIdRaw: string, tokenRaw: string) {
    const repairId = repairIdRaw.trim();
    const token = tokenRaw.trim();
    await this.verifyQuoteApprovalToken(repairId, token);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });
    if (!repair) throw new NotFoundException('Reparacion no encontrada');
    return {
      ok: true,
      canDecide: repair.status === 'WAITING_APPROVAL',
      item: this.serializePublicQuoteApproval(repair),
    };
  }

  async publicQuoteApprove(repairIdRaw: string, tokenRaw: string) {
    return this.applyPublicQuoteDecision(repairIdRaw, tokenRaw, 'REPAIRING', 'Presupuesto aprobado. Empezamos con la reparacion.');
  }

  async publicQuoteReject(repairIdRaw: string, tokenRaw: string) {
    return this.applyPublicQuoteDecision(repairIdRaw, tokenRaw, 'CANCELLED', 'Presupuesto rechazado. La reparacion quedo cancelada.');
  }

  private async applyPublicQuoteDecision(
    repairIdRaw: string,
    tokenRaw: string,
    toStatus: 'REPAIRING' | 'CANCELLED',
    successMessage: string,
  ) {
    const repairId = repairIdRaw.trim();
    const token = tokenRaw.trim();
    await this.verifyQuoteApprovalToken(repairId, token);

    const current = await this.prisma.repair.findUnique({ where: { id: repairId } });
    if (!current) throw new NotFoundException('Reparacion no encontrada');

    if (current.status !== 'WAITING_APPROVAL') {
      return {
        ok: true,
        changed: false,
        canDecide: false,
        message: 'Esta reparacion ya no esta esperando aprobacion.',
        item: this.serializePublicQuoteApproval(current),
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const update = await tx.repair.updateMany({
        where: { id: repairId, status: 'WAITING_APPROVAL' },
        data: { status: toStatus },
      });

      const updated = await tx.repair.findUnique({ where: { id: repairId } });
      if (!updated) throw new NotFoundException('Reparacion no encontrada');

      if (update.count === 1) {
        const message =
          toStatus === 'REPAIRING'
            ? 'Cliente aprobo el presupuesto desde enlace publico.'
            : 'Cliente rechazo el presupuesto desde enlace publico.';
        await tx.repairEventLog.create({
          data: {
            repairId,
            eventType: 'STATUS_CHANGED',
            message,
            metaJson: JSON.stringify({
              fromStatus: 'WAITING_APPROVAL',
              toStatus,
              source: 'public_quote_approval',
            }),
          },
        });
      }

      return { updated, changed: update.count === 1 };
    });

    if (!result.changed) {
      return {
        ok: true,
        changed: false,
        canDecide: false,
        message: 'Esta reparacion ya no esta esperando aprobacion.',
        item: this.serializePublicQuoteApproval(result.updated),
      };
    }

    return {
      ok: true,
      changed: true,
      canDecide: false,
      message: successMessage,
      item: this.serializePublicQuoteApproval(result.updated),
    };
  }

  async create(input: CreateRepairInput) {
    const userId = this.cleanNullable(input.userId);
    const deviceTypeId = this.cleanNullable(input.deviceTypeId);
    const deviceBrandId = this.cleanNullable(input.deviceBrandId);
    const deviceModelId = this.cleanNullable(input.deviceModelId);
    const deviceIssueTypeId = this.cleanNullable(input.deviceIssueTypeId);
    const deviceBrand = this.cleanNullable(input.deviceBrand);
    const deviceModel = this.cleanNullable(input.deviceModel);
    const issueLabel = this.cleanNullable(input.issueLabel);
    const pricingSnapshotDraft = input.pricingSnapshotDraft ?? null;

    await this.assertValidRepairReferences({
      userId,
      deviceTypeId,
      deviceBrandId,
      deviceModelId,
      deviceIssueTypeId,
    });

    const data: Prisma.RepairUncheckedCreateInput = {
      userId,
      deviceTypeId,
      deviceBrandId,
      deviceModelId,
      deviceIssueTypeId,
      customerName: input.customerName.trim(),
      customerPhone: this.cleanNullable(input.customerPhone),
      deviceBrand,
      deviceModel,
      issueLabel,
      notes: this.cleanNullable(input.notes),
      quotedPrice: input.quotedPrice != null ? new Prisma.Decimal(input.quotedPrice) : null,
      finalPrice: input.finalPrice != null ? new Prisma.Decimal(input.finalPrice) : null,
      status: 'RECEIVED',
    };

    const repair = await this.prisma.$transaction(async (tx) => {
      const created = await tx.repair.create({ data });

      if (pricingSnapshotDraft) {
        await this.applyPricingSnapshotDraft(tx, {
          repairId: created.id,
          previousActiveSnapshotId: null,
          draft: pricingSnapshotDraft,
          effectiveQuotedPrice: input.quotedPrice ?? null,
          context: {
            deviceTypeId,
            deviceBrandId,
            deviceModelId,
            deviceIssueTypeId,
            deviceBrand,
            deviceModel,
            issueLabel,
          },
        });
      }

      return tx.repair.findUnique({
        where: { id: created.id },
        include: { activePricingSnapshot: true },
      });
    });

    if (!repair) throw new NotFoundException('Reparacion no encontrada');

    await this.createEvent(repair.id, 'CREATED', 'Reparacion creada', {
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      activePricingSnapshotId: repair.activePricingSnapshotId ?? null,
    });

    if (repair.activePricingSnapshotId) {
      await this.createEvent(
        repair.id,
        'UPDATED',
        repair.activePricingSnapshot?.manualOverridePrice != null
          ? 'Snapshot de pricing aplicado con override manual al crear la reparacion'
          : 'Snapshot de pricing aplicado segun calculo al crear la reparacion',
        {
          activePricingSnapshotId: repair.activePricingSnapshotId,
          manualOverridePrice:
            repair.activePricingSnapshot?.manualOverridePrice != null ? Number(repair.activePricingSnapshot.manualOverridePrice) : null,
        },
      );
    }

    return this.serializeRepair(repair);
  }

  async adminList(params?: { status?: string; q?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim();
    const status = (params?.status ?? '').trim();
    const createdAtRange = this.buildCreatedAtRange(params?.from, params?.to);
    const normalizedStatus = status ? this.normalizeStatus(status) : null;
    if (status && !normalizedStatus) {
      throw new BadRequestException('Estado de reparacion invalido');
    }

    const items = await this.prisma.repair.findMany({
      where: {
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { customerName: { contains: q, mode: 'insensitive' } },
                { customerPhone: { contains: q, mode: 'insensitive' } },
                { deviceBrand: { contains: q, mode: 'insensitive' } },
                { deviceModel: { contains: q, mode: 'insensitive' } },
                { issueLabel: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { items: items.map((r) => this.serializeRepair(r)) };
  }

  async adminStats() {
    const [total, byStatusRows, readyPickup, deliveredToday] = await Promise.all([
      this.prisma.repair.count(),
      this.prisma.repair.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.repair.count({ where: { status: 'READY_PICKUP' } }),
      this.prisma.repair.count({
        where: {
          status: 'DELIVERED',
          updatedAt: { gte: this.startOfToday() },
        },
      }),
    ]);

    const byStatus = byStatusRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    return {
      total,
      readyPickup,
      deliveredToday,
      byStatus,
    };
  }

  async adminDetail(id: string) {
    const repair = await this.prisma.repair.findUnique({
      where: { id },
      include: { activePricingSnapshot: true },
    });
    if (!repair) throw new NotFoundException('Reparacion no encontrada');
    const [events, pricingSnapshots] = await Promise.all([
      this.prisma.repairEventLog.findMany({
        where: { repairId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.repairPricingSnapshot.findMany({
        where: { repairId: id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 12,
      }),
    ]);
    return {
      item: this.serializeRepair(repair),
      timeline: events.map((e) => this.serializeEvent(e)),
      pricingSnapshots: pricingSnapshots.map((snapshot) => this.serializeRepairPricingSnapshot(snapshot)),
    };
  }

  async adminUpdateStatus(id: string, statusRaw: string, finalPrice?: number | null, notes?: string | null) {
    const previous = await this.prisma.repair.findUnique({ where: { id } });
    if (!previous) throw new NotFoundException('Reparacion no encontrada');

    const status = this.normalizeStatus(statusRaw);
    if (!status) {
      throw new BadRequestException('Estado de reparacion invalido');
    }
    this.assertValidRepairStatusTransition(previous.status, status);

    const nextNotes = notes !== undefined ? this.cleanNullable(notes) : previous.notes;
    const nextFinalPrice = finalPrice !== undefined ? (finalPrice == null ? null : new Prisma.Decimal(finalPrice)) : previous.finalPrice;
    const hasStatusChange = previous.status !== status;
    const hasFinalPriceChange =
      (previous.finalPrice != null ? Number(previous.finalPrice) : null) !==
      (nextFinalPrice != null ? Number(nextFinalPrice) : null);
    const hasNotesChange = (previous.notes ?? null) !== (nextNotes ?? null);

    if (!hasStatusChange && !hasFinalPriceChange && !hasNotesChange) {
      return { item: this.serializeRepair(previous) };
    }

    const repair = await this.prisma.repair.update({
      where: { id },
      data: {
        status,
        ...(finalPrice !== undefined ? { finalPrice: nextFinalPrice } : {}),
        ...(notes !== undefined ? { notes: nextNotes } : {}),
      },
    });
    await this.createEvent(repair.id, hasStatusChange ? 'STATUS_CHANGED' : 'UPDATED', hasStatusChange ? `Estado: ${previous.status} -> ${repair.status}` : 'Datos de cierre actualizados', {
      fromStatus: previous.status,
      toStatus: repair.status,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notesUpdated: notes !== undefined,
    });
    if (hasStatusChange) {
      await this.createRepairWhatsappLog(repair);
    }
    return { item: this.serializeRepair(repair) };
  }

  async adminUpdate(id: string, input: UpdateRepairInput) {
    const previous = await this.prisma.repair.findUnique({
      where: { id },
      include: { activePricingSnapshot: true },
    });
    if (!previous) throw new NotFoundException('Reparacion no encontrada');

    const data: Prisma.RepairUncheckedUpdateInput = {};
    const pricingSnapshotDraft = input.pricingSnapshotDraft ?? null;

    if (input.customerName !== undefined) data.customerName = input.customerName.trim();
    if (input.customerPhone !== undefined) data.customerPhone = this.cleanNullable(input.customerPhone);
    if (input.deviceTypeId !== undefined) data.deviceTypeId = this.cleanNullable(input.deviceTypeId);
    if (input.deviceBrandId !== undefined) data.deviceBrandId = this.cleanNullable(input.deviceBrandId);
    if (input.deviceModelId !== undefined) data.deviceModelId = this.cleanNullable(input.deviceModelId);
    if (input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = this.cleanNullable(input.deviceIssueTypeId);
    if (input.deviceBrand !== undefined) data.deviceBrand = this.cleanNullable(input.deviceBrand);
    if (input.deviceModel !== undefined) data.deviceModel = this.cleanNullable(input.deviceModel);
    if (input.issueLabel !== undefined) data.issueLabel = this.cleanNullable(input.issueLabel);
    if (input.notes !== undefined) data.notes = this.cleanNullable(input.notes);
    if (input.quotedPrice !== undefined) data.quotedPrice = input.quotedPrice == null ? null : new Prisma.Decimal(input.quotedPrice);
    if (input.finalPrice !== undefined) data.finalPrice = input.finalPrice == null ? null : new Prisma.Decimal(input.finalPrice);
    if (input.status !== undefined) {
      const normalizedStatus = this.normalizeStatus(input.status);
      if (!normalizedStatus) {
        throw new BadRequestException('Estado de reparacion invalido');
      }
      this.assertValidRepairStatusTransition(previous.status, normalizedStatus);
      data.status = normalizedStatus;
    }

    const nextContext = {
      deviceTypeId: input.deviceTypeId !== undefined ? this.cleanNullable(input.deviceTypeId) : previous.deviceTypeId ?? null,
      deviceBrandId: input.deviceBrandId !== undefined ? this.cleanNullable(input.deviceBrandId) : previous.deviceBrandId ?? null,
      deviceModelId: input.deviceModelId !== undefined ? this.cleanNullable(input.deviceModelId) : previous.deviceModelId ?? null,
      deviceIssueTypeId: input.deviceIssueTypeId !== undefined ? this.cleanNullable(input.deviceIssueTypeId) : previous.deviceIssueTypeId ?? null,
      deviceBrand: input.deviceBrand !== undefined ? this.cleanNullable(input.deviceBrand) : previous.deviceBrand ?? null,
      deviceModel: input.deviceModel !== undefined ? this.cleanNullable(input.deviceModel) : previous.deviceModel ?? null,
      issueLabel: input.issueLabel !== undefined ? this.cleanNullable(input.issueLabel) : previous.issueLabel ?? null,
    };

    await this.assertValidRepairReferences({
      userId: previous.userId ?? null,
      deviceTypeId: nextContext.deviceTypeId,
      deviceBrandId: nextContext.deviceBrandId,
      deviceModelId: nextContext.deviceModelId,
      deviceIssueTypeId: nextContext.deviceIssueTypeId,
    });

    if (Object.keys(data).length === 0 && !pricingSnapshotDraft) {
      return { item: this.serializeRepair(previous) };
    }

    const repair = await this.prisma.$transaction(async (tx) => {
      const updated = Object.keys(data).length > 0
        ? await tx.repair.update({ where: { id }, data })
        : await tx.repair.findUnique({ where: { id } });

      if (!updated) throw new NotFoundException('Reparacion no encontrada');

      if (pricingSnapshotDraft) {
        await this.applyPricingSnapshotDraft(tx, {
          repairId: updated.id,
          previousActiveSnapshotId: previous.activePricingSnapshotId ?? null,
          draft: pricingSnapshotDraft,
          effectiveQuotedPrice: updated.quotedPrice != null ? Number(updated.quotedPrice) : null,
          context: nextContext,
        });
      }

      return tx.repair.findUnique({
        where: { id: updated.id },
        include: { activePricingSnapshot: true },
      });
    });

    if (!repair) throw new NotFoundException('Reparacion no encontrada');

    const changedFields = this.detectChangedFields(previous, repair);
    if (changedFields.length > 0) {
      await this.createEvent(repair.id, 'UPDATED', `Campos actualizados: ${changedFields.join(', ')}`, { changedFields });
    }

    if (pricingSnapshotDraft && repair.activePricingSnapshotId !== previous.activePricingSnapshotId) {
      await this.createEvent(
        repair.id,
        'UPDATED',
        repair.activePricingSnapshot?.manualOverridePrice != null
          ? 'Snapshot de pricing aplicado con override manual'
          : 'Snapshot de pricing aplicado segun calculo',
        {
          activePricingSnapshotId: repair.activePricingSnapshotId ?? null,
          previousActivePricingSnapshotId: previous.activePricingSnapshotId ?? null,
          manualOverridePrice:
            repair.activePricingSnapshot?.manualOverridePrice != null ? Number(repair.activePricingSnapshot.manualOverridePrice) : null,
        },
      );
    }

    if (
      !pricingSnapshotDraft
      && previous.activePricingSnapshotId
      && data.quotedPrice !== undefined
      && repair.activePricingSnapshotId === previous.activePricingSnapshotId
      && !this.sameMoney(previous.activePricingSnapshot?.appliedQuotedPrice, repair.quotedPrice != null ? Number(repair.quotedPrice) : null)
    ) {
      await this.createEvent(repair.id, 'UPDATED', 'Presupuesto modificado manualmente sobre el snapshot activo', {
        activePricingSnapshotId: repair.activePricingSnapshotId ?? null,
        previousQuotedPrice: previous.quotedPrice != null ? Number(previous.quotedPrice) : null,
        nextQuotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      });
    }

    return { item: this.serializeRepair(repair) };
  }

  async myRepairs(userId: string) {
    const items = await this.prisma.repair.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map((r) => this.serializeRepair(r)) };
  }

  async myRepairDetail(userId: string, id: string) {
    const repair = await this.prisma.repair.findUnique({ where: { id } });
    if (!repair) throw new NotFoundException('Reparacion no encontrada');
    if (repair.userId !== userId) throw new ForbiddenException('No autorizado');
    return { item: this.serializeRepair(repair) };
  }

  private async applyPricingSnapshotDraft(
    tx: Prisma.TransactionClient,
    input: {
      repairId: string;
      previousActiveSnapshotId: string | null;
      draft: RepairPricingSnapshotDraftInput;
      effectiveQuotedPrice: number | null;
      context: {
        deviceTypeId?: string | null;
        deviceBrandId?: string | null;
        deviceModelId?: string | null;
        deviceIssueTypeId?: string | null;
        deviceBrand?: string | null;
        deviceModel?: string | null;
        issueLabel?: string | null;
      };
    },
  ) {
    const draft = input.draft;
    if (draft.source !== 'SUPPLIER_PART' || draft.status !== 'DRAFT') {
      throw new BadRequestException('Snapshot de pricing invalido');
    }

    const appliedQuotedPrice = input.effectiveQuotedPrice != null ? this.roundMoney(input.effectiveQuotedPrice) : null;
    if (appliedQuotedPrice == null) {
      throw new BadRequestException('Define un presupuesto antes de aplicar el snapshot de pricing');
    }

    const suggestedQuotedPrice = draft.suggestedQuotedPrice != null ? this.roundMoney(draft.suggestedQuotedPrice) : null;
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
        supplierId: this.cleanNullable(draft.supplierId),
        supplierNameSnapshot: this.cleanNullable(draft.supplierNameSnapshot),
        supplierSearchQuery: this.cleanNullable(draft.supplierSearchQuery),
        supplierEndpointSnapshot: this.cleanNullable(draft.supplierEndpointSnapshot),
        externalPartId: this.cleanNullable(draft.externalPartId),
        partSkuSnapshot: this.cleanNullable(draft.partSkuSnapshot),
        partNameSnapshot: draft.partNameSnapshot.trim(),
        partBrandSnapshot: this.cleanNullable(draft.partBrandSnapshot),
        partUrlSnapshot: this.cleanNullable(draft.partUrlSnapshot),
        partAvailabilitySnapshot: this.cleanNullable(draft.partAvailabilitySnapshot) ?? 'unknown',
        quantity: Math.max(1, Math.min(999, Math.round(draft.quantity))),
        deviceTypeIdSnapshot: this.cleanNullable(draft.deviceTypeIdSnapshot),
        deviceBrandIdSnapshot: this.cleanNullable(draft.deviceBrandIdSnapshot),
        deviceModelGroupIdSnapshot: this.cleanNullable(draft.deviceModelGroupIdSnapshot),
        deviceModelIdSnapshot: this.cleanNullable(draft.deviceModelIdSnapshot),
        deviceIssueTypeIdSnapshot: this.cleanNullable(draft.deviceIssueTypeIdSnapshot),
        deviceBrandSnapshot: this.cleanNullable(draft.deviceBrandSnapshot),
        deviceModelSnapshot: this.cleanNullable(draft.deviceModelSnapshot),
        issueLabelSnapshot: this.cleanNullable(draft.issueLabelSnapshot),
        baseCost: new Prisma.Decimal(this.roundMoney(draft.baseCost)),
        extraCost: new Prisma.Decimal(this.roundMoney(draft.extraCost)),
        shippingCost: new Prisma.Decimal(this.roundMoney(draft.shippingCost)),
        pricingRuleId: this.cleanNullable(draft.pricingRuleId),
        pricingRuleNameSnapshot: this.cleanNullable(draft.pricingRuleNameSnapshot),
        calcModeSnapshot: draft.calcModeSnapshot,
        marginPercentSnapshot: new Prisma.Decimal(this.roundMoney(draft.marginPercentSnapshot)),
        minProfitSnapshot: draft.minProfitSnapshot != null ? new Prisma.Decimal(this.roundMoney(draft.minProfitSnapshot)) : null,
        minFinalPriceSnapshot: draft.minFinalPriceSnapshot != null ? new Prisma.Decimal(this.roundMoney(draft.minFinalPriceSnapshot)) : null,
        shippingFeeSnapshot: draft.shippingFeeSnapshot != null ? new Prisma.Decimal(this.roundMoney(draft.shippingFeeSnapshot)) : null,
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
    const supplierId = this.cleanNullable(draft.supplierId);
    const pricingRuleId = this.cleanNullable(draft.pricingRuleId);
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

  private assertSnapshotDraftMatchesContext(
    context: {
      deviceTypeId?: string | null;
      deviceBrandId?: string | null;
      deviceModelId?: string | null;
      deviceIssueTypeId?: string | null;
      deviceBrand?: string | null;
      deviceModel?: string | null;
      issueLabel?: string | null;
    },
    draft: RepairPricingSnapshotDraftInput,
  ) {
    this.assertMatchingNullableId('tipo de equipo', context.deviceTypeId ?? null, draft.deviceTypeIdSnapshot ?? null);
    this.assertMatchingNullableId('marca de catalogo', context.deviceBrandId ?? null, draft.deviceBrandIdSnapshot ?? null);
    this.assertMatchingNullableId('modelo de catalogo', context.deviceModelId ?? null, draft.deviceModelIdSnapshot ?? null);
    this.assertMatchingNullableId('falla de catalogo', context.deviceIssueTypeId ?? null, draft.deviceIssueTypeIdSnapshot ?? null);
    this.assertMatchingNullableText('marca del equipo', context.deviceBrand ?? null, draft.deviceBrandSnapshot ?? null);
    this.assertMatchingNullableText('modelo del equipo', context.deviceModel ?? null, draft.deviceModelSnapshot ?? null);
    this.assertMatchingNullableText('falla reportada', context.issueLabel ?? null, draft.issueLabelSnapshot ?? null);
  }

  private assertMatchingNullableId(label: string, current: string | null, snapshot: string | null) {
    const currentValue = this.cleanNullable(current);
    const snapshotValue = this.cleanNullable(snapshot);
    if (currentValue && snapshotValue && currentValue !== snapshotValue) {
      throw new BadRequestException(`El snapshot de pricing no coincide con ${label}`);
    }
  }

  private assertMatchingNullableText(label: string, current: string | null, snapshot: string | null) {
    const currentValue = this.normalizeComparableText(current);
    const snapshotValue = this.normalizeComparableText(snapshot);
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
      current.supplierId === this.cleanNullable(draft.supplierId) &&
      (current.externalPartId ?? null) === this.cleanNullable(draft.externalPartId) &&
      current.partNameSnapshot === draft.partNameSnapshot.trim() &&
      (current.partSkuSnapshot ?? null) === this.cleanNullable(draft.partSkuSnapshot) &&
      (current.partBrandSnapshot ?? null) === this.cleanNullable(draft.partBrandSnapshot) &&
      current.quantity === Math.max(1, Math.min(999, Math.round(draft.quantity))) &&
      this.sameMoney(current.baseCost, draft.baseCost) &&
      this.sameMoney(current.extraCost, draft.extraCost) &&
      this.sameMoney(current.shippingCost, draft.shippingCost) &&
      current.pricingRuleId === this.cleanNullable(draft.pricingRuleId) &&
      this.sameMoney(current.suggestedQuotedPrice, draft.suggestedQuotedPrice) &&
      this.sameMoney(current.appliedQuotedPrice, appliedQuotedPrice) &&
      this.sameMoney(current.manualOverridePrice, manualOverridePrice)
    );
  }

  private sameMoney(current: Prisma.Decimal | null | undefined, next: number | null | undefined) {
    const left = current != null ? this.roundMoney(Number(current)) : null;
    const right = next != null ? this.roundMoney(next) : null;
    return left === right;
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private normalizeComparableText(value?: string | null) {
    return this.cleanNullable(value)?.toLowerCase() ?? null;
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private normalizePhone(value?: string | null) {
    return (value ?? '').replace(/\D+/g, '');
  }

  private normalizeStatus(status: string) {
    const allowed = new Set([
      'RECEIVED',
      'DIAGNOSING',
      'WAITING_APPROVAL',
      'REPAIRING',
      'READY_PICKUP',
      'DELIVERED',
      'CANCELLED',
    ]);
    const normalized = status.trim().toUpperCase();
    if (!allowed.has(normalized)) return null;
    return normalized as
      | 'RECEIVED'
      | 'DIAGNOSING'
      | 'WAITING_APPROVAL'
      | 'REPAIRING'
      | 'READY_PICKUP'
      | 'DELIVERED'
      | 'CANCELLED';
  }

  private assertValidRepairStatusTransition(current: Repair['status'], next: Repair['status']) {
    if (current === next) return;
    const allowed = RepairsService.STATUS_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`No se puede cambiar una reparacion de ${current} a ${next}`);
    }
  }

  private async assertValidRepairReferences(input: {
    userId?: string | null;
    deviceTypeId?: string | null;
    deviceBrandId?: string | null;
    deviceModelId?: string | null;
    deviceIssueTypeId?: string | null;
  }) {
    const userId = this.cleanNullable(input.userId);
    const deviceTypeId = this.cleanNullable(input.deviceTypeId);
    const deviceBrandId = this.cleanNullable(input.deviceBrandId);
    const deviceModelId = this.cleanNullable(input.deviceModelId);
    const deviceIssueTypeId = this.cleanNullable(input.deviceIssueTypeId);

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

  private serializeRepair(repair: Repair | RepairWithActiveSnapshot) {
    const activePricingSnapshot =
      'activePricingSnapshot' in repair && repair.activePricingSnapshot ? this.serializeRepairPricingSnapshot(repair.activePricingSnapshot) : null;
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

  private serializeRepairPricingSnapshot(snapshot: RepairPricingSnapshot) {
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

  private serializePublicLookup(repair: Repair) {
    return {
      id: repair.id,
      customerName: repair.customerName,
      customerPhoneMasked: repair.customerPhone ? this.maskPhone(repair.customerPhone) : null,
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

  private serializePublicQuoteApproval(repair: Repair) {
    return {
      id: repair.id,
      customerName: repair.customerName,
      customerPhoneMasked: repair.customerPhone ? this.maskPhone(repair.customerPhone) : null,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      statusLabel: this.repairStatusLabel(repair.status),
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notes: repair.notes,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }

  private maskPhone(phone: string) {
    const digits = this.normalizePhone(phone);
    if (!digits) return null;
    if (digits.length <= 4) return digits;
    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  }

  private startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private buildCreatedAtRange(fromRaw?: string, toRaw?: string) {
    const from = this.parseDateStart(fromRaw);
    const toExclusive = this.parseDateEndExclusive(toRaw);
    if (!from && !toExclusive) return undefined;
    return {
      ...(from ? { gte: from } : {}),
      ...(toExclusive ? { lt: toExclusive } : {}),
    };
  }

  private parseDateStart(value?: string) {
    const v = (value ?? '').trim();
    if (!v) return null;
    const d = new Date(`${v}T00:00:00.000`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private parseDateEndExclusive(value?: string) {
    const v = (value ?? '').trim();
    if (!v) return null;
    const d = new Date(`${v}T00:00:00.000`);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 1);
    return d;
  }

  private async createEvent(repairId: string, eventType: string, message?: string | null, meta?: unknown) {
    await this.prisma.repairEventLog.create({
      data: {
        repairId,
        eventType,
        message: message ?? null,
        metaJson: meta == null ? null : JSON.stringify(meta),
      },
    });
  }

  private serializeEvent(event: { id: string; eventType: string; message: string | null; metaJson: string | null; createdAt: Date }) {
    let meta: unknown = null;
    if (event.metaJson) {
      try {
        meta = JSON.parse(event.metaJson);
      } catch {
        meta = event.metaJson;
      }
    }
    return {
      id: event.id,
      eventType: event.eventType,
      message: event.message,
      meta,
      createdAt: event.createdAt.toISOString(),
    };
  }

  private detectChangedFields(before: Repair, after: Repair) {
    const changed: string[] = [];

    const baseFields: Array<[keyof Repair, string]> = [
      ['customerName', 'customerName'],
      ['customerPhone', 'customerPhone'],
      ['deviceTypeId', 'deviceTypeId'],
      ['deviceBrandId', 'deviceBrandId'],
      ['deviceModelId', 'deviceModelId'],
      ['deviceIssueTypeId', 'deviceIssueTypeId'],
      ['deviceBrand', 'deviceBrand'],
      ['deviceModel', 'deviceModel'],
      ['issueLabel', 'issueLabel'],
      ['status', 'status'],
      ['notes', 'notes'],
    ];

    for (const [field, label] of baseFields) {
      if (String(before[field] ?? '') !== String(after[field] ?? '')) changed.push(label);
    }

    const beforeQuoted = before.quotedPrice != null ? Number(before.quotedPrice) : null;
    const afterQuoted = after.quotedPrice != null ? Number(after.quotedPrice) : null;
    const beforeFinal = before.finalPrice != null ? Number(before.finalPrice) : null;
    const afterFinal = after.finalPrice != null ? Number(after.finalPrice) : null;
    if (beforeQuoted !== afterQuoted) changed.push('quotedPrice');
    if (beforeFinal !== afterFinal) changed.push('finalPrice');

    return changed;
  }

  private async createRepairWhatsappLog(repair: Repair) {
    try {
      const statusKey = this.repairStatusTemplateKey(repair.status);
      const webBase = this.getWebBaseUrl();
      const approvalUrl = statusKey === 'waiting_approval' ? await this.createPublicQuoteApprovalUrl(repair.id) : '';
      const settingsKeys = [
        `whatsapp_repairs_template.${statusKey}.body`,
        'shop_address',
        'shop_hours',
      ];
      const rows = await this.prisma.appSetting.findMany({ where: { key: { in: settingsKeys } } });
      const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
      const template = (map.get(`whatsapp_repairs_template.${statusKey}.body`) || '').trim() || this.defaultRepairWhatsappTemplate(statusKey);
      const vars: Record<string, string> = {
        customer_name: (repair.customerName || 'Cliente').trim(),
        code: repair.id,
        status: statusKey,
        status_label: this.repairStatusLabel(repair.status),
        lookup_url: `${webBase}/reparacion`,
        phone: (repair.customerPhone || '').trim(),
        device_brand: (repair.deviceBrand || '').trim(),
        device_model: (repair.deviceModel || '').trim(),
        device: [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' ').trim(),
        final_price: repair.finalPrice != null ? `$${Number(repair.finalPrice).toLocaleString('es-AR')}` : '',
        warranty_days: '',
        approval_url: approvalUrl,
        shop_address: (map.get('shop_address') || '').trim(),
        shop_hours: (map.get('shop_hours') || '').trim(),
      };
      const message = this.applyTemplateVars(template, vars);
      await this.whatsappService.createAndDispatchLog({
        channel: 'repairs',
        templateKey: `repairs.${statusKey}`,
        targetType: 'repair',
        targetId: repair.id,
        phone: repair.customerPhone ?? null,
        recipient: repair.customerName ?? null,
        message,
        meta: {
          source: 'admin_status_change',
          repairId: repair.id,
          status: repair.status,
        },
      });
    } catch {
      // no bloquear flujo de negocio
    }
  }

  private repairStatusTemplateKey(status: Repair['status']) {
    if (status === 'RECEIVED') return 'received';
    if (status === 'DIAGNOSING') return 'diagnosing';
    if (status === 'WAITING_APPROVAL') return 'waiting_approval';
    if (status === 'REPAIRING') return 'repairing';
    if (status === 'READY_PICKUP') return 'ready_pickup';
    if (status === 'DELIVERED') return 'delivered';
    if (status === 'CANCELLED') return 'cancelled';
    return 'received';
  }

  private repairStatusLabel(status: Repair['status']) {
    const map: Record<string, string> = {
      RECEIVED: 'Recibido',
      DIAGNOSING: 'Diagnosticando',
      WAITING_APPROVAL: 'Esperando aprobación',
      REPAIRING: 'En reparación',
      READY_PICKUP: 'Listo para retirar',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return map[status] ?? status;
  }

  private defaultRepairWhatsappTemplate(statusKey: string) {
    const base = [
      'Hola {customer_name}',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ];
    if (statusKey === 'waiting_approval') {
      base.splice(2, 0, 'Necesitamos tu aprobación para continuar.', 'Aprobá o rechazá acá: {approval_url}', '');
    }
    if (statusKey === 'ready_pickup') {
      base.splice(2, 0, '¡Ya está lista para retirar!', '', 'Dirección: {shop_address}', 'Horarios: {shop_hours}', '');
    }
    return base.join('\n');
  }

  private applyTemplateVars(template: string, vars: Record<string, string>) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key) => vars[key] ?? '');
  }

  private async createPublicQuoteApprovalUrl(repairId: string) {
    const token = await this.signQuoteApprovalToken(repairId);
    const base = this.getWebBaseUrl();
    return `${base}/reparacion/${encodeURIComponent(repairId)}/presupuesto?token=${encodeURIComponent(token)}`;
  }

  private async signQuoteApprovalToken(repairId: string) {
    const payload: QuoteApprovalTokenPayload = {
      type: 'repair_quote',
      repairId,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.getQuoteApprovalSecret(),
      expiresIn: this.getQuoteApprovalTtlSeconds(),
    });
  }

  private async verifyQuoteApprovalToken(repairId: string, token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<QuoteApprovalTokenPayload>(token, {
        secret: this.getQuoteApprovalSecret(),
      });
      if (payload.type !== 'repair_quote' || payload.repairId !== repairId) {
        throw new UnauthorizedException('Enlace invalido o expirado');
      }
    } catch {
      throw new UnauthorizedException('Enlace invalido o expirado');
    }
  }

  private getQuoteApprovalSecret() {
    const explicit = (process.env.REPAIR_QUOTE_APPROVAL_SECRET ?? '').trim();
    if (explicit) return explicit;
    const accessSecret = (process.env.JWT_ACCESS_SECRET ?? '').trim();
    if (accessSecret) return `${accessSecret}.repair-quote`;
    return 'dev-access-secret-change-me.repair-quote';
  }

  private getQuoteApprovalTtlSeconds() {
    const raw = Number.parseInt((process.env.REPAIR_QUOTE_APPROVAL_TTL_SECONDS ?? '').trim(), 10);
    if (Number.isFinite(raw) && raw > 0) return raw;
    return 60 * 60 * 24 * 7;
  }

  private getWebBaseUrl() {
    return (((process.env.WEB_URL ?? '').trim() || 'http://localhost:5174')).replace(/\/+$/, '');
  }
}


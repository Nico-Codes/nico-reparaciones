import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  assertValidRepairStatusTransition,
  buildCreatedAtRange,
  cleanNullable,
  detectChangedFields,
  normalizeRepairStatus,
  sameMoney,
  startOfToday,
} from './repairs.helpers.js';
import { RepairsNotificationsService } from './repairs-notifications.service.js';
import { RepairsPricingService } from './repairs-pricing.service.js';
import { RepairsSupportService } from './repairs-support.service.js';
import { RepairsTimelineService } from './repairs-timeline.service.js';
import type { CreateRepairInput, RepairAdminListParams, RepairPricingDraftContext, UpdateRepairInput } from './repairs.types.js';

@Injectable()
export class RepairsAdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RepairsSupportService) private readonly repairsSupportService: RepairsSupportService,
    @Inject(RepairsPricingService) private readonly repairsPricingService: RepairsPricingService,
    @Inject(RepairsTimelineService) private readonly repairsTimelineService: RepairsTimelineService,
    @Inject(RepairsNotificationsService) private readonly repairsNotificationsService: RepairsNotificationsService,
  ) {}

  async create(input: CreateRepairInput) {
    const userId = cleanNullable(input.userId);
    const deviceTypeId = cleanNullable(input.deviceTypeId);
    const deviceBrandId = cleanNullable(input.deviceBrandId);
    const deviceModelId = cleanNullable(input.deviceModelId);
    const deviceIssueTypeId = cleanNullable(input.deviceIssueTypeId);
    const deviceBrand = cleanNullable(input.deviceBrand);
    const deviceModel = cleanNullable(input.deviceModel);
    const issueLabel = cleanNullable(input.issueLabel);
    const pricingSnapshotDraft = input.pricingSnapshotDraft ?? null;

    await this.repairsSupportService.assertValidRepairReferences({
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
      customerPhone: cleanNullable(input.customerPhone),
      deviceBrand,
      deviceModel,
      issueLabel,
      notes: cleanNullable(input.notes),
      quotedPrice: input.quotedPrice != null ? new Prisma.Decimal(input.quotedPrice) : null,
      finalPrice: input.finalPrice != null ? new Prisma.Decimal(input.finalPrice) : null,
      status: 'RECEIVED',
    };

    const repair = await this.prisma.$transaction(async (tx) => {
      const created = await tx.repair.create({ data });

      if (pricingSnapshotDraft) {
        await this.repairsPricingService.applyPricingSnapshotDraft(tx, {
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

    await this.repairsTimelineService.createEvent(repair.id, 'CREATED', 'Reparacion creada', {
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      activePricingSnapshotId: repair.activePricingSnapshotId ?? null,
    });

    if (repair.activePricingSnapshotId) {
      await this.repairsTimelineService.createEvent(
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

    return this.repairsSupportService.serializeRepair(repair);
  }

  async adminList(params?: RepairAdminListParams) {
    const query = (params?.q ?? '').trim();
    const status = (params?.status ?? '').trim();
    const createdAtRange = buildCreatedAtRange(params?.from, params?.to);
    const normalizedStatus = status ? normalizeRepairStatus(status) : null;

    if (status && !normalizedStatus) {
      throw new BadRequestException('Estado de reparacion invalido');
    }

    const items = await this.prisma.repair.findMany({
      where: {
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
        ...(query
          ? {
              OR: [
                { id: { contains: query, mode: 'insensitive' } },
                { customerName: { contains: query, mode: 'insensitive' } },
                { customerPhone: { contains: query, mode: 'insensitive' } },
                { deviceBrand: { contains: query, mode: 'insensitive' } },
                { deviceModel: { contains: query, mode: 'insensitive' } },
                { issueLabel: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { items: items.map((repair) => this.repairsSupportService.serializeRepair(repair)) };
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
          updatedAt: { gte: startOfToday() },
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

    const [timeline, pricingSnapshots] = await Promise.all([
      this.repairsTimelineService.listTimeline(id, 50),
      this.repairsPricingService.listSnapshots(id, 12),
    ]);

    return {
      item: this.repairsSupportService.serializeRepair(repair),
      timeline,
      pricingSnapshots,
    };
  }

  async adminUpdateStatus(id: string, statusRaw: string, finalPrice?: number | null, notes?: string | null) {
    const previous = await this.prisma.repair.findUnique({ where: { id } });
    if (!previous) throw new NotFoundException('Reparacion no encontrada');

    const status = normalizeRepairStatus(statusRaw);
    if (!status) {
      throw new BadRequestException('Estado de reparacion invalido');
    }
    assertValidRepairStatusTransition(previous.status, status);

    const nextNotes = notes !== undefined ? cleanNullable(notes) : previous.notes;
    const nextFinalPrice =
      finalPrice !== undefined ? (finalPrice == null ? null : new Prisma.Decimal(finalPrice)) : previous.finalPrice;
    const hasStatusChange = previous.status !== status;
    const hasFinalPriceChange =
      (previous.finalPrice != null ? Number(previous.finalPrice) : null) !==
      (nextFinalPrice != null ? Number(nextFinalPrice) : null);
    const hasNotesChange = (previous.notes ?? null) !== (nextNotes ?? null);

    if (!hasStatusChange && !hasFinalPriceChange && !hasNotesChange) {
      return { item: this.repairsSupportService.serializeRepair(previous) };
    }

    const repair = await this.prisma.repair.update({
      where: { id },
      data: {
        status,
        ...(finalPrice !== undefined ? { finalPrice: nextFinalPrice } : {}),
        ...(notes !== undefined ? { notes: nextNotes } : {}),
      },
    });

    await this.repairsTimelineService.createEvent(
      repair.id,
      hasStatusChange ? 'STATUS_CHANGED' : 'UPDATED',
      hasStatusChange ? `Estado: ${previous.status} -> ${repair.status}` : 'Datos de cierre actualizados',
      {
        fromStatus: previous.status,
        toStatus: repair.status,
        finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
        notesUpdated: notes !== undefined,
      },
    );

    if (hasStatusChange) {
      await this.repairsNotificationsService.createRepairWhatsappLog(repair);
    }

    return { item: this.repairsSupportService.serializeRepair(repair) };
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
    if (input.customerPhone !== undefined) data.customerPhone = cleanNullable(input.customerPhone);
    if (input.deviceTypeId !== undefined) data.deviceTypeId = cleanNullable(input.deviceTypeId);
    if (input.deviceBrandId !== undefined) data.deviceBrandId = cleanNullable(input.deviceBrandId);
    if (input.deviceModelId !== undefined) data.deviceModelId = cleanNullable(input.deviceModelId);
    if (input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = cleanNullable(input.deviceIssueTypeId);
    if (input.deviceBrand !== undefined) data.deviceBrand = cleanNullable(input.deviceBrand);
    if (input.deviceModel !== undefined) data.deviceModel = cleanNullable(input.deviceModel);
    if (input.issueLabel !== undefined) data.issueLabel = cleanNullable(input.issueLabel);
    if (input.notes !== undefined) data.notes = cleanNullable(input.notes);
    if (input.quotedPrice !== undefined) data.quotedPrice = input.quotedPrice == null ? null : new Prisma.Decimal(input.quotedPrice);
    if (input.finalPrice !== undefined) data.finalPrice = input.finalPrice == null ? null : new Prisma.Decimal(input.finalPrice);
    if (input.status !== undefined) {
      const normalizedStatus = normalizeRepairStatus(input.status);
      if (!normalizedStatus) {
        throw new BadRequestException('Estado de reparacion invalido');
      }
      assertValidRepairStatusTransition(previous.status, normalizedStatus);
      data.status = normalizedStatus;
    }

    const nextContext: RepairPricingDraftContext = {
      deviceTypeId: input.deviceTypeId !== undefined ? cleanNullable(input.deviceTypeId) : previous.deviceTypeId ?? null,
      deviceBrandId: input.deviceBrandId !== undefined ? cleanNullable(input.deviceBrandId) : previous.deviceBrandId ?? null,
      deviceModelId: input.deviceModelId !== undefined ? cleanNullable(input.deviceModelId) : previous.deviceModelId ?? null,
      deviceIssueTypeId:
        input.deviceIssueTypeId !== undefined ? cleanNullable(input.deviceIssueTypeId) : previous.deviceIssueTypeId ?? null,
      deviceBrand: input.deviceBrand !== undefined ? cleanNullable(input.deviceBrand) : previous.deviceBrand ?? null,
      deviceModel: input.deviceModel !== undefined ? cleanNullable(input.deviceModel) : previous.deviceModel ?? null,
      issueLabel: input.issueLabel !== undefined ? cleanNullable(input.issueLabel) : previous.issueLabel ?? null,
    };

    await this.repairsSupportService.assertValidRepairReferences({
      userId: previous.userId ?? null,
      deviceTypeId: nextContext.deviceTypeId,
      deviceBrandId: nextContext.deviceBrandId,
      deviceModelId: nextContext.deviceModelId,
      deviceIssueTypeId: nextContext.deviceIssueTypeId,
    });

    if (Object.keys(data).length === 0 && !pricingSnapshotDraft) {
      return { item: this.repairsSupportService.serializeRepair(previous) };
    }

    const repair = await this.prisma.$transaction(async (tx) => {
      const updated =
        Object.keys(data).length > 0 ? await tx.repair.update({ where: { id }, data }) : await tx.repair.findUnique({ where: { id } });

      if (!updated) throw new NotFoundException('Reparacion no encontrada');

      if (pricingSnapshotDraft) {
        await this.repairsPricingService.applyPricingSnapshotDraft(tx, {
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

    const changedFields = detectChangedFields(previous, repair);
    if (changedFields.length > 0) {
      await this.repairsTimelineService.createEvent(repair.id, 'UPDATED', `Campos actualizados: ${changedFields.join(', ')}`, {
        changedFields,
      });
    }

    if (pricingSnapshotDraft && repair.activePricingSnapshotId !== previous.activePricingSnapshotId) {
      await this.repairsTimelineService.createEvent(
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
      !pricingSnapshotDraft &&
      previous.activePricingSnapshotId &&
      data.quotedPrice !== undefined &&
      repair.activePricingSnapshotId === previous.activePricingSnapshotId &&
      !sameMoney(previous.activePricingSnapshot?.appliedQuotedPrice, repair.quotedPrice != null ? Number(repair.quotedPrice) : null)
    ) {
      await this.repairsTimelineService.createEvent(
        repair.id,
        'UPDATED',
        'Presupuesto modificado manualmente sobre el snapshot activo',
        {
          activePricingSnapshotId: repair.activePricingSnapshotId ?? null,
          previousQuotedPrice: previous.quotedPrice != null ? Number(previous.quotedPrice) : null,
          nextQuotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
        },
      );
    }

    return { item: this.repairsSupportService.serializeRepair(repair) };
  }

  async myRepairs(userId: string) {
    const items = await this.prisma.repair.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map((repair) => this.repairsSupportService.serializeRepair(repair)) };
  }

  async myRepairDetail(userId: string, id: string) {
    const repair = await this.prisma.repair.findUnique({ where: { id } });
    if (!repair) throw new NotFoundException('Reparacion no encontrada');
    if (repair.userId !== userId) throw new ForbiddenException('No autorizado');
    return { item: this.repairsSupportService.serializeRepair(repair) };
  }
}

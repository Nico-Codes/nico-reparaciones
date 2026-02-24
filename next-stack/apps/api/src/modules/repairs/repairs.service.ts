import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Repair } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateRepairInput = {
  customerName: string;
  customerPhone?: string | null;
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
};

type UpdateRepairInput = Partial<Omit<CreateRepairInput, 'userId'>> & {
  customerName?: string;
  status?: string;
};

@Injectable()
export class RepairsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async publicLookup(repairIdRaw: string, customerPhoneRaw?: string | null) {
    const repairId = repairIdRaw.trim();
    const customerPhone = this.cleanNullable(customerPhoneRaw);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });

    if (!repair) {
      return { ok: false, found: false, message: 'Reparacion no encontrada' };
    }

    if (customerPhone) {
      const inputPhoneNorm = this.normalizePhone(customerPhone);
      const repairPhoneNorm = this.normalizePhone(repair.customerPhone);
      if (!inputPhoneNorm || !repairPhoneNorm || inputPhoneNorm !== repairPhoneNorm) {
        return { ok: false, found: false, message: 'No coincide el telefono de la reparacion' };
      }
    }

    return {
      ok: true,
      found: true,
      item: this.serializePublicLookup(repair),
    };
  }

  async create(input: CreateRepairInput) {
    const data: Prisma.RepairUncheckedCreateInput = {
      userId: input.userId ?? null,
      deviceBrandId: this.cleanNullable(input.deviceBrandId),
      deviceModelId: this.cleanNullable(input.deviceModelId),
      deviceIssueTypeId: this.cleanNullable(input.deviceIssueTypeId),
      customerName: input.customerName.trim(),
      customerPhone: this.cleanNullable(input.customerPhone),
      deviceBrand: this.cleanNullable(input.deviceBrand),
      deviceModel: this.cleanNullable(input.deviceModel),
      issueLabel: this.cleanNullable(input.issueLabel),
      notes: this.cleanNullable(input.notes),
      quotedPrice: input.quotedPrice != null ? new Prisma.Decimal(input.quotedPrice) : null,
      finalPrice: input.finalPrice != null ? new Prisma.Decimal(input.finalPrice) : null,
      status: 'RECEIVED',
    };
    const repair = await this.prisma.repair.create({
      data,
    });

    await this.createEvent(repair.id, 'CREATED', 'Reparacion creada', {
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
    });

    return this.serializeRepair(repair);
  }

  async adminList(params?: { status?: string; q?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim();
    const status = (params?.status ?? '').trim();
    const createdAtRange = this.buildCreatedAtRange(params?.from, params?.to);

    const items = await this.prisma.repair.findMany({
      where: {
        ...(status ? { status: this.normalizeStatus(status) } : {}),
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
    const repair = await this.prisma.repair.findUnique({ where: { id } });
    if (!repair) throw new NotFoundException('Reparación no encontrada');
    const events = await this.prisma.repairEventLog.findMany({
      where: { repairId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { item: this.serializeRepair(repair), timeline: events.map((e) => this.serializeEvent(e)) };
  }

  async adminUpdateStatus(id: string, statusRaw: string, finalPrice?: number | null, notes?: string | null) {
    const status = this.normalizeStatus(statusRaw);
    const previous = await this.prisma.repair.findUnique({ where: { id } });
    const repair = await this.prisma.repair.update({
      where: { id },
      data: {
        status,
        ...(finalPrice !== undefined ? { finalPrice: finalPrice == null ? null : new Prisma.Decimal(finalPrice) } : {}),
        ...(notes !== undefined ? { notes: this.cleanNullable(notes) } : {}),
      },
    });
    await this.createEvent(repair.id, 'STATUS_CHANGED', `Estado: ${(previous?.status ?? 'UNKNOWN')} -> ${repair.status}`, {
      fromStatus: previous?.status ?? null,
      toStatus: repair.status,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notesUpdated: notes !== undefined,
    });
    return { item: this.serializeRepair(repair) };
  }

  async adminUpdate(id: string, input: UpdateRepairInput) {
    const previous = await this.prisma.repair.findUnique({ where: { id } });
    const data: Prisma.RepairUncheckedUpdateInput = {};

    if (input.customerName !== undefined) data.customerName = input.customerName.trim();
    if (input.customerPhone !== undefined) data.customerPhone = this.cleanNullable(input.customerPhone);
    if (input.deviceBrandId !== undefined) data.deviceBrandId = this.cleanNullable(input.deviceBrandId);
    if (input.deviceModelId !== undefined) data.deviceModelId = this.cleanNullable(input.deviceModelId);
    if (input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = this.cleanNullable(input.deviceIssueTypeId);
    if (input.deviceBrand !== undefined) data.deviceBrand = this.cleanNullable(input.deviceBrand);
    if (input.deviceModel !== undefined) data.deviceModel = this.cleanNullable(input.deviceModel);
    if (input.issueLabel !== undefined) data.issueLabel = this.cleanNullable(input.issueLabel);
    if (input.notes !== undefined) data.notes = this.cleanNullable(input.notes);
    if (input.quotedPrice !== undefined) data.quotedPrice = input.quotedPrice == null ? null : new Prisma.Decimal(input.quotedPrice);
    if (input.finalPrice !== undefined) data.finalPrice = input.finalPrice == null ? null : new Prisma.Decimal(input.finalPrice);
    if (input.status !== undefined) data.status = this.normalizeStatus(input.status);

    const repair = await this.prisma.repair.update({
      where: { id },
      data,
    });

    if (previous) {
      const changedFields = this.detectChangedFields(previous, repair);
      if (changedFields.length > 0) {
        await this.createEvent(repair.id, 'UPDATED', `Campos actualizados: ${changedFields.join(', ')}`, { changedFields });
      }
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
    if (!repair) throw new NotFoundException('Reparación no encontrada');
    if (repair.userId !== userId) throw new ForbiddenException('No autorizado');
    return { item: this.serializeRepair(repair) };
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
    const normalized = status.toUpperCase();
    if (!allowed.has(normalized)) return 'RECEIVED';
    return normalized as
      | 'RECEIVED'
      | 'DIAGNOSING'
      | 'WAITING_APPROVAL'
      | 'REPAIRING'
      | 'READY_PICKUP'
      | 'DELIVERED'
      | 'CANCELLED';
  }

  private serializeRepair(repair: Repair) {
    return {
      id: repair.id,
      userId: repair.userId,
      deviceBrandId: repair.deviceBrandId ?? null,
      deviceModelId: repair.deviceModelId ?? null,
      deviceIssueTypeId: repair.deviceIssueTypeId ?? null,
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
}

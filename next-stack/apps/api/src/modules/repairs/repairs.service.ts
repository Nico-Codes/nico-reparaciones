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

    return this.serializeRepair(repair);
  }

  async adminList(params?: { status?: string; q?: string }) {
    const q = (params?.q ?? '').trim();
    const status = (params?.status ?? '').trim();

    const items = await this.prisma.repair.findMany({
      where: {
        ...(status ? { status: this.normalizeStatus(status) } : {}),
        ...(q
          ? {
              OR: [
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

  async adminDetail(id: string) {
    const repair = await this.prisma.repair.findUnique({ where: { id } });
    if (!repair) throw new NotFoundException('Reparación no encontrada');
    return { item: this.serializeRepair(repair) };
  }

  async adminUpdateStatus(id: string, statusRaw: string, finalPrice?: number | null, notes?: string | null) {
    const status = this.normalizeStatus(statusRaw);
    const repair = await this.prisma.repair.update({
      where: { id },
      data: {
        status,
        ...(finalPrice !== undefined ? { finalPrice: finalPrice == null ? null : new Prisma.Decimal(finalPrice) } : {}),
        ...(notes !== undefined ? { notes: this.cleanNullable(notes) } : {}),
      },
    });
    return { item: this.serializeRepair(repair) };
  }

  async adminUpdate(id: string, input: UpdateRepairInput) {
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
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateRepairInput = {
  customerName: string;
  customerPhone?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  notes?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  userId?: string | null;
};

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRepairInput) {
    const repair = await this.prisma.repair.create({
      data: {
        userId: input.userId ?? null,
        customerName: input.customerName.trim(),
        customerPhone: this.cleanNullable(input.customerPhone),
        deviceBrand: this.cleanNullable(input.deviceBrand),
        deviceModel: this.cleanNullable(input.deviceModel),
        issueLabel: this.cleanNullable(input.issueLabel),
        notes: this.cleanNullable(input.notes),
        quotedPrice: input.quotedPrice != null ? new Prisma.Decimal(input.quotedPrice) : null,
        finalPrice: input.finalPrice != null ? new Prisma.Decimal(input.finalPrice) : null,
        status: 'RECEIVED',
      },
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

  private serializeRepair(repair: {
    id: string;
    userId: string | null;
    customerName: string;
    customerPhone: string | null;
    deviceBrand: string | null;
    deviceModel: string | null;
    issueLabel: string | null;
    status: string;
    quotedPrice: Prisma.Decimal | null;
    finalPrice: Prisma.Decimal | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: repair.id,
      userId: repair.userId,
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

import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { WarrantyIncidentRegistryRow } from './admin-warranty-registry.types.js';

@Injectable()
export class AdminWarrantyRegistryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async readIncidents() {
    const rows = await this.prisma.warrantyIncident.findMany({
      orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      sourceType: row.sourceType === 'product' ? 'product' : 'repair',
      status: row.status === 'closed' ? 'closed' : 'open',
      title: row.title.trim(),
      reason: this.cleanNullable(row.reason ?? null),
      repairId: this.cleanNullable(row.repairId ?? null),
      productId: this.cleanNullable(row.productId ?? null),
      orderId: this.cleanNullable(row.orderId ?? null),
      supplierId: this.cleanNullable(row.supplierId ?? null),
      quantity: this.clampInt(row.quantity, 1, 999),
      unitCost: Number(row.unitCost),
      costOrigin: row.costOrigin === 'repair' || row.costOrigin === 'product' ? row.costOrigin : 'manual',
      extraCost: Number(row.extraCost),
      recoveredAmount: Number(row.recoveredAmount),
      lossAmount: Number(row.lossAmount),
      happenedAt: row.happenedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      notes: this.cleanNullable(row.notes ?? null),
      createdBy: this.cleanNullable(row.createdBy ?? null),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } satisfies WarrantyIncidentRegistryRow));
  }

  private clampInt(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }
}

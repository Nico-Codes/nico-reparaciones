import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminWarrantyRegistryService } from './admin-warranty-registry.service.js';
import type { WarrantyIncidentRegistryRow } from './admin-warranty-registry.types.js';

type AccountingEntryRow = {
  id: string;
  happenedAt: string;
  direction: 'inflow' | 'outflow';
  category: string;
  description: string;
  source: string;
  amount: number;
};

@Injectable()
export class AdminFinanceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminWarrantyRegistryService) private readonly adminWarrantyRegistryService: AdminWarrantyRegistryService,
  ) {}

  async warranties(params?: { q?: string; sourceType?: string; status?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const sourceType = (params?.sourceType ?? '').trim().toLowerCase();
    const status = (params?.status ?? '').trim().toLowerCase();
    const from = this.parseDateOnly(params?.from ?? '');
    const to = this.parseDateOnly(params?.to ?? '');
    if (to) to.setUTCHours(23, 59, 59, 999);

    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    const suppliers = await this.prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: [{ searchPriority: 'asc' }, { name: 'asc' }],
    });
    const supplierById = new Map(suppliers.map((s) => [s.id, s]));
    const repairIds = incidents.map((i) => i.repairId).filter((v): v is string => !!v);
    const productIds = incidents.map((i) => i.productId).filter((v): v is string => !!v);
    const repairs = repairIds.length
      ? await this.prisma.repair.findMany({
          where: { id: { in: repairIds } },
          select: { id: true, customerName: true },
        })
      : [];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const repairById = new Map(repairs.map((r) => [r.id, r]));
    const productById = new Map(products.map((p) => [p.id, p]));

    const filtered = incidents
      .filter((row) => {
        if (sourceType && row.sourceType !== sourceType) return false;
        if (status && row.status !== status) return false;
        const at = new Date(row.happenedAt);
        if (Number.isNaN(at.getTime())) return false;
        if (from && at < from) return false;
        if (to && at > to) return false;
        if (!q) return true;
        const providerName = row.supplierId ? supplierById.get(row.supplierId)?.name ?? '' : '';
        const repair = row.repairId ? repairById.get(row.repairId) : null;
        const product = row.productId ? productById.get(row.productId) : null;
        const repairLookupCode = row.repairId ? `r-${row.repairId.slice(0, 13)}` : '';
        return (
          row.id.toLowerCase().includes(q) ||
          row.title.toLowerCase().includes(q) ||
          (row.reason ?? '').toLowerCase().includes(q) ||
          (row.notes ?? '').toLowerCase().includes(q) ||
          (row.repairId ?? '').toLowerCase().includes(q) ||
          (row.orderId ?? '').toLowerCase().includes(q) ||
          repairLookupCode.includes(q) ||
          (repair?.customerName ?? '').toLowerCase().includes(q) ||
          (product?.name ?? '').toLowerCase().includes(q) ||
          providerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

    const sourceLabelMap = { repair: 'Reparacion', product: 'Producto' } as const;
    const costOriginLabelMap = {
      manual: 'Manual',
      repair: 'Reparacion',
      product: 'Producto',
    } as const;

    const items = filtered.map((row) => {
      const at = new Date(row.happenedAt);
      const supplierName = row.supplierId ? supplierById.get(row.supplierId)?.name ?? '-' : '-';
      const repair = row.repairId ? repairById.get(row.repairId) : null;
      const product = row.productId ? productById.get(row.productId) : null;
      const date = this.formatDate(at);
      const time = this.formatTime(at);
      return {
        id: row.id,
        sourceType: row.sourceType,
        source: sourceLabelMap[row.sourceType] ?? row.sourceType,
        status: row.status,
        statusLabel: row.status === 'closed' ? 'Cerrado' : 'Abierto',
        title: row.title,
        reason: row.reason ?? '',
        repairId: row.repairId,
        repairCode: row.repairId ? `R-${row.repairId.slice(0, 13)}` : null,
        customerName: repair?.customerName ?? '',
        productId: row.productId,
        productName: product?.name ?? '',
        providerId: row.supplierId,
        provider: supplierName,
        costSource: costOriginLabelMap[row.costOrigin] ?? row.costOrigin,
        quantity: row.quantity,
        unitCost: row.unitCost,
        cost: row.quantity * row.unitCost + row.extraCost,
        recovered: row.recoveredAmount,
        loss: row.lossAmount,
        notes: row.notes ?? '',
        happenedAt: row.happenedAt,
        date,
        time,
      };
    });

    const summary = {
      totalCount: items.length,
      openCount: items.filter((i) => i.status === 'open').length,
      closedCount: items.filter((i) => i.status === 'closed').length,
      totalLoss: items.reduce((acc, i) => acc + i.loss, 0),
    };

    const groupedBySupplier = new Map<string, { supplierId: string; name: string; incidentsCount: number; totalLoss: number }>();
    for (const row of items) {
      if (!row.providerId) continue;
      const current = groupedBySupplier.get(row.providerId) ?? {
        supplierId: row.providerId,
        name: row.provider,
        incidentsCount: 0,
        totalLoss: 0,
      };
      current.incidentsCount += 1;
      current.totalLoss += row.loss;
      groupedBySupplier.set(row.providerId, current);
    }
    const supplierStats = [...groupedBySupplier.values()].sort((a, b) => b.totalLoss - a.totalLoss).slice(0, 8);

    return { items, summary, supplierStats };
  }

  async createWarranty(
    input: {
      sourceType: 'repair' | 'product';
      title: string;
      reason?: string | null;
      repairId?: string | null;
      productId?: string | null;
      orderId?: string | null;
      supplierId?: string | null;
      quantity: number;
      unitCost?: number | null;
      costOrigin?: 'manual' | 'repair' | 'product';
      extraCost?: number;
      recoveredAmount?: number;
      happenedAt?: string | null;
      notes?: string | null;
    },
    actorUserId: string | null,
  ) {
    const sourceType = input.sourceType;
    const repairId = this.cleanNullable(input.repairId);
    const productId = this.cleanNullable(input.productId);
    if (sourceType === 'repair' && !repairId) throw new BadRequestException('Selecciona la reparacion asociada');
    if (sourceType === 'product' && !productId) throw new BadRequestException('Selecciona el producto asociado');

    const [repair, product] = await Promise.all([
      repairId
        ? this.prisma.repair.findUnique({
            where: { id: repairId },
            select: { id: true, finalPrice: true, quotedPrice: true, customerName: true },
          })
        : Promise.resolve(null),
      productId
        ? this.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, costPrice: true, name: true },
          })
        : Promise.resolve(null),
    ]);
    if (repairId && !repair) throw new BadRequestException('Reparacion no encontrada');
    if (productId && !product) throw new BadRequestException('Producto no encontrado');

    let unitCost = Number(input.unitCost ?? 0);
    let costOrigin: WarrantyIncidentRegistryRow['costOrigin'] = input.costOrigin ?? 'manual';

    if (unitCost <= 0 && sourceType === 'repair' && repair) {
      unitCost = Number(repair.finalPrice ?? repair.quotedPrice ?? 0);
      if (unitCost > 0) costOrigin = 'repair';
    }
    if (unitCost <= 0 && sourceType === 'product' && product) {
      unitCost = Number(product.costPrice ?? 0);
      if (unitCost > 0) costOrigin = 'product';
    }
    if (unitCost <= 0) throw new BadRequestException('No se pudo resolver costo unitario. Cargalo manualmente.');

    if (costOrigin === 'repair' && sourceType !== 'repair') costOrigin = 'manual';
    if (costOrigin === 'product' && sourceType !== 'product') costOrigin = 'manual';

    const quantity = this.clampInt(input.quantity, 1, 999);
    const extraCost = Math.max(0, Number(input.extraCost ?? 0));
    const recoveredAmount = Math.max(0, Number(input.recoveredAmount ?? 0));
    const lossAmount = Math.max(0, quantity * unitCost + extraCost - recoveredAmount);

    const happenedAt = this.parseDateTime(input.happenedAt) ?? new Date();
    const suppliers = await this.prisma.supplier.findMany({ select: { id: true } });
    const supplierSet = new Set(suppliers.map((s) => s.id));
    const supplierId = this.cleanNullable(input.supplierId);
    const normalizedSupplierId = supplierId && supplierSet.has(supplierId) ? supplierId : null;

    const created = await this.prisma.warrantyIncident.create({
      data: {
        sourceType,
        status: 'open',
        title: input.title.trim(),
        reason: this.cleanNullable(input.reason),
        repairId,
        productId,
        orderId: this.cleanNullable(input.orderId),
        supplierId: normalizedSupplierId,
        quantity,
        unitCost,
        costOrigin,
        extraCost,
        recoveredAmount,
        lossAmount,
        happenedAt,
        resolvedAt: null,
        notes: this.cleanNullable(input.notes),
        createdBy: actorUserId,
      },
    });

    const result = await this.warranties();
    const row = result.items.find((i) => i.id === created.id);
    return { item: row ?? null };
  }

  async closeWarranty(id: string) {
    const existing = await this.prisma.warrantyIncident.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new BadRequestException('Incidente no encontrado');
    await this.prisma.warrantyIncident.update({
      where: { id },
      data: {
        status: 'closed',
        resolvedAt: new Date(),
      },
    });
    const result = await this.warranties();
    const row = result.items.find((i) => i.id === id);
    return { item: row ?? null };
  }

  async accounting(params?: { q?: string; direction?: string; category?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const direction = (params?.direction ?? '').trim().toLowerCase();
    const category = (params?.category ?? '').trim();
    const fromDate = this.parseDateOnly(params?.from ?? '') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = this.parseDateOnly(params?.to ?? '') ?? new Date();
    if (params?.to) toDate.setUTCHours(23, 59, 59, 999);

    const [orders, incidents] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: 'ENTREGADO' },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
      this.adminWarrantyRegistryService.readIncidents(),
    ]);

    const entries: AccountingEntryRow[] = [];
    for (const order of orders) {
      entries.push({
        id: `ord-${order.id}`,
        happenedAt: order.createdAt.toISOString(),
        direction: 'inflow',
        category: 'order_sale',
        description: `Venta web pedido #${order.id.slice(0, 8)}`,
        source: `Order ${order.id}`,
        amount: Number(order.total),
      });
    }
    for (const incident of incidents) {
      if (incident.lossAmount > 0) {
        entries.push({
          id: `wloss-${incident.id}`,
          happenedAt: incident.happenedAt,
          direction: 'outflow',
          category: 'warranty_loss',
          description: `Garantia: ${incident.title}`,
          source: `WarrantyIncident ${incident.id}`,
          amount: incident.lossAmount,
        });
      }
      if (incident.recoveredAmount > 0) {
        entries.push({
          id: `wrec-${incident.id}`,
          happenedAt: incident.happenedAt,
          direction: 'inflow',
          category: 'warranty_recovery',
          description: `Recupero garantia: ${incident.title}`,
          source: `WarrantyIncident ${incident.id}`,
          amount: incident.recoveredAmount,
        });
      }
    }

    const filtered = entries
      .filter((entry) => {
        const at = new Date(entry.happenedAt);
        if (Number.isNaN(at.getTime())) return false;
        if (at < fromDate || at > toDate) return false;
        if ((direction === 'inflow' || direction === 'outflow') && entry.direction !== direction) return false;
        if (category && entry.category !== category) return false;
        if (!q) return true;
        return (
          entry.description.toLowerCase().includes(q) ||
          entry.source.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

    const inflowTotal = filtered.filter((row) => row.direction === 'inflow').reduce((acc, row) => acc + row.amount, 0);
    const outflowTotal = filtered.filter((row) => row.direction === 'outflow').reduce((acc, row) => acc + row.amount, 0);
    const byCategory = new Map<string, { incomes: number; expenses: number; count: number }>();
    for (const row of filtered) {
      const current = byCategory.get(row.category) ?? { incomes: 0, expenses: 0, count: 0 };
      current.count += 1;
      if (row.direction === 'inflow') current.incomes += row.amount;
      else current.expenses += row.amount;
      byCategory.set(row.category, current);
    }

    return {
      summary: {
        entriesCount: filtered.length,
        inflowTotal,
        outflowTotal,
        netTotal: inflowTotal - outflowTotal,
      },
      categories: [...new Set(filtered.map((row) => row.category))].sort((a, b) => a.localeCompare(b, 'es')),
      categorySummary: [...byCategory.entries()]
        .map(([key, value]) => ({
          category: key,
          entriesCount: value.count,
          inflowTotal: value.incomes,
          outflowTotal: value.expenses,
          netTotal: value.incomes - value.expenses,
        }))
        .sort((a, b) => a.category.localeCompare(b.category, 'es')),
      items: filtered.map((row) => ({
        id: row.id,
        happenedAt: row.happenedAt,
        date: this.formatDateTime(new Date(row.happenedAt)),
        direction: row.direction === 'inflow' ? 'Ingreso' : 'Egreso',
        directionKey: row.direction,
        category: row.category,
        description: row.description,
        source: row.source,
        amount: row.amount,
      })),
      filters: {
        q: params?.q ?? '',
        direction: direction === 'inflow' || direction === 'outflow' ? direction : '',
        category,
        from: this.formatDateInput(fromDate),
        to: this.formatDateInput(toDate),
      },
    };
  }

  private parseDateOnly(value: string) {
    const raw = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const date = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  private parseDateTime(value?: string | null) {
    const raw = (value ?? '').trim();
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  private formatDate(date: Date) {
    if (Number.isNaN(date.getTime())) return '-';
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getFullYear()),
    ].join('/');
  }

  private formatTime(date: Date) {
    if (Number.isNaN(date.getTime())) return '--:--';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatDateTime(date: Date) {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  private formatDateInput(date: Date) {
    if (Number.isNaN(date.getTime())) return '';
    return [
      String(date.getFullYear()),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
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

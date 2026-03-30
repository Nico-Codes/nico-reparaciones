import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, type HelpFaqItem, type UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminBrandAssetsService } from './admin-brand-assets.service.js';
import { AdminCommunicationsService } from './admin-communications.service.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminProvidersService } from './admin-providers.service.js';
import { AdminSettingsService } from './admin-settings.service.js';

type WarrantyIncidentRegistryRow = {
  id: string;
  sourceType: 'repair' | 'product';
  status: 'open' | 'closed';
  title: string;
  reason: string | null;
  repairId: string | null;
  productId: string | null;
  orderId: string | null;
  supplierId: string | null;
  quantity: number;
  unitCost: number;
  costOrigin: 'manual' | 'repair' | 'product';
  extraCost: number;
  recoveredAmount: number;
  lossAmount: number;
  happenedAt: string;
  resolvedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

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
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminDashboardService) private readonly adminDashboardService: AdminDashboardService,
    @Inject(AdminSettingsService) private readonly adminSettingsService: AdminSettingsService,
    @Inject(AdminBrandAssetsService) private readonly adminBrandAssetsService: AdminBrandAssetsService,
    @Inject(AdminCommunicationsService) private readonly adminCommunicationsService: AdminCommunicationsService,
    @Inject(AdminProvidersService) private readonly adminProvidersService: AdminProvidersService,
  ) {}

  async dashboard() {
    return this.adminDashboardService.dashboard();
  }

  async users(params?: { q?: string; role?: string }) {
    const q = (params?.q ?? '').trim();
    const role = this.parseUserRole(params?.role);
    const items = await this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });

    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    };
  }

  async updateUserRole(targetUserId: string, roleRaw: string, actorUserId?: string | null) {
    const role = this.parseUserRole(roleRaw);
    if (!role) {
      return { message: 'Rol invalido' };
    }

    if (actorUserId && actorUserId === targetUserId && role !== 'ADMIN') {
      return { message: 'No podes quitarte el rol admin a vos mismo' };
    }

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    return {
      item: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  async settings() {
    return this.adminSettingsService.settings();
  }

  async upsertSettings(input: Array<{ key: string; value?: string | null; group?: string; label?: string | null; type?: string | null }>) {
    return this.adminSettingsService.upsertSettings(input);
  }

  async sendWeeklyDashboardReportNow(rangeDaysRaw?: number | null) {
    return this.adminCommunicationsService.sendWeeklyDashboardReportNow(rangeDaysRaw);
  }

  async sendOperationalAlertsNow() {
    return this.adminCommunicationsService.sendOperationalAlertsNow();
  }

  async smtpStatus(defaultToEmail?: string | null) {
    return this.adminCommunicationsService.smtpStatus(defaultToEmail);
  }

  async sendSmtpTestEmail(to: string) {
    return this.adminCommunicationsService.sendSmtpTestEmail(to);
  }

  async deviceTypes() {
    const items = await this.prisma.deviceType.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return {
      items: items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, active: i.active })),
    };
  }

  async createDeviceType(input: { name: string; active?: boolean }) {
    const name = input.name.trim();
    const slugBase = this.slugify(name) || 'tipo';
    let slug = slugBase;
    let idx = 2;
    while (await this.prisma.deviceType.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${idx++}`;
    }
    const item = await this.prisma.deviceType.create({
      data: { name, slug, active: input.active ?? true },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async updateDeviceType(id: string, input: { name?: string; active?: boolean }) {
    const item = await this.prisma.deviceType.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async modelGroups(deviceBrandIdRaw: string) {
    const deviceBrandId = (deviceBrandIdRaw ?? '').trim();
    if (!deviceBrandId) return { groups: [], models: [] };

    const brand = await this.prisma.deviceBrand.findUnique({ where: { id: deviceBrandId } });
    if (!brand) throw new BadRequestException('Marca no encontrada');

    const groups = await this.prisma.deviceModelGroup.findMany({
      where: { deviceBrandId },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    const models = await this.prisma.deviceModel.findMany({
      where: { brandId: deviceBrandId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, active: true, deviceModelGroupId: true },
    });

    return {
      groups: groups.map((g) => ({ id: g.id, name: g.name, slug: g.slug, active: g.active })),
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        active: m.active,
        deviceModelGroupId: m.deviceModelGroupId ?? null,
      })),
    };
  }

  async createModelGroup(input: { deviceBrandId: string; name: string; active?: boolean }) {
    const brand = await this.prisma.deviceBrand.findUnique({ where: { id: input.deviceBrandId } });
    if (!brand) throw new BadRequestException('Marca no encontrada');

    const name = input.name.trim();
    const slugBase = this.slugify(name) || 'grupo';
    let slug = slugBase;
    let idx = 2;
    while (
      await this.prisma.deviceModelGroup.findFirst({
        where: { deviceBrandId: input.deviceBrandId, slug },
        select: { id: true },
      })
    ) slug = `${slugBase}-${idx++}`;
    const item = await this.prisma.deviceModelGroup.create({
      data: {
        deviceBrandId: input.deviceBrandId,
        name,
        slug,
        active: input.active ?? true,
      },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async updateModelGroup(id: string, input: { deviceBrandId: string; name?: string; active?: boolean }) {
    const existing = await this.prisma.deviceModelGroup.findUnique({ where: { id } });
    if (!existing || existing.deviceBrandId !== input.deviceBrandId) throw new BadRequestException('Grupo no encontrado');
    const item = await this.prisma.deviceModelGroup.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async assignModelGroup(modelId: string, input: { deviceBrandId: string; deviceModelGroupId?: string | null }) {
    const model = await this.prisma.deviceModel.findUnique({ where: { id: modelId }, select: { id: true, brandId: true } });
    if (!model) throw new BadRequestException('Modelo no encontrado');
    if (model.brandId !== input.deviceBrandId) throw new BadRequestException('Modelo no pertenece a la marca seleccionada');

    const groupId = (input.deviceModelGroupId ?? '').trim() || null;
    if (groupId) {
      const group = await this.prisma.deviceModelGroup.findUnique({ where: { id: groupId } });
      if (!group || group.deviceBrandId !== input.deviceBrandId) throw new BadRequestException('Grupo invalido para esta marca');
    }
    await this.prisma.deviceModel.update({
      where: { id: modelId },
      data: { deviceModelGroupId: groupId },
    });
    return { ok: true };
  }

  async providers(params?: { q?: string; active?: string }) {
    return this.adminProvidersService.providers(params);
  }

  async createProvider(input: {
    name: string;
    phone?: string | null;
    notes?: string | null;
    searchPriority?: number;
    searchEnabled?: boolean;
    searchMode?: 'json' | 'html';
    searchEndpoint?: string | null;
    searchConfigJson?: string | null;
    active?: boolean;
  }) {
    return this.adminProvidersService.createProvider(input);
  }

  async updateProvider(
    id: string,
    input: Partial<{
      name: string;
      phone: string | null;
      notes: string | null;
      searchPriority: number;
      searchEnabled: boolean;
      searchMode: 'json' | 'html';
      searchEndpoint: string | null;
      searchConfigJson: string | null;
      active: boolean;
    }>,
  ) {
    return this.adminProvidersService.updateProvider(id, input);
  }

  async toggleProvider(id: string) {
    return this.adminProvidersService.toggleProvider(id);
  }

  async importDefaultProviders() {
    return this.adminProvidersService.importDefaultProviders();
  }

  async reorderProviders(orderedIds: string[]) {
    return this.adminProvidersService.reorderProviders(orderedIds);
  }

  async probeProvider(id: string, queryRaw?: string) {
    return this.adminProvidersService.probeProvider(id, queryRaw);
  }

  async searchProviderParts(id: string, input: { q: string; limit?: number }) {
    return this.adminProvidersService.searchProviderParts(id, input);
  }

  async searchPartsAcrossProviders(input: {
    q: string;
    supplierId?: string | null;
    limitPerSupplier?: number;
    totalLimit?: number;
  }) {
    return this.adminProvidersService.searchPartsAcrossProviders(input);
  }

  async warranties(params?: { q?: string; sourceType?: string; status?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const sourceType = (params?.sourceType ?? '').trim().toLowerCase();
    const status = (params?.status ?? '').trim().toLowerCase();
    const from = this.parseDateOnly(params?.from ?? '');
    const to = this.parseDateOnly(params?.to ?? '');
    if (to) to.setUTCHours(23, 59, 59, 999);

    const incidents = await this.readWarrantyIncidentsRegistry();
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
    if (toDate && params?.to) toDate.setUTCHours(23, 59, 59, 999);

    const [orders, incidents] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: 'ENTREGADO' },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
      this.readWarrantyIncidentsRegistry(),
    ]);

    const entries: AccountingEntryRow[] = [];
    for (const o of orders) {
      entries.push({
        id: `ord-${o.id}`,
        happenedAt: o.createdAt.toISOString(),
        direction: 'inflow',
        category: 'order_sale',
        description: `Venta web pedido #${o.id.slice(0, 8)}`,
        source: `Order ${o.id}`,
        amount: Number(o.total),
      });
    }
    for (const inc of incidents) {
      if (inc.lossAmount > 0) {
        entries.push({
          id: `wloss-${inc.id}`,
          happenedAt: inc.happenedAt,
          direction: 'outflow',
          category: 'warranty_loss',
          description: `Garantia: ${inc.title}`,
          source: `WarrantyIncident ${inc.id}`,
          amount: inc.lossAmount,
        });
      }
      if (inc.recoveredAmount > 0) {
        entries.push({
          id: `wrec-${inc.id}`,
          happenedAt: inc.happenedAt,
          direction: 'inflow',
          category: 'warranty_recovery',
          description: `Recupero garantia: ${inc.title}`,
          source: `WarrantyIncident ${inc.id}`,
          amount: inc.recoveredAmount,
        });
      }
    }

    const filtered = entries
      .filter((entry) => {
        const at = new Date(entry.happenedAt);
        if (Number.isNaN(at.getTime())) return false;
        if (at < fromDate || at > toDate) return false;
        if (direction === 'inflow' || direction === 'outflow') {
          if (entry.direction !== direction) return false;
        }
        if (category && entry.category !== category) return false;
        if (!q) return true;
        return (
          entry.description.toLowerCase().includes(q) ||
          entry.source.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

    const incomes = filtered.filter((r) => r.direction === 'inflow').reduce((acc, r) => acc + r.amount, 0);
    const expenses = filtered.filter((r) => r.direction === 'outflow').reduce((acc, r) => acc + r.amount, 0);
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
        inflowTotal: incomes,
        outflowTotal: expenses,
        netTotal: incomes - expenses,
      },
      categories: [...new Set(filtered.map((r) => r.category))].sort((a, b) => a.localeCompare(b, 'es')),
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

  async mailTemplates() {
    return this.adminCommunicationsService.mailTemplates();
  }
  async upsertMailTemplates(
    input: Array<{ templateKey: string; subject: string; body: string; enabled?: boolean }>,
  ) {
    return this.adminCommunicationsService.upsertMailTemplates(input);
  }
  async whatsappTemplates(params?: { channel?: string }) {
    return this.adminCommunicationsService.whatsappTemplates(params);
  }
  async upsertWhatsappTemplates(input: {
    channel?: 'repairs' | 'orders';
    items: Array<{
      templateKey: string;
      body: string;
      enabled?: boolean;
      channel?: 'repairs' | 'orders';
    }>;
  }) {
    return this.adminCommunicationsService.upsertWhatsappTemplates(input);
  }
  async whatsappLogs(params?: { channel?: string; status?: string; q?: string }) {
    return this.adminCommunicationsService.whatsappLogs(params);
  }
  async createWhatsappLog(input: {
    channel?: string;
    templateKey?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    phone?: string | null;
    recipient?: string | null;
    status?: string;
    message?: string | null;
    meta?: Record<string, unknown> | null;
  }) {
    return this.adminCommunicationsService.createWhatsappLog(input);
  }

  async helpFaqList(params?: { q?: string; active?: string; category?: string }) {
    const q = (params?.q ?? '').trim();
    const category = (params?.category ?? '').trim();
    const active = (params?.active ?? '').trim();
    const rows = await this.prisma.helpFaqItem.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(active === '1' ? { active: true } : active === '0' ? { active: false } : {}),
        ...(q
          ? {
              OR: [
                { question: { contains: q, mode: 'insensitive' } },
                { answer: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 300,
    });

    return {
      items: rows.map((r: HelpFaqItem) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        category: r.category ?? 'general',
        active: r.active,
        sortOrder: r.sortOrder,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async helpFaqCreate(input: { question: string; answer: string; category?: string | null; active?: boolean; sortOrder?: number }) {
    const row = await this.prisma.helpFaqItem.create({
      data: {
        question: input.question.trim(),
        answer: input.answer.trim(),
        category: this.cleanNullable(input.category) ?? 'general',
        active: input.active ?? true,
        sortOrder: Number(input.sortOrder ?? 0),
      },
    });
    return { item: this.serializeHelpFaq(row) };
  }

  async helpFaqUpdate(
    id: string,
    input: Partial<{ question: string; answer: string; category: string | null; active: boolean; sortOrder: number }>,
  ) {
    const data: Prisma.HelpFaqItemUpdateInput = {};
    if (input.question !== undefined) data.question = input.question.trim();
    if (input.answer !== undefined) data.answer = input.answer.trim();
    if (input.category !== undefined) data.category = this.cleanNullable(input.category) ?? 'general';
    if (input.active !== undefined) data.active = input.active;
    if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder ?? 0);

    const row = await this.prisma.helpFaqItem.update({
      where: { id },
      data,
    });
    return { item: this.serializeHelpFaq(row) };
  }

  async uploadBrandAsset(
    slot: string,
    file: { originalname: string; mimetype: string; size: number; buffer?: Buffer | Uint8Array },
  ) {
    return this.adminBrandAssetsService.uploadBrandAsset(slot, file);
  }

  async resetBrandAsset(slot: string) {
    return this.adminBrandAssetsService.resetBrandAsset(slot);
  }

  private async readWarrantyIncidentsRegistry() {
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

  private async writeWarrantyIncidentsRegistry(items: WarrantyIncidentRegistryRow[]) {
    const incidentIds = items.map((i) => i.id);
    const suppliers = await this.prisma.supplier.findMany({ select: { id: true } });
    const supplierSet = new Set(suppliers.map((s) => s.id));

    await this.prisma.$transaction(async (tx) => {
      for (const row of items) {
        await tx.warrantyIncident.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            sourceType: row.sourceType,
            status: row.status,
            title: row.title,
            reason: row.reason,
            repairId: row.repairId,
            productId: row.productId,
            orderId: row.orderId,
            supplierId: row.supplierId && supplierSet.has(row.supplierId) ? row.supplierId : null,
            quantity: row.quantity,
            unitCost: row.unitCost,
            costOrigin: row.costOrigin,
            extraCost: row.extraCost,
            recoveredAmount: row.recoveredAmount,
            lossAmount: row.lossAmount,
            happenedAt: new Date(row.happenedAt),
            resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
            notes: row.notes,
            createdBy: row.createdBy,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          },
          update: {
            sourceType: row.sourceType,
            status: row.status,
            title: row.title,
            reason: row.reason,
            repairId: row.repairId,
            productId: row.productId,
            orderId: row.orderId,
            supplierId: row.supplierId && supplierSet.has(row.supplierId) ? row.supplierId : null,
            quantity: row.quantity,
            unitCost: row.unitCost,
            costOrigin: row.costOrigin,
            extraCost: row.extraCost,
            recoveredAmount: row.recoveredAmount,
            lossAmount: row.lossAmount,
            happenedAt: new Date(row.happenedAt),
            resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
            notes: row.notes,
            createdBy: row.createdBy,
            updatedAt: new Date(row.updatedAt),
          },
        });
      }
      if (incidentIds.length > 0) {
        await tx.warrantyIncident.deleteMany({
          where: { id: { notIn: incidentIds } },
        });
      } else {
        await tx.warrantyIncident.deleteMany({});
      }
    });
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

  private formatDateTimeShort(date: Date) {
    if (Number.isNaN(date.getTime())) return '-';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${this.formatTime(date)}`;
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

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private randomEntityId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }

  private parseUserRole(value?: string | null): UserRole | null {
    const normalized = (value ?? '').trim().toUpperCase();
    return normalized === 'USER' || normalized === 'ADMIN' ? (normalized as UserRole) : null;
  }

  private serializeHelpFaq(r: HelpFaqItem) {
    return {
      id: r.id,
      question: r.question,
      answer: r.answer,
      category: r.category ?? 'general',
      active: r.active,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}


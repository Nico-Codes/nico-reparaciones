import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, type HelpFaqItem, type UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminBrandAssetsService } from './admin-brand-assets.service.js';
import { AdminCommunicationsService } from './admin-communications.service.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminFinanceService } from './admin-finance.service.js';
import { AdminProvidersService } from './admin-providers.service.js';
import { AdminSettingsService } from './admin-settings.service.js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminDashboardService) private readonly adminDashboardService: AdminDashboardService,
    @Inject(AdminSettingsService) private readonly adminSettingsService: AdminSettingsService,
    @Inject(AdminBrandAssetsService) private readonly adminBrandAssetsService: AdminBrandAssetsService,
    @Inject(AdminCommunicationsService) private readonly adminCommunicationsService: AdminCommunicationsService,
    @Inject(AdminFinanceService) private readonly adminFinanceService: AdminFinanceService,
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
    return this.adminFinanceService.warranties(params);
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
    return this.adminFinanceService.createWarranty(input, actorUserId);
  }

  async closeWarranty(id: string) {
    return this.adminFinanceService.closeWarranty(id);
  }

  async accounting(params?: { q?: string; direction?: string; category?: string; from?: string; to?: string }) {
    return this.adminFinanceService.accounting(params);
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


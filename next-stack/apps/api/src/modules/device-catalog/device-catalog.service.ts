import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type DeviceModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizeRepairIssueIconSlot } from './repair-issue-icons.js';

@Injectable()
export class DeviceCatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async brands(deviceTypeId?: string) {
    const items = await this.prisma.deviceBrand.findMany({
      where: (deviceTypeId ?? '').trim() ? { deviceTypeId: (deviceTypeId ?? '').trim() } : undefined,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return { items };
  }

  async models(brandId?: string) {
    const items = await this.prisma.deviceModel.findMany({
      where: brandId ? { brandId } : undefined,
      include: { brand: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return {
      items: items.map((m: DeviceModel & { brand: { id: string; name: string; slug: string } }) => ({
        id: m.id,
        brandId: m.brandId,
        deviceModelGroupId: m.deviceModelGroupId ?? null,
        name: m.name,
        slug: m.slug,
        active: m.active,
        brand: m.brand,
      })),
    };
  }

  async issues(deviceTypeId?: string) {
    const items = await this.prisma.deviceIssueType.findMany({
      where: (deviceTypeId ?? '').trim() ? { deviceTypeId: (deviceTypeId ?? '').trim() } : undefined,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return { items };
  }

  async createBrand(input: { deviceTypeId?: string | null; name: string; slug: string; active?: boolean }) {
    const name = this.normalizeCatalogName(input.name);
    const deviceTypeId = this.nullableId(input.deviceTypeId);
    const existing = await this.findEquivalentBrand(deviceTypeId, name);
    if (existing) {
      if ((input.active ?? true) && !existing.active) {
        return this.prisma.deviceBrand.update({ where: { id: existing.id }, data: { active: true } });
      }
      return existing;
    }
    const slug = await this.buildUniqueSlug('brand', this.normalizeCatalogSlug(input.slug || name));
    return this.prisma.deviceBrand.create({
      data: {
        deviceTypeId,
        name,
        slug,
        active: input.active ?? true,
      },
    });
  }

  async updateBrand(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    const current = await this.prisma.deviceBrand.findUnique({
      where: { id },
      select: { id: true, deviceTypeId: true, name: true, slug: true },
    });
    if (!current) throw new NotFoundException('Marca no encontrada');
    const nextTypeId = input.deviceTypeId !== undefined ? this.nullableId(input.deviceTypeId) : current.deviceTypeId ?? null;
    const nextName = input.name !== undefined ? this.normalizeCatalogName(input.name) : current.name;
    const duplicate = await this.findEquivalentBrand(nextTypeId, nextName, current.id);
    if (duplicate) {
      throw new BadRequestException(`Ya existe una marca equivalente en este tipo: "${duplicate.name}". Reutilizala o renombrala.`);
    }
    const nextSlug =
      input.slug !== undefined || input.name !== undefined
        ? await this.buildUniqueSlug('brand', this.normalizeCatalogSlug(input.slug ?? nextName), current.id)
        : undefined;
    return this.prisma.deviceBrand.update({
      where: { id },
      data: {
        ...(input.deviceTypeId !== undefined ? { deviceTypeId: nextTypeId } : {}),
        ...(input.name !== undefined ? { name: nextName } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
  }

  async createModel(input: { brandId: string; name: string; slug: string; active?: boolean }) {
    const name = this.normalizeCatalogName(input.name);
    const slug = this.normalizeCatalogSlug(input.slug || input.name);
    await this.ensureModelNameAvailable(input.brandId, name);
    return this.prisma.deviceModel.create({
      data: {
        brandId: input.brandId,
        name,
        slug,
        active: input.active ?? true,
      },
    });
  }

  async updateModel(id: string, input: { brandId?: string; name?: string; slug?: string; active?: boolean }) {
    const current = await this.prisma.deviceModel.findUnique({
      where: { id },
      select: { id: true, brandId: true, name: true, slug: true },
    });
    if (!current) throw new NotFoundException('Modelo no encontrado');

    const nextBrandId = input.brandId ?? current.brandId;
    const nextName = input.name !== undefined ? this.normalizeCatalogName(input.name) : current.name;
    if (input.name !== undefined || input.brandId !== undefined) {
      await this.ensureModelNameAvailable(nextBrandId, nextName, current.id);
    }

    const nextSlug = this.normalizeCatalogSlug(input.slug ?? nextName);
    return this.prisma.deviceModel.update({
      where: { id },
      data: {
        ...(input.brandId !== undefined ? { brandId: nextBrandId } : {}),
        ...(input.name !== undefined ? { name: nextName } : {}),
        ...(input.slug !== undefined || input.name !== undefined ? { slug: nextSlug } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
  }

  async createIssue(input: { deviceTypeId?: string | null; name: string; slug: string; iconSlot?: string | null; active?: boolean }) {
    const name = this.normalizeCatalogName(input.name);
    const deviceTypeId = this.nullableId(input.deviceTypeId);
    const iconSlot = this.normalizeIconSlot(input.iconSlot);
    const existing = await this.findEquivalentIssue(deviceTypeId, name);
    if (existing) {
      if ((input.active ?? true) && !existing.active) {
        return this.prisma.deviceIssueType.update({
          where: { id: existing.id },
          data: { active: true, ...(input.iconSlot !== undefined ? { iconSlot } : {}) },
        });
      }
      if (input.iconSlot !== undefined && iconSlot !== existing.iconSlot) {
        return this.prisma.deviceIssueType.update({ where: { id: existing.id }, data: { iconSlot } });
      }
      return existing;
    }
    const slug = await this.buildUniqueSlug('issue', this.normalizeCatalogSlug(input.slug || name));
    return this.prisma.deviceIssueType.create({
      data: {
        deviceTypeId,
        name,
        slug,
        iconSlot,
        active: input.active ?? true,
      },
    });
  }

  async updateIssue(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; iconSlot?: string | null; active?: boolean }) {
    const current = await this.prisma.deviceIssueType.findUnique({
      where: { id },
      select: { id: true, deviceTypeId: true, name: true, slug: true, iconSlot: true },
    });
    if (!current) throw new NotFoundException('Falla no encontrada');
    const nextTypeId = input.deviceTypeId !== undefined ? this.nullableId(input.deviceTypeId) : current.deviceTypeId ?? null;
    const nextName = input.name !== undefined ? this.normalizeCatalogName(input.name) : current.name;
    const duplicate = await this.findEquivalentIssue(nextTypeId, nextName, current.id);
    if (duplicate) {
      throw new BadRequestException(`Ya existe una falla equivalente en este tipo: "${duplicate.name}". Reutilizala o renombrala.`);
    }
    const nextSlug =
      input.slug !== undefined || input.name !== undefined
        ? await this.buildUniqueSlug('issue', this.normalizeCatalogSlug(input.slug ?? nextName), current.id)
        : undefined;
    return this.prisma.deviceIssueType.update({
      where: { id },
      data: {
        ...(input.deviceTypeId !== undefined ? { deviceTypeId: nextTypeId } : {}),
        ...(input.name != null ? { name: nextName } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(input.iconSlot !== undefined ? { iconSlot: this.normalizeIconSlot(input.iconSlot) } : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
  }

  async deleteBrand(id: string) {
    await this.ensureBrandCanBeDeleted(id);
    try {
      await this.prisma.deviceBrand.delete({ where: { id } });
    } catch (error) {
      this.rethrowDeleteError(error, 'marca');
    }
    return { ok: true };
  }

  async deleteModel(id: string) {
    await this.ensureModelCanBeDeleted(id);
    try {
      await this.prisma.deviceModel.delete({ where: { id } });
    } catch (error) {
      this.rethrowDeleteError(error, 'modelo');
    }
    return { ok: true };
  }

  async deleteIssue(id: string) {
    await this.ensureIssueCanBeDeleted(id);
    try {
      await this.prisma.deviceIssueType.delete({ where: { id } });
    } catch (error) {
      this.rethrowDeleteError(error, 'falla');
    }
    return { ok: true };
  }

  private nullableId(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private normalizeIconSlot(value?: string | null) {
    const normalized = normalizeRepairIssueIconSlot(value);
    if ((value ?? '').trim() && !normalized) {
      throw new BadRequestException('Icono de falla invalido');
    }
    return normalized;
  }

  private normalizeCatalogName(value: string) {
    return value.trim().toUpperCase();
  }

  private normalizeCatalogSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private compactCatalogValue(value: string) {
    return this.normalizeCatalogSlug(value).replace(/-/g, '');
  }

  private async findEquivalentBrand(deviceTypeId: string | null, name: string, ignoreId?: string) {
    const compact = this.compactCatalogValue(name);
    if (!compact) return null;
    const items = await this.prisma.deviceBrand.findMany({
      where: { deviceTypeId },
      select: { id: true, deviceTypeId: true, name: true, slug: true, active: true },
    });
    return (
      items.find((item) => {
        if (ignoreId && item.id === ignoreId) return false;
        return this.compactCatalogValue(item.name) === compact || this.compactCatalogValue(item.slug) === compact;
      }) ?? null
    );
  }

  private async findEquivalentIssue(deviceTypeId: string | null, name: string, ignoreId?: string) {
    const compact = this.compactCatalogValue(name);
    if (!compact) return null;
    const items = await this.prisma.deviceIssueType.findMany({
      where: { deviceTypeId },
      select: { id: true, deviceTypeId: true, name: true, slug: true, iconSlot: true, active: true },
    });
    return (
      items.find((item) => {
        if (ignoreId && item.id === ignoreId) return false;
        return this.compactCatalogValue(item.name) === compact || this.compactCatalogValue(item.slug) === compact;
      }) ?? null
    );
  }

  private async buildUniqueSlug(kind: 'brand' | 'issue', preferredSlug: string, ignoreId?: string) {
    const base = preferredSlug || kind;
    let slug = base;
    let suffix = 2;
    while (await this.slugExists(kind, slug, ignoreId)) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private async slugExists(kind: 'brand' | 'issue', slug: string, ignoreId?: string) {
    const item =
      kind === 'brand'
        ? await this.prisma.deviceBrand.findUnique({ where: { slug }, select: { id: true } })
        : await this.prisma.deviceIssueType.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(item && item.id !== ignoreId);
  }

  private async ensureModelNameAvailable(brandId: string, name: string, ignoreId?: string) {
    const normalizedName = this.normalizeCatalogSlug(name).replace(/-/g, '');
    const existingModels = await this.prisma.deviceModel.findMany({
      where: { brandId },
      select: { id: true, name: true, slug: true },
    });

    const duplicate = existingModels.find((item) => {
      if (ignoreId && item.id === ignoreId) return false;
      const normalizedItemName = this.normalizeCatalogSlug(item.name).replace(/-/g, '');
      const normalizedItemSlug = this.normalizeCatalogSlug(item.slug).replace(/-/g, '');
      return normalizedItemName === normalizedName || normalizedItemSlug === normalizedName;
    });

    if (duplicate) {
      throw new BadRequestException(
        `Ya existe un modelo equivalente dentro de esta marca: "${duplicate.name}". Reutilizalo o renombralo antes de crear otro.`,
      );
    }
  }

  private async ensureBrandCanBeDeleted(id: string) {
    const [repairsCount, rulesCount] = await Promise.all([
      this.prisma.repair.count({ where: { deviceBrandId: id } }),
      this.prisma.repairPricingRule.count({ where: { deviceBrandId: id } }),
    ]);

    if (repairsCount > 0 || rulesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar la marca porque ya esta en uso por reparaciones o reglas de precio. Desactivala si no queres usarla mas.',
      );
    }
  }

  private async ensureModelCanBeDeleted(id: string) {
    const [repairsCount, rulesCount] = await Promise.all([
      this.prisma.repair.count({ where: { deviceModelId: id } }),
      this.prisma.repairPricingRule.count({ where: { deviceModelId: id } }),
    ]);

    if (repairsCount > 0 || rulesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el modelo porque ya esta en uso por reparaciones o reglas de precio. Desactivalo si no queres usarlo mas.',
      );
    }
  }

  private async ensureIssueCanBeDeleted(id: string) {
    const [repairsCount, rulesCount] = await Promise.all([
      this.prisma.repair.count({ where: { deviceIssueTypeId: id } }),
      this.prisma.repairPricingRule.count({ where: { deviceIssueTypeId: id } }),
    ]);

    if (repairsCount > 0 || rulesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar la falla porque ya esta en uso por reparaciones o reglas de precio. Desactivala si no queres usarla mas.',
      );
    }
  }

  private rethrowDeleteError(error: unknown, entityLabel: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          `No se puede eliminar la ${entityLabel} porque todavia tiene relaciones activas. Desactivala o limpia esas relaciones primero.`,
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`${this.capitalize(entityLabel)} no encontrada`);
      }
    }
    throw error;
  }

  private capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type DeviceModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

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
        deviceModelGroupId: (m as any).deviceModelGroupId ?? null,
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
    return this.prisma.deviceBrand.create({
      data: {
        deviceTypeId: this.nullableId(input.deviceTypeId),
        name: input.name.trim(),
        slug: input.slug.trim(),
        active: input.active ?? true,
      },
    });
  }

  async updateBrand(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    return this.prisma.deviceBrand.update({
      where: { id },
      data: {
        ...(input.deviceTypeId !== undefined ? { deviceTypeId: this.nullableId(input.deviceTypeId) } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
  }

  async createModel(input: { brandId: string; name: string; slug: string; active?: boolean }) {
    const name = input.name.trim();
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
    const nextName = input.name !== undefined ? input.name.trim() : current.name;
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

  async createIssue(input: { deviceTypeId?: string | null; name: string; slug: string; active?: boolean }) {
    return this.prisma.deviceIssueType.create({
      data: {
        deviceTypeId: this.nullableId(input.deviceTypeId),
        name: input.name.trim(),
        slug: input.slug.trim(),
        active: input.active ?? true,
      },
    });
  }

  async updateIssue(id: string, input: { deviceTypeId?: string | null; name?: string; slug?: string; active?: boolean }) {
    return this.prisma.deviceIssueType.update({
      where: { id },
      data: {
        ...(input.deviceTypeId !== undefined ? { deviceTypeId: this.nullableId(input.deviceTypeId) } : {}),
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.slug != null ? { slug: input.slug.trim() } : {}),
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

  private normalizeCatalogSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

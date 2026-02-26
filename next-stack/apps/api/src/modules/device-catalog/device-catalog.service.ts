import { Inject, Injectable } from '@nestjs/common';
import type { DeviceModel } from '@prisma/client';
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
    return this.prisma.deviceModel.create({
      data: {
        brandId: input.brandId,
        name: input.name.trim(),
        slug: input.slug.trim(),
        active: input.active ?? true,
      },
    });
  }

  async updateModel(id: string, input: { brandId?: string; name?: string; slug?: string; active?: boolean }) {
    return this.prisma.deviceModel.update({
      where: { id },
      data: {
        ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
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
    await this.prisma.deviceBrand.delete({ where: { id } });
    return { ok: true };
  }

  async deleteModel(id: string) {
    await this.prisma.deviceModel.delete({ where: { id } });
    return { ok: true };
  }

  async deleteIssue(id: string) {
    await this.prisma.deviceIssueType.delete({ where: { id } });
    return { ok: true };
  }

  private nullableId(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }
}

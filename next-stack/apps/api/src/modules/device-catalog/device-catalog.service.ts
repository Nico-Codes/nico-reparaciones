import { Inject, Injectable } from '@nestjs/common';
import type { DeviceModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DeviceCatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async brands() {
    const items = await this.prisma.deviceBrand.findMany({
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
        name: m.name,
        slug: m.slug,
        active: m.active,
        brand: m.brand,
      })),
    };
  }

  async issues() {
    const items = await this.prisma.deviceIssueType.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return { items };
  }

  async createBrand(input: { name: string; slug: string; active?: boolean }) {
    return this.prisma.deviceBrand.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        active: input.active ?? true,
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

  async createIssue(input: { name: string; slug: string; active?: boolean }) {
    return this.prisma.deviceIssueType.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        active: input.active ?? true,
      },
    });
  }

  async updateIssue(id: string, input: { name?: string; slug?: string; active?: boolean }) {
    return this.prisma.deviceIssueType.update({
      where: { id },
      data: {
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
}

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';
import type { CategoryCreateInput, CategoryUpdateInput } from './catalog-admin.types.js';

@Injectable()
export class CatalogAdminCategoriesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CatalogAdminSupportService) private readonly support: CatalogAdminSupportService,
  ) {}

  async categories() {
    const items = await this.prisma.category.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        _count: { select: { products: true } },
      },
    });
    return {
      items: items.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        active: category.active,
        productsCount: category._count.products,
      })),
    };
  }

  async createCategory(input: CategoryCreateInput) {
    try {
      const item = await this.prisma.category.create({
        data: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          active: input.active ?? true,
        },
      });
      return { item };
    } catch (error) {
      this.support.rethrowCategoryWriteError(error);
    }
  }

  async updateCategory(id: string, input: CategoryUpdateInput) {
    try {
      const item = await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
        },
      });
      return { item };
    } catch (error) {
      this.support.rethrowCategoryWriteError(error);
    }
  }

  async deleteCategory(id: string) {
    const found = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { products: true } } },
    });
    if (!found) throw new NotFoundException('Categoria no encontrada');
    if (found._count.products > 0) {
      throw new BadRequestException('No se puede eliminar una categoria con productos asociados');
    }
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}

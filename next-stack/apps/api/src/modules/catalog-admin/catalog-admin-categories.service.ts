import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';
import type { CategoryCreateInput, CategoryUpdateInput, CategoryWithRelations } from './catalog-admin.types.js';

@Injectable()
export class CatalogAdminCategoriesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CatalogAdminSupportService) private readonly support: CatalogAdminSupportService,
  ) {}

  async categories() {
    const rows = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        active: true,
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ name: 'asc' }],
    });

    const directProductsCount = new Map(rows.map((row) => [row.id, row._count.products]));
    const childrenByParentId = new Map<string, CategoryWithRelations[]>();

    for (const row of rows as CategoryWithRelations[]) {
      if (!row.parentId) continue;
      const bucket = childrenByParentId.get(row.parentId) ?? [];
      bucket.push(row);
      childrenByParentId.set(row.parentId, bucket);
    }

    const roots = (rows as CategoryWithRelations[]).filter((row) => !row.parentId);
    const ordered: CategoryWithRelations[] = [];

    for (const root of roots) {
      ordered.push(root);
      const children = [...(childrenByParentId.get(root.id) ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name, 'es'),
      );
      ordered.push(...children);
    }

    return {
      items: ordered.map((category) => {
        const children = childrenByParentId.get(category.id) ?? [];
        const directCount = directProductsCount.get(category.id) ?? 0;
        const totalCount =
          directCount +
          children.reduce((sum, child) => sum + (directProductsCount.get(child.id) ?? 0), 0);

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
          parent: category.parent
            ? { id: category.parent.id, name: category.parent.name, slug: category.parent.slug }
            : null,
          depth: category.parentId ? 1 : 0,
          active: category.active,
          directProductsCount: directCount,
          totalProductsCount: totalCount,
          productsCount: totalCount,
          childrenCount: children.length,
          pathLabel: category.parent ? `${category.parent.name} / ${category.name}` : category.name,
        };
      }),
    };
  }

  async createCategory(input: CategoryCreateInput) {
    const parentId = await this.resolveParentId(input.parentId);
    try {
      const item = await this.prisma.category.create({
        data: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          parentId,
          active: input.active ?? true,
        },
      });
      return { item };
    } catch (error) {
      this.support.rethrowCategoryWriteError(error);
    }
  }

  async updateCategory(id: string, input: CategoryUpdateInput) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        parentId: true,
        _count: { select: { children: true } },
      },
    });
    if (!existing) throw new NotFoundException('Categoria no encontrada');

    const parentId =
      input.parentId !== undefined ? await this.resolveParentId(input.parentId, existing) : existing.parentId;

    try {
      const item = await this.prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
          ...(input.parentId !== undefined ? { parentId } : {}),
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
      select: { id: true, _count: { select: { products: true, children: true } } },
    });
    if (!found) throw new NotFoundException('Categoria no encontrada');
    if (found._count.products > 0) {
      throw new BadRequestException('No se puede eliminar una categoria con productos asociados');
    }
    if (found._count.children > 0) {
      throw new BadRequestException('No se puede eliminar una categoria con subcategorias asociadas');
    }
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private async resolveParentId(
    parentIdRaw?: string | null,
    current?: { id: string; parentId: string | null; _count: { children: number } },
  ) {
    const parentId = this.support.nullable(parentIdRaw);
    if (!parentId) return null;
    if (current && parentId === current.id) {
      throw new BadRequestException('Una categoria no puede ser su propia categoria padre');
    }

    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true },
    });
    if (!parent) {
      throw new BadRequestException('Categoria padre invalida');
    }
    if (parent.parentId) {
      throw new BadRequestException('Solo se permite un nivel de subcategoria');
    }
    if (current && current._count.children > 0) {
      throw new BadRequestException('Una categoria con subcategorias no puede pasar a ser subcategoria');
    }

    return parent.id;
  }
}

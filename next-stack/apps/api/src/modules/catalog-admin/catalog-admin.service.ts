import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type ProductListParams = {
  q?: string;
  categoryId?: string;
  active?: string;
};

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: { select: { id: true; name: true; slug: true } } };
}>;

@Injectable()
export class CatalogAdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        active: c.active,
        productsCount: c._count.products,
      })),
    };
  }

  async createCategory(input: { name: string; slug: string; active?: boolean }) {
    const item = await this.prisma.category.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        active: input.active ?? true,
      },
    });
    return { item };
  }

  async updateCategory(id: string, input: { name?: string; slug?: string; active?: boolean }) {
    const item = await this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return { item };
  }

  async products(params?: ProductListParams) {
    const q = (params?.q ?? '').trim();
    const categoryId = (params?.categoryId ?? '').trim();
    const activeFilter = (params?.active ?? '').trim().toLowerCase();
    const where: any = {
      ...(categoryId ? { categoryId } : {}),
      ...(activeFilter === '1' ? { active: true } : activeFilter === '0' ? { active: false } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { barcode: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const items = await this.prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
    });
    return {
      items: items.map((p) => this.serializeProduct(p)),
    };
  }

  async createProduct(input: {
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    costPrice?: number | null;
    stock?: number;
    active?: boolean;
    featured?: boolean;
    sku?: string | null;
    barcode?: string | null;
    categoryId?: string | null;
  }) {
    const data: Prisma.ProductUncheckedCreateInput = {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: this.nullable(input.description),
      price: new Prisma.Decimal(Number(input.price ?? 0)),
      costPrice: input.costPrice == null ? null : new Prisma.Decimal(Number(input.costPrice)),
      stock: Math.max(0, Math.trunc(input.stock ?? 0)),
      active: input.active ?? true,
      featured: input.featured ?? false,
      sku: this.nullable(input.sku),
      barcode: this.nullable(input.barcode),
      categoryId: this.nullable(input.categoryId),
    };
    const item = await this.prisma.product.create({
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return { item: this.serializeProduct(item) };
  }

  async updateProduct(id: string, input: {
    name?: string;
    slug?: string;
    description?: string | null;
    price?: number;
    costPrice?: number | null;
    stock?: number;
    active?: boolean;
    featured?: boolean;
    sku?: string | null;
    barcode?: string | null;
    categoryId?: string | null;
  }) {
    const existing = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) data.slug = input.slug.trim();
    if (input.description !== undefined) data.description = this.nullable(input.description);
    if (input.price !== undefined) data.price = new Prisma.Decimal(Number(input.price ?? 0));
    if (input.costPrice !== undefined) data.costPrice = input.costPrice == null ? null : new Prisma.Decimal(Number(input.costPrice));
    if (input.stock !== undefined) data.stock = Math.max(0, Math.trunc(input.stock ?? 0));
    if (input.active !== undefined) data.active = input.active;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.sku !== undefined) data.sku = this.nullable(input.sku);
    if (input.barcode !== undefined) data.barcode = this.nullable(input.barcode);
    if (input.categoryId !== undefined) data.categoryId = this.nullable(input.categoryId);

    const item = await this.prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return { item: this.serializeProduct(item) };
  }

  private nullable(v?: string | null) {
    const x = (v ?? '').trim();
    return x || null;
  }

  private serializeProduct(p: ProductWithCategory) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      price: Number(p.price),
      costPrice: p.costPrice != null ? Number(p.costPrice) : null,
      stock: p.stock,
      active: p.active,
      featured: p.featured,
      sku: p.sku ?? null,
      barcode: p.barcode ?? null,
      categoryId: p.categoryId ?? null,
      category: p.category ?? null,
      createdAt: p.createdAt?.toISOString?.() ?? null,
      updatedAt: p.updatedAt?.toISOString?.() ?? null,
    };
  }
}

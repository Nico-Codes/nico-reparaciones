import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type ListProductsParams = {
  q?: string;
  category?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  pageSize?: number;
};

@Injectable()
export class StoreService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories() {
    try {
      const categories = await this.prisma.category.findMany({
        where: { active: true },
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: {
                where: { active: true },
              },
            },
          },
        },
      });

      return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productsCount: c._count.products,
      }));
    } catch {
      return [];
    }
  }

  async listProducts(params: ListProductsParams) {
    const q = (params.q ?? '').trim();
    const categorySlug = (params.category ?? '').trim();
    const sort = params.sort ?? 'relevance';
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 24));
    const skip = (page - 1) * pageSize;

    try {
      const where = {
        active: true,
        ...(categorySlug
          ? {
              category: {
                is: {
                  slug: categorySlug,
                  active: true,
                },
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { slug: { contains: q, mode: 'insensitive' as const } },
                { description: { contains: q, mode: 'insensitive' as const } },
                { sku: { contains: q, mode: 'insensitive' as const } },
                { barcode: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [itemsRaw, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: this.orderBy(sort),
        }),
        this.prisma.product.count({ where }),
      ]);

      let items = itemsRaw.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imagePath: p.imagePath,
        imageLegacy: p.imageLegacy,
        imageUrl: this.resolveProductImageUrl(p.imagePath, p.imageLegacy),
        price: Number(p.price),
        stock: p.stock,
        featured: p.featured,
        active: p.active,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        createdAt: p.createdAt.toISOString(),
      }));

      // Relevancia básica por texto para UX más natural (sin full-text todavía).
      if (sort === 'relevance' && q) {
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        items = items
          .map((item) => ({
            ...item,
            _score: this.relevanceScore(item, terms),
            _featuredWeight: item.featured ? 5 : 0,
          }))
          .sort((a, b) => b._score - a._score || b._featuredWeight - a._featuredWeight || a.price - b.price)
          .map(({ _score: _s, _featuredWeight: _fw, ...rest }) => rest);
      }

      return {
        items,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          q,
          category: categorySlug || null,
          sort,
        },
      };
    } catch {
      return {
        items: [],
        meta: {
          total: 0,
          page,
          pageSize,
          totalPages: 1,
          q,
          category: categorySlug || null,
          sort,
        },
      };
    }
  }

  async getProductBySlug(slug: string) {
    try {
      const p = await this.prisma.product.findFirst({
        where: {
          slug,
          active: true,
          ...(slug ? {} : { id: '__never__' }),
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!p) return null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        imagePath: p.imagePath,
        imageLegacy: p.imageLegacy,
        imageUrl: this.resolveProductImageUrl(p.imagePath, p.imageLegacy),
        price: Number(p.price),
        stock: p.stock,
        featured: p.featured,
        active: p.active,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        createdAt: p.createdAt.toISOString(),
      };
    } catch {
      return null;
    }
  }

  private resolveProductImageUrl(imagePath?: string | null, imageLegacy?: string | null) {
    const base = (process.env.STORE_IMAGE_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

    if (imagePath && imagePath.trim() !== '') {
      const path = imagePath.replace(/^\/+/, '');
      return `${base}/storage/${path}`;
    }

    if (imageLegacy && imageLegacy.trim() !== '') {
      if (/^https?:\/\//i.test(imageLegacy)) return imageLegacy;
      const raw = imageLegacy.replace(/^\/+/, '');
      const path = raw.includes('/') ? raw : `products/${raw}`;
      return `${base}/storage/${path}`;
    }

    return null;
  }

  private orderBy(sort: NonNullable<ListProductsParams['sort']>) {
    if (sort === 'price_asc') return [{ price: 'asc' as const }, { createdAt: 'desc' as const }];
    if (sort === 'price_desc') return [{ price: 'desc' as const }, { createdAt: 'desc' as const }];
    if (sort === 'newest') return [{ createdAt: 'desc' as const }];
    return [{ featured: 'desc' as const }, { createdAt: 'desc' as const }];
  }

  private relevanceScore(
    item: {
      name: string;
      slug: string;
      description: string | null;
      sku: string | null;
      barcode: string | null;
      featured: boolean;
      price: number;
    },
    terms: string[],
  ) {
    const name = item.name.toLowerCase();
    const slug = item.slug.toLowerCase();
    const description = (item.description ?? '').toLowerCase();
    const sku = (item.sku ?? '').toLowerCase();
    const barcode = (item.barcode ?? '').toLowerCase();

    let score = 0;
    for (const t of terms) {
      if (name === t) score += 50;
      if (name.includes(t)) score += 20;
      if (slug.includes(t)) score += 12;
      if (description.includes(t)) score += 6;
      if (sku.includes(t)) score += 15;
      if (barcode.includes(t)) score += 15;
    }

    const featuredWeight = item.featured ? 5 : 0;
    return score + featuredWeight;
  }
}

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ProductPricingRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type ProductListParams = {
  q?: string;
  categoryId?: string;
  active?: string;
};

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: { select: { id: true; name: true; slug: true } } };
}>;

type ProductPricingRuleWithRelations = Prisma.ProductPricingRuleGetPayload<{
  include: {
    category: { select: { id: true; name: true } };
    product: { select: { id: true; name: true } };
  };
}>;

type ResolveProductPricingInput = {
  categoryId: string;
  costPrice: number;
  productId?: string | null;
};

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
    const where: Prisma.ProductWhereInput = {
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

  async product(id: string) {
    const item = await this.prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundException('Producto no encontrado');
    return { item: this.serializeProduct(item) };
  }

  async createProduct(input: {
    name: string;
    slug: string;
    description?: string | null;
    price?: number | null;
    costPrice?: number | null;
    stock?: number;
    active?: boolean;
    featured?: boolean;
    sku?: string | null;
    barcode?: string | null;
    categoryId?: string | null;
  }) {
    const categoryId = this.nullable(input.categoryId);
    const costPrice = input.costPrice == null ? null : Math.max(0, Number(input.costPrice));
    let salePrice = input.price == null ? null : Math.max(0, Number(input.price));

    if (salePrice == null) {
      if (categoryId && costPrice != null) {
        const resolved = await this.resolveRecommendedProductPrice({
          categoryId,
          costPrice,
          productId: null,
        });
        salePrice = resolved.recommendedPrice;
      } else if (costPrice != null) {
        salePrice = costPrice;
      } else {
        salePrice = 0;
      }
    }

    await this.assertProductMarginGuard(costPrice ?? 0, salePrice);

    const data: Prisma.ProductUncheckedCreateInput = {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: this.nullable(input.description),
      price: new Prisma.Decimal(salePrice),
      costPrice: costPrice == null ? null : new Prisma.Decimal(costPrice),
      stock: Math.max(0, Math.trunc(input.stock ?? 0)),
      active: input.active ?? true,
      featured: input.featured ?? false,
      sku: this.nullable(input.sku),
      barcode: this.nullable(input.barcode),
      categoryId,
    };
    const item = await this.prisma.product.create({
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return { item: this.serializeProduct(item) };
  }

  async updateProduct(
    id: string,
    input: {
      name?: string;
      slug?: string;
      description?: string | null;
      price?: number | null;
      costPrice?: number | null;
      stock?: number;
      active?: boolean;
      featured?: boolean;
      sku?: string | null;
      barcode?: string | null;
      categoryId?: string | null;
    },
  ) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, price: true, costPrice: true, categoryId: true },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    const nextCategoryId = input.categoryId !== undefined ? this.nullable(input.categoryId) : existing.categoryId;
    const nextCostPrice =
      input.costPrice !== undefined
        ? input.costPrice == null
          ? null
          : Math.max(0, Number(input.costPrice))
        : existing.costPrice != null
          ? Number(existing.costPrice)
          : null;

    let nextPrice =
      input.price !== undefined
        ? input.price == null
          ? null
          : Math.max(0, Number(input.price))
        : Number(existing.price);

    if (input.price !== undefined && input.price == null) {
      if (nextCategoryId && nextCostPrice != null) {
        const resolved = await this.resolveRecommendedProductPrice({
          categoryId: nextCategoryId,
          costPrice: nextCostPrice,
          productId: existing.id,
        });
        nextPrice = resolved.recommendedPrice;
      } else if (nextCostPrice != null) {
        nextPrice = nextCostPrice;
      } else {
        nextPrice = Number(existing.price);
      }
    }

    await this.assertProductMarginGuard(nextCostPrice ?? 0, nextPrice ?? Number(existing.price));

    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) data.slug = input.slug.trim();
    if (input.description !== undefined) data.description = this.nullable(input.description);
    if (input.price !== undefined) data.price = new Prisma.Decimal(nextPrice ?? 0);
    if (input.costPrice !== undefined) data.costPrice = nextCostPrice == null ? null : new Prisma.Decimal(nextCostPrice);
    if (input.stock !== undefined) data.stock = Math.max(0, Math.trunc(input.stock ?? 0));
    if (input.active !== undefined) data.active = input.active;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.sku !== undefined) data.sku = this.nullable(input.sku);
    if (input.barcode !== undefined) data.barcode = this.nullable(input.barcode);
    if (input.categoryId !== undefined) data.categoryId = nextCategoryId;

    const item = await this.prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return { item: this.serializeProduct(item) };
  }

  async productPricingSettings() {
    const settings = await this.resolveProductPricingSettings();
    return settings;
  }

  async updateProductPricingSettings(input: { defaultMarginPercent: number; preventNegativeMargin: boolean }) {
    const defaultMarginPercent = this.clampNumber(input.defaultMarginPercent, 0, 500, 35);
    const preventNegativeMargin = Boolean(input.preventNegativeMargin);

    await Promise.all([
      this.upsertSingleSetting(
        'product_default_margin_percent',
        String(defaultMarginPercent),
        'product_pricing',
        'Margen por defecto productos',
        'number',
      ),
      this.upsertSingleSetting(
        'product_prevent_negative_margin',
        preventNegativeMargin ? '1' : '0',
        'product_pricing',
        'Bloquear margen negativo',
        'boolean',
      ),
      this.upsertSingleSetting(
        'product_pricing.default_margin',
        String(defaultMarginPercent),
        'product_pricing',
        'Default product margin',
        'number',
      ),
      this.upsertSingleSetting(
        'product_pricing.block_negative_margin',
        preventNegativeMargin ? '1' : '0',
        'product_pricing',
        'Block negative margin',
        'boolean',
      ),
    ]);

    return this.productPricingSettings();
  }

  async productPricingRules() {
    await this.ensureProductPricingRulesMigratedFromLegacySetting();
    const items = await this.prisma.productPricingRule.findMany({
      include: {
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: [{ active: 'desc' }, { priority: 'desc' }, { id: 'asc' }],
    });
    return { items: items.map((r) => this.serializeProductPricingRule(r)) };
  }

  async createProductPricingRule(input: {
    name: string;
    categoryId?: string | null;
    productId?: string | null;
    costMin?: number | null;
    costMax?: number | null;
    marginPercent: number;
    priority?: number;
    active?: boolean;
  }) {
    await this.ensureProductPricingRulesMigratedFromLegacySetting();
    this.assertValidCostRange(input.costMin, input.costMax);
    const created = await this.prisma.productPricingRule.create({
      data: {
        name: input.name.trim(),
        categoryId: this.nullable(input.categoryId),
        productId: this.nullable(input.productId),
        costMin: input.costMin == null ? null : Math.max(0, Math.trunc(input.costMin)),
        costMax: input.costMax == null ? null : Math.max(0, Math.trunc(input.costMax)),
        marginPercent: new Prisma.Decimal(this.clampNumber(input.marginPercent, 0, 500, 0)),
        priority: Math.trunc(input.priority ?? 0),
        active: input.active ?? true,
      },
      include: {
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });
    return { item: this.serializeProductPricingRule(created) };
  }

  async updateProductPricingRule(
    id: string,
    input: Partial<{
      name: string;
      categoryId?: string | null;
      productId?: string | null;
      costMin?: number | null;
      costMax?: number | null;
      marginPercent: number;
      priority?: number;
      active?: boolean;
    }>,
  ) {
    const existing = await this.prisma.productPricingRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Regla de producto no encontrada');

    const costMin = input.costMin !== undefined ? input.costMin : existing.costMin;
    const costMax = input.costMax !== undefined ? input.costMax : existing.costMax;
    this.assertValidCostRange(costMin, costMax);

    const updated = await this.prisma.productPricingRule.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.categoryId !== undefined ? { categoryId: this.nullable(input.categoryId) } : {}),
        ...(input.productId !== undefined ? { productId: this.nullable(input.productId) } : {}),
        ...(input.costMin !== undefined ? { costMin: input.costMin == null ? null : Math.max(0, Math.trunc(input.costMin)) } : {}),
        ...(input.costMax !== undefined ? { costMax: input.costMax == null ? null : Math.max(0, Math.trunc(input.costMax)) } : {}),
        ...(input.marginPercent !== undefined ? { marginPercent: new Prisma.Decimal(this.clampNumber(input.marginPercent, 0, 500, 0)) } : {}),
        ...(input.priority !== undefined ? { priority: Math.trunc(input.priority) } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    });
    return { item: this.serializeProductPricingRule(updated) };
  }

  async deleteProductPricingRule(id: string) {
    await this.prisma.productPricingRule.delete({ where: { id } });
    return { ok: true };
  }

  async resolveRecommendedProductPrice(input: ResolveProductPricingInput) {
    await this.ensureProductPricingRulesMigratedFromLegacySetting();
    const categoryId = this.nullable(input.categoryId);
    if (!categoryId) throw new BadRequestException('Categoria requerida');
    const costPrice = Math.max(0, Math.trunc(Number(input.costPrice ?? 0)));
    const productId = this.nullable(input.productId);

    const settings = await this.resolveProductPricingSettings();

    const rules = await this.prisma.productPricingRule.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ categoryId: null }, { categoryId }] },
          productId ? { OR: [{ productId: null }, { productId }] } : { productId: null },
          { OR: [{ costMin: null }, { costMin: { lte: costPrice } }] },
          { OR: [{ costMax: null }, { costMax: { gte: costPrice } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });

    let best: ProductPricingRule | null = null;
    let bestScore = -1;
    let bestPriority = -999999;
    for (const rule of rules) {
      const score = this.productPricingRuleScore(rule);
      if (score > bestScore || (score === bestScore && rule.priority > bestPriority)) {
        best = rule;
        bestScore = score;
        bestPriority = rule.priority;
      }
    }

    const marginPercent = best ? Number(best.marginPercent) : settings.defaultMarginPercent;
    const recommendedPrice = Math.max(0, Math.round(costPrice * (1 + marginPercent / 100)));

    return {
      ok: true,
      recommendedPrice,
      marginPercent,
      rule: best ? { id: best.id, name: best.name } : null,
    };
  }

  private productPricingRuleScore(rule: ProductPricingRule) {
    let score = 0;
    if (rule.productId != null) score += 8;
    if (rule.categoryId != null) score += 4;
    if (rule.costMin != null) score += 2;
    if (rule.costMax != null) score += 1;
    return score;
  }

  private async resolveProductPricingSettings() {
    const defaultMarginRaw = await this.getSettingFirst(
      ['product_default_margin_percent', 'product_pricing.default_margin'],
      '35',
    );
    const preventNegativeRaw = await this.getSettingFirst(
      ['product_prevent_negative_margin', 'product_pricing.block_negative_margin'],
      '1',
    );
    const defaultMargin = this.clampNumber(Number(defaultMarginRaw), 0, 500, 35);
    const preventNegativeMargin = preventNegativeRaw.trim() !== '0';
    return {
      defaultMarginPercent: defaultMargin,
      preventNegativeMargin,
    };
  }

  private async assertProductMarginGuard(costPrice: number, salePrice: number) {
    const settings = await this.resolveProductPricingSettings();
    if (!settings.preventNegativeMargin) return;
    if (salePrice < costPrice) {
      throw new BadRequestException(
        'El precio de venta no puede ser menor al costo (guard de margen activo).',
      );
    }
  }

  private async ensureProductPricingRulesMigratedFromLegacySetting() {
    const count = await this.prisma.productPricingRule.count();
    if (count > 0) return;

    const raw = await this.getSettingValue('product_pricing.rules');
    if (!raw) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const rows = parsed
      .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && !Array.isArray(r))
      .map((r) => ({
        name: String(r.name ?? '').trim(),
        categoryId: this.nullable(String(r.categoryId ?? '')),
        productId: this.nullable(String(r.productId ?? '')),
        costMin: this.parseNullableInt(r.minCost),
        costMax: this.parseNullableInt(r.maxCost),
        marginPercent: this.clampNumber(Number(r.marginPercent ?? 0), 0, 500, 0),
        priority: Math.trunc(Number(r.priority ?? 0)),
        active: Boolean(r.active ?? true),
      }))
      .filter((r) => r.name.length > 0);
    if (rows.length === 0) return;

    const categoryIds = Array.from(new Set(rows.map((r) => r.categoryId).filter((v): v is string => !!v)));
    const productIds = Array.from(new Set(rows.map((r) => r.productId).filter((v): v is string => !!v)));

    const [categories, products] = await Promise.all([
      categoryIds.length > 0
        ? this.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);
    const categorySet = new Set(categories.map((x) => x.id));
    const productSet = new Set(products.map((x) => x.id));

    await this.prisma.productPricingRule.createMany({
      data: rows
        .filter((r) => (r.categoryId == null || categorySet.has(r.categoryId)) && (r.productId == null || productSet.has(r.productId)))
        .filter((r) => r.costMin == null || r.costMax == null || r.costMax >= r.costMin)
        .map((r) => ({
          name: r.name,
          categoryId: r.categoryId,
          productId: r.productId,
          costMin: r.costMin,
          costMax: r.costMax,
          marginPercent: new Prisma.Decimal(r.marginPercent),
          priority: r.priority,
          active: r.active,
        })),
    });
  }

  private assertValidCostRange(costMin?: number | null, costMax?: number | null) {
    if (costMin == null || costMax == null) return;
    if (costMax < costMin) {
      throw new BadRequestException('Costo maximo debe ser mayor o igual al minimo.');
    }
  }

  private async getSettingValue(key: string) {
    const row = await this.prisma.appSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? null;
  }

  private async getSettingFirst(keys: string[], fallback: string) {
    for (const key of keys) {
      const value = await this.getSettingValue(key);
      if (value != null && value.trim().length > 0) return value;
    }
    return fallback;
  }

  private async upsertSingleSetting(key: string, value: string, group: string, label: string, type: string) {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value, group, label, type },
      update: { value, group, label, type },
    });
  }

  private parseNullableInt(value: unknown) {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.trunc(n));
  }

  private clampNumber(value: number, min: number, max: number, fallback: number) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
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

  private serializeProductPricingRule(rule: ProductPricingRuleWithRelations) {
    return {
      id: rule.id,
      name: rule.name,
      categoryId: rule.categoryId,
      productId: rule.productId,
      costMin: rule.costMin,
      costMax: rule.costMax,
      marginPercent: Number(rule.marginPercent),
      priority: rule.priority,
      active: rule.active,
      category: rule.category ? { id: rule.category.id, name: rule.category.name } : null,
      product: rule.product ? { id: rule.product.id, name: rule.product.name } : null,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}

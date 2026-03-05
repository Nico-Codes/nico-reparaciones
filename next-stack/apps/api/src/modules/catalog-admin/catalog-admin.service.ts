import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ProductPricingRule } from '@prisma/client';
import { existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';

type ProductListParams = {
  q?: string;
  categoryId?: string;
  active?: string;
};

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    supplier: { select: { id: true; name: true } };
  };
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
  private readonly productImageAllowedExts = ['jpg', 'jpeg', 'png', 'webp'] as const;
  private readonly productImageMaxKb = 4096;

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
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
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
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
    if (!item) throw new NotFoundException('Producto no encontrado');
    return { item: this.serializeProduct(item) };
  }

  async createProduct(input: {
    name: string;
    slug: string;
    description?: string | null;
    purchaseReference?: string | null;
    price?: number | null;
    costPrice?: number | null;
    stock?: number;
    active?: boolean;
    featured?: boolean;
    sku?: string | null;
    barcode?: string | null;
    supplierId?: string | null;
    categoryId?: string | null;
  }) {
    const categoryId = this.nullable(input.categoryId);
    const supplierId = await this.validateSupplierId(input.supplierId);
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
      purchaseReference: this.nullable(input.purchaseReference),
      price: new Prisma.Decimal(salePrice),
      costPrice: costPrice == null ? null : new Prisma.Decimal(costPrice),
      stock: Math.max(0, Math.trunc(input.stock ?? 0)),
      active: input.active ?? true,
      featured: input.featured ?? false,
      sku: this.nullable(input.sku),
      barcode: this.nullable(input.barcode),
      categoryId,
      supplierId,
    };
    const item = await this.prisma.product.create({
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
    return { item: this.serializeProduct(item) };
  }

  async updateProduct(
    id: string,
    input: {
      name?: string;
      slug?: string;
      description?: string | null;
      purchaseReference?: string | null;
      price?: number | null;
      costPrice?: number | null;
      stock?: number;
      active?: boolean;
      featured?: boolean;
      sku?: string | null;
      barcode?: string | null;
      supplierId?: string | null;
      categoryId?: string | null;
    },
  ) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, price: true, costPrice: true, categoryId: true, supplierId: true },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    const nextCategoryId = input.categoryId !== undefined ? this.nullable(input.categoryId) : existing.categoryId;
    const nextSupplierId = input.supplierId !== undefined ? await this.validateSupplierId(input.supplierId) : existing.supplierId;
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
    if (input.purchaseReference !== undefined) data.purchaseReference = this.nullable(input.purchaseReference);
    if (input.supplierId !== undefined) data.supplierId = nextSupplierId;
    if (input.categoryId !== undefined) data.categoryId = nextCategoryId;

    const item = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
    return { item: this.serializeProduct(item) };
  }

  async uploadProductImage(
    id: string,
    file: { originalname: string; mimetype: string; size: number; buffer?: Buffer | Uint8Array },
  ) {
    const ext = this.detectFileExt(file.originalname);
    if (!ext || !this.productImageAllowedExts.includes(ext as (typeof this.productImageAllowedExts)[number])) {
      throw new BadRequestException(`Formato no permitido. Permitidos: ${this.productImageAllowedExts.join(', ')}`);
    }
    if (!file.buffer || !Buffer.isBuffer(file.buffer)) throw new BadRequestException('Archivo invalido');
    if (file.size > this.productImageMaxKb * 1024) {
      throw new BadRequestException(`Archivo supera el máximo (${this.productImageMaxKb} KB)`);
    }

    const current = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, imagePath: true },
    });
    if (!current) throw new NotFoundException('Producto no encontrado');

    const publicRoot = this.resolveWebPublicDir();
    const relPath = `products/${id}-${Date.now().toString(36)}.${ext}`;
    const absPath = path.join(publicRoot, 'storage', ...relPath.split('/'));
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, file.buffer);

    if (current.imagePath) {
      await this.deleteLocalProductImage(publicRoot, current.imagePath);
    }

    const item = await this.prisma.product.update({
      where: { id },
      data: { imagePath: relPath },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return {
      item: this.serializeProduct(item),
      upload: {
        path: relPath,
        url: this.resolveProductImageUrl(relPath),
      },
    };
  }

  async removeProductImage(id: string) {
    const current = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
    });
    if (!current) throw new NotFoundException('Producto no encontrado');

    const publicRoot = this.resolveWebPublicDir();
    if (current.imagePath) {
      await this.deleteLocalProductImage(publicRoot, current.imagePath);
    }

    const item = await this.prisma.product.update({
      where: { id },
      data: { imagePath: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
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

  private assertValidCostRange(costMin?: number | null, costMax?: number | null) {
    if (costMin == null || costMax == null) return;
    if (costMax < costMin) {
      throw new BadRequestException('Costo máximo debe ser mayor o igual al mínimo.');
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

  private clampNumber(value: number, min: number, max: number, fallback: number) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  private async validateSupplierId(supplierIdRaw?: string | null) {
    const supplierId = this.nullable(supplierIdRaw);
    if (!supplierId) return null;
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) {
      throw new BadRequestException('Proveedor invalido');
    }
    return supplier.id;
  }

  private nullable(v?: string | null) {
    const x = (v ?? '').trim();
    return x || null;
  }

  private detectFileExt(filename: string) {
    const ext = path.extname(filename || '').replace('.', '').trim().toLowerCase();
    return ext || null;
  }

  private resolveWebPublicDir() {
    const cwd = process.cwd();
    const candidates = [
      path.resolve(cwd, 'apps/web/public'),
      path.resolve(cwd, '../web/public'),
      path.resolve(cwd, '../../apps/web/public'),
    ];
    const found = candidates.find((p) => existsSync(p));
    if (!found) throw new Error('No se pudo resolver apps/web/public');
    return found;
  }

  private normalizeLocalProductPath(rawPath?: string | null) {
    const raw = (rawPath ?? '').trim();
    if (!raw || /^https?:\/\//i.test(raw)) return null;

    let normalized = raw;
    if (normalized.startsWith('/')) normalized = normalized.replace(/^\/+/, '');
    if (normalized.startsWith('storage/')) normalized = normalized.slice('storage/'.length);
    if (normalized.startsWith('products/')) normalized = normalized.slice('products/'.length);

    if (!normalized || normalized.includes('..')) return null;
    return `products/${normalized}`;
  }

  private async deleteLocalProductImage(publicRoot: string, rawPath?: string | null) {
    const localPath = this.normalizeLocalProductPath(rawPath);
    if (!localPath) return;
    const absPath = path.join(publicRoot, 'storage', ...localPath.split('/'));
    try {
      await unlink(absPath);
    } catch {
      // ignore
    }
  }

  private resolveProductImageUrl(rawPath?: string | null) {
    const raw = (rawPath ?? '').trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    if (raw.startsWith('storage/')) return `/${raw}`;
    return `/storage/${raw.replace(/^\/+/, '')}`;
  }

  private serializeProduct(p: ProductWithRelations) {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      purchaseReference: p.purchaseReference ?? null,
      imagePath: p.imagePath ?? null,
      imageUrl: this.resolveProductImageUrl(p.imagePath ?? p.imageLegacy ?? null),
      price: Number(p.price),
      costPrice: p.costPrice != null ? Number(p.costPrice) : null,
      stock: p.stock,
      active: p.active,
      featured: p.featured,
      sku: p.sku ?? null,
      barcode: p.barcode ?? null,
      categoryId: p.categoryId ?? null,
      category: p.category ?? null,
      supplierId: p.supplierId ?? null,
      supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : null,
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

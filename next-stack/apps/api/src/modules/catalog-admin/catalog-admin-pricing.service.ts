import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type ProductPricingRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';
import type {
  ProductPricingRuleCreateInput,
  ProductPricingRuleUpdateInput,
  ProductPricingRuleWithRelations,
  ProductPricingSettingsInput,
  ResolveProductPricingInput,
} from './catalog-admin.types.js';

@Injectable()
export class CatalogAdminPricingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CatalogAdminSupportService) private readonly support: CatalogAdminSupportService,
  ) {}

  async productPricingSettings() {
    return this.resolveProductPricingSettings();
  }

  async updateProductPricingSettings(input: ProductPricingSettingsInput) {
    const defaultMarginPercent = this.support.clampNumber(input.defaultMarginPercent, 0, 500, 35);
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
    return { items: items.map((rule) => this.serializeProductPricingRule(rule)) };
  }

  async createProductPricingRule(input: ProductPricingRuleCreateInput) {
    this.assertValidCostRange(input.costMin, input.costMax);
    const created = await this.prisma.productPricingRule.create({
      data: {
        name: input.name.trim(),
        categoryId: this.support.nullable(input.categoryId),
        productId: this.support.nullable(input.productId),
        costMin: input.costMin == null ? null : Math.max(0, Math.trunc(input.costMin)),
        costMax: input.costMax == null ? null : Math.max(0, Math.trunc(input.costMax)),
        marginPercent: new Prisma.Decimal(this.support.clampNumber(input.marginPercent, 0, 500, 0)),
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

  async updateProductPricingRule(id: string, input: ProductPricingRuleUpdateInput) {
    const existing = await this.prisma.productPricingRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Regla de producto no encontrada');

    const costMin = input.costMin !== undefined ? input.costMin : existing.costMin;
    const costMax = input.costMax !== undefined ? input.costMax : existing.costMax;
    this.assertValidCostRange(costMin, costMax);

    const updated = await this.prisma.productPricingRule.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.categoryId !== undefined ? { categoryId: this.support.nullable(input.categoryId) } : {}),
        ...(input.productId !== undefined ? { productId: this.support.nullable(input.productId) } : {}),
        ...(input.costMin !== undefined ? { costMin: input.costMin == null ? null : Math.max(0, Math.trunc(input.costMin)) } : {}),
        ...(input.costMax !== undefined ? { costMax: input.costMax == null ? null : Math.max(0, Math.trunc(input.costMax)) } : {}),
        ...(input.marginPercent !== undefined
          ? { marginPercent: new Prisma.Decimal(this.support.clampNumber(input.marginPercent, 0, 500, 0)) }
          : {}),
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
    const categoryId = await this.support.validateCategoryId(input.categoryId);
    if (!categoryId) throw new BadRequestException('Categoria requerida');

    const costPrice = Math.max(0, Math.trunc(Number(input.costPrice ?? 0)));
    const productId = this.support.nullable(input.productId);
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

  async assertProductMarginGuard(costPrice: number, salePrice: number) {
    const settings = await this.resolveProductPricingSettings();
    if (!settings.preventNegativeMargin) return;
    if (salePrice < costPrice) {
      throw new BadRequestException('El precio de venta no puede ser menor al costo (guard de margen activo).');
    }
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
    const defaultMargin = this.support.clampNumber(Number(defaultMarginRaw), 0, 500, 35);
    const preventNegativeMargin = preventNegativeRaw.trim() !== '0';
    return {
      defaultMarginPercent: defaultMargin,
      preventNegativeMargin,
    };
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

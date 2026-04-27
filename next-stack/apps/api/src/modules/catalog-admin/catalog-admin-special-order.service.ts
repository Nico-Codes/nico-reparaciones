import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogAdminPricingService } from './catalog-admin-pricing.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';
import {
  buildSpecialOrderColorSourceKey,
  extractSpecialOrderColorLabel,
  googleSheetUrlToCsvExportUrl,
  normalizeSpecialOrderText,
  parseSpecialOrderListing,
  parseSpecialOrderColorCsv,
  resolveSpecialOrderPreviewStatus,
  slugifySpecialOrderLabel,
  type ExistingSpecialOrderSnapshot,
  type NextSpecialOrderSnapshot,
  type ParsedSpecialOrderColorRow,
  type ParsedSpecialOrderRow,
  type ParsedSpecialOrderSection,
  type SpecialOrderPreviewStatus,
} from './catalog-admin-special-order.helpers.js';
import type {
  SpecialOrderImportApplyInput,
  SpecialOrderImportPreviewInput,
  SpecialOrderProfileCreateInput,
  SpecialOrderProfileUpdateInput,
} from './catalog-admin.types.js';

type SectionCategoryMapEntry = {
  categoryId?: string | null;
  createCategoryName?: string | null;
};

type RememberedSpecialOrderSelections = {
  sectionKeys: string[];
  sourceKeys: string[];
};

type ResolvedSectionMapping = {
  sectionKey: string;
  sectionName: string;
  categoryId: string | null;
  categoryName: string | null;
  createCategoryName: string | null;
  willCreateCategory: boolean;
  mappingSource: 'input' | 'profile' | 'existing' | 'new';
};

type ExistingImportedProduct = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  price: number;
  costPrice: number | null;
  categoryId: string | null;
  supplierId: string | null;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
  sourcePriceUsd: number | null;
  specialOrderSourceKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: { id: string; name: string; slug: string } | null;
    pathLabel: string;
  } | null;
  colorVariants: ExistingColorVariant[];
};

type ExistingColorVariant = {
  id: string;
  label: string;
  normalizedLabel: string;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  active: boolean;
  sourceSheetRow: number | null;
  sourceSheetKey: string | null;
};

type ImportedColorSource = {
  kind: 'google_sheet' | 'csv';
  label: string;
  rawText: string;
};

type ColorPreviewItem = {
  rowId: string;
  rowNumber: number;
  sectionKey: string;
  sectionName: string;
  rawTitle: string;
  productSourceKey: string;
  productTitle: string;
  productRowId: string;
  label: string;
  normalizedLabel: string;
  sourceSheetKey: string;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  status: 'new' | 'availability_update' | 'unchanged';
  existingVariantId: string | null;
  included: boolean;
};

type ColorPreviewWarning = {
  rowId: string;
  rowNumber: number;
  sectionKey: string;
  sectionName: string;
  rawTitle: string;
  reason: string;
};

type ColorPreviewGroup = {
  productSourceKey: string;
  productTitle: string;
  productRowId: string;
  sectionKey: string;
  sectionName: string;
  items: ColorPreviewItem[];
};

type ColorPreviewResult = {
  enabled: boolean;
  sourceKind: 'google_sheet' | 'csv' | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  rowsParsed: number;
  matchedCount: number;
  unmatchedCount: number;
  outOfStockCount: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  deactivatedCount: number;
  items: ColorPreviewGroup[];
  warnings: ColorPreviewWarning[];
  deactivated: Array<{
    productId: string;
    productSourceKey: string;
    productTitle: string;
    variantId: string;
    label: string;
  }>;
};

@Injectable()
export class CatalogAdminSpecialOrderService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CatalogAdminSupportService) private readonly support: CatalogAdminSupportService,
    @Inject(CatalogAdminPricingService) private readonly pricingService: CatalogAdminPricingService,
  ) {}

  async profiles() {
    const items = await this.prisma.specialOrderImportProfile.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        batches: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, createdAt: true },
        },
      },
      orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
    });

    return {
      items: items.map((item) => this.serializeProfile(item)),
    };
  }

  async createProfile(input: SpecialOrderProfileCreateInput) {
    const supplierId = await this.support.validateSupplierId(input.supplierId);
    if (!supplierId) throw new BadRequestException('Proveedor requerido');

    try {
      const item = await this.prisma.specialOrderImportProfile.create({
        data: {
          supplierId,
          name: input.name.trim(),
          active: input.active ?? true,
          defaultUsdRate: this.decimal(this.clampDecimalInput(input.defaultUsdRate, 0, 999999, 0)),
          defaultShippingUsd: this.decimal(this.clampDecimalInput(input.defaultShippingUsd, 0, 999999, 0)),
          fallbackMarginPercent: this.decimal(this.clampDecimalInput(input.fallbackMarginPercent, 0, 500, 0)),
          defaultColorSheetUrl: this.support.nullable(input.defaultColorSheetUrl),
          rememberColorSheet: input.rememberColorSheet ?? false,
        },
        include: {
          supplier: { select: { id: true, name: true } },
          batches: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, createdAt: true },
          },
        },
      });
      return { item: this.serializeProfile(item) };
    } catch (error) {
      this.rethrowProfileWriteError(error);
    }
  }

  async updateProfile(id: string, input: SpecialOrderProfileUpdateInput) {
    const existing = await this.prisma.specialOrderImportProfile.findUnique({
      where: { id },
      select: { id: true, supplierId: true },
    });
    if (!existing) throw new NotFoundException('Perfil de encargue no encontrado');

    const supplierId =
      input.supplierId !== undefined ? await this.support.validateSupplierId(input.supplierId) : existing.supplierId;
    if (!supplierId) throw new BadRequestException('Proveedor requerido');

    try {
      const item = await this.prisma.specialOrderImportProfile.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.active !== undefined ? { active: input.active } : {}),
          ...(input.defaultUsdRate !== undefined
            ? { defaultUsdRate: this.decimal(this.clampDecimalInput(input.defaultUsdRate, 0, 999999, 0)) }
            : {}),
          ...(input.defaultShippingUsd !== undefined
            ? { defaultShippingUsd: this.decimal(this.clampDecimalInput(input.defaultShippingUsd, 0, 999999, 0)) }
            : {}),
          ...(input.fallbackMarginPercent !== undefined
            ? { fallbackMarginPercent: this.decimal(this.clampDecimalInput(input.fallbackMarginPercent, 0, 500, 0)) }
            : {}),
          ...(input.defaultColorSheetUrl !== undefined
            ? { defaultColorSheetUrl: this.support.nullable(input.defaultColorSheetUrl) }
            : {}),
          ...(input.rememberColorSheet !== undefined ? { rememberColorSheet: input.rememberColorSheet } : {}),
          ...(input.supplierId !== undefined ? { supplierId } : {}),
        },
        include: {
          supplier: { select: { id: true, name: true } },
          batches: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, createdAt: true },
          },
        },
      });
      return { item: this.serializeProfile(item) };
    } catch (error) {
      this.rethrowProfileWriteError(error);
    }
  }

  async previewImport(input: SpecialOrderImportPreviewInput) {
    return this.preparePreview(input);
  }

  async applyImport(input: SpecialOrderImportApplyInput) {
    const preview = await this.preparePreview(input);
    if (preview.blocked) {
      throw new BadRequestException('El preview tiene conflictos. Excluye filas conflictivas o corrige el listado antes de aplicar.');
    }

    const now = new Date();
    const includedItems = preview.items.filter((item) => item.included && item.status !== 'conflict');
    const missingItems = preview.missing;
    const includedColorItems = preview.colorImport.items.flatMap((group) => group.items.filter((item) => item.included));

    const applied = await this.prisma.$transaction(async (tx) => {
      const resolvedCategoryIds = new Map<string, string | null>();
      const persistedMapping: Record<string, SectionCategoryMapEntry> = {};

      for (const section of preview.sections) {
        let categoryId = section.categoryId;
        if (!categoryId && section.createCategoryName) {
          categoryId = await this.createCategoryIfMissing(tx, section.createCategoryName);
        }
        resolvedCategoryIds.set(section.sectionKey, categoryId ?? null);
        persistedMapping[section.sectionKey] = {
          categoryId: categoryId ?? null,
          createCategoryName: categoryId ? null : section.createCategoryName,
        };
      }

      for (const item of includedItems) {
        const categoryId = resolvedCategoryIds.get(item.sectionKey) ?? null;
        const payload: Prisma.ProductUncheckedUpdateInput = {
          name: item.title,
          price: this.decimal(item.nextPrice),
          costPrice: this.decimal(item.nextCostPrice),
          stock: 0,
          categoryId,
          supplierId: preview.profile.supplier.id,
          active: true,
          supplierAvailability: item.supplierAvailability,
          fulfillmentMode: 'SPECIAL_ORDER',
          specialOrderProfileId: preview.profile.id,
          specialOrderSourceKey: item.sourceKey,
          sourcePriceUsd: item.sourcePriceUsd == null ? null : this.decimal(item.sourcePriceUsd),
          lastImportedAt: now,
        };

        if (item.existingProductId) {
          await tx.product.update({
            where: { id: item.existingProductId },
            data: payload,
          });
          continue;
        }

        const slug = await this.buildUniqueProductSlug(tx, item.title);
        const created = await tx.product.create({
          data: {
            name: item.title,
            slug,
            description: null,
            purchaseReference: null,
            price: this.decimal(item.nextPrice),
            costPrice: this.decimal(item.nextCostPrice),
            stock: 0,
            active: true,
            featured: false,
            sku: null,
            barcode: null,
            categoryId,
            supplierId: preview.profile.supplier.id,
            supplierAvailability: item.supplierAvailability,
            fulfillmentMode: 'SPECIAL_ORDER',
            specialOrderProfileId: preview.profile.id,
            specialOrderSourceKey: item.sourceKey,
            sourcePriceUsd: item.sourcePriceUsd == null ? null : this.decimal(item.sourcePriceUsd),
            lastImportedAt: now,
          },
        });
        item.existingProductId = created.id;
      }

      if (preview.colorImport.enabled) {
        const productIdBySourceKey = new Map(
          includedItems
            .filter((item) => item.existingProductId)
            .map((item) => [item.sourceKey, item.existingProductId as string]),
        );

        for (const colorItem of includedColorItems) {
          const productId = productIdBySourceKey.get(colorItem.productSourceKey);
          if (!productId) continue;

          if (colorItem.existingVariantId) {
            await tx.productColorVariant.update({
              where: { id: colorItem.existingVariantId },
              data: {
                label: colorItem.label,
                normalizedLabel: colorItem.normalizedLabel,
                supplierAvailability: colorItem.supplierAvailability,
                active: true,
                lastImportedAt: now,
                sourceSheetRow: colorItem.rowNumber,
                sourceSheetKey: colorItem.sourceSheetKey,
              },
            });
            continue;
          }

          await tx.productColorVariant.create({
            data: {
              productId,
              label: colorItem.label,
              normalizedLabel: colorItem.normalizedLabel,
              supplierAvailability: colorItem.supplierAvailability,
              active: true,
              lastImportedAt: now,
              sourceSheetRow: colorItem.rowNumber,
              sourceSheetKey: colorItem.sourceSheetKey,
            },
          });
        }

        if (preview.colorImport.deactivated.length > 0) {
          await tx.productColorVariant.updateMany({
            where: { id: { in: preview.colorImport.deactivated.map((item) => item.variantId) } },
            data: {
              active: false,
              lastImportedAt: now,
            },
          });
        }
      }

      if (missingItems.length > 0) {
        await tx.product.updateMany({
          where: {
            id: { in: missingItems.map((item) => item.productId) },
            specialOrderProfileId: preview.profile.id,
            fulfillmentMode: 'SPECIAL_ORDER',
          },
          data: {
            active: false,
            lastImportedAt: now,
          },
        });
      }

      const profileUpdateData: Prisma.SpecialOrderImportProfileUncheckedUpdateInput = {
        sectionCategoryMapJson: JSON.stringify(persistedMapping),
      };
      if (input.rememberExclusions) {
        profileUpdateData.rememberedExcludedSectionKeysJson = this.stringifyStringArray(
          preview.selection.excludedSectionKeys,
        );
        profileUpdateData.rememberedExcludedSourceKeysJson = this.stringifyStringArray(
          preview.selection.excludedSourceKeys,
        );
      }
      if (preview.profile.rememberColorSheet && input.colorSheetUrl !== undefined) {
        profileUpdateData.defaultColorSheetUrl = this.support.nullable(input.colorSheetUrl);
      }

      await tx.specialOrderImportProfile.update({
        where: { id: preview.profile.id },
        data: profileUpdateData,
      });

      const batch = await tx.specialOrderImportBatch.create({
        data: {
          profileId: preview.profile.id,
          rawText: input.rawText,
          usdRate: this.decimal(preview.usdRate),
          shippingUsd: this.decimal(preview.shippingUsd),
          summaryJson: JSON.stringify({
            ...preview.summary,
            colorImport: {
              matchedCount: preview.colorImport.matchedCount,
              unmatchedCount: preview.colorImport.unmatchedCount,
              outOfStockCount: preview.colorImport.outOfStockCount,
              newCount: preview.colorImport.newCount,
              updatedCount: preview.colorImport.updatedCount,
              unchangedCount: preview.colorImport.unchangedCount,
              deactivatedCount: preview.colorImport.deactivatedCount,
            },
          }),
          createdBy: this.support.nullable(input.createdBy),
        },
      });

      return {
        batchId: batch.id,
      };
    });

    return {
      ok: true,
      batchId: applied.batchId,
      summary: preview.summary,
      item: {
        ...preview.profile,
        lastBatch: {
          id: applied.batchId,
          createdAt: now.toISOString(),
        },
      },
    };
  }

  private async preparePreview(input: SpecialOrderImportPreviewInput) {
    const profile = await this.prisma.specialOrderImportProfile.findUnique({
      where: { id: input.profileId },
      include: {
        supplier: { select: { id: true, name: true } },
        batches: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, createdAt: true },
        },
      },
    });
    if (!profile) throw new NotFoundException('Perfil de encargue no encontrado');

    const usdRate = this.clampDecimalInput(input.usdRate ?? Number(profile.defaultUsdRate), 0, 999999, Number(profile.defaultUsdRate));
    const shippingUsd = this.clampDecimalInput(
      input.shippingUsd ?? Number(profile.defaultShippingUsd),
      0,
      999999,
      Number(profile.defaultShippingUsd),
    );
    const colorSheetUrl =
      this.support.nullable(input.colorSheetUrl) ?? (profile.rememberColorSheet ? profile.defaultColorSheetUrl : null);
    const parsed = parseSpecialOrderListing(input.rawText ?? '');
    const colorSource = await this.resolveColorSource({
      colorSheetUrl,
      colorCsvText: input.colorCsvText,
    });
    const parsedColors = colorSource ? parseSpecialOrderColorCsv(colorSource.rawText) : null;
    const rememberedSelections = this.parseRememberedSelections(profile);
    const rememberedSectionKeys = new Set(rememberedSelections.sectionKeys);
    const rememberedSourceKeys = new Set(rememberedSelections.sourceKeys);
    const effectiveExcludedSectionKeys = new Set(
      input.excludedSectionKeys === undefined
        ? rememberedSelections.sectionKeys
        : this.normalizeStringArray(input.excludedSectionKeys),
    );
    const effectiveExcludedSourceKeys = new Set(
      input.excludedSourceKeys === undefined
        ? rememberedSelections.sourceKeys
        : this.normalizeStringArray(input.excludedSourceKeys),
    );
    const excludedRowIds = new Set((input.excludedRowIds ?? []).map((value) => value.trim()).filter(Boolean));

    const [categories, existingProducts] = await Promise.all([
      this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { specialOrderProfileId: profile.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, slug: true } },
            },
          },
          colorVariants: {
            orderBy: [{ active: 'desc' }, { label: 'asc' }],
          },
        },
        orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
      }),
    ]);

    const mappings = this.resolveSectionMappings({
      sections: parsed.sections,
      inputMappings: input.sectionMappings ?? [],
      profileMapJson: profile.sectionCategoryMapJson,
      categories,
    });

    const includedCounts = new Map<string, number>();
    for (const row of parsed.rows) {
      if (
        excludedRowIds.has(row.rowId) ||
        effectiveExcludedSectionKeys.has(row.sectionKey) ||
        effectiveExcludedSourceKeys.has(row.sourceKey)
      ) {
        continue;
      }
      includedCounts.set(row.sourceKey, (includedCounts.get(row.sourceKey) ?? 0) + 1);
    }

    const existingBySourceKey = new Map(
      existingProducts
        .filter((product) => product.specialOrderSourceKey)
        .map((product) => [product.specialOrderSourceKey as string, this.serializeExistingImportedProduct(product)]),
    );

    const items = await Promise.all(
      parsed.rows.map(async (row) => {
        const section = mappings.get(row.sectionKey);
        if (!section) {
          throw new BadRequestException(`No se pudo resolver la categoria para la seccion ${row.sectionName}`);
        }

        const excludedBySection = effectiveExcludedSectionKeys.has(row.sectionKey);
        const excludedBySource = effectiveExcludedSourceKeys.has(row.sourceKey);
        const excludedByRow = excludedRowIds.has(row.rowId);
        const included = !excludedBySection && !excludedBySource && !excludedByRow;
        const conflict = included && (includedCounts.get(row.sourceKey) ?? 0) > 1;
        const existing = existingBySourceKey.get(row.sourceKey) ?? null;
        const effectiveSourcePriceUsd = row.sourcePriceUsd ?? existing?.sourcePriceUsd ?? null;
        const pricing = await this.resolvePreviewPricing({
          categoryId: section.categoryId,
          sourcePriceUsd: effectiveSourcePriceUsd,
          usdRate,
          shippingUsd,
          fallbackMarginPercent: Number(profile.fallbackMarginPercent),
          existingProductId: existing?.id ?? null,
        });

        const nextSnapshot: NextSpecialOrderSnapshot = {
          sourcePriceUsd: effectiveSourcePriceUsd,
          price: pricing.finalPrice,
          costPrice: pricing.costArs,
          supplierAvailability: row.supplierAvailability,
          categoryId: section.categoryId,
          supplierId: profile.supplier.id,
        };

        const existingSnapshot: ExistingSpecialOrderSnapshot | null = existing
          ? {
              sourcePriceUsd: existing.sourcePriceUsd,
              price: existing.price,
              costPrice: existing.costPrice,
              supplierAvailability: existing.supplierAvailability,
              categoryId: existing.categoryId,
              supplierId: existing.supplierId,
              active: existing.active,
              fulfillmentMode: existing.fulfillmentMode,
            }
          : null;

        const resolvedStatus = resolveSpecialOrderPreviewStatus(existingSnapshot, nextSnapshot);
        const status: SpecialOrderPreviewStatus = conflict ? 'conflict' : resolvedStatus;

        return {
          rowId: row.rowId,
          lineNumber: row.lineNumber,
          included,
          excludedBySection,
          excludedBySource,
          excludedByRow,
          rememberedExcludedBySection: rememberedSectionKeys.has(row.sectionKey),
          rememberedExcludedBySource: rememberedSourceKeys.has(row.sourceKey),
          resolvedStatus,
          status,
          sourceKey: row.sourceKey,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          title: row.title,
          sourcePriceUsd: effectiveSourcePriceUsd,
          supplierAvailability: row.supplierAvailability,
          nextCostPrice: pricing.costArs,
          nextPrice: pricing.finalPrice,
          marginPercent: pricing.marginPercent,
          appliedRuleName: pricing.ruleName,
          categoryId: section.categoryId,
          categoryName: section.categoryName,
          createCategoryName: section.createCategoryName,
          willCreateCategory: section.willCreateCategory,
          mappingSource: section.mappingSource,
          existingProductId: existing?.id ?? null,
          existingProduct: existing
            ? {
                id: existing.id,
                name: existing.name,
                slug: existing.slug,
                active: existing.active,
                price: existing.price,
                costPrice: existing.costPrice,
                supplierAvailability: existing.supplierAvailability,
                category: existing.category,
              }
            : null,
        };
      }),
    );

    const includedSourceKeys = new Set(items.filter((item) => item.included).map((item) => item.sourceKey));
    const missing = existingProducts
      .filter((product) => {
        const sourceKey = product.specialOrderSourceKey ?? '';
        return sourceKey && !includedSourceKeys.has(sourceKey) && product.fulfillmentMode === 'SPECIAL_ORDER' && product.specialOrderProfileId === profile.id && product.active;
      })
      .map((product) => ({
        rowId: `missing:${product.id}`,
        productId: product.id,
        sourceKey: product.specialOrderSourceKey ?? '',
        title: product.name,
        status: 'missing_deactivate' as const,
        categoryName: product.category
          ? product.category.parent
            ? `${product.category.parent.name} / ${product.category.name}`
            : product.category.name
          : null,
      }));

    const colorImport = this.buildColorPreview({
      colorSource,
      parsedColors,
      items,
      existingProducts: Array.from(existingBySourceKey.values()),
    });

    const summary = {
      newCount: items.filter((item) => item.included && item.status === 'new').length,
      priceUpdatedCount: items.filter((item) => item.included && item.status === 'price_update').length,
      availabilityUpdatedCount: items.filter((item) => item.included && item.status === 'availability_update').length,
      unchangedCount: items.filter((item) => item.included && item.status === 'unchanged').length,
      conflictCount: items.filter((item) => item.included && item.status === 'conflict').length,
      supplierOutOfStockCount: items.filter((item) => item.included && item.supplierAvailability === 'OUT_OF_STOCK').length,
      deactivatedCount: missing.length,
      updatedCount: items.filter((item) => item.included && (item.status === 'price_update' || item.status === 'availability_update')).length,
      parsedCount: parsed.rows.length,
      includedCount: items.filter((item) => item.included).length,
      excludedCount: items.filter((item) => !item.included).length,
    };

    return {
      profile: this.serializeProfile(profile),
      usdRate,
      shippingUsd,
      blocked: summary.conflictCount > 0,
      selection: {
        excludedSectionKeys: Array.from(effectiveExcludedSectionKeys),
        excludedSourceKeys: Array.from(effectiveExcludedSourceKeys),
        excludedRowIds: Array.from(excludedRowIds),
        rememberedSectionKeys: rememberedSelections.sectionKeys,
        rememberedSourceKeys: rememberedSelections.sourceKeys,
      },
      sections: Array.from(mappings.values()).map((section) => ({
        ...section,
        included: !effectiveExcludedSectionKeys.has(section.sectionKey),
        rememberedExcluded: rememberedSectionKeys.has(section.sectionKey),
      })),
      items,
      colorImport,
      missing,
      summary,
    };
  }

  private resolveSectionMappings(input: {
    sections: ParsedSpecialOrderSection[];
    inputMappings: Array<{ sectionKey: string; categoryId?: string | null; createCategoryName?: string | null }>;
    profileMapJson?: string | null;
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      parent: { id: string; name: string; slug: string } | null;
    }>;
  }) {
    const inputMappings = new Map(
      input.inputMappings
        .map((entry) => ({
          sectionKey: entry.sectionKey.trim(),
          categoryId: this.support.nullable(entry.categoryId),
          createCategoryName: this.support.nullable(entry.createCategoryName),
        }))
        .filter((entry) => entry.sectionKey)
        .map((entry) => [entry.sectionKey, entry]),
    );
    const storedMap = this.parseSectionMap(input.profileMapJson);
    const categoriesById = new Map(input.categories.map((category) => [category.id, category]));
    const categoriesBySlug = new Map(input.categories.map((category) => [category.slug, category]));
    const categoriesByName = new Map(
      input.categories.map((category) => [slugifySpecialOrderLabel(category.name), category]),
    );

    const resolved = new Map<string, ResolvedSectionMapping>();

    for (const section of input.sections) {
      const inputEntry = inputMappings.get(section.sectionKey);
      const storedEntry = storedMap[section.sectionKey];
      const matchedExisting =
        categoriesBySlug.get(section.sectionKey) ??
        categoriesByName.get(section.sectionKey) ??
        null;

      const entrySource: ResolvedSectionMapping['mappingSource'] = inputEntry
        ? 'input'
        : storedEntry
          ? 'profile'
          : matchedExisting
            ? 'existing'
            : 'new';

      const referencedCategoryId =
        inputEntry?.categoryId ??
        storedEntry?.categoryId ??
        matchedExisting?.id ??
        null;
      const referencedCategory = referencedCategoryId ? categoriesById.get(referencedCategoryId) ?? null : null;
      const createCategoryName =
        this.support.nullable(inputEntry?.createCategoryName) ??
        this.support.nullable(storedEntry?.createCategoryName) ??
        (referencedCategory ? null : section.sectionName);

      resolved.set(section.sectionKey, {
        sectionKey: section.sectionKey,
        sectionName: section.sectionName,
        categoryId: referencedCategory?.id ?? null,
        categoryName: referencedCategory
          ? referencedCategory.parent
            ? `${referencedCategory.parent.name} / ${referencedCategory.name}`
            : referencedCategory.name
          : createCategoryName ?? section.sectionName,
        createCategoryName,
        willCreateCategory: !referencedCategory && Boolean(createCategoryName),
        mappingSource: entrySource,
      });
    }

    return resolved;
  }

  private async resolvePreviewPricing(input: {
    categoryId: string | null;
    sourcePriceUsd: number | null;
    usdRate: number;
    shippingUsd: number;
    fallbackMarginPercent: number;
    existingProductId: string | null;
  }) {
    const costArs = Math.max(0, Math.round((input.sourcePriceUsd ?? 0) * input.usdRate));
    const shippingArs = Math.max(0, Math.round(input.shippingUsd * input.usdRate));

    if (!input.categoryId) {
      const fallbackPrice = Math.max(0, Math.round(costArs * (1 + input.fallbackMarginPercent / 100) + shippingArs));
      return {
        costArs,
        finalPrice: fallbackPrice,
        marginPercent: input.fallbackMarginPercent,
        ruleName: null,
      };
    }

    const resolved = await this.pricingService.resolveRecommendedProductPrice({
      categoryId: input.categoryId,
      costPrice: costArs,
      productId: input.existingProductId,
    });

    if (resolved.rule) {
      return {
        costArs,
        finalPrice: Math.max(0, Math.round(resolved.recommendedPrice + shippingArs)),
        marginPercent: resolved.marginPercent,
        ruleName: resolved.rule.name,
      };
    }

    return {
      costArs,
      finalPrice: Math.max(0, Math.round(costArs * (1 + input.fallbackMarginPercent / 100) + shippingArs)),
      marginPercent: input.fallbackMarginPercent,
      ruleName: null,
    };
  }

  private serializeProfile(profile: {
    id: string;
    name: string;
    active: boolean;
    defaultUsdRate: Prisma.Decimal | number;
    defaultShippingUsd: Prisma.Decimal | number;
    fallbackMarginPercent: Prisma.Decimal | number;
    defaultColorSheetUrl?: string | null;
    rememberColorSheet?: boolean;
    supplier: { id: string; name: string };
    createdAt: Date;
    updatedAt: Date;
    batches?: Array<{ id: string; createdAt: Date }>;
  }) {
    return {
      id: profile.id,
      name: profile.name,
      active: profile.active,
      supplier: profile.supplier,
      defaultUsdRate: Number(profile.defaultUsdRate),
      defaultShippingUsd: Number(profile.defaultShippingUsd),
      fallbackMarginPercent: Number(profile.fallbackMarginPercent),
      defaultColorSheetUrl: profile.defaultColorSheetUrl ?? null,
      rememberColorSheet: profile.rememberColorSheet ?? false,
      lastBatch: profile.batches?.[0]
        ? {
            id: profile.batches[0].id,
            createdAt: profile.batches[0].createdAt.toISOString(),
          }
        : null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private serializeExistingImportedProduct(product: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    price: Prisma.Decimal | number;
    costPrice: Prisma.Decimal | number | null;
    categoryId: string | null;
    supplierId: string | null;
    supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
    fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
    sourcePriceUsd: Prisma.Decimal | number | null;
    specialOrderSourceKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    category?: {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      parent: { id: string; name: string; slug: string } | null;
    } | null;
    colorVariants?: Array<{
      id: string;
      label: string;
      normalizedLabel: string;
      supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
      active: boolean;
      sourceSheetRow: number | null;
      sourceSheetKey: string | null;
    }>;
  }): ExistingImportedProduct {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      active: product.active,
      price: Number(product.price),
      costPrice: product.costPrice == null ? null : Number(product.costPrice),
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      supplierAvailability: product.supplierAvailability,
      fulfillmentMode: product.fulfillmentMode,
      sourcePriceUsd: product.sourcePriceUsd == null ? null : Number(product.sourcePriceUsd),
      specialOrderSourceKey: product.specialOrderSourceKey,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            parentId: product.category.parentId ?? null,
            parent: product.category.parent
              ? {
                  id: product.category.parent.id,
                  name: product.category.parent.name,
                  slug: product.category.parent.slug,
                }
              : null,
            pathLabel: product.category.parent
              ? `${product.category.parent.name} / ${product.category.name}`
              : product.category.name,
          }
        : null,
      colorVariants: (product.colorVariants ?? []).map((variant) => ({
        id: variant.id,
        label: variant.label,
        normalizedLabel: variant.normalizedLabel,
        supplierAvailability: variant.supplierAvailability,
        active: variant.active,
        sourceSheetRow: variant.sourceSheetRow ?? null,
        sourceSheetKey: variant.sourceSheetKey ?? null,
      })),
    };
  }

  private async resolveColorSource(input: {
    colorSheetUrl?: string | null;
    colorCsvText?: string | null;
  }): Promise<ImportedColorSource | null> {
    const colorCsvText = this.support.nullable(input.colorCsvText);
    if (colorCsvText) {
      return {
        kind: 'csv',
        label: 'CSV manual',
        rawText: colorCsvText,
      };
    }

    const colorSheetUrl = this.support.nullable(input.colorSheetUrl);
    if (!colorSheetUrl) return null;

    let exportUrl = '';
    try {
      exportUrl = googleSheetUrlToCsvExportUrl(colorSheetUrl);
    } catch {
      throw new BadRequestException('La URL de Google Sheets no es valida');
    }
    const rawText = await this.fetchRemoteText(exportUrl);
    return {
      kind: 'google_sheet',
      label: colorSheetUrl,
      rawText,
    };
  }

  private async fetchRemoteText(url: string) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'NicoReparacionesBot/1.0' },
      });
    } catch {
      throw new BadRequestException('No se pudo descargar la hoja publica de Google Sheets');
    }
    if (!response.ok) {
      throw new BadRequestException(`No se pudo descargar la hoja publica (${response.status})`);
    }
    return response.text();
  }

  private buildColorPreview(input: {
    colorSource: ImportedColorSource | null;
    parsedColors: { sections: ParsedSpecialOrderSection[]; rows: ParsedSpecialOrderColorRow[] } | null;
    items: Array<{
      rowId: string;
      included: boolean;
      status: SpecialOrderPreviewStatus;
      sectionKey: string;
      sectionName: string;
      sourceKey: string;
      title: string;
      existingProductId: string | null;
    }>;
    existingProducts: ExistingImportedProduct[];
  }): ColorPreviewResult {
    if (!input.colorSource || !input.parsedColors) {
      return {
        enabled: false,
        sourceKind: null,
        sourceLabel: null,
        sourceUrl: null,
        rowsParsed: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        outOfStockCount: 0,
        newCount: 0,
        updatedCount: 0,
        unchangedCount: 0,
        deactivatedCount: 0,
        items: [],
        warnings: [],
        deactivated: [],
      };
    }

    const baseItems = input.items.filter((item) => item.included && item.status !== 'conflict');
    const knownSectionKeys = new Set(input.items.map((item) => item.sectionKey));
    const candidatesBySectionKey = new Map<
      string,
      Array<{
        rowId: string;
        sourceKey: string;
        title: string;
        sectionName: string;
        normalizedCandidates: string[];
      }>
    >();
    const existingBySourceKey = new Map(input.existingProducts.map((product) => [product.specialOrderSourceKey ?? '', product]));

    for (const item of baseItems) {
      const bucket = candidatesBySectionKey.get(item.sectionKey) ?? [];
      bucket.push({
        rowId: item.rowId,
        sourceKey: item.sourceKey,
        title: item.title,
        sectionName: item.sectionName,
        normalizedCandidates: Array.from(
          new Set([
            normalizeSpecialOrderText(item.title),
            normalizeSpecialOrderText(`${item.sectionName} ${item.title}`),
          ].filter(Boolean)),
        ),
      });
      candidatesBySectionKey.set(item.sectionKey, bucket);
    }

    const matchedGroups = new Map<string, ColorPreviewGroup>();
    const warnings: ColorPreviewWarning[] = [];
    const matchedSourceKeysByProduct = new Map<string, Set<string>>();

    for (const row of input.parsedColors.rows) {
      const sectionCandidates = candidatesBySectionKey.get(row.sectionKey) ?? [];
      if (sectionCandidates.length === 0) {
        if (knownSectionKeys.has(row.sectionKey)) continue;
        warnings.push({
          rowId: row.rowId,
          rowNumber: row.rowNumber,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          rawTitle: row.title,
          reason: 'La seccion no matchea con productos incluidos del TXT',
        });
        continue;
      }

      const rankedMatches = sectionCandidates
        .map((candidate) => {
          const bestLength = Math.max(
            ...candidate.normalizedCandidates
              .filter((normalizedBase) => row.normalizedTitle === normalizedBase || row.normalizedTitle.startsWith(`${normalizedBase} `))
              .map((normalizedBase) => normalizedBase.length),
            0,
          );
          return { candidate, bestLength };
        })
        .filter((entry) => entry.bestLength > 0)
        .sort((left, right) => right.bestLength - left.bestLength);

      if (rankedMatches.length === 0) {
        warnings.push({
          rowId: row.rowId,
          rowNumber: row.rowNumber,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          rawTitle: row.title,
          reason: 'No matchea con un producto base del TXT',
        });
        continue;
      }

      const topLength = rankedMatches[0]?.bestLength ?? 0;
      const topMatches = rankedMatches.filter((entry) => entry.bestLength === topLength);
      if (topMatches.length > 1) {
        warnings.push({
          rowId: row.rowId,
          rowNumber: row.rowNumber,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          rawTitle: row.title,
          reason: 'Matchea con mas de un producto base',
        });
        continue;
      }

      const match = topMatches[0]!.candidate;
      const colorLabel = extractSpecialOrderColorLabel({
        rowTitle: row.title,
        normalizedRowTitle: row.normalizedTitle,
        productTitle: match.title,
        productSectionName: match.sectionName,
      });
      if (!colorLabel) {
        warnings.push({
          rowId: row.rowId,
          rowNumber: row.rowNumber,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          rawTitle: row.title,
          reason: 'No pudimos aislar el color de la variante',
        });
        continue;
      }

      const normalizedLabel = normalizeSpecialOrderText(colorLabel);
      if (!normalizedLabel) {
        warnings.push({
          rowId: row.rowId,
          rowNumber: row.rowNumber,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          rawTitle: row.title,
          reason: 'El color detectado quedo vacio',
        });
        continue;
      }

      const sourceSheetKey = buildSpecialOrderColorSourceKey(match.sourceKey, colorLabel);
      const existingProduct = existingBySourceKey.get(match.sourceKey) ?? null;
      const existingVariant =
        existingProduct?.colorVariants.find(
          (variant) => variant.sourceSheetKey === sourceSheetKey || variant.normalizedLabel === normalizedLabel,
        ) ?? null;
      const status: ColorPreviewItem['status'] = !existingVariant
        ? 'new'
        : existingVariant.supplierAvailability !== row.supplierAvailability || !existingVariant.active || existingVariant.label !== colorLabel
          ? 'availability_update'
          : 'unchanged';

      const colorItem: ColorPreviewItem = {
        rowId: row.rowId,
        rowNumber: row.rowNumber,
        sectionKey: row.sectionKey,
        sectionName: row.sectionName,
        rawTitle: row.title,
        productSourceKey: match.sourceKey,
        productTitle: match.title,
        productRowId: match.rowId,
        label: colorLabel,
        normalizedLabel,
        sourceSheetKey,
        supplierAvailability: row.supplierAvailability,
        status,
        existingVariantId: existingVariant?.id ?? null,
        included: true,
      };

      const group = matchedGroups.get(match.sourceKey) ?? {
        productSourceKey: match.sourceKey,
        productTitle: match.title,
        productRowId: match.rowId,
        sectionKey: row.sectionKey,
        sectionName: row.sectionName,
        items: [],
      };

      if (group.items.some((item) => item.sourceSheetKey === colorItem.sourceSheetKey)) {
        warnings.push({
          rowId: row.rowId,
          rowNumber: row.rowNumber,
          sectionKey: row.sectionKey,
          sectionName: row.sectionName,
          rawTitle: row.title,
          reason: 'La hoja trae la misma variante mas de una vez',
        });
        continue;
      }

      group.items.push(colorItem);
      matchedGroups.set(match.sourceKey, group);

      const matchedKeys = matchedSourceKeysByProduct.get(match.sourceKey) ?? new Set<string>();
      matchedKeys.add(colorItem.sourceSheetKey);
      matchedSourceKeysByProduct.set(match.sourceKey, matchedKeys);
    }

    const deactivated = baseItems.flatMap((item) => {
      const existingProduct = existingBySourceKey.get(item.sourceKey);
      if (!existingProduct) return [];
      const matchedKeys = matchedSourceKeysByProduct.get(item.sourceKey) ?? new Set<string>();
      return existingProduct.colorVariants
        .filter((variant) => variant.active)
        .filter((variant) => {
          const sourceKey = variant.sourceSheetKey ?? buildSpecialOrderColorSourceKey(item.sourceKey, variant.label);
          return !matchedKeys.has(sourceKey);
        })
        .map((variant) => ({
          productId: existingProduct.id,
          productSourceKey: item.sourceKey,
          productTitle: item.title,
          variantId: variant.id,
          label: variant.label,
        }));
    });

    const groups = Array.from(matchedGroups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort((left, right) => left.label.localeCompare(right.label, 'es')),
      }))
      .sort((left, right) => left.productTitle.localeCompare(right.productTitle, 'es'));

    const allItems = groups.flatMap((group) => group.items);
    return {
      enabled: true,
      sourceKind: input.colorSource.kind,
      sourceLabel: input.colorSource.label,
      sourceUrl: input.colorSource.kind === 'google_sheet' ? input.colorSource.label : null,
      rowsParsed: input.parsedColors.rows.length,
      matchedCount: allItems.length,
      unmatchedCount: warnings.length,
      outOfStockCount: allItems.filter((item) => item.supplierAvailability === 'OUT_OF_STOCK').length,
      newCount: allItems.filter((item) => item.status === 'new').length,
      updatedCount: allItems.filter((item) => item.status === 'availability_update').length,
      unchangedCount: allItems.filter((item) => item.status === 'unchanged').length,
      deactivatedCount: deactivated.length,
      items: groups,
      warnings,
      deactivated,
    };
  }

  private parseSectionMap(rawValue?: string | null): Record<string, SectionCategoryMapEntry> {
    const normalized = (rawValue ?? '').trim();
    if (!normalized) return {};
    try {
      const parsed = JSON.parse(normalized) as Record<string, SectionCategoryMapEntry>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private parseRememberedSelections(profile: {
    rememberedExcludedSectionKeysJson?: string | null;
    rememberedExcludedSourceKeysJson?: string | null;
  }): RememberedSpecialOrderSelections {
    return {
      sectionKeys: this.parseStringArray(profile.rememberedExcludedSectionKeysJson),
      sourceKeys: this.parseStringArray(profile.rememberedExcludedSourceKeysJson),
    };
  }

  private parseStringArray(rawValue?: string | null) {
    const normalized = (rawValue ?? '').trim();
    if (!normalized) return [];
    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? this.normalizeStringArray(parsed) : [];
    } catch {
      return [];
    }
  }

  private normalizeStringArray(values: unknown[]) {
    return Array.from(
      new Set(
        values
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter(Boolean),
      ),
    );
  }

  private stringifyStringArray(values: string[]) {
    const normalized = this.normalizeStringArray(values);
    return normalized.length > 0 ? JSON.stringify(normalized) : null;
  }

  private async createCategoryIfMissing(tx: Prisma.TransactionClient, rawName: string) {
    const name = rawName.trim();
    if (!name) return null;
    const baseSlug = slugifySpecialOrderLabel(name) || 'categoria';
    const existing =
      (await tx.category.findUnique({
        where: { slug: baseSlug },
        select: { id: true },
      })) ??
      (await tx.category.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      }));
    if (existing) return existing.id;
    const slug = await this.buildUniqueCategorySlug(tx, name);
    const created = await tx.category.create({
      data: {
        name,
        slug,
        active: true,
      },
      select: { id: true },
    });
    return created.id;
  }

  private async buildUniqueCategorySlug(tx: Prisma.TransactionClient, name: string) {
    return this.buildUniqueSlug(tx, 'category', slugifySpecialOrderLabel(name) || 'categoria');
  }

  private async buildUniqueProductSlug(tx: Prisma.TransactionClient, name: string) {
    return this.buildUniqueSlug(tx, 'product', slugifySpecialOrderLabel(name) || 'producto');
  }

  private async buildUniqueSlug(tx: Prisma.TransactionClient, entity: 'category' | 'product', baseSlug: string) {
    let attempt = baseSlug;
    let suffix = 2;
    while (true) {
      const existing =
        entity === 'category'
          ? await tx.category.findUnique({
              where: { slug: attempt },
              select: { id: true },
            })
          : await tx.product.findUnique({
              where: { slug: attempt },
              select: { id: true },
            });
      if (!existing) return attempt;
      attempt = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private clampDecimalInput(value: number, min: number, max: number, fallback: number) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  private decimal(value: number) {
    return new Prisma.Decimal(value);
  }

  private rethrowProfileWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Ya existe un perfil de encargue con ese nombre para el proveedor seleccionado');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Perfil de encargue no encontrado');
      }
    }
    throw error;
  }
}

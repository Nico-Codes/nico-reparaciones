import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type RepairPartApplicability } from '@prisma/client';
import { PublicAssetStorageService } from '../../common/storage/public-asset-storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogAdminPricingService } from './catalog-admin-pricing.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';
import { normalizeSpecialOrderText } from './catalog-admin-special-order.helpers.js';
import type {
  ProductColorVariantCreateInput,
  ProductColorVariantUpdateInput,
  ProductCreateInput,
  ProductImageUpload,
  ProductListParams,
  ProductUpdateInput,
  ProductWithRelations,
  RepairPartApplicabilityCreateInput,
  RepairPartApplicabilityUpdateInput,
  RepairPartSuggestionsInput,
} from './catalog-admin.types.js';

@Injectable()
export class CatalogAdminProductsService {
  private readonly productImageAllowedExts = ['jpg', 'jpeg', 'png', 'webp'] as const;
  private readonly productImageMaxKb = 4096;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PublicAssetStorageService) private readonly assetStorage: PublicAssetStorageService,
    @Inject(CatalogAdminSupportService) private readonly support: CatalogAdminSupportService,
    @Inject(CatalogAdminPricingService) private readonly pricingService: CatalogAdminPricingService,
  ) {}

  async products(params?: ProductListParams) {
    const q = (params?.q ?? '').trim();
    const categoryId = (params?.categoryId ?? '').trim();
    const activeFilter = (params?.active ?? '').trim().toLowerCase();
    const fulfillmentModeFilter = (params?.fulfillmentMode ?? '').trim().toUpperCase();
    const publishedToStoreFilter = (params?.publishedToStore ?? '').trim().toLowerCase();
    const repairUsageFilter = (params?.repairUsageEnabled ?? '').trim().toLowerCase();
    const categoryFilter = categoryId ? await this.buildCategoryFilter(categoryId) : null;
    const where: Prisma.ProductWhereInput = {
      ...(categoryFilter ? categoryFilter : {}),
      ...(activeFilter === '1' ? { active: true } : activeFilter === '0' ? { active: false } : {}),
      ...(fulfillmentModeFilter === 'INVENTORY' || fulfillmentModeFilter === 'SPECIAL_ORDER'
        ? { fulfillmentMode: fulfillmentModeFilter }
        : {}),
      ...(publishedToStoreFilter === '1' ? { publishedToStore: true } : publishedToStoreFilter === '0' ? { publishedToStore: false } : {}),
      ...(repairUsageFilter === '1' ? { repairUsageEnabled: true } : repairUsageFilter === '0' ? { repairUsageEnabled: false } : {}),
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        supplier: { select: { id: true, name: true } },
        specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
        colorVariants: {
          select: {
            id: true,
            label: true,
            normalizedLabel: true,
            supplierAvailability: true,
            active: true,
            lastImportedAt: true,
            sourceSheetRow: true,
            sourceSheetKey: true,
          },
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
        },
        repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
      },
      orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
    });
    return {
      items: items.map((product) => this.serializeProduct(product)),
    };
  }

  async product(id: string) {
    const item = await this.prisma.product.findUnique({
      where: { id },
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
        supplier: { select: { id: true, name: true } },
        specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
        colorVariants: {
          select: {
            id: true,
            label: true,
            normalizedLabel: true,
            supplierAvailability: true,
            active: true,
            lastImportedAt: true,
            sourceSheetRow: true,
            sourceSheetKey: true,
          },
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
        },
        repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
      },
    });
    if (!item) throw new NotFoundException('Producto no encontrado');
    return { item: this.serializeProduct(item) };
  }

  async createProduct(input: ProductCreateInput) {
    const categoryId = await this.support.validateCategoryId(input.categoryId);
    const supplierId = await this.support.validateSupplierId(input.supplierId);
    const costPrice = input.costPrice == null ? null : Math.max(0, Number(input.costPrice));
    let salePrice = input.price == null ? null : Math.max(0, Number(input.price));

    if (salePrice == null) {
      if (categoryId && costPrice != null) {
        const resolved = await this.pricingService.resolveRecommendedProductPrice({
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

    await this.pricingService.assertProductMarginGuard(costPrice ?? 0, salePrice);
    if (input.repairUsageEnabled && ((costPrice ?? 0) <= 0 || Math.max(0, Math.trunc(input.stock ?? 0)) <= 0)) {
      throw new BadRequestException('Un repuesto interno necesita costo y stock mayor a cero');
    }

    const data: Prisma.ProductUncheckedCreateInput = {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: this.support.nullable(input.description),
      purchaseReference: this.support.nullable(input.purchaseReference),
      price: new Prisma.Decimal(salePrice),
      costPrice: costPrice == null ? null : new Prisma.Decimal(costPrice),
      stock: Math.max(0, Math.trunc(input.stock ?? 0)),
      active: input.active ?? true,
      featured: input.featured ?? false,
      publishedToStore: input.publishedToStore ?? true,
      repairUsageEnabled: input.repairUsageEnabled ?? false,
      sku: this.support.nullable(input.sku),
      barcode: this.support.nullable(input.barcode),
      categoryId,
      supplierId,
    };

    try {
      const item = await this.prisma.product.create({
        data,
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
          supplier: { select: { id: true, name: true } },
          specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
          colorVariants: {
            select: {
              id: true,
              label: true,
              normalizedLabel: true,
              supplierAvailability: true,
              active: true,
              lastImportedAt: true,
              sourceSheetRow: true,
              sourceSheetKey: true,
            },
            orderBy: [{ active: 'desc' }, { label: 'asc' }],
          },
          repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
        },
      });
      return { item: this.serializeProduct(item) };
    } catch (error) {
      this.support.rethrowProductWriteError(error);
    }
  }

  async updateProduct(id: string, input: ProductUpdateInput) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, price: true, costPrice: true, categoryId: true, supplierId: true, fulfillmentMode: true, repairUsageEnabled: true, stock: true },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado');

    const nextCategoryId =
      input.categoryId !== undefined ? await this.support.validateCategoryId(input.categoryId) : existing.categoryId;
    const nextSupplierId =
      input.supplierId !== undefined ? await this.support.validateSupplierId(input.supplierId) : existing.supplierId;
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
        const resolved = await this.pricingService.resolveRecommendedProductPrice({
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

    await this.pricingService.assertProductMarginGuard(nextCostPrice ?? 0, nextPrice ?? Number(existing.price));
    const nextRepairUsageEnabled = input.repairUsageEnabled !== undefined ? input.repairUsageEnabled : existing.repairUsageEnabled;
    const nextStock = input.stock !== undefined ? Math.max(0, Math.trunc(input.stock ?? 0)) : existing.stock;
    if (nextRepairUsageEnabled === true) {
      if (existing.fulfillmentMode !== 'INVENTORY') {
        throw new BadRequestException('Solo los productos con stock fisico pueden usarse en reparaciones');
      }
      if ((nextCostPrice ?? 0) <= 0 || nextStock <= 0) {
        throw new BadRequestException('Un repuesto interno necesita costo y stock mayor a cero');
      }
    }

    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) data.slug = input.slug.trim();
    if (input.description !== undefined) data.description = this.support.nullable(input.description);
    if (input.price !== undefined) data.price = new Prisma.Decimal(nextPrice ?? 0);
    if (input.costPrice !== undefined) data.costPrice = nextCostPrice == null ? null : new Prisma.Decimal(nextCostPrice);
    if (input.stock !== undefined) data.stock = Math.max(0, Math.trunc(input.stock ?? 0));
    if (input.active !== undefined) data.active = input.active;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.publishedToStore !== undefined) data.publishedToStore = input.publishedToStore;
    if (input.repairUsageEnabled !== undefined) data.repairUsageEnabled = input.repairUsageEnabled;
    if (input.sku !== undefined) data.sku = this.support.nullable(input.sku);
    if (input.barcode !== undefined) data.barcode = this.support.nullable(input.barcode);
    if (input.purchaseReference !== undefined) data.purchaseReference = this.support.nullable(input.purchaseReference);
    if (input.supplierId !== undefined) data.supplierId = nextSupplierId;
    if (input.categoryId !== undefined) data.categoryId = nextCategoryId;

    try {
      const item = await this.prisma.product.update({
        where: { id },
        data,
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
          supplier: { select: { id: true, name: true } },
          specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
          colorVariants: {
            select: {
              id: true,
              label: true,
              normalizedLabel: true,
              supplierAvailability: true,
              active: true,
              lastImportedAt: true,
              sourceSheetRow: true,
              sourceSheetKey: true,
            },
            orderBy: [{ active: 'desc' }, { label: 'asc' }],
          },
          repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
        },
      });
      return { item: this.serializeProduct(item) };
    } catch (error) {
      this.support.rethrowProductWriteError(error);
    }
  }

  async createProductColorVariant(productId: string, input: ProductColorVariantCreateInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, fulfillmentMode: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.fulfillmentMode !== 'SPECIAL_ORDER') {
      throw new BadRequestException('Los colores por proveedor solo aplican a productos por encargue');
    }

    const label = input.label.trim();
    const normalizedLabel = normalizeSpecialOrderText(label);
    if (!normalizedLabel) throw new BadRequestException('Etiqueta de color invalida');

    try {
      await this.prisma.productColorVariant.create({
        data: {
          productId,
          label,
          normalizedLabel,
          supplierAvailability: input.supplierAvailability ?? 'IN_STOCK',
          active: input.active ?? true,
          lastImportedAt: new Date(),
        },
      });
      return this.product(productId);
    } catch (error) {
      this.rethrowColorVariantWriteError(error);
    }
  }

  async updateProductColorVariant(productId: string, variantId: string, input: ProductColorVariantUpdateInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, fulfillmentMode: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.fulfillmentMode !== 'SPECIAL_ORDER') {
      throw new BadRequestException('Los colores por proveedor solo aplican a productos por encargue');
    }

    const current = await this.prisma.productColorVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Color del producto no encontrado');

    const data: Prisma.ProductColorVariantUncheckedUpdateInput = {};
    if (input.label !== undefined) {
      const label = input.label.trim();
      const normalizedLabel = normalizeSpecialOrderText(label);
      if (!normalizedLabel) throw new BadRequestException('Etiqueta de color invalida');
      data.label = label;
      data.normalizedLabel = normalizedLabel;
    }
    if (input.supplierAvailability !== undefined) data.supplierAvailability = input.supplierAvailability;
    if (input.active !== undefined) data.active = input.active;
    data.lastImportedAt = new Date();

    try {
      await this.prisma.productColorVariant.update({
        where: { id: variantId },
        data,
      });
      return this.product(productId);
    } catch (error) {
      this.rethrowColorVariantWriteError(error);
    }
  }

  async createRepairPartApplicability(productId: string, input: RepairPartApplicabilityCreateInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, repairUsageEnabled: true, fulfillmentMode: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.fulfillmentMode !== 'INVENTORY') {
      throw new BadRequestException('Solo los productos con stock fisico pueden usarse como repuesto interno');
    }
    if (!product.repairUsageEnabled) {
      throw new BadRequestException('Activa el uso en reparaciones antes de cargar compatibilidades');
    }

    const data = await this.buildRepairPartApplicabilityData(input, false);
    await this.prisma.repairPartApplicability.create({
      data: { ...(data as Prisma.RepairPartApplicabilityUncheckedCreateInput), productId },
    });
    return this.product(productId);
  }

  async updateRepairPartApplicability(productId: string, applicabilityId: string, input: RepairPartApplicabilityUpdateInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, repairUsageEnabled: true, fulfillmentMode: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.fulfillmentMode !== 'INVENTORY') {
      throw new BadRequestException('Solo los productos con stock fisico pueden usarse como repuesto interno');
    }
    if (!product.repairUsageEnabled) {
      throw new BadRequestException('Activa el uso en reparaciones antes de editar compatibilidades');
    }

    const current = await this.prisma.repairPartApplicability.findFirst({
      where: { id: applicabilityId, productId },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Compatibilidad no encontrada');

    const data = await this.buildRepairPartApplicabilityData(input, true);
    await this.prisma.repairPartApplicability.update({
      where: { id: applicabilityId },
      data,
    });
    return this.product(productId);
  }

  async deleteRepairPartApplicability(productId: string, applicabilityId: string) {
    const current = await this.prisma.repairPartApplicability.findFirst({
      where: { id: applicabilityId, productId },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Compatibilidad no encontrada');
    await this.prisma.repairPartApplicability.delete({ where: { id: applicabilityId } });
    return this.product(productId);
  }

  async repairPartSuggestions(input: RepairPartSuggestionsInput) {
    const context = await this.resolveRepairPartSuggestionContext(input);
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        fulfillmentMode: 'INVENTORY',
        repairUsageEnabled: true,
        stock: { gt: 0 },
        costPrice: { not: null },
        repairApplicabilities: { some: { active: true } },
      },
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
        supplier: { select: { id: true, name: true } },
        specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
        colorVariants: {
          select: {
            id: true,
            label: true,
            normalizedLabel: true,
            supplierAvailability: true,
            active: true,
            lastImportedAt: true,
            sourceSheetRow: true,
            sourceSheetKey: true,
          },
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
        },
        repairApplicabilities: {
          where: { active: true },
          orderBy: [{ updatedAt: 'desc' }],
        },
      },
      orderBy: [{ stock: 'desc' }, { updatedAt: 'desc' }],
      take: 200,
    });

    const scored = products
      .flatMap((product) =>
        product.repairApplicabilities.map((applicability) => {
          const score = this.scoreRepairPartApplicability(applicability, context);
          return { product, applicability, score };
        }),
      )
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.product.stock - a.product.stock)
      .slice(0, Math.max(1, Math.min(50, input.limit ?? 8)));

    return {
      items: scored.map((item) => ({
        product: this.serializeProduct(item.product),
        applicability: this.serializeRepairPartApplicability(item.applicability),
        score: item.score,
        matchKind: item.score >= 700 ? 'exact' : 'probable',
      })),
      meta: {
        total: scored.length,
      },
    };
  }

  async uploadProductImage(id: string, file: ProductImageUpload) {
    const current = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, imagePath: true },
    });
    if (!current) throw new NotFoundException('Producto no encontrado');

    const { ext, buffer } = this.assetStorage.validateUpload(file, this.productImageAllowedExts, this.productImageMaxKb);
    const relPath = this.assetStorage.buildTimestampedProductImagePath(id, ext);
    await this.assetStorage.writeStorageAsset(relPath, buffer);

    if (current.imagePath) {
      await this.assetStorage.deleteStorageAsset(current.imagePath);
    }

    const item = await this.prisma.product.update({
      where: { id },
      data: { imagePath: relPath },
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
        supplier: { select: { id: true, name: true } },
        specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
        colorVariants: {
          select: {
            id: true,
            label: true,
            normalizedLabel: true,
            supplierAvailability: true,
            active: true,
            lastImportedAt: true,
            sourceSheetRow: true,
            sourceSheetKey: true,
          },
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
        },
        repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
      },
    });

    return {
      item: this.serializeProduct(item),
      upload: {
        path: relPath,
        url: this.resolveProductImageUrl(relPath, null),
      },
    };
  }

  async removeProductImage(id: string) {
    const current = await this.prisma.product.findUnique({
      where: { id },
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
        supplier: { select: { id: true, name: true } },
        specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
        colorVariants: {
          select: {
            id: true,
            label: true,
            normalizedLabel: true,
            supplierAvailability: true,
            active: true,
            lastImportedAt: true,
            sourceSheetRow: true,
            sourceSheetKey: true,
          },
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
        },
        repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
      },
    });
    if (!current) throw new NotFoundException('Producto no encontrado');

    if (current.imagePath) {
      await this.assetStorage.deleteStorageAsset(current.imagePath);
    }

    const item = await this.prisma.product.update({
      where: { id },
      data: { imagePath: null },
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
        supplier: { select: { id: true, name: true } },
        specialOrderProfile: { select: { id: true, name: true, requiresColorVariants: true } },
        colorVariants: {
          select: {
            id: true,
            label: true,
            normalizedLabel: true,
            supplierAvailability: true,
            active: true,
            lastImportedAt: true,
            sourceSheetRow: true,
            sourceSheetKey: true,
          },
          orderBy: [{ active: 'desc' }, { label: 'asc' }],
        },
        repairApplicabilities: { orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] },
      },
    });
    return { item: this.serializeProduct(item) };
  }

  private async buildRepairPartApplicabilityData(
    input: RepairPartApplicabilityCreateInput | RepairPartApplicabilityUpdateInput,
    partial: boolean,
  ): Promise<Prisma.RepairPartApplicabilityUncheckedUpdateInput> {
    const data: Prisma.RepairPartApplicabilityUncheckedUpdateInput = {};
    if (!partial || input.deviceTypeId !== undefined) data.deviceTypeId = await this.validateDeviceTypeId(input.deviceTypeId);
    if (!partial || input.deviceBrandId !== undefined) data.deviceBrandId = await this.validateDeviceBrandId(input.deviceBrandId);
    if (!partial || input.deviceModelGroupId !== undefined) data.deviceModelGroupId = await this.validateDeviceModelGroupId(input.deviceModelGroupId);
    if (!partial || input.deviceModelId !== undefined) data.deviceModelId = await this.validateDeviceModelId(input.deviceModelId);
    if (!partial || input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = await this.validateDeviceIssueTypeId(input.deviceIssueTypeId);
    if (!partial || input.notes !== undefined) data.notes = this.support.nullable(input.notes);
    if (!partial || input.active !== undefined) data.active = input.active ?? true;

    const hasScope =
      data.deviceTypeId !== null ||
      data.deviceBrandId !== null ||
      data.deviceModelGroupId !== null ||
      data.deviceModelId !== null ||
      data.deviceIssueTypeId !== null;
    if (!partial && !hasScope) {
      throw new BadRequestException('Define al menos un alcance tecnico para la compatibilidad');
    }
    return data;
  }

  private async validateDeviceTypeId(value?: string | null) {
    const id = this.support.nullable(value);
    if (!id) return null;
    const row = await this.prisma.deviceType.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new BadRequestException('Tipo de dispositivo invalido');
    return row.id;
  }

  private async validateDeviceBrandId(value?: string | null) {
    const id = this.support.nullable(value);
    if (!id) return null;
    const row = await this.prisma.deviceBrand.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new BadRequestException('Marca tecnica invalida');
    return row.id;
  }

  private async validateDeviceModelGroupId(value?: string | null) {
    const id = this.support.nullable(value);
    if (!id) return null;
    const row = await this.prisma.deviceModelGroup.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new BadRequestException('Grupo de modelo invalido');
    return row.id;
  }

  private async validateDeviceModelId(value?: string | null) {
    const id = this.support.nullable(value);
    if (!id) return null;
    const row = await this.prisma.deviceModel.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new BadRequestException('Modelo tecnico invalido');
    return row.id;
  }

  private async validateDeviceIssueTypeId(value?: string | null) {
    const id = this.support.nullable(value);
    if (!id) return null;
    const row = await this.prisma.deviceIssueType.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new BadRequestException('Falla tecnica invalida');
    return row.id;
  }

  private async resolveRepairPartSuggestionContext(input: RepairPartSuggestionsInput) {
    let deviceTypeId = this.support.nullable(input.deviceTypeId);
    const deviceBrandId = this.support.nullable(input.deviceBrandId);
    let deviceModelGroupId = this.support.nullable(input.deviceModelGroupId);
    const deviceModelId = this.support.nullable(input.deviceModelId);
    const deviceIssueTypeId = this.support.nullable(input.deviceIssueTypeId);

    if (!deviceTypeId && deviceBrandId) {
      const brand = await this.prisma.deviceBrand.findUnique({ where: { id: deviceBrandId }, select: { deviceTypeId: true } });
      deviceTypeId = brand?.deviceTypeId ?? null;
    }
    if (!deviceModelGroupId && deviceModelId) {
      const model = await this.prisma.deviceModel.findUnique({ where: { id: deviceModelId }, select: { deviceModelGroupId: true } });
      deviceModelGroupId = model?.deviceModelGroupId ?? null;
    }

    return {
      deviceTypeId,
      deviceBrandId,
      deviceModelGroupId,
      deviceModelId,
      deviceIssueTypeId,
      deviceBrand: normalizeSpecialOrderText(input.deviceBrand ?? ''),
      deviceModel: normalizeSpecialOrderText(input.deviceModel ?? ''),
      issueLabel: normalizeSpecialOrderText(input.issueLabel ?? ''),
    };
  }

  private scoreRepairPartApplicability(
    applicability: RepairPartApplicability,
    context: Awaited<ReturnType<CatalogAdminProductsService['resolveRepairPartSuggestionContext']>>,
  ) {
    let score = 0;
    let constrained = 0;
    const check = (actual: string | null, expected: string | null, weight: number) => {
      if (!expected) return true;
      constrained++;
      if (!actual || actual !== expected) return false;
      score += weight;
      return true;
    };

    if (!check(context.deviceTypeId, applicability.deviceTypeId, 120)) return 0;
    if (!check(context.deviceBrandId, applicability.deviceBrandId, 180)) return 0;
    if (!check(context.deviceModelGroupId, applicability.deviceModelGroupId, 210)) return 0;
    if (!check(context.deviceModelId, applicability.deviceModelId, 320)) return 0;
    if (!check(context.deviceIssueTypeId, applicability.deviceIssueTypeId, 260)) return 0;

    if (constrained === 0) return 0;
    if (applicability.deviceModelId && applicability.deviceIssueTypeId) score += 180;
    if (applicability.deviceModelGroupId && applicability.deviceIssueTypeId) score += 80;
    return score;
  }

  private serializeProduct(product: ProductWithRelations) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      purchaseReference: product.purchaseReference ?? null,
      imagePath: product.imagePath ?? null,
      imageUrl: this.resolveProductImageUrl(product.imagePath, product.imageLegacy),
      price: Number(product.price),
      costPrice: product.costPrice != null ? Number(product.costPrice) : null,
      stock: product.stock,
      fulfillmentMode: product.fulfillmentMode,
      supplierAvailability: product.supplierAvailability,
      publishedToStore: product.publishedToStore,
      repairUsageEnabled: product.repairUsageEnabled,
      sourcePriceUsd: product.sourcePriceUsd != null ? Number(product.sourcePriceUsd) : null,
      active: product.active,
      featured: product.featured,
      sku: product.sku ?? null,
      barcode: product.barcode ?? null,
      categoryId: product.categoryId ?? null,
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
      supplierId: product.supplierId ?? null,
      supplier: product.supplier ? { id: product.supplier.id, name: product.supplier.name } : null,
      specialOrderProfile: product.specialOrderProfile
        ? {
            id: product.specialOrderProfile.id,
            name: product.specialOrderProfile.name,
            requiresColorVariants: product.specialOrderProfile.requiresColorVariants,
          }
        : null,
      hasColorOptions: product.colorVariants.some((variant) => variant.active),
      requiresColorSelection:
        product.fulfillmentMode === 'SPECIAL_ORDER' && (product.specialOrderProfile?.requiresColorVariants ?? true),
      colorOptions: product.colorVariants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        normalizedLabel: variant.normalizedLabel,
        supplierAvailability: variant.supplierAvailability,
        active: variant.active,
        lastImportedAt: variant.lastImportedAt?.toISOString?.() ?? null,
        sourceSheetRow: variant.sourceSheetRow ?? null,
        sourceSheetKey: variant.sourceSheetKey ?? null,
      })),
      repairApplicabilities: product.repairApplicabilities.map((applicability) =>
        this.serializeRepairPartApplicability(applicability),
      ),
      lastImportedAt: product.lastImportedAt?.toISOString?.() ?? null,
      createdAt: product.createdAt?.toISOString?.() ?? null,
      updatedAt: product.updatedAt?.toISOString?.() ?? null,
    };
  }

  private serializeRepairPartApplicability(applicability: RepairPartApplicability) {
    return {
      id: applicability.id,
      productId: applicability.productId,
      deviceTypeId: applicability.deviceTypeId ?? null,
      deviceBrandId: applicability.deviceBrandId ?? null,
      deviceModelGroupId: applicability.deviceModelGroupId ?? null,
      deviceModelId: applicability.deviceModelId ?? null,
      deviceIssueTypeId: applicability.deviceIssueTypeId ?? null,
      notes: applicability.notes ?? null,
      active: applicability.active,
      createdAt: applicability.createdAt?.toISOString?.() ?? null,
      updatedAt: applicability.updatedAt?.toISOString?.() ?? null,
    };
  }

  private async buildCategoryFilter(categoryId: string): Promise<Prisma.ProductWhereInput> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true, children: { select: { id: true } } },
    });
    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }
    if (category.parentId) {
      return { categoryId: category.id };
    }
    const categoryIds = [category.id, ...category.children.map((child) => child.id)];
    return { categoryId: { in: categoryIds } };
  }

  private resolveProductImageUrl(imagePath?: string | null, imageLegacy?: string | null) {
    const fromPath = imagePath && imagePath.trim() !== '' ? imagePath.trim() : null;
    if (fromPath) {
      return this.resolveStorageAssetUrl(fromPath, this.runtimeStorageBaseUrl());
    }

    if (imageLegacy && imageLegacy.trim() !== '') {
      const legacy = imageLegacy.trim();
      return this.resolveStorageAssetUrl(legacy.includes('/') ? legacy : `products/${legacy}`, this.legacyStorageBaseUrl());
    }

    return null;
  }

  private resolveStorageAssetUrl(rawPath: string, base: string) {
    const raw = rawPath.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;

    let path = raw.replace(/^\/+/, '');
    if (path.startsWith('storage/')) path = path.slice('storage/'.length);
    const urlPath = `/storage/${path}`;
    return base ? `${base}${urlPath}` : urlPath;
  }

  private runtimeStorageBaseUrl() {
    return (process.env.API_URL ?? '').trim().replace(/\/+$/, '');
  }

  private legacyStorageBaseUrl() {
    return (process.env.STORE_IMAGE_BASE_URL ?? process.env.API_URL ?? '').trim().replace(/\/+$/, '');
  }

  private rethrowColorVariantWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Ya existe un color con esa etiqueta para este producto');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Color del producto no encontrado');
      }
    }
    throw error;
  }
}

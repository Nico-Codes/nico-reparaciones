import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PublicAssetStorageService } from '../../common/storage/public-asset-storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogAdminPricingService } from './catalog-admin-pricing.service.js';
import { CatalogAdminSupportService } from './catalog-admin-support.service.js';
import type {
  ProductCreateInput,
  ProductImageUpload,
  ProductListParams,
  ProductUpdateInput,
  ProductWithRelations,
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
      items: items.map((product) => this.serializeProduct(product)),
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
      sku: this.support.nullable(input.sku),
      barcode: this.support.nullable(input.barcode),
      categoryId,
      supplierId,
    };

    try {
      const item = await this.prisma.product.create({
        data,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          supplier: { select: { id: true, name: true } },
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
      select: { id: true, price: true, costPrice: true, categoryId: true, supplierId: true },
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

    const data: Prisma.ProductUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.slug !== undefined) data.slug = input.slug.trim();
    if (input.description !== undefined) data.description = this.support.nullable(input.description);
    if (input.price !== undefined) data.price = new Prisma.Decimal(nextPrice ?? 0);
    if (input.costPrice !== undefined) data.costPrice = nextCostPrice == null ? null : new Prisma.Decimal(nextCostPrice);
    if (input.stock !== undefined) data.stock = Math.max(0, Math.trunc(input.stock ?? 0));
    if (input.active !== undefined) data.active = input.active;
    if (input.featured !== undefined) data.featured = input.featured;
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
          category: { select: { id: true, name: true, slug: true } },
          supplier: { select: { id: true, name: true } },
        },
      });
      return { item: this.serializeProduct(item) };
    } catch (error) {
      this.support.rethrowProductWriteError(error);
    }
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
        category: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    return {
      item: this.serializeProduct(item),
      upload: {
        path: relPath,
        url: this.assetStorage.toStorageUrl(relPath),
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

    if (current.imagePath) {
      await this.assetStorage.deleteStorageAsset(current.imagePath);
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

  private serializeProduct(product: ProductWithRelations) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      purchaseReference: product.purchaseReference ?? null,
      imagePath: product.imagePath ?? null,
      imageUrl: this.assetStorage.toStorageUrl(product.imagePath ?? product.imageLegacy ?? null),
      price: Number(product.price),
      costPrice: product.costPrice != null ? Number(product.costPrice) : null,
      stock: product.stock,
      active: product.active,
      featured: product.featured,
      sku: product.sku ?? null,
      barcode: product.barcode ?? null,
      categoryId: product.categoryId ?? null,
      category: product.category ?? null,
      supplierId: product.supplierId ?? null,
      supplier: product.supplier ? { id: product.supplier.id, name: product.supplier.name } : null,
      createdAt: product.createdAt?.toISOString?.() ?? null,
      updatedAt: product.updatedAt?.toISOString?.() ?? null,
    };
  }
}

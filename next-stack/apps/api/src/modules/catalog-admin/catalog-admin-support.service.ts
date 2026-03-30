import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CatalogAdminSupportService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async validateSupplierId(supplierIdRaw?: string | null) {
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

  async validateCategoryId(categoryIdRaw?: string | null) {
    const categoryId = this.nullable(categoryIdRaw);
    if (!categoryId) return null;
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Categoria invalida');
    }
    return category.id;
  }

  nullable(value?: string | null) {
    const normalized = (value ?? '').trim();
    return normalized || null;
  }

  clampNumber(value: number, min: number, max: number, fallback: number) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  rethrowCategoryWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
        if (targets.includes('slug')) {
          throw new BadRequestException('Ya existe una categoria con ese slug');
        }
        throw new BadRequestException('Ya existe una categoria con esos datos');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Categoria no encontrada');
      }
    }
    throw error;
  }

  rethrowProductWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
        if (targets.includes('slug')) {
          throw new BadRequestException('Ya existe un producto con ese slug');
        }
        if (targets.includes('sku')) {
          throw new BadRequestException('Ya existe un producto con ese SKU');
        }
        if (targets.includes('barcode')) {
          throw new BadRequestException('Ya existe un producto con ese codigo de barras');
        }
        throw new BadRequestException('Ya existe un producto con esos datos');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Producto no encontrado');
      }
    }
    throw error;
  }
}

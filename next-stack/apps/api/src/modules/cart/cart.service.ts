import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type CartQuoteItemInput = {
  productId: string;
  quantity: number;
};

@Injectable()
export class CartService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async quote(items: CartQuoteItemInput[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { items: [], totals: { subtotal: 0, itemsCount: 0 } };
    }

    const normalized = items
      .map((item) => ({
        productId: String(item.productId ?? '').trim(),
        quantity: Math.max(1, Math.min(999, Number(item.quantity) || 1)),
      }))
      .filter((item) => item.productId)
      .reduce<Array<{ productId: string; quantity: number }>>((accumulator, item) => {
        const existing = accumulator.find((entry) => entry.productId === item.productId);
        if (existing) {
          existing.quantity = Math.min(999, existing.quantity + item.quantity);
          return accumulator;
        }
        accumulator.push({ ...item });
        return accumulator;
      }, []);

    const ids = [...new Set(normalized.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: { select: { id: true, name: true, slug: true, active: true } },
      },
    });

    const byId = new Map(products.map((product) => [product.id, product]));

    let subtotal = 0;
    let itemsCount = 0;

    const lines = normalized.map((row) => {
      const product = byId.get(row.productId);

      if (!product) {
        return {
          productId: row.productId,
          quantity: row.quantity,
          valid: false,
          reason: 'Producto no existe',
          name: 'Producto no encontrado',
          unitPrice: 0,
          lineTotal: 0,
          stockAvailable: 0,
          fulfillmentMode: 'INVENTORY' as const,
          supplierAvailability: 'UNKNOWN' as const,
          active: false,
          category: null,
        };
      }

      const categoryActive = product.category ? product.category.active : true;
      const isSpecialOrder = product.fulfillmentMode === 'SPECIAL_ORDER';
      const valid = isSpecialOrder
        ? product.active && categoryActive && product.supplierAvailability !== 'OUT_OF_STOCK'
        : product.active && categoryActive && product.stock > 0;
      const quantity = isSpecialOrder
        ? Math.max(1, Math.min(row.quantity, 999))
        : Math.max(1, Math.min(row.quantity, Math.max(1, product.stock)));
      const unitPrice = Number(product.price);
      const lineTotal = valid ? unitPrice * quantity : 0;

      if (valid) {
        subtotal += lineTotal;
        itemsCount += quantity;
      }

      const reason = !product.active
        ? 'Producto inactivo'
        : !categoryActive
          ? 'Categoria inactiva'
          : isSpecialOrder
            ? product.supplierAvailability === 'OUT_OF_STOCK'
              ? 'Sin stock en proveedor'
              : null
            : product.stock <= 0
              ? 'Sin stock'
              : null;

      return {
        productId: product.id,
        quantity,
        requestedQuantity: row.quantity,
        valid,
        reason,
        name: product.name,
        slug: product.slug,
        unitPrice,
        lineTotal,
        stockAvailable: isSpecialOrder ? 0 : product.stock,
        fulfillmentMode: product.fulfillmentMode,
        supplierAvailability: product.supplierAvailability,
        active: product.active,
        category: product.category ? { id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
      };
    });

    return {
      items: lines,
      totals: {
        subtotal,
        itemsCount,
      },
    };
  }
}

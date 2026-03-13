import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
      .map((i) => ({
        productId: String(i.productId ?? '').trim(),
        quantity: Math.max(1, Math.min(999, Number(i.quantity) || 1)),
      }))
      .filter((i) => i.productId)
      .reduce<Array<{ productId: string; quantity: number }>>((accumulator, item) => {
        const existing = accumulator.find((entry) => entry.productId === item.productId);
        if (existing) {
          existing.quantity = Math.min(999, existing.quantity + item.quantity);
          return accumulator;
        }
        accumulator.push({ ...item });
        return accumulator;
      }, []);

    const ids = [...new Set(normalized.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        category: { select: { id: true, name: true, slug: true, active: true } },
      },
    });

    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let itemsCount = 0;
    const lines = normalized.map((row) => {
      const p = byId.get(row.productId);

      if (!p) {
        return {
          productId: row.productId,
          quantity: row.quantity,
          valid: false,
          reason: 'Producto no existe',
          name: 'Producto no encontrado',
          unitPrice: 0,
          lineTotal: 0,
          stockAvailable: 0,
          active: false,
          category: null,
        };
      }

      const categoryActive = p.category ? p.category.active : true;
      const valid = p.active && categoryActive && p.stock > 0;
      const adjustedQty = Math.max(1, Math.min(row.quantity, Math.max(1, p.stock)));
      const unitPrice = Number(p.price);
      const lineTotal = valid ? unitPrice * adjustedQty : 0;

      if (valid) {
        subtotal += lineTotal;
        itemsCount += adjustedQty;
      }

      return {
        productId: p.id,
        quantity: adjustedQty,
        requestedQuantity: row.quantity,
        valid,
        reason: !p.active ? 'Producto inactivo' : !categoryActive ? 'Categoría inactiva' : p.stock <= 0 ? 'Sin stock' : null,
        name: p.name,
        slug: p.slug,
        unitPrice,
        lineTotal,
        stockAvailable: p.stock,
        active: p.active,
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
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

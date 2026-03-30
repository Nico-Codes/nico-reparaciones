import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ORDER_WALKIN_EMAIL } from './orders.helpers.js';
import type { SerializableOrder } from './orders.types.js';

@Injectable()
export class OrdersSupportService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  serializeOrder(order: SerializableOrder) {
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      isQuickSale: order.isQuickSale,
      quickSaleAdminId: order.quickSaleAdminId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : null,
      items: (order.items ?? []).map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.nameSnapshot,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
    };
  }

  async getOrCreateWalkinUser() {
    const existing = await this.prisma.user.findUnique({
      where: { email: ORDER_WALKIN_EMAIL },
      select: { id: true, name: true, email: true },
    });
    if (existing) return existing;
    return this.prisma.user.create({
      data: {
        name: 'Venta mostrador',
        email: ORDER_WALKIN_EMAIL,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });
  }

  async decrementProductStockOrThrow(
    tx: Prisma.TransactionClient,
    input: { productId: string; quantity: number; name: string },
  ) {
    const updated = await tx.product.updateMany({
      where: {
        id: input.productId,
        active: true,
        stock: { gte: input.quantity },
      },
      data: {
        stock: { decrement: input.quantity },
      },
    });
    if (updated.count !== 1) {
      throw new BadRequestException(`Stock insuficiente para ${input.name}`);
    }
  }

  async assertQuickSaleMarginGuard(lines: Array<{ productId: string }>) {
    if (!lines.length) return;
    const blockNegative = await this.isNegativeMarginBlocked();
    if (!blockNegative) return;
    const products = await this.prisma.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) } },
      select: { id: true, name: true, costPrice: true, price: true },
    });
    for (const product of products) {
      const costPrice = Number(product.costPrice ?? 0);
      const salePrice = Number(product.price ?? 0);
      if (costPrice > 0 && salePrice < costPrice) {
        throw new BadRequestException(`No se puede confirmar: ${product.name} tiene margen negativo (guard activo).`);
      }
    }
  }

  private async isNegativeMarginBlocked() {
    const keys = ['product_prevent_negative_margin', 'product_pricing.block_negative_margin'];
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((row) => [row.key, (row.value ?? '').trim()]));
    const direct = map.get('product_prevent_negative_margin');
    if (direct) return direct !== '0';
    const legacy = map.get('product_pricing.block_negative_margin');
    if (legacy) return legacy !== '0';
    return true;
  }
}

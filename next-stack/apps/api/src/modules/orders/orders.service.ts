import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CartService } from '../cart/cart.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type CheckoutInput = {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: string | null;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  async checkout(input: CheckoutInput) {
    const quote = await this.cartService.quote(input.items);
    const validLines = quote.items.filter((i) => i.valid);

    if (!validLines.length) {
      throw new BadRequestException('No hay items válidos para generar pedido');
    }

    // Si hay inválidos, frenamos para evitar sorpresas.
    const invalid = quote.items.filter((i) => !i.valid);
    if (invalid.length > 0) {
      throw new BadRequestException({
        message: 'Hay items inválidos en el carrito',
        invalidItems: invalid.map((i) => ({ productId: i.productId, reason: i.reason })),
      });
    }

    const total = validLines.reduce((acc, line) => acc + line.lineTotal, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      // Revalidación de stock en transacción antes de descontar.
      const productIds = validLines.map((l) => l.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true, active: true, price: true, name: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      for (const line of validLines) {
        const p = byId.get(line.productId);
        if (!p || !p.active) {
          throw new BadRequestException(`Producto inválido en checkout: ${line.name}`);
        }
        if (p.stock < line.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${line.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId: input.userId,
          status: 'PENDIENTE',
          total: new Prisma.Decimal(total),
          paymentMethod: (input.paymentMethod ?? '').trim() || 'efectivo',
          items: {
            create: validLines.map((line) => ({
              productId: line.productId,
              nameSnapshot: line.name,
              unitPrice: new Prisma.Decimal(line.unitPrice),
              quantity: line.quantity,
              lineTotal: new Prisma.Decimal(line.lineTotal),
            })),
          },
        },
        include: {
          items: true,
        },
      });

      for (const line of validLines) {
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: { decrement: line.quantity },
          },
        });
      }

      return created;
    });

    return this.serializeOrder(order);
  }

  async myOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      items: orders.map((o) => this.serializeOrder(o)),
    };
  }

  async myOrderDetail(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.userId !== userId) throw new ForbiddenException('No autorizado');
    return { item: this.serializeOrder(order) };
  }

  private serializeOrder(order: {
    id: string;
    status: string;
    total: Prisma.Decimal;
    paymentMethod: string | null;
    isQuickSale: boolean;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      productId: string | null;
      nameSnapshot: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      lineTotal: Prisma.Decimal;
    }>;
  }) {
    return {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      isQuickSale: order.isQuickSale,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: (order.items ?? []).map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.nameSnapshot,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
    };
  }
}

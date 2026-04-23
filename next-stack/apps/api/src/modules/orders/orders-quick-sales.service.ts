import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CartService } from '../cart/cart.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizePaymentFilter, normalizePaymentMethod, paymentMethods, resolveQuickSalesRange } from './orders.helpers.js';
import { OrdersNotificationsService } from './orders-notifications.service.js';
import { OrdersSupportService } from './orders-support.service.js';
import type { QuickSaleConfirmInput, QuickSalesHistoryInput } from './orders.types.js';

@Injectable()
export class OrdersQuickSalesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CartService) private readonly cartService: CartService,
    @Inject(OrdersSupportService) private readonly ordersSupportService: OrdersSupportService,
    @Inject(OrdersNotificationsService) private readonly ordersNotificationsService: OrdersNotificationsService,
  ) {}

  async adminConfirmQuickSale(input: QuickSaleConfirmInput) {
    const dedupMap = new Map<string, number>();
    for (const rawLine of input.items) {
      const productId = rawLine.productId.trim();
      const quantity = Math.max(1, Math.min(999, Math.trunc(Number(rawLine.quantity) || 0)));
      if (!productId) continue;
      dedupMap.set(productId, (dedupMap.get(productId) ?? 0) + quantity);
    }
    const dedupItems = Array.from(dedupMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));
    const quote = await this.cartService.quote(dedupItems);
    const validLines = quote.items.filter((item) => item.valid);
    if (!validLines.length) {
      throw new BadRequestException('No hay items validos para confirmar la venta rapida');
    }
    const invalid = quote.items.filter((item) => !item.valid);
    if (invalid.length > 0) {
      throw new BadRequestException({
        message: 'Hay items invalidos en la venta rapida',
        invalidItems: invalid.map((item) => ({ productId: item.productId, reason: item.reason })),
      });
    }
    await this.ordersSupportService.assertQuickSaleMarginGuard(validLines.map((line) => ({ productId: line.productId })));

    const walkin = await this.ordersSupportService.getOrCreateWalkinUser();
    const normalizedPayment = normalizePaymentMethod(input.paymentMethod);
    if (!normalizedPayment) {
      throw new BadRequestException('Metodo de pago invalido para la venta rapida');
    }
    const total = validLines.reduce((acc, line) => acc + line.lineTotal, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const productIds = validLines.map((line) => line.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true, active: true, price: true, name: true, fulfillmentMode: true },
      });
      const byId = new Map(products.map((product) => [product.id, product]));

      for (const line of validLines) {
        const product = byId.get(line.productId);
        if (!product || !product.active) {
          throw new BadRequestException(`Producto invalido en venta rapida: ${line.name}`);
        }
        if (product.fulfillmentMode === 'SPECIAL_ORDER') {
          throw new BadRequestException(`La venta rapida solo admite productos con stock real: ${line.name}`);
        }
        if (product.stock < line.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${line.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId: walkin.id,
          status: 'ENTREGADO',
          total: new Prisma.Decimal(total),
          paymentMethod: normalizedPayment,
          isQuickSale: true,
          quickSaleAdminId: input.adminUserId,
          items: {
            create: validLines.map((line) => ({
              productId: line.productId,
              nameSnapshot: line.name,
              fulfillmentModeSnapshot: line.fulfillmentMode,
              unitPrice: new Prisma.Decimal(line.unitPrice),
              quantity: line.quantity,
              lineTotal: new Prisma.Decimal(line.lineTotal),
            })),
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
      });

      for (const line of validLines) {
        await this.ordersSupportService.decrementProductStockOrThrow(tx, line);
      }

      return created;
    });

    await this.ordersNotificationsService.createQuickSaleWhatsappLog(order.id, {
      customerName: input.customerName ?? '',
      customerPhone: input.customerPhone ?? '',
      notes: input.notes ?? '',
      paymentMethod: normalizedPayment,
      itemCount: validLines.reduce((acc, line) => acc + line.quantity, 0),
    });

    return { item: this.ordersSupportService.serializeOrder(order) };
  }

  async adminQuickSales(params?: QuickSalesHistoryInput) {
    const range = resolveQuickSalesRange(params?.from, params?.to);
    const payment = normalizePaymentFilter(params?.payment);
    if ((params?.payment ?? '').trim() && !payment) {
      throw new BadRequestException('Metodo de pago invalido');
    }
    const adminId = (params?.adminId ?? '').trim();

    const where: Prisma.OrderWhereInput = {
      isQuickSale: true,
      createdAt: {
        gte: range.fromStart,
        lte: range.toEnd,
      },
      ...(payment ? { paymentMethod: payment } : {}),
      ...(adminId ? { quickSaleAdminId: adminId } : {}),
    };

    const [orders, summary, admins] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.order.aggregate({
        where,
        _count: { id: true },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { isQuickSale: true, quickSaleAdminId: { not: null } },
        select: { quickSaleAdminId: true },
        distinct: ['quickSaleAdminId'],
      }),
    ]);

    const adminIds = admins.map((row) => row.quickSaleAdminId).filter((id): id is string => Boolean(id));
    const adminsResolved =
      adminIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: adminIds } },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
          })
        : [];
    const adminById = new Map(adminsResolved.map((admin) => [admin.id, admin]));

    return {
      from: range.from,
      to: range.to,
      payment,
      adminId: adminId || null,
      paymentMethods: paymentMethods(),
      summary: {
        salesCount: Number(summary._count.id ?? 0),
        salesTotal: Number(summary._sum.total ?? 0),
      },
      admins: adminsResolved.map((admin) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
      })),
      items: orders.map((order) => ({
        ...this.ordersSupportService.serializeOrder(order),
        itemsCount: order.items.reduce((acc, line) => acc + line.quantity, 0),
        admin: order.quickSaleAdminId
          ? (() => {
              const admin = adminById.get(order.quickSaleAdminId);
              if (!admin) return null;
              return {
                id: admin.id,
                name: admin.name,
                email: admin.email,
              };
            })()
          : null,
      })),
    };
  }
}

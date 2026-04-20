import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CartService } from '../cart/cart.service.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizeCheckoutPaymentMethod } from './orders.helpers.js';
import { OrdersSupportService } from './orders-support.service.js';
import type { CheckoutInput } from './orders.types.js';

@Injectable()
export class OrdersCheckoutService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CartService) private readonly cartService: CartService,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(OrdersSupportService) private readonly ordersSupportService: OrdersSupportService,
  ) {}

  async checkout(input: CheckoutInput) {
    const quote = await this.cartService.quote(input.items);
    const validLines = quote.items.filter((item) => item.valid);
    const normalizedPaymentMethod = normalizeCheckoutPaymentMethod(input.paymentMethod);

    if (input.paymentMethod !== undefined && input.paymentMethod !== null && !normalizedPaymentMethod) {
      throw new BadRequestException('Metodo de pago invalido para checkout');
    }

    if (!validLines.length) {
      throw new BadRequestException('No hay items validos para generar pedido');
    }

    const invalid = quote.items.filter((item) => !item.valid);
    if (invalid.length > 0) {
      throw new BadRequestException({
        message: 'Hay items invalidos en el carrito',
        invalidItems: invalid.map((item) => ({ productId: item.productId, reason: item.reason })),
      });
    }

    const total = validLines.reduce((acc, line) => acc + line.lineTotal, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const productIds = validLines.map((line) => line.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true, active: true, price: true, name: true },
      });
      const byId = new Map(products.map((product) => [product.id, product]));

      for (const line of validLines) {
        const product = byId.get(line.productId);
        if (!product || !product.active) {
          throw new BadRequestException(`Producto invalido en checkout: ${line.name}`);
        }
        if (product.stock < line.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${line.name}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId: input.userId,
          status: 'PENDIENTE',
          total: new Prisma.Decimal(total),
          paymentMethod: normalizedPaymentMethod ?? 'efectivo',
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
          user: { select: { id: true, name: true, email: true } },
          items: true,
        },
      });

      for (const line of validLines) {
        await this.ordersSupportService.decrementProductStockOrThrow(tx, line);
      }

      return created;
    });

    if (order.user?.email) {
      void this.mailService.sendTemplate({
        templateKey: 'order_created',
        to: order.user.email,
        vars: {
          user_name: order.user.name,
          order_id: order.id,
          order_total: `$${Number(order.total).toLocaleString('es-AR')}`,
        },
      });
    }

    return this.ordersSupportService.serializeOrder(order);
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
      items: orders.map((order) => this.ordersSupportService.serializeOrder(order)),
    };
  }

  async myOrderDetail(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.userId !== userId) throw new ForbiddenException('No autorizado');
    return { item: this.ordersSupportService.serializeOrder(order) };
  }

  async uploadTransferProof(
    userId: string,
    orderId: string,
    file?: { originalname: string; mimetype: string; size: number; buffer?: Buffer },
  ) {
    if (!file) {
      throw new BadRequestException('Debes seleccionar un comprobante');
    }

    const current = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!current) throw new NotFoundException('Pedido no encontrado');
    if (current.userId !== userId) throw new ForbiddenException('No autorizado');
    if ((current.paymentMethod ?? '').trim().toLowerCase() !== 'transferencia') {
      throw new BadRequestException('Solo puedes cargar comprobantes para pedidos con transferencia');
    }

    const transferProofPath = await this.ordersSupportService.replaceTransferProof(
      current.id,
      current.transferProofPath,
      file,
    );

    const updated = await this.prisma.order.update({
      where: { id: current.id },
      data: {
        transferProofPath,
        transferProofUploadedAt: new Date(),
      },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });

    return { item: this.ordersSupportService.serializeOrder(updated) };
  }
}

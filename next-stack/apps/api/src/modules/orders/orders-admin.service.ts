import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertValidOrderStatusTransition, normalizeOrderStatus } from './orders.helpers.js';
import { OrdersNotificationsService } from './orders-notifications.service.js';
import { OrdersSupportService } from './orders-support.service.js';
import type { AdminListInput } from './orders.types.js';

@Injectable()
export class OrdersAdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(OrdersSupportService) private readonly ordersSupportService: OrdersSupportService,
    @Inject(OrdersNotificationsService) private readonly ordersNotificationsService: OrdersNotificationsService,
  ) {}

  async adminOrders(params?: AdminListInput) {
    const query = (params?.q ?? '').trim();
    const status = normalizeOrderStatus(params?.status);
    if ((params?.status ?? '').trim() && !status) {
      throw new BadRequestException('Estado de pedido invalido');
    }
    const orders = await this.prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { id: { contains: query, mode: 'insensitive' } },
                { paymentMethod: { contains: query, mode: 'insensitive' } },
                { user: { is: { name: { contains: query, mode: 'insensitive' } } } },
                { user: { is: { email: { contains: query, mode: 'insensitive' } } } },
                { items: { some: { nameSnapshot: { contains: query, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: orders.map((order) => this.ordersSupportService.serializeOrder(order)) };
  }

  async adminOrderDetail(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return { item: this.ordersSupportService.serializeOrder(order) };
  }

  async adminUpdateStatus(orderId: string, statusRaw: string) {
    const current = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!current) throw new NotFoundException('Pedido no encontrado');

    const status = normalizeOrderStatus(statusRaw);
    if (!status) {
      throw new BadRequestException('Estado de pedido invalido');
    }
    assertValidOrderStatusTransition(current.status, status);
    if (current.status === status) {
      return { item: this.ordersSupportService.serializeOrder(current) };
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
    await this.ordersNotificationsService.createOrderWhatsappLog(order);
    return { item: this.ordersSupportService.serializeOrder(order) };
  }
}

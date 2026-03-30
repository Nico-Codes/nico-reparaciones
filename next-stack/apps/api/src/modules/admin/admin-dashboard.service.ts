import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OPEN_REPAIR_STATUSES, PENDING_ORDER_STATUSES } from './admin.constants.js';

@Injectable()
export class AdminDashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async dashboard() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalRepairsOpen,
      repairsReadyPickup,
      repairsToday,
      ordersPending,
      ordersToday,
      ordersMonthAgg,
      recentOrders,
      recentRepairs,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.product.count({ where: { active: true, stock: { gt: 0, lte: 5 } } }),
      this.prisma.product.count({ where: { active: true, stock: { lte: 0 } } }),
      this.prisma.repair.count({ where: { status: { in: [...OPEN_REPAIR_STATUSES] } } }),
      this.prisma.repair.count({ where: { status: 'READY_PICKUP' } }),
      this.prisma.repair.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.count({ where: { status: { in: [...PENDING_ORDER_STATUSES] } } }),
      this.prisma.order.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startMonth } },
      }),
      this.prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { select: { id: true, nameSnapshot: true, quantity: true, lineTotal: true }, take: 3 },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.repair.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    const monthRevenue = Number(ordersMonthAgg._sum.total ?? 0);
    const alerts = [];
    if (outOfStockProducts > 0) alerts.push({ id: 'stock-out', severity: 'high', title: 'Productos sin stock', value: outOfStockProducts });
    if (lowStockProducts > 0) alerts.push({ id: 'stock-low', severity: 'medium', title: 'Productos con stock bajo', value: lowStockProducts });
    if (repairsReadyPickup > 0) alerts.push({ id: 'repairs-ready', severity: 'low', title: 'Reparaciones listas para entregar', value: repairsReadyPickup });
    if (ordersPending > 0) alerts.push({ id: 'orders-pending', severity: 'medium', title: 'Pedidos pendientes/preparacion', value: ordersPending });

    return {
      metrics: {
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        repairs: {
          open: totalRepairsOpen,
          readyPickup: repairsReadyPickup,
          createdToday: repairsToday,
        },
        orders: {
          pendingFlow: ordersPending,
          createdToday: ordersToday,
          revenueMonth: monthRevenue,
        },
      },
      alerts,
      recent: {
        orders: recentOrders.map((row: any) => ({
          id: row.id,
          status: row.status,
          total: Number(row.total),
          createdAt: row.createdAt.toISOString(),
          user: row.user ? { id: row.user.id, name: row.user.name, email: row.user.email } : null,
          itemsPreview: (row.items ?? []).map((item: any) => ({
            id: item.id,
            name: item.nameSnapshot,
            quantity: item.quantity,
            lineTotal: Number(item.lineTotal),
          })),
        })),
        repairs: recentRepairs.map((row: any) => ({
          id: row.id,
          status: row.status,
          customerName: row.customerName,
          deviceBrand: row.deviceBrand,
          deviceModel: row.deviceModel,
          issueLabel: row.issueLabel,
          quotedPrice: row.quotedPrice != null ? Number(row.quotedPrice) : null,
          finalPrice: row.finalPrice != null ? Number(row.finalPrice) : null,
          createdAt: row.createdAt.toISOString(),
        })),
      },
      generatedAt: now.toISOString(),
    };
  }
}

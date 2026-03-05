import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type OrderStatus } from '@prisma/client';
import { CartService } from '../cart/cart.service.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type CheckoutInput = {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod?: string | null;
};

type AdminListInput = {
  status?: string;
  q?: string;
};

type QuickSaleConfirmInput = {
  adminUserId: string;
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
};

type QuickSalesHistoryInput = {
  from?: string;
  to?: string;
  payment?: string;
  adminId?: string;
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

type OrderWithUserAndItems = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    items: true;
  };
}>;

type SerializableOrder = OrderWithItems & {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

@Injectable()
export class OrdersService {
  private static readonly WALKIN_EMAIL = 'walkin@nico.local';
  private static readonly PAYMENT_METHODS = {
    local: 'Pago en el local',
    mercado_pago: 'Mercado Pago',
    transferencia: 'Transferencia',
  } as const;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CartService) private readonly cartService: CartService,
    @Inject(MailService) private readonly mailService: MailService,
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
          user: { select: { id: true, name: true, email: true } },
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

  async adminOrders(params?: AdminListInput) {
    const q = (params?.q ?? '').trim();
    const status = this.normalizeStatus(params?.status);
    const orders = await this.prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { paymentMethod: { contains: q, mode: 'insensitive' } },
                { user: { is: { name: { contains: q, mode: 'insensitive' } } } },
                { user: { is: { email: { contains: q, mode: 'insensitive' } } } },
                { items: { some: { nameSnapshot: { contains: q, mode: 'insensitive' } } } },
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
    return { items: orders.map((o) => this.serializeOrder(o)) };
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
    return { item: this.serializeOrder(order) };
  }

  async adminUpdateStatus(orderId: string, statusRaw: string) {
    const status = this.normalizeStatus(statusRaw) ?? 'PENDIENTE';
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
    await this.createOrderWhatsappLog(order);
    return { item: this.serializeOrder(order) };
  }

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
    const validLines = quote.items.filter((i) => i.valid);
    if (!validLines.length) {
      throw new BadRequestException('No hay items validos para confirmar la venta rapida');
    }
    const invalid = quote.items.filter((i) => !i.valid);
    if (invalid.length > 0) {
      throw new BadRequestException({
        message: 'Hay items invalidos en la venta rapida',
        invalidItems: invalid.map((i) => ({ productId: i.productId, reason: i.reason })),
      });
    }
    await this.assertQuickSaleMarginGuard(validLines.map((line) => ({ productId: line.productId })));

    const walkin = await this.getOrCreateWalkinUser();
    const normalizedPayment = this.normalizePaymentMethod(input.paymentMethod);
    const total = validLines.reduce((acc, line) => acc + line.lineTotal, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const productIds = validLines.map((l) => l.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true, active: true, price: true, name: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      for (const line of validLines) {
        const p = byId.get(line.productId);
        if (!p || !p.active) {
          throw new BadRequestException(`Producto invalido en venta rapida: ${line.name}`);
        }
        if (p.stock < line.quantity) {
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
        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: { decrement: line.quantity },
          },
        });
      }

      return created;
    });

    await this.createQuickSaleWhatsappLog(order.id, {
      customerName: input.customerName ?? '',
      customerPhone: input.customerPhone ?? '',
      notes: input.notes ?? '',
      paymentMethod: normalizedPayment,
      itemCount: validLines.reduce((acc, line) => acc + line.quantity, 0),
    });

    return { item: this.serializeOrder(order) };
  }

  async adminQuickSales(params?: QuickSalesHistoryInput) {
    const range = this.resolveQuickSalesRange(params?.from, params?.to);
    const payment = this.normalizePaymentFilter(params?.payment);
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
    const adminById = new Map(adminsResolved.map((a) => [a.id, a]));

    return {
      from: range.from,
      to: range.to,
      payment,
      adminId: adminId || null,
      paymentMethods: this.paymentMethods(),
      summary: {
        salesCount: Number(summary._count.id ?? 0),
        salesTotal: Number(summary._sum.total ?? 0),
      },
      admins: adminsResolved.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
      })),
      items: orders.map((order) => ({
        ...this.serializeOrder(order),
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

  private normalizeStatus(statusRaw?: string): OrderStatus | null {
    const value = (statusRaw ?? '').trim().toUpperCase();
    if (!value) return null;
    const allowed = new Set<OrderStatus>(['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO']);
    return allowed.has(value as OrderStatus) ? (value as OrderStatus) : null;
  }

  private serializeOrder(order: SerializableOrder) {
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

  private paymentMethods() {
    return Object.entries(OrdersService.PAYMENT_METHODS).map(([key, label]) => ({ key, label }));
  }

  private normalizePaymentMethod(raw?: string | null) {
    const value = (raw ?? '').trim().toLowerCase();
    return value in OrdersService.PAYMENT_METHODS ? value : 'local';
  }

  private normalizePaymentFilter(raw?: string) {
    const value = (raw ?? '').trim().toLowerCase();
    if (!value) return '';
    return value in OrdersService.PAYMENT_METHODS ? value : '';
  }

  private resolveQuickSalesRange(fromRaw?: string, toRaw?: string) {
    const now = new Date();
    const fallback = now.toISOString().slice(0, 10);
    const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
    const from = valid(fromRaw ?? '') ? (fromRaw as string) : fallback;
    const to = valid(toRaw ?? '') ? (toRaw as string) : fallback;
    const fromStart = new Date(`${from}T00:00:00.000`);
    const toEnd = new Date(`${to}T23:59:59.999`);
    if (fromStart.getTime() > toEnd.getTime()) {
      return {
        from: to,
        to: from,
        fromStart: new Date(`${to}T00:00:00.000`),
        toEnd: new Date(`${from}T23:59:59.999`),
      };
    }
    return { from, to, fromStart, toEnd };
  }

  private async getOrCreateWalkinUser() {
    const existing = await this.prisma.user.findUnique({
      where: { email: OrdersService.WALKIN_EMAIL },
      select: { id: true, name: true, email: true },
    });
    if (existing) return existing;
    return this.prisma.user.create({
      data: {
        name: 'Venta mostrador',
        email: OrdersService.WALKIN_EMAIL,
        role: 'USER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });
  }

  private async assertQuickSaleMarginGuard(lines: Array<{ productId: string }>) {
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
        throw new BadRequestException(
          `No se puede confirmar: ${product.name} tiene margen negativo (guard activo).`,
        );
      }
    }
  }

  private async isNegativeMarginBlocked() {
    const keys = ['product_prevent_negative_margin', 'product_pricing.block_negative_margin'];
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, (r.value ?? '').trim()]));
    const direct = map.get('product_prevent_negative_margin');
    if (direct) return direct !== '0';
    const legacy = map.get('product_pricing.block_negative_margin');
    if (legacy) return legacy !== '0';
    return true;
  }

  private async createQuickSaleWhatsappLog(
    orderId: string,
    details: {
      customerName: string;
      customerPhone: string;
      notes: string;
      paymentMethod: string;
      itemCount: number;
    },
  ) {
    try {
      const paymentLabel = OrdersService.PAYMENT_METHODS[details.paymentMethod as keyof typeof OrdersService.PAYMENT_METHODS] ?? details.paymentMethod;
      await this.prisma.whatsAppLog.create({
        data: {
          channel: 'orders',
          templateKey: 'orders.quick_sale',
          targetType: 'order',
          targetId: orderId,
          phone: details.customerPhone || null,
          recipient: details.customerName || null,
          status: 'PENDING',
          message: `Venta rapida confirmada #${orderId}. Pago: ${paymentLabel}. Items: ${details.itemCount}.`,
          metaJson: JSON.stringify({
            source: 'quick_sale_confirm',
            orderId,
            customerName: details.customerName || null,
            customerPhone: details.customerPhone || null,
            notes: details.notes || null,
            paymentMethod: details.paymentMethod,
          }),
        },
      });
    } catch {
      // no bloquear confirmacion por log
    }
  }

  private async createOrderWhatsappLog(order: OrderWithUserAndItems) {
    try {
      const statusKey = this.orderStatusTemplateKey(order.status);
      const webBase = this.getWebBaseUrl();
      const settingsKeys = [
        `whatsapp_orders_template.${statusKey}.body`,
        'business_name',
        'shop_phone',
        'shop_address',
        'shop_hours',
      ];
      const rows = await this.prisma.appSetting.findMany({ where: { key: { in: settingsKeys } } });
      const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
      const template = (map.get(`whatsapp_orders_template.${statusKey}.body`) || '').trim() || this.defaultOrderWhatsappTemplate(statusKey);
      const vars: Record<string, string> = {
        customer_name: (order.user?.name ?? 'Cliente').trim(),
        order_id: order.id,
        status: statusKey,
        status_label: this.orderStatusLabel(order.status),
        total: `$${Number(order.total).toLocaleString('es-AR')}`,
        total_raw: String(Number(order.total)),
        items_count: String(order.items.length),
        items_summary: order.items.map((i) => `- ${i.nameSnapshot} x${i.quantity}`).join('\n'),
        pickup_name: order.user?.name ?? '',
        pickup_phone: '',
        phone: '',
        notes: '',
        my_orders_url: `${webBase}/orders`,
        store_url: `${webBase}/store`,
        shop_address: (map.get('shop_address') || '').trim(),
        shop_hours: (map.get('shop_hours') || '').trim(),
        shop_phone: (map.get('shop_phone') || '').trim(),
        shop_name: (map.get('business_name') || 'NicoReparaciones').trim(),
      };
      const message = this.applyTemplateVars(template, vars);
      await this.prisma.whatsAppLog.create({
        data: {
          channel: 'orders',
          templateKey: `orders.${statusKey}`,
          targetType: 'order',
          targetId: order.id,
          phone: null,
          recipient: order.user?.name ?? null,
          status: 'PENDING',
          message,
          metaJson: JSON.stringify({
            source: 'admin_status_change',
            orderId: order.id,
            status: order.status,
          }),
        },
      });
    } catch {
      // no bloquear cambio de estado por log/plantilla
    }
  }

  private orderStatusTemplateKey(status: OrderStatus) {
    if (status === 'PENDIENTE') return 'pendiente';
    if (status === 'CONFIRMADO') return 'confirmado';
    if (status === 'PREPARANDO') return 'preparando';
    if (status === 'LISTO_RETIRO') return 'listo_retirar';
    if (status === 'ENTREGADO') return 'entregado';
    if (status === 'CANCELADO') return 'cancelado';
    return 'pendiente';
  }

  private orderStatusLabel(status: OrderStatus) {
    if (status === 'LISTO_RETIRO') return 'Listo para retirar';
    const lower = status.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  private defaultOrderWhatsappTemplate(statusKey: string) {
    const base = [
      'Hola {customer_name}',
      'Tu pedido *#{order_id}* está en estado: *{status_label}*.',
      'Total: {total}',
      'Ítems: {items_count}',
      '',
      '{items_summary}',
      '',
      'Ver tus pedidos: {my_orders_url}',
      'Tienda: {store_url}',
    ];
    if (statusKey === 'listo_retirar') base.push('', 'Dirección: {shop_address}', 'Horarios: {shop_hours}', 'Teléfono: {shop_phone}');
    if (statusKey === 'entregado') base.push('', 'Gracias por tu compra.');
    if (statusKey === 'cancelado') base.push('', 'Si querés, lo revisamos por WhatsApp.');
    return base.join('\n');
  }

  private applyTemplateVars(template: string, vars: Record<string, string>) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key) => vars[key] ?? '');
  }

  private getWebBaseUrl() {
    return (((process.env.WEB_URL ?? '').trim() || 'http://localhost:5174')).replace(/\/+$/, '');
  }
}

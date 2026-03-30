import { Inject, Injectable } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import {
  applyTemplateVars,
  defaultOrderWhatsappTemplate,
  getOrdersWebBaseUrl,
  ORDER_PAYMENT_METHODS,
  orderStatusLabel,
  orderStatusTemplateKey,
} from './orders.helpers.js';
import type { OrderWithUserAndItems } from './orders.types.js';

@Injectable()
export class OrdersNotificationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(WhatsappService) private readonly whatsappService: WhatsappService,
  ) {}

  async createQuickSaleWhatsappLog(
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
      const paymentLabel = ORDER_PAYMENT_METHODS[details.paymentMethod as keyof typeof ORDER_PAYMENT_METHODS] ?? details.paymentMethod;
      await this.whatsappService.createAndDispatchLog({
        channel: 'orders',
        templateKey: 'orders.quick_sale',
        targetType: 'order',
        targetId: orderId,
        phone: details.customerPhone || null,
        recipient: details.customerName || null,
        message: `Venta rapida confirmada #${orderId}. Pago: ${paymentLabel}. Items: ${details.itemCount}.`,
        meta: {
          source: 'quick_sale_confirm',
          orderId,
          customerName: details.customerName || null,
          customerPhone: details.customerPhone || null,
          notes: details.notes || null,
          paymentMethod: details.paymentMethod,
        },
      });
    } catch {
      // no bloquear confirmacion por log
    }
  }

  async createOrderWhatsappLog(order: OrderWithUserAndItems) {
    try {
      const statusKey = orderStatusTemplateKey(order.status);
      const webBase = getOrdersWebBaseUrl();
      const settingsKeys = [
        `whatsapp_orders_template.${statusKey}.body`,
        'business_name',
        'shop_phone',
        'shop_address',
        'shop_hours',
      ];
      const rows = await this.prisma.appSetting.findMany({ where: { key: { in: settingsKeys } } });
      const map = new Map(rows.map((row) => [row.key, row.value ?? '']));
      const template =
        (map.get(`whatsapp_orders_template.${statusKey}.body`) || '').trim() || defaultOrderWhatsappTemplate(statusKey);
      const vars: Record<string, string> = {
        customer_name: (order.user?.name ?? 'Cliente').trim(),
        order_id: order.id,
        status: statusKey,
        status_label: orderStatusLabel(order.status as OrderStatus),
        total: `$${Number(order.total).toLocaleString('es-AR')}`,
        total_raw: String(Number(order.total)),
        items_count: String(order.items.length),
        items_summary: order.items.map((item) => `- ${item.nameSnapshot} x${item.quantity}`).join('\n'),
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
      const message = applyTemplateVars(template, vars);
      await this.whatsappService.createAndDispatchLog({
        channel: 'orders',
        templateKey: `orders.${statusKey}`,
        targetType: 'order',
        targetId: order.id,
        phone: null,
        recipient: order.user?.name ?? null,
        message,
        meta: {
          source: 'admin_status_change',
          orderId: order.id,
          status: order.status,
          missingPhone: true,
        },
      });
    } catch {
      // no bloquear cambio de estado por log/plantilla
    }
  }
}

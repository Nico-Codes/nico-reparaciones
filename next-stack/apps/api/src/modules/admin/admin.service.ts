import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type AppSetting, type HelpFaqItem, type UserRole, type WhatsAppLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  private readonly openRepairStatuses = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP'] as const;
  private readonly pendingOrderStatuses = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO'] as const;

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
      this.prisma.repair.count({
        where: { status: { in: [...this.openRepairStatuses] } },
      }),
      this.prisma.repair.count({ where: { status: 'READY_PICKUP' } }),
      this.prisma.repair.count({ where: { createdAt: { gte: startToday } } }),
      this.prisma.order.count({ where: { status: { in: [...this.pendingOrderStatuses] } } }),
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
    if (ordersPending > 0) alerts.push({ id: 'orders-pending', severity: 'medium', title: 'Pedidos pendientes/preparación', value: ordersPending });

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
        orders: recentOrders.map((o: any) => ({
          id: o.id,
          status: o.status,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          user: o.user ? { id: o.user.id, name: o.user.name, email: o.user.email } : null,
          itemsPreview: (o.items ?? []).map((i: any) => ({
            id: i.id,
            name: i.nameSnapshot,
            quantity: i.quantity,
            lineTotal: Number(i.lineTotal),
          })),
        })),
        repairs: recentRepairs.map((r: any) => ({
          id: r.id,
          status: r.status,
          customerName: r.customerName,
          deviceBrand: r.deviceBrand,
          deviceModel: r.deviceModel,
          issueLabel: r.issueLabel,
          quotedPrice: r.quotedPrice != null ? Number(r.quotedPrice) : null,
          finalPrice: r.finalPrice != null ? Number(r.finalPrice) : null,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      generatedAt: now.toISOString(),
    };
  }

  async users(params?: { q?: string; role?: string }) {
    const q = (params?.q ?? '').trim();
    const role = this.parseUserRole(params?.role);
    const items = await this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });

    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    };
  }

  async updateUserRole(targetUserId: string, roleRaw: string, actorUserId?: string | null) {
    const role = this.parseUserRole(roleRaw);
    if (!role) {
      return { message: 'Rol inválido' };
    }

    if (actorUserId && actorUserId === targetUserId && role !== 'ADMIN') {
      return { message: 'No podés quitarte el rol admin a vos mismo' };
    }

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    return {
      item: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  async settings() {
    const existing = await this.prisma.appSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    const defaults = [
      { key: 'business_name', group: 'business', label: 'Nombre del negocio', type: 'text', value: 'NicoReparaciones' },
      { key: 'shop_phone', group: 'business', label: 'Tel�fono WhatsApp', type: 'text', value: '' },
      { key: 'shop_email', group: 'business', label: 'Email del local', type: 'email', value: '' },
      { key: 'store_hero_title', group: 'branding', label: 'T�tulo portada tienda', type: 'text', value: '' },
      { key: 'store_hero_subtitle', group: 'branding', label: 'SubT�tulo portada tienda', type: 'textarea', value: '' },
      { key: 'store_hero_image_desktop', group: 'branding', label: 'Imagen portada tienda (desktop)', type: 'text', value: '' },
      { key: 'store_hero_image_mobile', group: 'branding', label: 'Imagen portada tienda (mobile)', type: 'text', value: '' },
      { key: 'store_hero_fade_rgb_desktop', group: 'branding', label: 'Fade portada desktop (RGB)', type: 'text', value: '14, 165, 233' },
      { key: 'store_hero_fade_rgb_mobile', group: 'branding', label: 'Fade portada mobile (RGB)', type: 'text', value: '14, 165, 233' },
      { key: 'store_hero_fade_intensity', group: 'branding', label: 'Fade intensidad', type: 'number', value: '42' },
      { key: 'store_hero_fade_size', group: 'branding', label: 'Fade tama�o px', type: 'number', value: '96' },
      { key: 'store_hero_fade_hold', group: 'branding', label: 'Fade hold %', type: 'number', value: '12' },
      { key: 'store_hero_fade_mid_alpha', group: 'branding', label: 'Fade alpha medio', type: 'text', value: '0.58' },
      { key: 'mail_from_name', group: 'email', label: 'Nombre remitente email', type: 'text', value: 'NicoReparaciones' },
      { key: 'mail_from_address', group: 'email', label: 'Email remitente', type: 'email', value: '' },
    ];

    const byKey = new Map<string, AppSetting>(existing.map((s) => [s.key, s]));
    const merged = defaults.map((d) => {
      const found = byKey.get(d.key);
      return found
        ? {
            id: found.id,
            key: found.key,
            value: found.value ?? '',
            group: found.group,
            label: found.label ?? d.label,
            type: found.type ?? d.type,
            createdAt: found.createdAt.toISOString(),
            updatedAt: found.updatedAt.toISOString(),
          }
        : {
            id: null,
            key: d.key,
            value: d.value,
            group: d.group,
            label: d.label,
            type: d.type,
            createdAt: null,
            updatedAt: null,
          };
    });

    const extra = existing
      .filter((s) => !defaults.some((d) => d.key === s.key))
      .map((s) => ({
        id: s.id,
        key: s.key,
        value: s.value ?? '',
        group: s.group,
        label: s.label ?? s.key,
        type: s.type ?? 'text',
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }));

    return { items: [...merged, ...extra] };
  }

  async upsertSettings(input: Array<{ key: string; value?: string | null; group?: string; label?: string | null; type?: string | null }>) {
    const cleaned = input
      .map((i) => ({
        key: (i.key ?? '').trim(),
        value: i.value == null ? null : String(i.value),
        group: (i.group ?? 'general').trim() || 'general',
        label: i.label == null ? null : String(i.label).trim() || null,
        type: i.type == null ? 'text' : String(i.type).trim() || 'text',
      }))
      .filter((i) => i.key.length > 0);

    const results = [];
    for (const item of cleaned) {
      const createData: Prisma.AppSettingCreateInput = {
        key: item.key,
        value: item.value,
        group: item.group,
        label: item.label,
        type: item.type,
      };
      const updateData: Prisma.AppSettingUpdateInput = {
        value: item.value,
        group: item.group,
        label: item.label,
        type: item.type,
      };
      const saved = await this.prisma.appSetting.upsert({
        where: { key: item.key },
        create: createData,
        update: updateData,
      });
      results.push({
        id: saved.id,
        key: saved.key,
        value: saved.value ?? '',
        group: saved.group,
        label: saved.label,
        type: saved.type,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      });
    }
    return { items: results };
  }

  async mailTemplates() {
    const templates = [
      {
        templateKey: 'verify_email',
        label: 'Verificación de correo',
        description: 'Se envía al crear cuenta para verificar email.',
        subjectDefault: 'Verifica tu correo en {{business_name}}',
        bodyDefault:
          'Hola {{user_name}},\n\nUsa este enlace para verificar tu correo:\n{{verify_url}}\n\nSi no creaste esta cuenta, ignora este mensaje.',
      },
      {
        templateKey: 'reset_password',
        label: 'Recuperación de contraseña',
        description: 'Se envía cuando el usuario solicita restablecer contraseña.',
        subjectDefault: 'Recuperar contraseña en {{business_name}}',
        bodyDefault:
          'Hola {{user_name}},\n\nRecibimos una solicitud para restablecer tu contraseña.\nUsa este enlace:\n{{reset_url}}\n\nSi no fuiste vos, ignora este mensaje.',
      },
      {
        templateKey: 'order_created',
        label: 'Compra confirmada',
        description: 'Se envía al finalizar una compra.',
        subjectDefault: 'Recibimos tu pedido {{order_id}}',
        bodyDefault:
          'Hola {{user_name}},\n\nTu pedido {{order_id}} fue recibido correctamente.\nTotal: {{order_total}}\n\nGracias por tu compra.',
      },
    ];

    const keys = templates.flatMap((t) => [
      `mail_template.${t.templateKey}.subject`,
      `mail_template.${t.templateKey}.body`,
      `mail_template.${t.templateKey}.enabled`,
    ]);

    const existing = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      orderBy: { key: 'asc' },
    });

    const map = new Map<string, AppSetting>(existing.map((s) => [s.key, s]));
    return {
      items: templates.map((t) => {
        const subjectKey = `mail_template.${t.templateKey}.subject`;
        const bodyKey = `mail_template.${t.templateKey}.body`;
        const enabledKey = `mail_template.${t.templateKey}.enabled`;
        return {
          templateKey: t.templateKey,
          label: t.label,
          description: t.description,
          subject: map.get(subjectKey)?.value ?? t.subjectDefault,
          body: map.get(bodyKey)?.value ?? t.bodyDefault,
          enabled: (map.get(enabledKey)?.value ?? '1') !== '0',
          placeholders: this.mailTemplatePlaceholders(t.templateKey),
        };
      }),
    };
  }

  async upsertMailTemplates(
    input: Array<{ templateKey: string; subject: string; body: string; enabled?: boolean }>,
  ) {
    const allowed = new Set(['verify_email', 'reset_password', 'order_created']);
    const items = input.filter((i) => allowed.has(i.templateKey));
    const savedTemplates = [];

    for (const t of items) {
      const base = `mail_template.${t.templateKey}`;
      const upserts = [
        { key: `${base}.subject`, value: t.subject, type: 'text' },
        { key: `${base}.body`, value: t.body, type: 'textarea' },
        { key: `${base}.enabled`, value: t.enabled === false ? '0' : '1', type: 'boolean' },
      ];

      for (const s of upserts) {
        await this.prisma.appSetting.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            value: s.value,
            group: 'email_templates',
            label: s.key,
            type: s.type,
          },
          update: {
            value: s.value,
            group: 'email_templates',
            type: s.type,
          },
        });
      }

      savedTemplates.push(t.templateKey);
    }

    return { ok: true, savedTemplates };
  }

  private mailTemplatePlaceholders(templateKey: string) {
    const common = ['{{business_name}}', '{{user_name}}'];
    if (templateKey === 'verify_email') return [...common, '{{verify_url}}'];
    if (templateKey === 'reset_password') return [...common, '{{reset_url}}'];
    if (templateKey === 'order_created') return [...common, '{{order_id}}', '{{order_total}}'];
    return common;
  }

  async whatsappTemplates() {
    const templates = [
      {
        templateKey: 'repair_status_update',
        label: 'Actualización de reparación',
        description: 'Mensaje para avisar cambios de estado en reparaciones.',
        bodyDefault:
          'Hola {{customer_name}}, tu reparación {{repair_id}} ahora está en estado: {{repair_status}}. {{extra_message}}',
      },
      {
        templateKey: 'order_status_update',
        label: 'Actualización de pedido',
        description: 'Mensaje para avisar cambios de estado en pedidos.',
        bodyDefault:
          'Hola {{customer_name}}, tu pedido {{order_id}} ahora está: {{order_status}}. Total: {{order_total}}',
      },
    ];

    const keys = templates.flatMap((t) => [
      `whatsapp_template.${t.templateKey}.body`,
      `whatsapp_template.${t.templateKey}.enabled`,
    ]);
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      orderBy: { key: 'asc' },
    });
    const map = new Map(rows.map((r) => [r.key, r.value ?? '']));

    return {
      items: templates.map((t) => ({
        templateKey: t.templateKey,
        label: t.label,
        description: t.description,
        body: map.get(`whatsapp_template.${t.templateKey}.body`) || t.bodyDefault,
        enabled: (map.get(`whatsapp_template.${t.templateKey}.enabled`) || '1') !== '0',
        placeholders: this.whatsappTemplatePlaceholders(t.templateKey),
      })),
    };
  }

  async upsertWhatsappTemplates(input: Array<{ templateKey: string; body: string; enabled?: boolean }>) {
    const allowed = new Set(['repair_status_update', 'order_status_update']);
    const items = input.filter((i) => allowed.has(i.templateKey));
    for (const t of items) {
      const base = `whatsapp_template.${t.templateKey}`;
      await this.prisma.appSetting.upsert({
        where: { key: `${base}.body` },
        create: {
          key: `${base}.body`,
          value: t.body,
          group: 'whatsapp_templates',
          label: `${t.templateKey}.body`,
          type: 'textarea',
        },
        update: { value: t.body, group: 'whatsapp_templates', type: 'textarea' },
      });
      await this.prisma.appSetting.upsert({
        where: { key: `${base}.enabled` },
        create: {
          key: `${base}.enabled`,
          value: t.enabled === false ? '0' : '1',
          group: 'whatsapp_templates',
          label: `${t.templateKey}.enabled`,
          type: 'boolean',
        },
        update: { value: t.enabled === false ? '0' : '1', group: 'whatsapp_templates', type: 'boolean' },
      });
    }
    return { ok: true, savedTemplates: items.map((i) => i.templateKey) };
  }

  async whatsappLogs(params?: { channel?: string; status?: string; q?: string }) {
    const channel = (params?.channel ?? '').trim();
    const status = (params?.status ?? '').trim();
    const q = (params?.q ?? '').trim();

    const rows = await this.prisma.whatsAppLog.findMany({
      where: {
        ...(channel ? { channel } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { recipient: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { templateKey: { contains: q, mode: 'insensitive' } },
                { targetId: { contains: q, mode: 'insensitive' } },
                { message: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return {
      items: rows.map((r: WhatsAppLog) => ({
        id: r.id,
        channel: r.channel,
        templateKey: r.templateKey,
        targetType: r.targetType,
        targetId: r.targetId,
        phone: r.phone,
        recipient: r.recipient,
        status: r.status,
        message: r.message,
        meta: this.parseJson(r.metaJson),
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async createWhatsappLog(input: {
    channel?: string;
    templateKey?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    phone?: string | null;
    recipient?: string | null;
    status?: string;
    message?: string | null;
    meta?: Record<string, unknown> | null;
  }) {
    const row = await this.prisma.whatsAppLog.create({
      data: {
        channel: (input.channel ?? '').trim() || 'general',
        templateKey: this.cleanNullable(input.templateKey),
        targetType: this.cleanNullable(input.targetType),
        targetId: this.cleanNullable(input.targetId),
        phone: this.cleanNullable(input.phone),
        recipient: this.cleanNullable(input.recipient),
        status: (input.status ?? '').trim() || 'SENT',
        message: this.cleanNullable(input.message),
        metaJson: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
    return {
      item: {
        id: row.id,
        channel: row.channel,
        templateKey: row.templateKey,
        targetType: row.targetType,
        targetId: row.targetId,
        phone: row.phone,
        recipient: row.recipient,
        status: row.status,
        message: row.message,
        meta: this.parseJson(row.metaJson),
        createdAt: row.createdAt.toISOString(),
      },
    };
  }

  async helpFaqList(params?: { q?: string; active?: string; category?: string }) {
    const q = (params?.q ?? '').trim();
    const category = (params?.category ?? '').trim();
    const active = (params?.active ?? '').trim();
    const rows = await this.prisma.helpFaqItem.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(active === '1' ? { active: true } : active === '0' ? { active: false } : {}),
        ...(q
          ? {
              OR: [
                { question: { contains: q, mode: 'insensitive' } },
                { answer: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 300,
    });

    return {
      items: rows.map((r: HelpFaqItem) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        category: r.category ?? 'general',
        active: r.active,
        sortOrder: r.sortOrder,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async helpFaqCreate(input: { question: string; answer: string; category?: string | null; active?: boolean; sortOrder?: number }) {
    const row = await this.prisma.helpFaqItem.create({
      data: {
        question: input.question.trim(),
        answer: input.answer.trim(),
        category: this.cleanNullable(input.category) ?? 'general',
        active: input.active ?? true,
        sortOrder: Number(input.sortOrder ?? 0),
      },
    });
    return { item: this.serializeHelpFaq(row) };
  }

  async helpFaqUpdate(
    id: string,
    input: Partial<{ question: string; answer: string; category: string | null; active: boolean; sortOrder: number }>,
  ) {
    const data: Prisma.HelpFaqItemUpdateInput = {};
    if (input.question !== undefined) data.question = input.question.trim();
    if (input.answer !== undefined) data.answer = input.answer.trim();
    if (input.category !== undefined) data.category = this.cleanNullable(input.category) ?? 'general';
    if (input.active !== undefined) data.active = input.active;
    if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder ?? 0);

    const row = await this.prisma.helpFaqItem.update({
      where: { id },
      data,
    });
    return { item: this.serializeHelpFaq(row) };
  }

  private whatsappTemplatePlaceholders(templateKey: string) {
    if (templateKey === 'repair_status_update') {
      return ['{{customer_name}}', '{{repair_id}}', '{{repair_status}}', '{{extra_message}}'];
    }
    if (templateKey === 'order_status_update') {
      return ['{{customer_name}}', '{{order_id}}', '{{order_status}}', '{{order_total}}'];
    }
    return ['{{customer_name}}'];
  }

  private parseJson(value?: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private parseUserRole(value?: string | null): UserRole | null {
    const normalized = (value ?? '').trim().toUpperCase();
    return normalized === 'USER' || normalized === 'ADMIN' ? (normalized as UserRole) : null;
  }

  private serializeHelpFaq(r: HelpFaqItem) {
    return {
      id: r.id,
      question: r.question,
      answer: r.answer,
      category: r.category ?? 'general',
      active: r.active,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}


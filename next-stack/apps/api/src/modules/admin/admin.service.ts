import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, type AppSetting, type HelpFaqItem, type UserRole, type WhatsAppLog } from '@prisma/client';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailService) private readonly mailService: MailService,
  ) {}
  private readonly openRepairStatuses = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP'] as const;
  private readonly pendingOrderStatuses = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO'] as const;
  private readonly brandAssetSlots = {
    favicon_ico: { settingKey: 'brand_asset.favicon_ico.path', defaultPath: 'favicon.ico', fileBase: 'favicon-ico', maxKb: 1024, allowedExts: ['ico'] },
    favicon_16: { settingKey: 'brand_asset.favicon_16.path', defaultPath: 'favicon-16x16.png', fileBase: 'favicon-16x16', maxKb: 1024, allowedExts: ['png', 'ico', 'webp'] },
    favicon_32: { settingKey: 'brand_asset.favicon_32.path', defaultPath: 'favicon-32x32.png', fileBase: 'favicon-32x32', maxKb: 1024, allowedExts: ['png', 'ico', 'webp'] },
    android_192: { settingKey: 'brand_asset.android_192.path', defaultPath: 'android-chrome-192x192.png', fileBase: 'android-192', maxKb: 2048, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
    android_512: { settingKey: 'brand_asset.android_512.path', defaultPath: 'android-chrome-512x512.png', fileBase: 'android-512', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
    apple_touch: { settingKey: 'brand_asset.apple_touch.path', defaultPath: 'apple-touch-icon.png', fileBase: 'apple-touch', maxKb: 2048, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
    store_hero_desktop: { settingKey: 'store_hero_image_desktop', defaultPath: '', fileBase: 'store-hero-desktop', maxKb: 6144, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
    store_hero_mobile: { settingKey: 'store_hero_image_mobile', defaultPath: '', fileBase: 'store-hero-mobile', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp'] },
    icon_settings: { settingKey: 'brand_asset.icon_settings.path', defaultPath: 'icons/settings.svg', fileBase: 'icon-settings', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_carrito: { settingKey: 'brand_asset.icon_carrito.path', defaultPath: 'icons/carrito.svg', fileBase: 'icon-carrito', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_logout: { settingKey: 'brand_asset.icon_logout.path', defaultPath: 'icons/logout.svg', fileBase: 'icon-logout', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_consultar_reparacion: { settingKey: 'brand_asset.icon_consultar_reparacion.path', defaultPath: 'icons/consultar-reparacion.svg', fileBase: 'icon-consultar-reparacion', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_mis_pedidos: { settingKey: 'brand_asset.icon_mis_pedidos.path', defaultPath: 'icons/mis-pedidos.svg', fileBase: 'icon-mis-pedidos', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_mis_reparaciones: { settingKey: 'brand_asset.icon_mis_reparaciones.path', defaultPath: 'icons/mis-reparaciones.svg', fileBase: 'icon-mis-reparaciones', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_dashboard: { settingKey: 'brand_asset.icon_dashboard.path', defaultPath: 'icons/dashboard.svg', fileBase: 'icon-dashboard', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    icon_tienda: { settingKey: 'brand_asset.icon_tienda.path', defaultPath: 'icons/tienda.svg', fileBase: 'icon-tienda', maxKb: 2048, allowedExts: ['svg', 'png', 'jpg', 'jpeg', 'webp'] },
    logo_principal: { settingKey: 'brand_asset.logo_principal.path', defaultPath: 'brand/logo.png', fileBase: 'logo-principal', maxKb: 4096, allowedExts: ['png', 'jpg', 'jpeg', 'webp', 'svg'] },
  } as const;

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
    if (ordersPending > 0) alerts.push({ id: 'orders-pending', severity: 'medium', title: 'Pedidos pendientes/preparaciÃ³n', value: ordersPending });

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
      return { message: 'Rol invÃ¡lido' };
    }

    if (actorUserId && actorUserId === targetUserId && role !== 'ADMIN') {
      return { message: 'No podÃ©s quitarte el rol admin a vos mismo' };
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
      { key: 'shop_phone', group: 'business', label: 'Teléfono WhatsApp', type: 'text', value: '' },
      { key: 'shop_email', group: 'business', label: 'Email del local', type: 'email', value: '' },
      { key: 'store_hero_title', group: 'branding', label: 'Título portada tienda', type: 'text', value: '' },
      { key: 'store_hero_subtitle', group: 'branding', label: 'SubTítulo portada tienda', type: 'textarea', value: '' },
      { key: 'store_hero_image_desktop', group: 'branding', label: 'Imagen portada tienda (desktop)', type: 'text', value: '' },
      { key: 'store_hero_image_mobile', group: 'branding', label: 'Imagen portada tienda (mobile)', type: 'text', value: '' },
      { key: 'store_hero_fade_rgb_desktop', group: 'branding', label: 'Fade portada desktop (RGB)', type: 'text', value: '14, 165, 233' },
      { key: 'store_hero_fade_rgb_mobile', group: 'branding', label: 'Fade portada mobile (RGB)', type: 'text', value: '14, 165, 233' },
      { key: 'store_hero_fade_intensity', group: 'branding', label: 'Fade intensidad', type: 'number', value: '42' },
      { key: 'store_hero_fade_size', group: 'branding', label: 'Fade tamaño px', type: 'number', value: '96' },
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

  async sendWeeklyDashboardReportNow(rangeDaysRaw?: number | null) {
    const configuredRange = Number(await this.getAppSettingValue('ops_weekly_report_range_days', '30'));
    const rangeDays = [7, 30, 90].includes(Number(rangeDaysRaw)) ? Number(rangeDaysRaw) : ([7, 30, 90].includes(configuredRange) ? configuredRange : 30);
    const recipients = await this.resolveWeeklyReportRecipients();
    if (recipients.length === 0) {
      throw new BadRequestException('No hay destinatarios configurados para el reporte semanal');
    }

    const dashboard = await this.dashboard();
    const now = new Date();
    const businessName = await this.getAppSettingValue('business_name', 'NicoReparaciones');

    const text = [
      `Reporte semanal dashboard ${businessName}`,
      `Fecha: ${now.toISOString()}`,
      `Rango: ultimos ${rangeDays} dias`,
      '',
      'KPIs',
      `Productos totales: ${dashboard.metrics.products.total}`,
      `Productos activos: ${dashboard.metrics.products.active}`,
      `Stock bajo: ${dashboard.metrics.products.lowStock}`,
      `Sin stock: ${dashboard.metrics.products.outOfStock}`,
      `Reparaciones abiertas: ${dashboard.metrics.repairs.open}`,
      `Reparaciones listas para retiro: ${dashboard.metrics.repairs.readyPickup}`,
      `Pedidos en flujo pendiente: ${dashboard.metrics.orders.pendingFlow}`,
      `Facturacion mes: ${dashboard.metrics.orders.revenueMonth}`,
      '',
      'Alertas activas',
      ...(dashboard.alerts.length ? dashboard.alerts.map((a) => `- ${a.title}: ${a.value} (${a.severity})`) : ['- Sin alertas activas']),
    ].join('\n');

    const sendRes = await this.mailService.sendText({
      to: recipients,
      subject: `Reporte semanal dashboard ${businessName}`,
      text,
    });

    return {
      ok: true,
      status: 'simulated' in sendRes && sendRes.simulated ? 'dry_run' : 'sent',
      recipients,
      rangeDays,
    };
  }

  async sendOperationalAlertsNow() {
    const now = new Date();
    const recipients = await this.resolveOperationalAlertRecipients();
    if (recipients.length === 0) {
      await this.persistOperationalAlertsRun('failed', '', { orders: 0, repairs: 0 }, 'No recipients configured');
      throw new BadRequestException('No hay destinatarios configurados para alertas operativas');
    }

    const orderStaleHours = Math.max(1, Math.min(720, Number(await this.getAppSettingValue('ops_alert_order_stale_hours', '24')) || 24));
    const repairStaleDays = Math.max(1, Math.min(180, Number(await this.getAppSettingValue('ops_alert_repair_stale_days', '3')) || 3));
    const dedupeMinutes = Math.max(5, Math.min(10080, Number(await this.getAppSettingValue('ops_operational_alerts_dedupe_minutes', '360')) || 360));

    const staleOrdersCutoff = new Date(now.getTime() - orderStaleHours * 60 * 60 * 1000);
    const staleRepairsCutoff = new Date(now.getTime() - repairStaleDays * 24 * 60 * 60 * 1000);
    const [orders, repairs] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: [...this.pendingOrderStatuses] }, updatedAt: { lte: staleOrdersCutoff } },
        orderBy: { updatedAt: 'asc' },
        take: 100,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.repair.findMany({
        where: { status: { in: [...this.openRepairStatuses] }, updatedAt: { lte: staleRepairsCutoff } },
        orderBy: { updatedAt: 'asc' },
        take: 100,
      }),
    ]);
    const summary = { orders: orders.length, repairs: repairs.length };

    const lastStatus = await this.getAppSettingValue('ops_operational_alerts_last_status', '');
    const lastRunAtRaw = await this.getAppSettingValue('ops_operational_alerts_last_run_at', '');
    const lastSummaryRaw = await this.getAppSettingValue('ops_operational_alerts_last_summary', '{}');
    let lastSummary: { orders?: number; repairs?: number } = {};
    try {
      lastSummary = JSON.parse(lastSummaryRaw || '{}') ?? {};
    } catch {
      lastSummary = {};
    }
    const lastRunAt = lastRunAtRaw ? new Date(lastRunAtRaw) : null;
    const dedupeCutoff = new Date(now.getTime() - dedupeMinutes * 60_000);
    const deduped =
      !!lastRunAt &&
      !Number.isNaN(lastRunAt.getTime()) &&
      lastRunAt >= dedupeCutoff &&
      lastStatus === 'sent' &&
      Number(lastSummary.orders ?? 0) === summary.orders &&
      Number(lastSummary.repairs ?? 0) === summary.repairs;

    if (deduped) {
      await this.persistOperationalAlertsRun('deduped', recipients.join(', '), summary, '');
      return { ok: true, status: 'deduped', recipients, summary };
    }

    if (summary.orders === 0 && summary.repairs === 0) {
      await this.persistOperationalAlertsRun('no_alerts', recipients.join(', '), summary, '');
      return { ok: true, status: 'no_alerts', recipients, summary };
    }

    const text = [
      'Alertas operativas NicoReparaciones',
      `Fecha: ${now.toISOString()}`,
      `Pedidos alertados: ${summary.orders}`,
      `Reparaciones alertadas: ${summary.repairs}`,
      '',
      'Pedidos',
      ...(orders.length ? orders.map((o) => `- ${o.id} | ${o.status} | ${o.user?.name ?? 'Sin usuario'} | ${o.updatedAt.toISOString()}`) : ['- Sin pedidos alertados']),
      '',
      'Reparaciones',
      ...(repairs.length ? repairs.map((r) => `- ${r.id} | ${r.status} | ${r.customerName} | ${r.updatedAt.toISOString()}`) : ['- Sin reparaciones alertadas']),
    ].join('\n');

    try {
      const sendRes = await this.mailService.sendText({
        to: recipients,
        subject: `Alertas operativas: ${summary.orders} pedidos / ${summary.repairs} reparaciones`,
        text,
      });
      const status = 'simulated' in sendRes && sendRes.simulated ? 'dry_run' : 'sent';
      await this.persistOperationalAlertsRun(status, recipients.join(', '), summary, '');
      return { ok: true, status, recipients, summary };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error enviando alertas';
      await this.persistOperationalAlertsRun('failed', recipients.join(', '), summary, msg);
      throw e;
    }
  }

  async smtpStatus(defaultToEmail?: string | null) {
    const smtpHealth = await this.mailService.smtpHealth();
    return {
      smtpDefaultTo: (defaultToEmail ?? '').trim(),
      smtpHealth,
    };
  }

  async sendSmtpTestEmail(to: string) {
    const dest = to.trim();
    if (!dest) throw new BadRequestException('Email destino requerido');
    const businessName = await this.getAppSettingValue('business_name', 'NicoReparaciones');
    const smtpHealth = await this.mailService.smtpHealth();
    const sendRes = await this.mailService.sendText({
      to: dest,
      subject: `Prueba SMTP - ${businessName}`,
      text: [
        `Prueba SMTP de ${businessName}`,
        '',
        'Si recibiste este correo, la configuracion de mail del sistema responde correctamente.',
        `Fecha: ${new Date().toISOString()}`,
        `Estado actual SMTP: ${smtpHealth.label}`,
      ].join('\n'),
    });
    return {
      ok: true,
      sentTo: dest,
      status: 'simulated' in sendRes && sendRes.simulated ? 'dry_run' : 'sent',
      smtpHealth,
    };
  }

  async mailTemplates() {
    const templates = [
      {
        templateKey: 'verify_email',
        label: 'VerificaciÃ³n de correo',
        description: 'Se envÃ­a al crear cuenta para verificar email.',
        subjectDefault: 'Verifica tu correo en {{business_name}}',
        bodyDefault:
          'Hola {{user_name}},\n\nUsa este enlace para verificar tu correo:\n{{verify_url}}\n\nSi no creaste esta cuenta, ignora este mensaje.',
      },
      {
        templateKey: 'reset_password',
        label: 'RecuperaciÃ³n de contraseÃ±a',
        description: 'Se envÃ­a cuando el usuario solicita restablecer contraseÃ±a.',
        subjectDefault: 'Recuperar contraseÃ±a en {{business_name}}',
        bodyDefault:
          'Hola {{user_name}},\n\nRecibimos una solicitud para restablecer tu contraseÃ±a.\nUsa este enlace:\n{{reset_url}}\n\nSi no fuiste vos, ignora este mensaje.',
      },
      {
        templateKey: 'order_created',
        label: 'Compra confirmada',
        description: 'Se envÃ­a al finalizar una compra.',
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
        label: 'ActualizaciÃ³n de reparaciÃ³n',
        description: 'Mensaje para avisar cambios de estado en reparaciones.',
        bodyDefault:
          'Hola {{customer_name}}, tu reparaciÃ³n {{repair_id}} ahora estÃ¡ en estado: {{repair_status}}. {{extra_message}}',
      },
      {
        templateKey: 'order_status_update',
        label: 'ActualizaciÃ³n de pedido',
        description: 'Mensaje para avisar cambios de estado en pedidos.',
        bodyDefault:
          'Hola {{customer_name}}, tu pedido {{order_id}} ahora estÃ¡: {{order_status}}. Total: {{order_total}}',
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

  async uploadBrandAsset(
    slot: string,
    file: { originalname: string; mimetype: string; size: number; buffer?: Buffer | Uint8Array },
  ) {
    const spec = this.brandAssetSlots[slot as keyof typeof this.brandAssetSlots];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');
    const ext = this.detectFileExt(file.originalname);
    const allowedExts = spec.allowedExts as readonly string[];
    if (!ext || !allowedExts.includes(ext)) {
      throw new BadRequestException(`Formato no permitido. Permitidos: ${allowedExts.join(', ')}`);
    }
    if (!file.buffer || !Buffer.isBuffer(file.buffer)) throw new BadRequestException('Archivo invalido');
    if (file.size > spec.maxKb * 1024) throw new BadRequestException(`Archivo supera el maximo (${spec.maxKb} KB)`);

    const publicRoot = this.resolveWebPublicDir();
    const relPath = `brand-assets/identity/${spec.fileBase}.${ext}`;
    const absPath = path.join(publicRoot, ...relPath.split('/'));
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, file.buffer);
    await this.upsertSingleSetting(spec.settingKey, relPath, 'branding_assets', spec.settingKey, 'text');

    return {
      ok: true,
      slot,
      settingKey: spec.settingKey,
      path: relPath,
      url: this.toAbsoluteAssetUrl(relPath),
      file: { originalName: file.originalname, mimeType: file.mimetype, size: file.size },
    };
  }

  async resetBrandAsset(slot: string) {
    const spec = this.brandAssetSlots[slot as keyof typeof this.brandAssetSlots];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');

    const publicRoot = this.resolveWebPublicDir();
    const identityDir = path.join(publicRoot, 'brand-assets', 'identity');
    for (const ext of spec.allowedExts as readonly string[]) {
      try {
        await unlink(path.join(identityDir, `${spec.fileBase}.${ext}`));
      } catch {
        // ignore
      }
    }

    await this.upsertSingleSetting(spec.settingKey, spec.defaultPath || '', 'branding_assets', spec.settingKey, 'text');
    return {
      ok: true,
      slot,
      settingKey: spec.settingKey,
      path: spec.defaultPath || '',
      url: spec.defaultPath ? this.toAbsoluteAssetUrl(spec.defaultPath) : null,
      resetToDefault: true,
    };
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

  private async upsertSingleSetting(key: string, value: string, group: string, label: string, type: string) {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: { key, value, group, label, type },
      update: { value, group, label, type },
    });
  }

  private detectFileExt(filename: string) {
    const ext = path.extname(filename || '').replace('.', '').trim().toLowerCase();
    return ext || null;
  }

  private resolveWebPublicDir() {
    const cwd = process.cwd();
    const candidates = [
      path.resolve(cwd, 'apps/web/public'),
      path.resolve(cwd, '../web/public'),
      path.resolve(cwd, '../../apps/web/public'),
    ];
    const found = candidates.find((p) => existsSync(p));
    if (!found) throw new Error('No se pudo resolver apps/web/public');
    return found;
  }

  private toAbsoluteAssetUrl(rawPath: string) {
    const normalized = `/${rawPath.replace(/^\/+/, '')}`;
    const base = ((process.env.API_URL ?? '').trim() || 'http://127.0.0.1:3001').replace(/\/+$/, '');
    return `${base}${normalized}`;
  }

  private async getAppSettingValue(key: string, fallback = '') {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  }

  private parseEmailList(raw: string) {
    const seen = new Set<string>();
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.includes('@'))
      .filter((v) => {
        const k = v.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  }

  private async resolveWeeklyReportRecipients() {
    return this.parseEmailList(await this.getAppSettingValue('ops_weekly_report_emails', ''));
  }

  private async resolveOperationalAlertRecipients() {
    const direct = this.parseEmailList(await this.getAppSettingValue('ops_operational_alerts_emails', ''));
    if (direct.length) return direct;

    const weekly = await this.resolveWeeklyReportRecipients();
    if (weekly.length) return weekly;

    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
      take: 50,
    });
    return this.parseEmailList(admins.map((a) => a.email).join(','));
  }

  private async persistOperationalAlertsRun(
    status: string,
    recipients: string,
    summary: { orders: number; repairs: number },
    error: string,
  ) {
    await this.upsertSettings([
      { key: 'ops_operational_alerts_last_status', value: status, group: 'ops_reports', label: 'Operational alerts last status', type: 'text' },
      { key: 'ops_operational_alerts_last_run_at', value: new Date().toISOString(), group: 'ops_reports', label: 'Operational alerts last run at', type: 'text' },
      { key: 'ops_operational_alerts_last_recipients', value: recipients, group: 'ops_reports', label: 'Operational alerts last recipients', type: 'text' },
      { key: 'ops_operational_alerts_last_summary', value: JSON.stringify(summary), group: 'ops_reports', label: 'Operational alerts last summary', type: 'json' },
      { key: 'ops_operational_alerts_last_error', value: error, group: 'ops_reports', label: 'Operational alerts last error', type: 'text' },
    ]);
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



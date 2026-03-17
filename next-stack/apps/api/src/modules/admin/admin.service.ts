import { BadGatewayException, BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type AppSetting, type HelpFaqItem, type UserRole, type WhatsAppLog } from '@prisma/client';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';

type SupplierRegistryRow = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  active: boolean;
  searchPriority: number;
  searchEnabled: boolean;
  searchMode: 'json' | 'html';
  searchEndpoint: string | null;
  searchConfigJson: string | null;
  lastProbeStatus: 'ok' | 'none';
  lastProbeQuery: string | null;
  lastProbeCount: number;
  lastProbeError: string | null;
  lastProbeAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type WarrantyIncidentRegistryRow = {
  id: string;
  sourceType: 'repair' | 'product';
  status: 'open' | 'closed';
  title: string;
  reason: string | null;
  repairId: string | null;
  productId: string | null;
  orderId: string | null;
  supplierId: string | null;
  quantity: number;
  unitCost: number;
  costOrigin: 'manual' | 'repair' | 'product';
  extraCost: number;
  recoveredAmount: number;
  lossAmount: number;
  happenedAt: string;
  resolvedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type AccountingEntryRow = {
  id: string;
  happenedAt: string;
  direction: 'inflow' | 'outflow';
  category: string;
  description: string;
  source: string;
  amount: number;
};

type SupplierPartSearchInput = {
  q: string;
  limit?: number;
};

type SupplierPartAggregateSearchInput = {
  q: string;
  supplierId?: string | null;
  limitPerSupplier?: number;
  totalLimit?: number;
};

type NormalizedSupplierPart = {
  externalPartId: string;
  name: string;
  sku: string | null;
  brand: string | null;
  price: number | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  url: string | null;
  rawLabel: string | null;
};

type NormalizedSupplierPartWithProvider = NormalizedSupplierPart & {
  supplier: {
    id: string;
    name: string;
    priority: number;
    endpoint: string | null;
    mode: 'json' | 'html';
  };
};

type ProviderPartSearchOutcome = {
  supplier: SupplierRegistryRow;
  query: string;
  url: string;
  items: NormalizedSupplierPart[];
  error: string | null;
};

const DEFAULT_SUPPLIER_CATALOG: Array<
  Pick<
    SupplierRegistryRow,
    'name' | 'searchPriority' | 'searchMode' | 'searchEnabled' | 'searchEndpoint' | 'searchConfigJson'
  >
> = [
  {
    name: 'PuntoCell',
    searchPriority: 10,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://www.puntocell.com.ar/shop?search={query}',
    searchConfigJson:
      '{"item_regex":"<div class=\\"oe_product[\\\\s\\\\S]*?<\\\\/form>\\\\s*<\\\\/div>","name_regex":"o_wsale_products_item_title[\\\\s\\\\S]*?<a[^>]*>(.*?)<\\\\/a>","price_regex":"(?:\\\\$|ARS)[^0-9]{0,120}([0-9\\\\.,]+)","url_regex":"href=\\"([^\\"]*\\\\/shop\\\\/\\\\d+\\\\-[^\\"]+)\\"","context_window":12000}',
  },
  {
    name: 'Evophone',
    searchPriority: 20,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://www.evophone.com.ar/?s={query}&post_type=product&dgwt_wcas=1',
    searchConfigJson:
      '{"profile":"woodmart","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart=","yoast.com/product/"],"context_window":2200}',
  },
  {
    name: 'Celuphone',
    searchPriority: 30,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://celuphone.com.ar/?s={query}&post_type=product&dgwt_wcas=1',
    searchConfigJson:
      '{"profile":"shoptimizer","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":2200}',
  },
  {
    name: 'Okey Rosario',
    searchPriority: 40,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://okeyrosario.com.ar/?s={query}&post_type=product',
    searchConfigJson:
      '{"profile":"flatsome","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart=","yoast.com/product/"],"context_window":1800}',
  },
  {
    name: 'Novocell',
    searchPriority: 45,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://www.novocell.com.ar/search?q={query}',
    searchConfigJson:
      '{"profile":"wix","candidate_paths":["/product-page/"],"exclude_paths":[],"context_window":2400}',
  },
  {
    name: 'Electrostore',
    searchPriority: 50,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://electrostore.com.ar/?s={query}&post_type=product',
    searchConfigJson:
      '{"profile":"flatsome","candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart=","yoast.com/product/"],"context_window":1800}',
  },
  {
    name: 'El Reparador de PC',
    searchPriority: 60,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://www.elreparadordepc.com/search_producto?term={query}',
    searchConfigJson:
      '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria","/carrito","/deseos"],"candidate_url_regex":"\\\\/producto\\\\/\\\\d+","context_window":12000}',
  },
  {
    name: 'Tienda Movil Rosario',
    searchPriority: 70,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://tiendamovilrosario.com.ar/?s={query}&post_type=product',
    searchConfigJson:
      '{"candidate_paths":["/product/"],"exclude_paths":["/product-category/","add-to-cart="],"context_window":12000}',
  },
];

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(WhatsappService) private readonly whatsappService: WhatsappService,
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
      return { message: 'Rol invalido' };
    }

    if (actorUserId && actorUserId === targetUserId && role !== 'ADMIN') {
      return { message: 'No podes quitarte el rol admin a vos mismo' };
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
      { key: 'shop_phone', group: 'business', label: 'Telefono WhatsApp', type: 'text', value: '' },
      { key: 'shop_email', group: 'business', label: 'Email del local', type: 'email', value: '' },
      { key: 'store_hero_title', group: 'branding', label: 'Titulo portada tienda', type: 'text', value: '' },
      { key: 'store_hero_subtitle', group: 'branding', label: 'SubTitulo portada tienda', type: 'textarea', value: '' },
      { key: 'store_hero_image_desktop', group: 'branding', label: 'Imagen portada tienda (desktop)', type: 'text', value: '' },
      { key: 'store_hero_image_mobile', group: 'branding', label: 'Imagen portada tienda (mobile)', type: 'text', value: '' },
      { key: 'store_hero_fade_rgb_desktop', group: 'branding', label: 'Fade portada desktop (RGB)', type: 'text', value: '14, 165, 233' },
      { key: 'store_hero_fade_rgb_mobile', group: 'branding', label: 'Fade portada mobile (RGB)', type: 'text', value: '14, 165, 233' },
      { key: 'store_hero_fade_intensity', group: 'branding', label: 'Fade intensidad', type: 'number', value: '42' },
      { key: 'store_hero_fade_size', group: 'branding', label: 'Fade tamano px', type: 'number', value: '96' },
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

  async deviceTypes() {
    const items = await this.prisma.deviceType.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return {
      items: items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, active: i.active })),
    };
  }

  async createDeviceType(input: { name: string; active?: boolean }) {
    const name = input.name.trim();
    const slugBase = this.slugify(name) || 'tipo';
    let slug = slugBase;
    let idx = 2;
    while (await this.prisma.deviceType.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${idx++}`;
    }
    const item = await this.prisma.deviceType.create({
      data: { name, slug, active: input.active ?? true },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async updateDeviceType(id: string, input: { name?: string; active?: boolean }) {
    const item = await this.prisma.deviceType.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async modelGroups(deviceBrandIdRaw: string) {
    const deviceBrandId = (deviceBrandIdRaw ?? '').trim();
    if (!deviceBrandId) return { groups: [], models: [] };

    const brand = await this.prisma.deviceBrand.findUnique({ where: { id: deviceBrandId } });
    if (!brand) throw new BadRequestException('Marca no encontrada');

    const groups = await this.prisma.deviceModelGroup.findMany({
      where: { deviceBrandId },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    const models = await this.prisma.deviceModel.findMany({
      where: { brandId: deviceBrandId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, active: true, deviceModelGroupId: true },
    });

    return {
      groups: groups.map((g) => ({ id: g.id, name: g.name, slug: g.slug, active: g.active })),
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        active: m.active,
        deviceModelGroupId: m.deviceModelGroupId ?? null,
      })),
    };
  }

  async createModelGroup(input: { deviceBrandId: string; name: string; active?: boolean }) {
    const brand = await this.prisma.deviceBrand.findUnique({ where: { id: input.deviceBrandId } });
    if (!brand) throw new BadRequestException('Marca no encontrada');

    const name = input.name.trim();
    const slugBase = this.slugify(name) || 'grupo';
    let slug = slugBase;
    let idx = 2;
    while (
      await this.prisma.deviceModelGroup.findFirst({
        where: { deviceBrandId: input.deviceBrandId, slug },
        select: { id: true },
      })
    ) slug = `${slugBase}-${idx++}`;
    const item = await this.prisma.deviceModelGroup.create({
      data: {
        deviceBrandId: input.deviceBrandId,
        name,
        slug,
        active: input.active ?? true,
      },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async updateModelGroup(id: string, input: { deviceBrandId: string; name?: string; active?: boolean }) {
    const existing = await this.prisma.deviceModelGroup.findUnique({ where: { id } });
    if (!existing || existing.deviceBrandId !== input.deviceBrandId) throw new BadRequestException('Grupo no encontrado');
    const item = await this.prisma.deviceModelGroup.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.active != null ? { active: input.active } : {}),
      },
    });
    return { item: { id: item.id, name: item.name, slug: item.slug, active: item.active } };
  }

  async assignModelGroup(modelId: string, input: { deviceBrandId: string; deviceModelGroupId?: string | null }) {
    const model = await this.prisma.deviceModel.findUnique({ where: { id: modelId }, select: { id: true, brandId: true } });
    if (!model) throw new BadRequestException('Modelo no encontrado');
    if (model.brandId !== input.deviceBrandId) throw new BadRequestException('Modelo no pertenece a la marca seleccionada');

    const groupId = (input.deviceModelGroupId ?? '').trim() || null;
    if (groupId) {
      const group = await this.prisma.deviceModelGroup.findUnique({ where: { id: groupId } });
      if (!group || group.deviceBrandId !== input.deviceBrandId) throw new BadRequestException('Grupo invalido para esta marca');
    }
    await this.prisma.deviceModel.update({
      where: { id: modelId },
      data: { deviceModelGroupId: groupId },
    });
    return { ok: true };
  }

  async providers(params?: { q?: string; active?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const activeRaw = (params?.active ?? '').trim().toLowerCase();
    const suppliers = await this.readSuppliersRegistry();
    const incidents = await this.readWarrantyIncidentsRegistry();
    const statsByProvider = this.buildProviderStats(incidents);

    const filtered = suppliers
      .filter((row) => {
        if (activeRaw === '1' || activeRaw === 'true') return row.active;
        if (activeRaw === '0' || activeRaw === 'false') return !row.active;
        return true;
      })
      .filter((row) => {
        if (!q) return true;
        return (
          row.name.toLowerCase().includes(q) ||
          (row.phone ?? '').toLowerCase().includes(q) ||
          (row.notes ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        if (a.searchPriority !== b.searchPriority) return a.searchPriority - b.searchPriority;
        return a.name.localeCompare(b.name, 'es');
      });

    const productCounts = await this.countProductsBySupplierIds(filtered.map((row) => row.id));
    const items = filtered.map((row) =>
      this.serializeProvider(row, statsByProvider.get(row.id), productCounts.get(row.id) ?? 0),
    );
    const summary = {
      total: items.length,
      active: items.filter((i) => i.active).length,
      incidents: items.reduce((acc, i) => acc + i.incidents, 0),
      openIncidents: items.reduce((acc, i) => acc + i.warrantiesExpired, 0),
      closedIncidents: items.reduce((acc, i) => acc + i.warrantiesOk, 0),
      accumulatedLoss: items.reduce((acc, i) => acc + i.loss, 0),
    };
    return { items, summary };
  }

  async createProvider(input: {
    name: string;
    phone?: string | null;
    notes?: string | null;
    searchPriority?: number;
    searchEnabled?: boolean;
    searchMode?: 'json' | 'html';
    searchEndpoint?: string | null;
    searchConfigJson?: string | null;
    active?: boolean;
  }) {
    const items = await this.readSuppliersRegistry();
    const name = input.name.trim();
    if (!name) throw new BadRequestException('Nombre requerido');
    if (items.some((i) => i.name.trim().toLowerCase() === name.toLowerCase())) {
      throw new BadRequestException('Ya existe un proveedor con ese nombre');
    }
    const now = new Date().toISOString();
    const next: SupplierRegistryRow = {
      id: this.randomEntityId('sup'),
      name,
      phone: this.cleanNullable(input.phone),
      notes: this.cleanNullable(input.notes),
      active: input.active ?? true,
      searchPriority: this.clampInt(input.searchPriority ?? 100, 1, 99999),
      searchEnabled: input.searchEnabled ?? false,
      searchMode: input.searchMode === 'json' ? 'json' : 'html',
      searchEndpoint: this.cleanNullable(input.searchEndpoint),
      searchConfigJson: this.normalizeJsonString(input.searchConfigJson),
      lastProbeStatus: 'none',
      lastProbeQuery: null,
      lastProbeCount: 0,
      lastProbeError: null,
      lastProbeAt: null,
      createdAt: now,
      updatedAt: now,
    };
    items.push(next);
    await this.writeSuppliersRegistry(items);
    return { item: this.serializeProvider(next, this.emptyProviderStats(), 0) };
  }

  async updateProvider(
    id: string,
    input: Partial<{
      name: string;
      phone: string | null;
      notes: string | null;
      searchPriority: number;
      searchEnabled: boolean;
      searchMode: 'json' | 'html';
      searchEndpoint: string | null;
      searchConfigJson: string | null;
      active: boolean;
    }>,
  ) {
    const items = await this.readSuppliersRegistry();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) throw new BadRequestException('Proveedor no encontrado');

    const current = items[index];
    const nextName = input.name != null ? input.name.trim() : current.name;
    if (!nextName) throw new BadRequestException('Nombre requerido');
    const duplicated = items.some((i) => i.id !== id && i.name.trim().toLowerCase() === nextName.toLowerCase());
    if (duplicated) throw new BadRequestException('Ya existe un proveedor con ese nombre');

    const updated: SupplierRegistryRow = {
      ...current,
      name: nextName,
      phone: input.phone !== undefined ? this.cleanNullable(input.phone) : current.phone,
      notes: input.notes !== undefined ? this.cleanNullable(input.notes) : current.notes,
      active: input.active ?? current.active,
      searchPriority:
        input.searchPriority !== undefined
          ? this.clampInt(input.searchPriority, 1, 99999)
          : current.searchPriority,
      searchEnabled: input.searchEnabled ?? current.searchEnabled,
      searchMode: input.searchMode ? input.searchMode : current.searchMode,
      searchEndpoint:
        input.searchEndpoint !== undefined ? this.cleanNullable(input.searchEndpoint) : current.searchEndpoint,
      searchConfigJson:
        input.searchConfigJson !== undefined
          ? this.normalizeJsonString(input.searchConfigJson)
          : current.searchConfigJson,
      updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    await this.writeSuppliersRegistry(items);

    const incidents = await this.readWarrantyIncidentsRegistry();
    const stats = this.buildProviderStats(incidents).get(updated.id);
    const productCount = await this.countProductsForSupplier(updated.id);
    return { item: this.serializeProvider(updated, stats, productCount) };
  }

  async toggleProvider(id: string) {
    const items = await this.readSuppliersRegistry();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) throw new BadRequestException('Proveedor no encontrado');
    items[index] = {
      ...items[index],
      active: !items[index].active,
      updatedAt: new Date().toISOString(),
    };
    await this.writeSuppliersRegistry(items);
    const incidents = await this.readWarrantyIncidentsRegistry();
    const stats = this.buildProviderStats(incidents).get(items[index].id);
    const productCount = await this.countProductsForSupplier(items[index].id);
    return { item: this.serializeProvider(items[index], stats, productCount) };
  }

  async importDefaultProviders() {
    const items = await this.readSuppliersRegistry();
    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    for (const seed of DEFAULT_SUPPLIER_CATALOG) {
      const idx = items.findIndex((i) => i.name.trim().toLowerCase() === seed.name.toLowerCase());
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
          searchPriority: seed.searchPriority,
          searchEnabled: seed.searchEnabled,
          searchMode: seed.searchMode,
          searchEndpoint: seed.searchEndpoint,
          searchConfigJson: seed.searchConfigJson,
          updatedAt: now,
        };
        updated += 1;
      } else {
        items.push({
          id: this.randomEntityId('sup'),
          name: seed.name,
          phone: null,
          notes: null,
          active: true,
          searchPriority: seed.searchPriority,
          searchEnabled: seed.searchEnabled,
          searchMode: seed.searchMode,
          searchEndpoint: seed.searchEndpoint,
          searchConfigJson: seed.searchConfigJson,
          lastProbeStatus: 'none',
          lastProbeQuery: null,
          lastProbeCount: 0,
          lastProbeError: null,
          lastProbeAt: null,
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }
    }
    await this.writeSuppliersRegistry(items);
    const incidents = await this.readWarrantyIncidentsRegistry();
    const stats = this.buildProviderStats(incidents);
    const productCounts = await this.countProductsBySupplierIds(items.map((row) => row.id));
    return {
      created,
      updated,
      items: items
        .sort((a, b) => a.searchPriority - b.searchPriority)
        .map((row) => this.serializeProvider(row, stats.get(row.id), productCounts.get(row.id) ?? 0)),
    };
  }

  async reorderProviders(orderedIds: string[]) {
    const items = await this.readSuppliersRegistry();
    const map = new Map(items.map((i) => [i.id, i]));
    const seen = new Set<string>();
    const ordered = orderedIds.filter((id) => map.has(id) && !seen.has(id) && (seen.add(id), true));
    if (ordered.length === 0) throw new BadRequestException('Lista de orden vacia');

    let priority = 10;
    for (const id of ordered) {
      const row = map.get(id);
      if (!row) continue;
      row.searchPriority = priority;
      row.updatedAt = new Date().toISOString();
      priority += 10;
    }
    const leftovers = items
      .filter((i) => !seen.has(i.id))
      .sort((a, b) => a.searchPriority - b.searchPriority || a.name.localeCompare(b.name, 'es'));
    for (const row of leftovers) {
      row.searchPriority = priority;
      row.updatedAt = new Date().toISOString();
      priority += 10;
    }

    await this.writeSuppliersRegistry(items);
    const incidents = await this.readWarrantyIncidentsRegistry();
    const stats = this.buildProviderStats(incidents);
    const productCounts = await this.countProductsBySupplierIds(items.map((row) => row.id));
    return {
      ok: true,
      items: items
        .sort((a, b) => a.searchPriority - b.searchPriority)
        .map((row) => this.serializeProvider(row, stats.get(row.id), productCounts.get(row.id) ?? 0)),
    };
  }

  async probeProvider(id: string, queryRaw?: string) {
    const items = await this.readSuppliersRegistry();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) throw new BadRequestException('Proveedor no encontrado');
    const row = items[index];
    const q = (queryRaw ?? '').trim() || 'modulo a30';
    const now = new Date().toISOString();

    if (!row.searchEndpoint) {
      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: 'Sin endpoint configurado',
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);
      const incidents = await this.readWarrantyIncidentsRegistry();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);
      return {
        item: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        probe: { query: q, count: 0 },
      };
    }

    const url = row.searchEndpoint.includes('{query}')
      ? row.searchEndpoint.replaceAll('{query}', encodeURIComponent(q))
      : `${row.searchEndpoint}${row.searchEndpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json,text/html,*/*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36 NicoReparaciones/1.0',
        },
      });
      const count = await this.estimateProbeResultCount(res, row.searchMode, row.searchConfigJson);
      const status: SupplierRegistryRow['lastProbeStatus'] = count > 0 ? 'ok' : 'none';
      items[index] = {
        ...row,
        lastProbeStatus: status,
        lastProbeQuery: q,
        lastProbeCount: count,
        lastProbeError: res.ok ? null : `HTTP ${res.status}`,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);
      const incidents = await this.readWarrantyIncidentsRegistry();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);
      return {
        item: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        probe: { query: q, count, url, httpStatus: res.status },
      };
    } catch (e) {
      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: e instanceof Error ? e.message : 'Error de conexion',
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);
      const incidents = await this.readWarrantyIncidentsRegistry();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);
      return {
        item: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        probe: { query: q, count: 0, url },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchProviderParts(id: string, input: SupplierPartSearchInput) {
    const items = await this.readSuppliersRegistry();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) throw new NotFoundException('Proveedor no encontrado');

    const row = items[index];
    if (!row.searchEnabled) throw new BadRequestException('El proveedor no tiene habilitada la busqueda de repuestos');
    if (!row.searchEndpoint) throw new BadRequestException('El proveedor no tiene endpoint de busqueda configurado');

    const q = input.q.trim();
    const limit = this.clampInt(input.limit ?? 8, 1, 30);
    const now = new Date().toISOString();
    const url = this.buildProviderSearchUrl(row, q);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json,text/html,*/*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        },
      });
      if (!res.ok) {
        throw new BadGatewayException(`El proveedor respondio HTTP ${res.status}`);
      }

      const body = await res.text();
      const normalized = row.searchMode === 'json'
        ? this.extractNormalizedPartsFromJsonPayload(body, row, limit)
        : this.extractNormalizedPartsFromHtml(body, row, url, limit);

      items[index] = {
        ...row,
        lastProbeStatus: normalized.length > 0 ? 'ok' : 'none',
        lastProbeQuery: q,
        lastProbeCount: normalized.length,
        lastProbeError: null,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);

      const incidents = await this.readWarrantyIncidentsRegistry();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);

      return {
        supplier: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        query: q,
        total: normalized.length,
        url,
        items: normalized,
      };
    } catch (error) {
      const message = error instanceof BadGatewayException
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Error de conexion';

      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: message,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);

      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException('No se pudo consultar el proveedor');
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchPartsAcrossProviders(input: SupplierPartAggregateSearchInput) {
    const registry = await this.readSuppliersRegistry();
    const q = input.q.trim();
    const limitPerSupplier = this.clampInt(input.limitPerSupplier ?? 6, 1, 20);
    const totalLimit = this.clampInt(input.totalLimit ?? 24, 1, 80);
    const supplierId = this.cleanNullable(input.supplierId);
    const queryProfile = this.buildPartSearchQueryProfile(q);

    const selectedSupplier = supplierId ? registry.find((item) => item.id === supplierId) ?? null : null;
    if (supplierId && !selectedSupplier) throw new NotFoundException('Proveedor no encontrado');
    if (selectedSupplier && (!selectedSupplier.active || !selectedSupplier.searchEnabled || !selectedSupplier.searchEndpoint)) {
      throw new BadRequestException('El proveedor seleccionado no esta disponible para busqueda de repuestos');
    }

    const candidates = (selectedSupplier ? [selectedSupplier] : registry)
      .filter((item) => item.active && item.searchEnabled && !!item.searchEndpoint)
      .sort((left, right) => {
        if (left.searchPriority !== right.searchPriority) return left.searchPriority - right.searchPriority;
        return left.name.localeCompare(right.name, 'es');
      });

    if (candidates.length === 0) {
      throw new BadRequestException('No hay proveedores activos con busqueda habilitada');
    }

    const outcomes = await Promise.all(candidates.map((supplier) => this.runProviderPartsSearch(supplier, { q, limit: limitPerSupplier })));
    const now = new Date().toISOString();
    const outcomeBySupplier = new Map(outcomes.map((outcome) => [outcome.supplier.id, outcome]));
    let registryChanged = false;
    const nextRegistry: SupplierRegistryRow[] = registry.map((row) => {
      const outcome = outcomeBySupplier.get(row.id);
      if (!outcome) return row;
      registryChanged = true;
      return {
        ...row,
        lastProbeStatus: (outcome.error ? 'none' : outcome.items.length > 0 ? 'ok' : 'none') as 'ok' | 'none',
        lastProbeQuery: outcome.query,
        lastProbeCount: outcome.items.length,
        lastProbeError: outcome.error,
        lastProbeAt: now,
        updatedAt: now,
      };
    });
    if (registryChanged) {
      await this.writeSuppliersRegistry(nextRegistry);
    }

    const suppliers = outcomes.map((outcome) => ({
      supplier: {
        id: outcome.supplier.id,
        name: outcome.supplier.name,
        priority: outcome.supplier.searchPriority,
        endpoint: outcome.supplier.searchEndpoint ?? null,
        mode: outcome.supplier.searchMode,
      },
      status: outcome.error ? 'error' : outcome.items.length > 0 ? 'ok' : 'empty',
      total: outcome.items.length,
      error: outcome.error,
      url: outcome.url,
    }));

    const items = outcomes
      .flatMap((outcome) =>
        outcome.items.map((item) => ({
          ...item,
          supplier: {
            id: outcome.supplier.id,
            name: outcome.supplier.name,
            priority: outcome.supplier.searchPriority,
            endpoint: outcome.supplier.searchEndpoint ?? null,
            mode: outcome.supplier.searchMode,
          },
        })),
      )
      .map((item) => ({ item, rank: this.rankSupplierPart(item, queryProfile) }))
      .filter(({ rank }) => rank >= 0)
      .sort((left, right) => {
        if (left.rank !== right.rank) return right.rank - left.rank;

        const availabilityDiff = this.availabilityOrder(left.item.availability) - this.availabilityOrder(right.item.availability);
        if (availabilityDiff !== 0) return availabilityDiff;

        const leftPrice = left.item.price == null ? Number.POSITIVE_INFINITY : left.item.price;
        const rightPrice = right.item.price == null ? Number.POSITIVE_INFINITY : right.item.price;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;

        if (left.item.supplier.priority !== right.item.supplier.priority) return left.item.supplier.priority - right.item.supplier.priority;
        return left.item.name.localeCompare(right.item.name, 'es');
      })
      .map(({ item }) => item satisfies NormalizedSupplierPartWithProvider)
      .slice(0, totalLimit);

    return {
      query: q,
      items,
      suppliers,
      summary: {
        searchedSuppliers: suppliers.length,
        suppliersWithResults: suppliers.filter((item) => item.status === 'ok').length,
        failedSuppliers: suppliers.filter((item) => item.status === 'error').length,
        totalResults: items.length,
      },
    };
  }

  async warranties(params?: { q?: string; sourceType?: string; status?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const sourceType = (params?.sourceType ?? '').trim().toLowerCase();
    const status = (params?.status ?? '').trim().toLowerCase();
    const from = this.parseDateOnly(params?.from ?? '');
    const to = this.parseDateOnly(params?.to ?? '');
    if (to) to.setUTCHours(23, 59, 59, 999);

    const incidents = await this.readWarrantyIncidentsRegistry();
    const suppliers = await this.readSuppliersRegistry();
    const supplierById = new Map(suppliers.map((s) => [s.id, s]));
    const repairIds = incidents.map((i) => i.repairId).filter((v): v is string => !!v);
    const productIds = incidents.map((i) => i.productId).filter((v): v is string => !!v);
    const repairs = repairIds.length
      ? await this.prisma.repair.findMany({
          where: { id: { in: repairIds } },
          select: { id: true, customerName: true },
        })
      : [];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const repairById = new Map(repairs.map((r) => [r.id, r]));
    const productById = new Map(products.map((p) => [p.id, p]));

    const filtered = incidents
      .filter((row) => {
        if (sourceType && row.sourceType !== sourceType) return false;
        if (status && row.status !== status) return false;
        const at = new Date(row.happenedAt);
        if (Number.isNaN(at.getTime())) return false;
        if (from && at < from) return false;
        if (to && at > to) return false;
        if (!q) return true;
        const providerName = row.supplierId ? supplierById.get(row.supplierId)?.name ?? '' : '';
        const repair = row.repairId ? repairById.get(row.repairId) : null;
        const product = row.productId ? productById.get(row.productId) : null;
        const repairLookupCode = row.repairId ? `r-${row.repairId.slice(0, 13)}` : '';
        return (
          row.id.toLowerCase().includes(q) ||
          row.title.toLowerCase().includes(q) ||
          (row.reason ?? '').toLowerCase().includes(q) ||
          (row.notes ?? '').toLowerCase().includes(q) ||
          (row.repairId ?? '').toLowerCase().includes(q) ||
          (row.orderId ?? '').toLowerCase().includes(q) ||
          repairLookupCode.includes(q) ||
          (repair?.customerName ?? '').toLowerCase().includes(q) ||
          (product?.name ?? '').toLowerCase().includes(q) ||
          providerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

    const sourceLabelMap = { repair: 'Reparacion', product: 'Producto' } as const;
    const costOriginLabelMap = {
      manual: 'Manual',
      repair: 'Reparacion',
      product: 'Producto',
    } as const;

    const items = filtered.map((row) => {
      const at = new Date(row.happenedAt);
      const supplierName = row.supplierId ? supplierById.get(row.supplierId)?.name ?? '-' : '-';
      const repair = row.repairId ? repairById.get(row.repairId) : null;
      const product = row.productId ? productById.get(row.productId) : null;
      const date = this.formatDate(at);
      const time = this.formatTime(at);
      return {
        id: row.id,
        sourceType: row.sourceType,
        source: sourceLabelMap[row.sourceType] ?? row.sourceType,
        status: row.status,
        statusLabel: row.status === 'closed' ? 'Cerrado' : 'Abierto',
        title: row.title,
        reason: row.reason ?? '',
        repairId: row.repairId,
        repairCode: row.repairId ? `R-${row.repairId.slice(0, 13)}` : null,
        customerName: repair?.customerName ?? '',
        productId: row.productId,
        productName: product?.name ?? '',
        providerId: row.supplierId,
        provider: supplierName,
        costSource: costOriginLabelMap[row.costOrigin] ?? row.costOrigin,
        quantity: row.quantity,
        unitCost: row.unitCost,
        cost: row.quantity * row.unitCost + row.extraCost,
        recovered: row.recoveredAmount,
        loss: row.lossAmount,
        notes: row.notes ?? '',
        happenedAt: row.happenedAt,
        date,
        time,
      };
    });

    const summary = {
      totalCount: items.length,
      openCount: items.filter((i) => i.status === 'open').length,
      closedCount: items.filter((i) => i.status === 'closed').length,
      totalLoss: items.reduce((acc, i) => acc + i.loss, 0),
    };

    const groupedBySupplier = new Map<string, { supplierId: string; name: string; incidentsCount: number; totalLoss: number }>();
    for (const row of items) {
      if (!row.providerId) continue;
      const current = groupedBySupplier.get(row.providerId) ?? {
        supplierId: row.providerId,
        name: row.provider,
        incidentsCount: 0,
        totalLoss: 0,
      };
      current.incidentsCount += 1;
      current.totalLoss += row.loss;
      groupedBySupplier.set(row.providerId, current);
    }
    const supplierStats = [...groupedBySupplier.values()].sort((a, b) => b.totalLoss - a.totalLoss).slice(0, 8);

    return { items, summary, supplierStats };
  }

  async createWarranty(
    input: {
      sourceType: 'repair' | 'product';
      title: string;
      reason?: string | null;
      repairId?: string | null;
      productId?: string | null;
      orderId?: string | null;
      supplierId?: string | null;
      quantity: number;
      unitCost?: number | null;
      costOrigin?: 'manual' | 'repair' | 'product';
      extraCost?: number;
      recoveredAmount?: number;
      happenedAt?: string | null;
      notes?: string | null;
    },
    actorUserId: string | null,
  ) {
    const sourceType = input.sourceType;
    const repairId = this.cleanNullable(input.repairId);
    const productId = this.cleanNullable(input.productId);
    if (sourceType === 'repair' && !repairId) throw new BadRequestException('Selecciona la reparacion asociada');
    if (sourceType === 'product' && !productId) throw new BadRequestException('Selecciona el producto asociado');

    const [repair, product] = await Promise.all([
      repairId
        ? this.prisma.repair.findUnique({
            where: { id: repairId },
            select: { id: true, finalPrice: true, quotedPrice: true, customerName: true },
          })
        : Promise.resolve(null),
      productId
        ? this.prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, costPrice: true, name: true },
          })
        : Promise.resolve(null),
    ]);
    if (repairId && !repair) throw new BadRequestException('Reparacion no encontrada');
    if (productId && !product) throw new BadRequestException('Producto no encontrado');

    let unitCost = Number(input.unitCost ?? 0);
    let costOrigin: WarrantyIncidentRegistryRow['costOrigin'] = input.costOrigin ?? 'manual';

    if (unitCost <= 0 && sourceType === 'repair' && repair) {
      unitCost = Number(repair.finalPrice ?? repair.quotedPrice ?? 0);
      if (unitCost > 0) costOrigin = 'repair';
    }
    if (unitCost <= 0 && sourceType === 'product' && product) {
      unitCost = Number(product.costPrice ?? 0);
      if (unitCost > 0) costOrigin = 'product';
    }
    if (unitCost <= 0) throw new BadRequestException('No se pudo resolver costo unitario. Cargalo manualmente.');

    if (costOrigin === 'repair' && sourceType !== 'repair') costOrigin = 'manual';
    if (costOrigin === 'product' && sourceType !== 'product') costOrigin = 'manual';

    const quantity = this.clampInt(input.quantity, 1, 999);
    const extraCost = Math.max(0, Number(input.extraCost ?? 0));
    const recoveredAmount = Math.max(0, Number(input.recoveredAmount ?? 0));
    const lossAmount = Math.max(0, quantity * unitCost + extraCost - recoveredAmount);

    const happenedAt = this.parseDateTime(input.happenedAt) ?? new Date();
    const suppliers = await this.readSuppliersRegistry();
    const supplierSet = new Set(suppliers.map((s) => s.id));
    const supplierId = this.cleanNullable(input.supplierId);
    const normalizedSupplierId = supplierId && supplierSet.has(supplierId) ? supplierId : null;

    const created = await this.prisma.warrantyIncident.create({
      data: {
        sourceType,
        status: 'open',
        title: input.title.trim(),
        reason: this.cleanNullable(input.reason),
        repairId,
        productId,
        orderId: this.cleanNullable(input.orderId),
        supplierId: normalizedSupplierId,
        quantity,
        unitCost,
        costOrigin,
        extraCost,
        recoveredAmount,
        lossAmount,
        happenedAt,
        resolvedAt: null,
        notes: this.cleanNullable(input.notes),
        createdBy: actorUserId,
      },
    });

    const result = await this.warranties();
    const row = result.items.find((i) => i.id === created.id);
    return { item: row ?? null };
  }

  async closeWarranty(id: string) {
    const existing = await this.prisma.warrantyIncident.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new BadRequestException('Incidente no encontrado');
    await this.prisma.warrantyIncident.update({
      where: { id },
      data: {
        status: 'closed',
        resolvedAt: new Date(),
      },
    });
    const result = await this.warranties();
    const row = result.items.find((i) => i.id === id);
    return { item: row ?? null };
  }

  async accounting(params?: { q?: string; direction?: string; category?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const direction = (params?.direction ?? '').trim().toLowerCase();
    const category = (params?.category ?? '').trim();
    const fromDate = this.parseDateOnly(params?.from ?? '') ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = this.parseDateOnly(params?.to ?? '') ?? new Date();
    if (toDate && params?.to) toDate.setUTCHours(23, 59, 59, 999);

    const [orders, incidents] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: 'ENTREGADO' },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
      this.readWarrantyIncidentsRegistry(),
    ]);

    const entries: AccountingEntryRow[] = [];
    for (const o of orders) {
      entries.push({
        id: `ord-${o.id}`,
        happenedAt: o.createdAt.toISOString(),
        direction: 'inflow',
        category: 'order_sale',
        description: `Venta web pedido #${o.id.slice(0, 8)}`,
        source: `Order ${o.id}`,
        amount: Number(o.total),
      });
    }
    for (const inc of incidents) {
      if (inc.lossAmount > 0) {
        entries.push({
          id: `wloss-${inc.id}`,
          happenedAt: inc.happenedAt,
          direction: 'outflow',
          category: 'warranty_loss',
          description: `Garantia: ${inc.title}`,
          source: `WarrantyIncident ${inc.id}`,
          amount: inc.lossAmount,
        });
      }
      if (inc.recoveredAmount > 0) {
        entries.push({
          id: `wrec-${inc.id}`,
          happenedAt: inc.happenedAt,
          direction: 'inflow',
          category: 'warranty_recovery',
          description: `Recupero garantia: ${inc.title}`,
          source: `WarrantyIncident ${inc.id}`,
          amount: inc.recoveredAmount,
        });
      }
    }

    const filtered = entries
      .filter((entry) => {
        const at = new Date(entry.happenedAt);
        if (Number.isNaN(at.getTime())) return false;
        if (at < fromDate || at > toDate) return false;
        if (direction === 'inflow' || direction === 'outflow') {
          if (entry.direction !== direction) return false;
        }
        if (category && entry.category !== category) return false;
        if (!q) return true;
        return (
          entry.description.toLowerCase().includes(q) ||
          entry.source.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

    const incomes = filtered.filter((r) => r.direction === 'inflow').reduce((acc, r) => acc + r.amount, 0);
    const expenses = filtered.filter((r) => r.direction === 'outflow').reduce((acc, r) => acc + r.amount, 0);
    const byCategory = new Map<string, { incomes: number; expenses: number; count: number }>();
    for (const row of filtered) {
      const current = byCategory.get(row.category) ?? { incomes: 0, expenses: 0, count: 0 };
      current.count += 1;
      if (row.direction === 'inflow') current.incomes += row.amount;
      else current.expenses += row.amount;
      byCategory.set(row.category, current);
    }

    return {
      summary: {
        entriesCount: filtered.length,
        inflowTotal: incomes,
        outflowTotal: expenses,
        netTotal: incomes - expenses,
      },
      categories: [...new Set(filtered.map((r) => r.category))].sort((a, b) => a.localeCompare(b, 'es')),
      categorySummary: [...byCategory.entries()]
        .map(([key, value]) => ({
          category: key,
          entriesCount: value.count,
          inflowTotal: value.incomes,
          outflowTotal: value.expenses,
          netTotal: value.incomes - value.expenses,
        }))
        .sort((a, b) => a.category.localeCompare(b.category, 'es')),
      items: filtered.map((row) => ({
        id: row.id,
        happenedAt: row.happenedAt,
        date: this.formatDateTime(new Date(row.happenedAt)),
        direction: row.direction === 'inflow' ? 'Ingreso' : 'Egreso',
        directionKey: row.direction,
        category: row.category,
        description: row.description,
        source: row.source,
        amount: row.amount,
      })),
      filters: {
        q: params?.q ?? '',
        direction: direction === 'inflow' || direction === 'outflow' ? direction : '',
        category,
        from: this.formatDateInput(fromDate),
        to: this.formatDateInput(toDate),
      },
    };
  }

  async mailTemplates() {
    const templates = [
      {
        templateKey: 'verify_email',
        label: 'Verificacion de correo',
        description: 'Se envia al crear cuenta para verificar email.',
        subjectDefault: 'Verifica tu correo en {{business_name}}',
        bodyDefault:
          'Hola {{user_name}},\n\nUsa este enlace para verificar tu correo:\n{{verify_url}}\n\nSi no creaste esta cuenta, ignora este mensaje.',
      },
      {
        templateKey: 'reset_password',
        label: 'Recuperacion de contrasena',
        description: 'Se envia cuando el usuario solicita restablecer contrasena.',
        subjectDefault: 'Recuperar contrasena en {{business_name}}',
        bodyDefault:
          'Hola {{user_name}},\n\nRecibimos una solicitud para restablecer tu contrasena.\nUsa este enlace:\n{{reset_url}}\n\nSi no fuiste vos, ignora este mensaje.',
      },
      {
        templateKey: 'order_created',
        label: 'Compra confirmada',
        description: 'Se envia al finalizar una compra.',
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

  async whatsappTemplates(params?: { channel?: string }) {
    const channel = (params?.channel ?? '').trim().toLowerCase();
    if (channel === 'repairs' || channel === 'orders') {
      return this.whatsappTemplatesByChannel(channel);
    }

    const templates = [
      {
        templateKey: 'repair_status_update',
        label: 'Actualizacion de reparacion',
        description: 'Mensaje para avisar cambios de estado en reparaciones.',
        bodyDefault:
          'Hola {{customer_name}}, tu reparacion {{repair_id}} ahora esta en estado: {{repair_status}}. {{extra_message}}',
      },
      {
        templateKey: 'order_status_update',
        label: 'Actualizacion de pedido',
        description: 'Mensaje para avisar cambios de estado en pedidos.',
        bodyDefault:
          'Hola {{customer_name}}, tu pedido {{order_id}} ahora esta: {{order_status}}. Total: {{order_total}}',
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

  async upsertWhatsappTemplates(input: {
    channel?: 'repairs' | 'orders';
    items: Array<{
      templateKey: string;
      body: string;
      enabled?: boolean;
      channel?: 'repairs' | 'orders';
    }>;
  }) {
    const fallbackChannel = input.channel;
    const repairTemplateKeys = new Set<string>(this.whatsappTemplateDefs('repairs').map((t) => t.templateKey));
    const orderTemplateKeys = new Set<string>(this.whatsappTemplateDefs('orders').map((t) => t.templateKey));
    const savedTemplates: string[] = [];

    for (const t of input.items) {
      const channel = t.channel ?? fallbackChannel;
      if (channel === 'repairs' && repairTemplateKeys.has(t.templateKey)) {
        const base = `whatsapp_repairs_template.${t.templateKey}`;
        await this.upsertSingleSetting(
          `${base}.body`,
          t.body,
          'whatsapp_repair_templates',
          `Plantilla WhatsApp reparaciones: ${t.templateKey}`,
          'textarea',
        );
        await this.upsertSingleSetting(
          `${base}.enabled`,
          t.enabled === false ? '0' : '1',
          'whatsapp_repair_templates',
          `Plantilla WhatsApp reparaciones habilitada: ${t.templateKey}`,
          'boolean',
        );
        savedTemplates.push(`repairs.${t.templateKey}`);
        continue;
      }
      if (channel === 'orders' && orderTemplateKeys.has(t.templateKey)) {
        const base = `whatsapp_orders_template.${t.templateKey}`;
        await this.upsertSingleSetting(
          `${base}.body`,
          t.body,
          'whatsapp_order_templates',
          `Plantilla WhatsApp pedidos: ${t.templateKey}`,
          'textarea',
        );
        await this.upsertSingleSetting(
          `${base}.enabled`,
          t.enabled === false ? '0' : '1',
          'whatsapp_order_templates',
          `Plantilla WhatsApp pedidos habilitada: ${t.templateKey}`,
          'boolean',
        );
        savedTemplates.push(`orders.${t.templateKey}`);
        continue;
      }
    }

    // Backward compatibility for generic endpoint payloads.
    const allowed = new Set(['repair_status_update', 'order_status_update']);
    const legacyItems = input.items.filter((i) => !i.channel && !fallbackChannel && allowed.has(i.templateKey));
    for (const t of legacyItems) {
      const base = `whatsapp_template.${t.templateKey}`;
      await this.upsertSingleSetting(
        `${base}.body`,
        t.body,
        'whatsapp_templates',
        `${t.templateKey}.body`,
        'textarea',
      );
      await this.upsertSingleSetting(
        `${base}.enabled`,
        t.enabled === false ? '0' : '1',
        'whatsapp_templates',
        `${t.templateKey}.enabled`,
        'boolean',
      );
      savedTemplates.push(t.templateKey);
    }

    return { ok: true, savedTemplates };
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
                { remoteMessageId: { contains: q, mode: 'insensitive' } },
                { errorMessage: { contains: q, mode: 'insensitive' } },
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
        provider: r.provider,
        remoteMessageId: r.remoteMessageId,
        providerStatus: r.providerStatus,
        errorMessage: r.errorMessage,
        status: r.status,
        message: r.message,
        meta: this.parseJson(r.metaJson),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        lastAttemptAt: r.lastAttemptAt?.toISOString() ?? null,
        sentAt: r.sentAt?.toISOString() ?? null,
        failedAt: r.failedAt?.toISOString() ?? null,
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
    return this.whatsappService.createAndDispatchLog({
      channel: input.channel,
      templateKey: input.templateKey,
      targetType: input.targetType,
      targetId: input.targetId,
      phone: input.phone,
      recipient: input.recipient,
      message: input.message,
      meta: input.meta,
    });
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

  private async whatsappTemplatesByChannel(channel: 'repairs' | 'orders') {
    const defs = this.whatsappTemplateDefs(channel);
    const prefix = channel === 'repairs' ? 'whatsapp_repairs_template' : 'whatsapp_orders_template';
    const keys = defs.flatMap((t) => [`${prefix}.${t.templateKey}.body`, `${prefix}.${t.templateKey}.enabled`]);
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: keys } },
      orderBy: { key: 'asc' },
    });
    const map = new Map(rows.map((r) => [r.key, r.value ?? '']));

    return {
      channel,
      items: defs.map((t) => {
        const bodyKey = `${prefix}.${t.templateKey}.body`;
        const enabledKey = `${prefix}.${t.templateKey}.enabled`;
        const body = (map.get(bodyKey) || '').trim() || this.defaultWhatsappTemplateBody(channel, t.templateKey);
        const enabled = (map.get(enabledKey) || '1') !== '0';
        return {
          templateKey: t.templateKey,
          label: t.label,
          description: t.description,
          body,
          enabled,
          placeholders: this.whatsappTemplatePlaceholdersByChannel(channel, t.templateKey),
        };
      }),
    };
  }

  private whatsappTemplateDefs(channel: 'repairs' | 'orders') {
    if (channel === 'repairs') {
      return [
        { templateKey: 'received', label: 'Recibido', description: 'Mensaje para reparación recibida.' },
        { templateKey: 'diagnosing', label: 'Diagnosticando', description: 'Mensaje para reparación en diagnóstico.' },
        { templateKey: 'waiting_approval', label: 'Esperando aprobación', description: 'Mensaje para solicitar aprobación.' },
        { templateKey: 'repairing', label: 'En reparación', description: 'Mensaje para reparación en curso.' },
        { templateKey: 'ready_pickup', label: 'Listo para retirar', description: 'Mensaje para reparación lista para retiro.' },
        { templateKey: 'delivered', label: 'Entregado', description: 'Mensaje para reparación entregada.' },
        { templateKey: 'cancelled', label: 'Cancelado', description: 'Mensaje para reparación cancelada.' },
      ] as const;
    }
    return [
      { templateKey: 'pendiente', label: 'Pendiente', description: 'Mensaje para pedido pendiente.' },
      { templateKey: 'confirmado', label: 'Confirmado', description: 'Mensaje para pedido confirmado.' },
      { templateKey: 'preparando', label: 'Preparando', description: 'Mensaje para pedido en preparación.' },
      { templateKey: 'listo_retirar', label: 'Listo para retirar', description: 'Mensaje para pedido listo para retiro.' },
      { templateKey: 'entregado', label: 'Entregado', description: 'Mensaje para pedido entregado.' },
      { templateKey: 'cancelado', label: 'Cancelado', description: 'Mensaje para pedido cancelado.' },
    ] as const;
  }

  private defaultWhatsappTemplateBody(channel: 'repairs' | 'orders', templateKey: string) {
    if (channel === 'repairs') {
      if (templateKey === 'waiting_approval') {
        return [
          'Hola {customer_name}',
          'Tu reparación ({code}) está en estado: *{status_label}*.',
          'Necesitamos tu aprobación para continuar.',
          'Aprobá o rechazá acá: {approval_url}',
          '',
          'Podés consultar el estado en: {lookup_url}',
          'Código: {code}',
          'Equipo: {device}',
          'NicoReparaciones',
        ].join('\n');
      }
      if (templateKey === 'ready_pickup') {
        return [
          'Hola {customer_name}',
          'Tu reparación ({code}) está en estado: *{status_label}*.',
          'Ya está lista para retirar.',
          '',
          'Dirección: {shop_address}',
          'Horarios: {shop_hours}',
          '',
          'Podés consultar el estado en: {lookup_url}',
          'Código: {code}',
          'Equipo: {device}',
          'NicoReparaciones',
        ].join('\n');
      }
      if (templateKey === 'delivered') {
        return [
          'Hola {customer_name}',
          'Tu reparación ({code}) está en estado: *{status_label}*.',
          'Gracias por tu visita.',
          '',
          'Podés consultar el estado en: {lookup_url}',
          'Código: {code}',
          'Equipo: {device}',
          'NicoReparaciones',
        ].join('\n');
      }
      return [
        'Hola {customer_name}',
        'Tu reparación ({code}) está en estado: *{status_label}*.',
        '',
        'Podés consultar el estado en: {lookup_url}',
        'Código: {code}',
        'Equipo: {device}',
        'NicoReparaciones',
      ].join('\n');
    }

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
    if (templateKey === 'listo_retirar') {
      base.push('', 'Dirección: {shop_address}', 'Horarios: {shop_hours}', 'Teléfono: {shop_phone}');
    }
    if (templateKey === 'entregado') {
      base.push('', 'Gracias por tu compra.');
    }
    if (templateKey === 'cancelado') {
      base.push('', 'Si querés, lo revisamos por WhatsApp.');
    }
    return base.join('\n');
  }

  private whatsappTemplatePlaceholdersByChannel(channel: 'repairs' | 'orders', _templateKey: string) {
    if (channel === 'repairs') {
      return [
        '{customer_name}',
        '{code}',
        '{status}',
        '{status_label}',
        '{lookup_url}',
        '{phone}',
        '{device_brand}',
        '{device_model}',
        '{device}',
        '{final_price}',
        '{warranty_days}',
        '{approval_url}',
        '{shop_address}',
        '{shop_hours}',
      ];
    }
    return [
      '{customer_name}',
      '{order_id}',
      '{status}',
      '{status_label}',
      '{total}',
      '{total_raw}',
      '{items_count}',
      '{items_summary}',
      '{pickup_name}',
      '{pickup_phone}',
      '{phone}',
      '{notes}',
      '{my_orders_url}',
      '{store_url}',
      '{shop_address}',
      '{shop_hours}',
      '{shop_phone}',
      '{shop_name}',
    ];
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

  private async readSuppliersRegistry() {
    const rows = await this.prisma.supplier.findMany({
      orderBy: [{ searchPriority: 'asc' }, { name: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name.trim(),
      phone: row.phone,
      notes: row.notes,
      active: row.active,
      searchPriority: this.clampInt(row.searchPriority, 1, 99999),
      searchEnabled: row.searchEnabled,
      searchMode: row.searchMode === 'json' ? 'json' : 'html',
      searchEndpoint: row.searchEndpoint,
      searchConfigJson: this.normalizeJsonString(row.searchConfigJson),
      lastProbeStatus: row.lastProbeStatus === 'ok' ? 'ok' : 'none',
      lastProbeQuery: row.lastProbeQuery,
      lastProbeCount: this.clampInt(row.lastProbeCount, 0, 999999),
      lastProbeError: row.lastProbeError,
      lastProbeAt: row.lastProbeAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } satisfies SupplierRegistryRow));
  }

  private async writeSuppliersRegistry(items: SupplierRegistryRow[]) {
    const supplierIds = items.map((i) => i.id);
    await this.prisma.$transaction(async (tx) => {
      for (const row of items) {
        await tx.supplier.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            name: row.name,
            phone: row.phone,
            notes: row.notes,
            active: row.active,
            searchPriority: row.searchPriority,
            searchEnabled: row.searchEnabled,
            searchMode: row.searchMode,
            searchEndpoint: row.searchEndpoint,
            searchConfigJson: row.searchConfigJson,
            lastProbeStatus: row.lastProbeStatus,
            lastProbeQuery: row.lastProbeQuery,
            lastProbeCount: row.lastProbeCount,
            lastProbeError: row.lastProbeError,
            lastProbeAt: row.lastProbeAt ? new Date(row.lastProbeAt) : null,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          },
          update: {
            name: row.name,
            phone: row.phone,
            notes: row.notes,
            active: row.active,
            searchPriority: row.searchPriority,
            searchEnabled: row.searchEnabled,
            searchMode: row.searchMode,
            searchEndpoint: row.searchEndpoint,
            searchConfigJson: row.searchConfigJson,
            lastProbeStatus: row.lastProbeStatus,
            lastProbeQuery: row.lastProbeQuery,
            lastProbeCount: row.lastProbeCount,
            lastProbeError: row.lastProbeError,
            lastProbeAt: row.lastProbeAt ? new Date(row.lastProbeAt) : null,
            updatedAt: new Date(row.updatedAt),
          },
        });
      }
      if (supplierIds.length > 0) {
        await tx.supplier.deleteMany({
          where: { id: { notIn: supplierIds } },
        });
      } else {
        await tx.supplier.deleteMany({});
      }
    });
  }

  private async readWarrantyIncidentsRegistry() {
    const rows = await this.prisma.warrantyIncident.findMany({
      orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      sourceType: row.sourceType === 'product' ? 'product' : 'repair',
      status: row.status === 'closed' ? 'closed' : 'open',
      title: row.title.trim(),
      reason: this.cleanNullable(row.reason ?? null),
      repairId: this.cleanNullable(row.repairId ?? null),
      productId: this.cleanNullable(row.productId ?? null),
      orderId: this.cleanNullable(row.orderId ?? null),
      supplierId: this.cleanNullable(row.supplierId ?? null),
      quantity: this.clampInt(row.quantity, 1, 999),
      unitCost: Number(row.unitCost),
      costOrigin: row.costOrigin === 'repair' || row.costOrigin === 'product' ? row.costOrigin : 'manual',
      extraCost: Number(row.extraCost),
      recoveredAmount: Number(row.recoveredAmount),
      lossAmount: Number(row.lossAmount),
      happenedAt: row.happenedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      notes: this.cleanNullable(row.notes ?? null),
      createdBy: this.cleanNullable(row.createdBy ?? null),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } satisfies WarrantyIncidentRegistryRow));
  }

  private async writeWarrantyIncidentsRegistry(items: WarrantyIncidentRegistryRow[]) {
    const incidentIds = items.map((i) => i.id);
    const suppliers = await this.prisma.supplier.findMany({ select: { id: true } });
    const supplierSet = new Set(suppliers.map((s) => s.id));

    await this.prisma.$transaction(async (tx) => {
      for (const row of items) {
        await tx.warrantyIncident.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            sourceType: row.sourceType,
            status: row.status,
            title: row.title,
            reason: row.reason,
            repairId: row.repairId,
            productId: row.productId,
            orderId: row.orderId,
            supplierId: row.supplierId && supplierSet.has(row.supplierId) ? row.supplierId : null,
            quantity: row.quantity,
            unitCost: row.unitCost,
            costOrigin: row.costOrigin,
            extraCost: row.extraCost,
            recoveredAmount: row.recoveredAmount,
            lossAmount: row.lossAmount,
            happenedAt: new Date(row.happenedAt),
            resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
            notes: row.notes,
            createdBy: row.createdBy,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
          },
          update: {
            sourceType: row.sourceType,
            status: row.status,
            title: row.title,
            reason: row.reason,
            repairId: row.repairId,
            productId: row.productId,
            orderId: row.orderId,
            supplierId: row.supplierId && supplierSet.has(row.supplierId) ? row.supplierId : null,
            quantity: row.quantity,
            unitCost: row.unitCost,
            costOrigin: row.costOrigin,
            extraCost: row.extraCost,
            recoveredAmount: row.recoveredAmount,
            lossAmount: row.lossAmount,
            happenedAt: new Date(row.happenedAt),
            resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
            notes: row.notes,
            createdBy: row.createdBy,
            updatedAt: new Date(row.updatedAt),
          },
        });
      }
      if (incidentIds.length > 0) {
        await tx.warrantyIncident.deleteMany({
          where: { id: { notIn: incidentIds } },
        });
      } else {
        await tx.warrantyIncident.deleteMany({});
      }
    });
  }

  private buildProviderStats(incidents: WarrantyIncidentRegistryRow[]) {
    const map = new Map<
      string,
      {
        incidents: number;
        openIncidents: number;
        closedIncidents: number;
        loss: number;
      }
    >();
    for (const row of incidents) {
      if (!row.supplierId) continue;
      const current = map.get(row.supplierId) ?? { incidents: 0, openIncidents: 0, closedIncidents: 0, loss: 0 };
      current.incidents += 1;
      if (row.status === 'closed') current.closedIncidents += 1;
      else current.openIncidents += 1;
      current.loss += row.lossAmount;
      map.set(row.supplierId, current);
    }
    return map;
  }

  private async countProductsBySupplierIds(supplierIds: string[]) {
    const uniqueSupplierIds = [...new Set(supplierIds.filter(Boolean))];
    if (!uniqueSupplierIds.length) return new Map<string, number>();

    const rows = await this.prisma.product.groupBy({
      by: ['supplierId'],
      where: { supplierId: { in: uniqueSupplierIds } },
      _count: { _all: true },
    });

    const map = new Map<string, number>();
    for (const row of rows) {
      if (!row.supplierId) continue;
      map.set(row.supplierId, row._count._all);
    }
    return map;
  }

  private async countProductsForSupplier(supplierId: string) {
    const map = await this.countProductsBySupplierIds([supplierId]);
    return map.get(supplierId) ?? 0;
  }

  private emptyProviderStats() {
    return {
      incidents: 0,
      openIncidents: 0,
      closedIncidents: 0,
      loss: 0,
    };
  }

  private serializeProvider(
    row: SupplierRegistryRow,
    statsInput?: { incidents: number; openIncidents: number; closedIncidents: number; loss: number },
    productCount = 0,
  ) {
    const stats = statsInput ?? this.emptyProviderStats();
    const baseScore = 80;
    const openPenalty = Math.min(12, stats.openIncidents * 3);
    const lossPenalty = Math.min(18, Math.round(stats.loss / 100000));
    const score = Math.max(0, Math.min(100, baseScore - openPenalty - lossPenalty));
    const confidenceLabel = score >= 90 ? 'Excelente' : score >= 75 ? 'Confiable' : score >= 60 ? 'En seguimiento' : 'Riesgo alto';

    return {
      id: row.id,
      name: row.name,
      priority: row.searchPriority,
      phone: row.phone ?? '',
      products: productCount,
      incidents: stats.incidents,
      warrantiesOk: stats.closedIncidents,
      warrantiesExpired: stats.openIncidents,
      loss: stats.loss,
      score,
      confidenceLabel,
      active: row.active,
      searchEnabled: row.searchEnabled,
      statusProbe: row.lastProbeStatus,
      lastProbeAt: row.lastProbeAt ? this.formatDateTimeShort(new Date(row.lastProbeAt)) : '-',
      lastQuery: row.lastProbeQuery ?? '-',
      lastResults: row.lastProbeCount,
      mode: row.searchMode === 'json' ? 'JSON API' : 'HTML simple',
      endpoint: row.searchEndpoint ?? '',
      configJson: row.searchConfigJson ?? '',
      notes: row.notes ?? '',
    };
  }

  private async runProviderPartsSearch(
    row: SupplierRegistryRow,
    input: SupplierPartSearchInput,
  ): Promise<ProviderPartSearchOutcome> {
    const q = input.q.trim();
    const limit = this.clampInt(input.limit ?? 8, 1, 30);
    const url = this.buildProviderSearchUrl(row, q);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json,text/html,*/*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        },
      });
      if (!res.ok) {
        return {
          supplier: row,
          query: q,
          url,
          items: [],
          error: `El proveedor respondio HTTP ${res.status}`,
        };
      }

      const body = await res.text();
      const items =
        row.searchMode === 'json'
          ? this.extractNormalizedPartsFromJsonPayload(body, row, limit)
          : this.extractNormalizedPartsFromHtml(body, row, url, limit);

      return {
        supplier: row,
        query: q,
        url,
        items,
        error: null,
      };
    } catch (error) {
      return {
        supplier: row,
        query: q,
        url,
        items: [],
        error: error instanceof Error ? error.message : 'No se pudo consultar el proveedor',
      };
    } finally {
        clearTimeout(timeout);
    }
  }

  private normalizeJsonString(value?: string | null) {
    const raw = this.cleanNullable(value);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return JSON.stringify(parsed);
    } catch {
      return raw;
    }
  }

  private buildProviderSearchUrl(row: SupplierRegistryRow, query: string) {
    if (!row.searchEndpoint) throw new BadRequestException('El proveedor no tiene endpoint de busqueda configurado');
    return row.searchEndpoint.includes('{query}')
      ? row.searchEndpoint.replaceAll('{query}', encodeURIComponent(query))
      : `${row.searchEndpoint}${row.searchEndpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`;
  }

  private extractNormalizedPartsFromJsonPayload(
    rawBody: string,
    row: SupplierRegistryRow,
    limit: number,
  ): NormalizedSupplierPart[] {
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new BadGatewayException('El proveedor configurado como JSON devolvio una respuesta invalida');
    }

    const cfg = (this.parseJson(row.searchConfigJson) ?? {}) as Record<string, unknown>;
    const items = this.extractJsonItems(payload, cfg);
    if (items.length === 0) return [];

    const normalized = items
      .map((item, index) => this.normalizeJsonPart(item, cfg, row, index))
      .filter((item): item is NormalizedSupplierPart => !!item)
      .slice(0, limit);

    return this.dedupeNormalizedParts(normalized, limit);
  }

  private extractJsonItems(payload: unknown, cfg: Record<string, unknown>) {
    const itemsPath = typeof cfg.items_path === 'string' ? cfg.items_path.trim() : '';
    if (itemsPath) {
      const resolved = this.readObjectPath(payload, itemsPath);
      if (Array.isArray(resolved)) return resolved;
    }
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.results)) return record.results;
    if (Array.isArray(record.data)) return record.data;
    const firstArray = Object.values(record).find((value) => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
  }

  private normalizeJsonPart(
    item: unknown,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    index: number,
  ): NormalizedSupplierPart | null {
    if (!item || typeof item !== 'object') return null;

    const externalId = this.findJsonString(item, cfg, ['externalPartId', 'external_id_path', 'id_path'], ['id', 'productId', 'product_id', 'sku']);
    const name = this.findJsonString(item, cfg, ['name_path', 'title_path'], ['name', 'title', 'label', 'description', 'productName']);
    const sku = this.findJsonString(item, cfg, ['sku_path'], ['sku', 'code', 'barcode', 'partNumber', 'part_number']);
    const brand = this.findJsonString(item, cfg, ['brand_path'], ['brand', 'manufacturer']);
    const price = this.findJsonNumber(item, cfg, ['price_path'], ['price', 'salePrice', 'amount', 'finalPrice', 'unitPrice']);
    const availabilityRaw = this.findJsonValue(item, cfg, ['availability_path'], ['availability', 'stockStatus', 'stock_status', 'stock', 'available']);
    const url = this.normalizeUrl(
      this.findJsonString(item, cfg, ['url_path'], ['url', 'link', 'href']),
      row.searchEndpoint,
    );

    const normalizedName = this.cleanLabel(name);
    if (!normalizedName) return null;

    return {
      externalPartId: externalId || url || `${row.id}:${index}:${normalizedName.toLowerCase()}`,
      name: normalizedName,
      sku: this.cleanLabel(sku),
      brand: this.cleanLabel(brand),
      price,
      availability: this.normalizeAvailability(availabilityRaw),
      url,
      rawLabel: null,
    };
  }

  private extractNormalizedPartsFromHtml(
    html: string,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
  ): NormalizedSupplierPart[] {
    const cfg = (this.parseJson(row.searchConfigJson) ?? {}) as Record<string, unknown>;
    const profile = this.resolveHtmlSearchProfile(row, requestUrl, cfg);
    const providerSpecific = this.extractHtmlPartsFromKnownProviderHtml(html, cfg, row, requestUrl, limit, profile);
    if (providerSpecific.length > 0) {
      return this.dedupeNormalizedParts(providerSpecific, limit);
    }

    const parsedFromBlocks = this.extractHtmlPartsFromBlocks(html, cfg, row, requestUrl, limit, profile);
    if (parsedFromBlocks.length > 0) {
      return this.dedupeNormalizedParts(parsedFromBlocks, limit);
    }

    const parsedFromAnchors = this.extractHtmlPartsFromAnchors(html, cfg, row, requestUrl, limit, profile);
    return this.dedupeNormalizedParts(parsedFromAnchors, limit);
  }

  private resolveHtmlSearchProfile(row: SupplierRegistryRow, requestUrl: string, cfg: Record<string, unknown>) {
    const explicitProfile = typeof cfg.profile === 'string' ? cfg.profile.trim().toLowerCase() : '';
    if (explicitProfile) return explicitProfile;

    const host = this.safeHostname(requestUrl) || this.safeHostname(row.searchEndpoint);
    if (!host) return 'generic';
    if (host.includes('novocell.com.ar')) return 'wix';
    if (host.includes('evophone.com.ar')) return 'woodmart';
    if (host.includes('celuphone.com.ar')) return 'shoptimizer';
    if (host.includes('okeyrosario.com.ar') || host.includes('electrostore.com.ar')) return 'flatsome';
    return 'generic';
  }

  private extractHtmlPartsFromKnownProviderHtml(
    html: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
    profile: string,
  ) {
    const blockRegexes: Record<string, RegExp[]> = {
      woodmart: [/<div class="[^"]*\bwd-product\b[^"]*\bproduct-grid-item\b[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi],
      flatsome: [/<div class="product-small col has-hover product[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi],
      shoptimizer: [/<li class="product type-product[\s\S]*?<\/li>/gi],
      wix: [/<li data-hook="product-list-grid-item">[\s\S]*?<\/li>/gi],
    };
    const regexes = blockRegexes[profile] ?? [];
    if (regexes.length === 0) return [];

    const items: NormalizedSupplierPart[] = [];
    for (const regex of regexes) {
      for (const match of html.matchAll(regex)) {
        if (items.length >= limit) break;
        const normalized = this.normalizeHtmlPartFromSnippet(match[0] ?? '', cfg, row, requestUrl, items.length, profile);
        if (!normalized) continue;
        items.push(normalized);
      }
      if (items.length >= limit) break;
    }
    return items;
  }

  private extractHtmlPartsFromBlocks(
    html: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
    profile: string,
  ) {
    const itemRegexSource = typeof cfg.item_regex === 'string' ? cfg.item_regex : '';
    if (!itemRegexSource) return [];

    let itemRegex: RegExp;
    try {
      itemRegex = new RegExp(itemRegexSource, 'gi');
    } catch {
      return [];
    }

    const nameRegex = this.compileOptionalRegex(cfg.name_regex);
    const priceRegex = this.compileOptionalRegex(cfg.price_regex);
    const urlRegex = this.compileOptionalRegex(cfg.url_regex);
    const raw: NormalizedSupplierPart[] = [];

    for (const match of html.matchAll(itemRegex)) {
      if (raw.length >= limit) break;
      const block = match[0] ?? '';
      const rawName = nameRegex ? this.firstCapture(block, nameRegex) : '';
      const rawPrice = priceRegex ? this.firstCapture(block, priceRegex) : '';
      const rawUrl = urlRegex ? this.firstCapture(block, urlRegex) : '';
      const url = this.normalizeUrl(rawUrl, requestUrl);
      const normalized = this.normalizeHtmlPartFromSnippet(block, cfg, row, requestUrl, raw.length, profile, {
        url,
        name: this.cleanLabel(this.stripHtml(rawName || block)),
        price: this.parseMoneyValue(rawPrice || block),
      });
      if (!normalized) continue;

      raw.push(normalized);
    }

    return raw;
  }

  private extractHtmlPartsFromAnchors(
    html: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
    profile: string,
  ) {
    const candidatePaths = Array.isArray(cfg.candidate_paths) ? cfg.candidate_paths.filter((value): value is string => typeof value === 'string') : [];
    const excludePaths = Array.isArray(cfg.exclude_paths) ? cfg.exclude_paths.filter((value): value is string => typeof value === 'string') : [];
    const contextWindow = this.clampInt(typeof cfg.context_window === 'number' ? cfg.context_window : 1000, 240, 12000);
    const candidateUrlRegex = this.compileOptionalRegex(cfg.candidate_url_regex);
    const priceRegex = this.compileOptionalRegex(cfg.price_regex);
    const anchorRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
    const out: NormalizedSupplierPart[] = [];

    for (const match of html.matchAll(anchorRegex)) {
      if (out.length >= limit) break;
      const href = (match[2] ?? '').trim();
      if (!href) continue;
      const absoluteUrl = this.normalizeUrl(href, requestUrl);
      if (!absoluteUrl) continue;
      if (!this.isLikelyProductUrl(absoluteUrl, requestUrl, candidatePaths, excludePaths, candidateUrlRegex)) continue;

      const startIndex = match.index ?? 0;
      const contextStart = Math.max(0, startIndex - Math.round(contextWindow * 0.45));
      const contextEnd = Math.min(html.length, startIndex + contextWindow);
      const snippet = html.slice(contextStart, contextEnd);
      const normalized = this.normalizeHtmlPartFromSnippet(snippet, cfg, row, requestUrl, out.length, profile, {
        url: absoluteUrl,
        rawLabel: this.cleanLabel(this.stripHtml(match[3] ?? '')),
        price: this.parseMoneyValue(priceRegex ? this.firstCapture(snippet, priceRegex) : snippet),
      });
      if (!normalized) continue;
      out.push(normalized);
    }

    return out;
  }

  private normalizeHtmlPartFromSnippet(
    snippet: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    index: number,
    profile: string,
    preferred?: {
      url?: string | null;
      name?: string | null;
      price?: number | null;
      rawLabel?: string | null;
    },
  ): NormalizedSupplierPart | null {
    const url =
      preferred?.url ??
      this.normalizeUrl(
        this.firstCapture(snippet, /href=(["'])([^"']*(?:\/producto\/|\/product-page\/)[^"']*)\1/i),
        requestUrl,
      );
    const name =
      this.cleanLabel(preferred?.name) ??
      this.extractHtmlPartName(snippet, preferred?.rawLabel ?? null, url, profile) ??
      this.extractProductNameFromContext(snippet);
    if (!this.isMeaningfulPartName(name, row.name)) return null;

    const brand = this.extractHtmlPartBrand(snippet, name, profile);
    const price = preferred?.price ?? this.extractHtmlPartPrice(snippet, profile);

    return {
      externalPartId: this.cleanLabel(this.firstCapture(snippet, /data-product_id=(["'])([^"']+)\1/i)) || url || `${row.id}:${index}:${name!.toLowerCase()}`,
      name: name!,
      sku: this.extractSku(snippet),
      brand,
      price,
      availability: this.extractHtmlPartAvailability(snippet),
      url,
      rawLabel: this.cleanLabel(preferred?.rawLabel ?? null) ?? name!,
    };
  }

  private dedupeNormalizedParts(items: NormalizedSupplierPart[], limit: number) {
    const seen = new Set<string>();
    const result: NormalizedSupplierPart[] = [];
    for (const item of items) {
      const key = `${item.externalPartId}::${this.normalizeSearchText(item.name)}::${item.price ?? 'na'}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= limit) break;
    }
    return result;
  }

  private isLikelyProductUrl(
    absoluteUrl: string,
    requestUrl: string,
    candidatePaths: string[],
    excludePaths: string[],
    candidateUrlRegex: RegExp | null,
  ) {
    if (excludePaths.some((pathChunk) => absoluteUrl.includes(pathChunk))) return false;
    if (candidateUrlRegex && !candidateUrlRegex.test(absoluteUrl)) return false;
    if (candidatePaths.length > 0 && !candidatePaths.some((pathChunk) => absoluteUrl.includes(pathChunk))) return false;

    const requestHost = this.safeHostname(requestUrl);
    const candidateHost = this.safeHostname(absoluteUrl);
    if (requestHost && candidateHost && requestHost !== candidateHost) return false;

    const pathname = this.safePathname(absoluteUrl);
    if (!pathname) return false;
    if (/\/(?:categoria-producto|product-category|search|tienda|shop)\/?$/i.test(pathname)) return false;
    if (/\/(?:producto|product-page)\//i.test(pathname)) return true;
    return candidatePaths.length > 0;
  }

  private readObjectPath(value: unknown, rawPath: string) {
    const parts = rawPath.split('.').map((part) => part.trim()).filter(Boolean);
    let cursor: unknown = value;
    for (const part of parts) {
      if (cursor == null) return null;
      if (Array.isArray(cursor)) {
        const index = Number(part);
        if (!Number.isInteger(index) || index < 0 || index >= cursor.length) return null;
        cursor = cursor[index];
        continue;
      }
      if (typeof cursor !== 'object') return null;
      cursor = (cursor as Record<string, unknown>)[part];
    }
    return cursor ?? null;
  }

  private findJsonValue(item: unknown, cfg: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
    for (const configKey of configPaths) {
      const path = typeof cfg[configKey] === 'string' ? String(cfg[configKey]).trim() : '';
      if (!path) continue;
      const value = this.readObjectPath(item, path);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    for (const key of fallbackKeys) {
      const value = record[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  }

  private findJsonString(item: unknown, cfg: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
    const value = this.findJsonValue(item, cfg, configPaths, fallbackKeys);
    if (value == null) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return null;
  }

  private findJsonNumber(item: unknown, cfg: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
    const value = this.findJsonValue(item, cfg, configPaths, fallbackKeys);
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100) / 100;
    if (typeof value === 'string') return this.parseMoneyValue(value);
    return null;
  }

  private compileOptionalRegex(raw: unknown) {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      return new RegExp(raw, 'i');
    } catch {
      return null;
    }
  }

  private firstCapture(value: string, regex: RegExp) {
    const match = value.match(regex);
    if (!match) return '';
    return (match[2] ?? match[1] ?? match[0] ?? '').trim();
  }

  private stripHtml(value: string) {
    return this.decodeHtmlEntities(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeHtmlEntities(value: string) {
    return value
      .replace(/&#(\d+);/g, (_match, digits) => {
        const code = Number(digits);
        return Number.isInteger(code) ? String.fromCharCode(code) : '';
      })
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
        const code = Number.parseInt(hex, 16);
        return Number.isInteger(code) ? String.fromCharCode(code) : '';
      });
  }

  private cleanLabel(value?: string | null) {
    const stripped = this.stripHtml(value ?? '');
    return stripped || null;
  }

  private normalizeUrl(rawUrl?: string | null, requestUrl?: string | null) {
    const value = (rawUrl ?? '').trim();
    if (!value) return null;
    try {
      return new URL(value, requestUrl ?? undefined).toString();
    } catch {
      return null;
    }
  }

  private parseMoneyValue(value?: string | null) {
    const raw = this.decodeHtmlEntities((value ?? '').trim());
    if (!raw) return null;
    const cleaned = raw
      .replace(/\s+/g, ' ')
      .replace(/\bprecio\b/gi, ' ')
      .replace(/\bars\b/gi, '$');
    const match = cleaned.match(/(?:\$|ars|usd)?\s*([0-9][0-9.,\s]*)/i);
    const amount = match?.[1] ?? cleaned;
    let normalized = amount
      .replace(/\s/g, '')
      .replace(/[^0-9.,]/g, '');
    if (!normalized) return null;

    const hasDot = normalized.includes('.');
    const hasComma = normalized.includes(',');
    if (hasDot && hasComma) {
      const lastDot = normalized.lastIndexOf('.');
      const lastComma = normalized.lastIndexOf(',');
      const decimalSeparator = lastDot > lastComma ? '.' : ',';
      const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
      const decimalSuffix = normalized.slice(normalized.lastIndexOf(decimalSeparator) + 1);
      if (/^\d{2}$/.test(decimalSuffix)) {
        normalized = normalized.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
        if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
      } else {
        normalized = normalized.replace(/[.,]/g, '');
      }
    } else if (hasComma) {
      if (/^\d{1,3}(,\d{3})+$/.test(normalized)) normalized = normalized.replace(/,/g, '');
      else if (/,\d{2}$/.test(normalized)) normalized = normalized.replace(',', '.');
      else normalized = normalized.replace(/,/g, '');
    } else if (hasDot) {
      if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) normalized = normalized.replace(/\./g, '');
      else if (!/\.\d{2}$/.test(normalized)) normalized = normalized.replace(/\./g, '');
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
  }

  private extractSku(value?: string | null) {
    const raw = (value ?? '').trim();
    if (!raw) return null;
    const match = raw.match(/(?:sku|data-product_sku|c[oo]d(?:igo)?|part(?: number)?)[^A-Z0-9]{0,16}([A-Z0-9._\-]{4,})/i);
    const candidate = match?.[1]?.trim() ?? null;
    if (!candidate) return null;
    if (/^(bg_img|img|jpg|jpeg|png|webp|svg|gif|image|thumbnail)$/i.test(candidate)) return null;
    return candidate;
  }

  private normalizeAvailability(value: unknown): 'in_stock' | 'out_of_stock' | 'unknown' {
    if (typeof value === 'boolean') return value ? 'in_stock' : 'out_of_stock';
    if (typeof value === 'number') return value > 0 ? 'in_stock' : 'out_of_stock';
    const raw = typeof value === 'string' ? value.toLowerCase() : '';
    if (!raw) return 'unknown';
    if (/(sin stock|agotado|out of stock|outofstock|no disponible|no stock)/i.test(raw)) return 'out_of_stock';
    if (/(en stock|stock disponible|disponible|available|hay stock|instock)/i.test(raw)) return 'in_stock';
    return 'unknown';
  }

  private extractProductNameFromContext(snippet: string) {
    const headingMatch = snippet.match(/<(?:h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|h4)>/i);
    if (headingMatch) return this.cleanLabel(headingMatch[1]);
    const titleMatch = snippet.match(/title=(["'])(.*?)\1/i);
    if (titleMatch) return this.cleanLabel(titleMatch[2]);
    return null;
  }

  private extractHtmlPartName(snippet: string, rawLabel: string | null, url: string | null, profile: string) {
    const ariaLabel = this.cleanLabel(this.firstCapture(snippet, /aria-label=([\"'])(.*?)\1/i));
    const safeRawLabel = this.stripPartActionLabel(rawLabel);
    const safeAriaLabel = this.stripPartActionLabel(ariaLabel);
    const candidateNames = [
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bwd-entities-title\b[^\"']*\1[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /woocommerce-loop-product__title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bproduct-title\b[^\"']*\1[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bwoocommerce-LoopProduct-link\b[^\"']*\1[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bproduct__categories\b[^\"']*\1[\s\S]*?<\/p>\s*<div[^>]*woocommerce-loop-product__title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /data-hook=([\"'])product-item-root\1[^>]*aria-label=([\"'])(.*?)\2/i)),
      safeRawLabel,
      safeAriaLabel?.replace(/^galer[ií]a de\s+/i, '').trim() || null,
      this.extractProductNameFromContext(snippet),
      this.cleanLabel(this.slugToLabel(url)),
    ];
    const meaningful = candidateNames.find((value) => this.isMeaningfulPartName(value, null));
    if (!meaningful) return null;
    if (profile === 'wix') {
      return meaningful.replace(/^galer[ií]a de\s+/i, '').trim();
    }
    return meaningful;
  }

  private extractHtmlPartBrand(snippet: string, name: string | null, profile: string) {
    const categories = [...snippet.matchAll(/rel=(["'])tag\1[^>]*>([^<]+)</gi)].map((match) => this.cleanLabel(match[2])).filter(Boolean);
    const lastCategory = categories.at(-1) ?? null;
    if (lastCategory && !/(modulo|modulos|repuesto|repuestos|pantalla|display)/i.test(lastCategory)) {
      return lastCategory;
    }

    const categoryLabel = this.cleanLabel(this.firstCapture(snippet, /class=(["'])[^"']*\bproduct-cat\b[^"']*\1[^>]*>([\s\S]*?)<\/p>/i));
    if (categoryLabel && !/(modulo|modulos|repuesto|repuestos)/i.test(categoryLabel)) {
      return categoryLabel;
    }

    if (!name) return null;
    const brands = ['samsung', 'motorola', 'xiaomi', 'iphone', 'apple', 'lg', 'tcl', 'zte', 'realme', 'tecno', 'infinix', 'nokia', 'alcatel', 'huawei', 'oppo', 'vivo'];
    const normalized = this.normalizeSearchText(name);
    const found = brands.find((brand) => normalized.includes(brand));
    if (!found) return null;
    return found === 'apple' ? 'Apple' : found.charAt(0).toUpperCase() + found.slice(1);
  }

  private extractHtmlPartPrice(snippet: string, profile: string) {
    const candidates: string[] = [];
    if (profile === 'wix') {
      candidates.push(...[...snippet.matchAll(/data-wix-price=(["'])(.*?)\1/gi)].map((match) => match[2] ?? ''));
    }
    candidates.push(
      ...[...snippet.matchAll(/<span class="price">[\s\S]*?<\/span>/gi)].map((match) => this.stripHtml(match[0] ?? '')),
      ...[...snippet.matchAll(/woocommerce-Price-amount[^>]*>[\s\S]*?<span[^>]*woocommerce-Price-currencySymbol[^>]*>[\s\S]*?<\/span>\s*([^<]+)/gi)].map(
        (match) => match[1] ?? '',
      ),
      ...[...snippet.matchAll(/(?:\$|&#36;)\s*(?:&nbsp;|\s)*[0-9][0-9.,]*/gi)].map((match) => match[0] ?? ''),
      ...[...snippet.matchAll(/(?:\$|&#36;)\s*[0-9][0-9.,]*/gi)].map((match) => match[0] ?? ''),
    );
    const parsedValues = candidates
      .map((candidate) => this.parseMoneyValue(candidate))
      .filter((value): value is number => value != null);
    const realistic = parsedValues.find((value) => value >= 100 && value !== 0);
    if (realistic != null) return realistic;
    return null;
  }

  private extractHtmlPartAvailability(snippet: string) {
    if (/\binstock\b/i.test(snippet)) return 'in_stock' as const;
    if (/\boutofstock\b/i.test(snippet)) return 'out_of_stock' as const;
    return this.normalizeAvailability(snippet);
  }

  private safeHostname(value?: string | null) {
    try {
      return value ? new URL(value).hostname.toLowerCase().replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  }

  private safePathname(value?: string | null) {
    try {
      return value ? new URL(value).pathname.toLowerCase() : '';
    } catch {
      return '';
    }
  }

  private slugToLabel(url?: string | null) {
    const pathname = this.safePathname(url);
    const slug = pathname.split('/').filter(Boolean).pop();
    if (!slug) return null;
    return slug.replace(/[-_]+/g, ' ').trim();
  }

  private isMeaningfulPartName(value?: string | null, supplierName?: string | null) {
    const label = this.cleanLabel(value);
    if (!label) return false;
    const normalized = this.normalizeSearchText(label);
    if (!normalized || normalized.length < 4) return false;
    if (supplierName && normalized === this.normalizeSearchText(supplierName)) return false;
    if (/^(modulos?|repuestos?|samsung|apple|motorola|xiaomi|lg|nokia)$/.test(normalized)) return false;
    return /[a-z]/i.test(label);
  }

  private normalizeSearchText(value?: string | null) {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildPartSearchQueryProfile(query: string) {
    const genericTokens = new Set(['modulo', 'modulos', 'pantalla', 'display', 'touch', 'lcd', 'oled', 'incell', 'repuesto', 'repuestos', 'parte', 'partes', 'con', 'sin', 'marco', 'negro', 'blanco', 'original', 'premium']);
    const tokens = [...new Set(this.normalizeSearchText(query).split(' ').filter((token) => token.length >= 2))];
    const specificTokens = tokens.filter((token) => !genericTokens.has(token));
    return {
      normalized: this.normalizeSearchText(query),
      tokens,
      specificTokens,
      genericTokens,
    };
  }

  private availabilityOrder(value: 'in_stock' | 'out_of_stock' | 'unknown') {
    return value === 'in_stock' ? 0 : value === 'unknown' ? 1 : 2;
  }

  private rankSupplierPart(item: NormalizedSupplierPartWithProvider, profile: ReturnType<AdminService['buildPartSearchQueryProfile']>) {
    const nameTokens = this.normalizeSearchText(item.name).split(' ').filter(Boolean);
    const brandTokens = this.normalizeSearchText(item.brand).split(' ').filter(Boolean);
    const skuTokens = this.normalizeSearchText(item.sku).split(' ').filter(Boolean);
    const rawLabelTokens = this.normalizeSearchText(item.rawLabel).split(' ').filter(Boolean);
    const urlTokens = this.normalizeSearchText(this.slugToLabel(item.url)).split(' ').filter(Boolean);
    const haystack = [...nameTokens, ...brandTokens, ...skuTokens, ...rawLabelTokens, ...urlTokens].join(' ');
    const exactTokens = new Set(haystack.split(' ').filter(Boolean));
    let score = 0;
    let specificHits = 0;
    let totalHits = 0;
    if (profile.normalized && this.normalizeSearchText(item.name).includes(profile.normalized)) {
      score += 70;
    }
    for (const token of profile.tokens) {
      const exact = exactTokens.has(token);
      const partial = !exact && haystack.includes(token);
      if (!exact && !partial) continue;
      totalHits += 1;
      if (profile.specificTokens.includes(token)) {
        specificHits += 1;
        score += exact ? 22 : 9;
      } else {
        score += exact ? 5 : 2;
      }
    }
    if (item.price != null) score += 14;
    else score -= 8;
    if (item.price != null && item.price < 100) score -= 55;
    if (item.availability === 'in_stock') score += 12;
    else if (item.availability === 'out_of_stock') score -= 6;
    if (item.sku) score += 4;
    if (item.brand) score += 3;
    if (item.url && /\/(?:producto|product-page)\//i.test(item.url)) score += 6;
    if (item.name.length <= 64) score += 4;
    if (profile.specificTokens.length > 0 && specificHits === 0) score -= 45;
    if (profile.tokens.length >= 2 && totalHits < 2) score -= 18;
    if (item.price === 0) score -= 40;
    return score;
  }
  private stripPartActionLabel(value?: string | null) {
    const label = this.cleanLabel(value);
    if (!label) return null;

    const normalized = this.normalizeSearchText(label);
    if (normalized.startsWith('anadir al carrito')) {
      const quoted = label.match(/[:«“"]\s*(.+?)\s*[»”"]?$/);
      return quoted?.[1] ? this.cleanLabel(quoted[1]) : null;
    }
    if (normalized.startsWith('add to cart')) {
      const quoted = label.match(/[:«“"]\s*(.+?)\s*[»”"]?$/);
      return quoted?.[1] ? this.cleanLabel(quoted[1]) : null;
    }
    return label;
  }

  private async estimateProbeResultCount(
    response: { text: () => Promise<string> },
    searchMode: SupplierRegistryRow['searchMode'],
    configJson?: string | null,
  ) {
    if (searchMode === 'json') {
      const text = await response.text();
      try {
        const payload: unknown = JSON.parse(text);
        return this.extractCountFromJsonPayload(payload, configJson);
      } catch {
        return this.estimateHtmlResultCount(text);
      }
    }
    const html = await response.text();
    return this.estimateHtmlResultCount(html);
  }

  private extractCountFromJsonPayload(payload: unknown, configJson?: string | null) {
    if (Array.isArray(payload)) return payload.length;
    if (!payload || typeof payload !== 'object') return 0;

    const obj = payload as Record<string, unknown>;
    const cfg = this.parseJson(configJson) as { items_path?: string } | null;
    if (cfg?.items_path) {
      const parts = cfg.items_path.split('.').map((p) => p.trim()).filter(Boolean);
      let cursor: unknown = obj;
      for (const part of parts) {
        if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
          cursor = null;
          break;
        }
        cursor = (cursor as Record<string, unknown>)[part];
      }
      if (Array.isArray(cursor)) return cursor.length;
    }
    if (Array.isArray(obj.items)) return obj.items.length;
    return Object.keys(obj).length;
  }

  private estimateHtmlResultCount(html: string) {
    if (!html) return 0;
    const productLikeMatches = html.match(/(producto|product|price|precio|add-to-cart)/gi);
    if (productLikeMatches && productLikeMatches.length > 0) {
      return Math.min(99, Math.max(1, Math.round(productLikeMatches.length / 3)));
    }
    const linkMatches = html.match(/<a\s/gi);
    return Math.min(99, linkMatches?.length ?? 0);
  }

  private parseDateOnly(value: string) {
    const raw = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const date = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  private parseDateTime(value?: string | null) {
    const raw = (value ?? '').trim();
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  private formatDate(date: Date) {
    if (Number.isNaN(date.getTime())) return '-';
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getFullYear()),
    ].join('/');
  }

  private formatTime(date: Date) {
    if (Number.isNaN(date.getTime())) return '--:--';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatDateTime(date: Date) {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }

  private formatDateTimeShort(date: Date) {
    if (Number.isNaN(date.getTime())) return '-';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${this.formatTime(date)}`;
  }

  private formatDateInput(date: Date) {
    if (Number.isNaN(date.getTime())) return '';
    return [
      String(date.getFullYear()),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private clampInt(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private randomEntityId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
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

  private slugify(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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





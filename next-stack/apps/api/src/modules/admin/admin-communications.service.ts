import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import { OPEN_REPAIR_STATUSES, PENDING_ORDER_STATUSES } from './admin.constants.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { AdminSettingsService } from './admin-settings.service.js';

@Injectable()
export class AdminCommunicationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailService) private readonly mailService: MailService,
    @Inject(WhatsappService) private readonly whatsappService: WhatsappService,
    @Inject(AdminDashboardService) private readonly adminDashboardService: AdminDashboardService,
    @Inject(AdminSettingsService) private readonly adminSettingsService: AdminSettingsService,
  ) {}

  private readonly openRepairStatuses = OPEN_REPAIR_STATUSES;
  private readonly pendingOrderStatuses = PENDING_ORDER_STATUSES;

  async sendWeeklyDashboardReportNow(rangeDaysRaw?: number | null) {
    const configuredRange = Number(await this.getAppSettingValue('ops_weekly_report_range_days', '30'));
    const rangeDays = [7, 30, 90].includes(Number(rangeDaysRaw))
      ? Number(rangeDaysRaw)
      : [7, 30, 90].includes(configuredRange)
        ? configuredRange
        : 30;
    const recipients = await this.resolveWeeklyReportRecipients();
    if (recipients.length === 0) {
      throw new BadRequestException('No hay destinatarios configurados para el reporte semanal');
    }

    const dashboard = await this.adminDashboardService.dashboard();
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
      ...(dashboard.alerts.length
        ? dashboard.alerts.map((a) => `- ${a.title}: ${a.value} (${a.severity})`)
        : ['- Sin alertas activas']),
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

    const orderStaleHours = Math.max(
      1,
      Math.min(720, Number(await this.getAppSettingValue('ops_alert_order_stale_hours', '24')) || 24),
    );
    const repairStaleDays = Math.max(
      1,
      Math.min(180, Number(await this.getAppSettingValue('ops_alert_repair_stale_days', '3')) || 3),
    );
    const dedupeMinutes = Math.max(
      5,
      Math.min(10080, Number(await this.getAppSettingValue('ops_operational_alerts_dedupe_minutes', '360')) || 360),
    );

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
      ...(orders.length
        ? orders.map((o) => `- ${o.id} | ${o.status} | ${o.user?.name ?? 'Sin usuario'} | ${o.updatedAt.toISOString()}`)
        : ['- Sin pedidos alertados']),
      '',
      'Reparaciones',
      ...(repairs.length
        ? repairs.map((r) => `- ${r.id} | ${r.status} | ${r.customerName} | ${r.updatedAt.toISOString()}`)
        : ['- Sin reparaciones alertadas']),
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

    const map = new Map(existing.map((s) => [s.key, s]));
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

  async upsertMailTemplates(input: Array<{ templateKey: string; subject: string; body: string; enabled?: boolean }>) {
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

    const allowed = new Set(['repair_status_update', 'order_status_update']);
    const legacyItems = input.items.filter((i) => !i.channel && !fallbackChannel && allowed.has(i.templateKey));
    for (const t of legacyItems) {
      const base = `whatsapp_template.${t.templateKey}`;
      await this.upsertSingleSetting(`${base}.body`, t.body, 'whatsapp_templates', `${t.templateKey}.body`, 'textarea');
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
      items: rows.map((r) => ({
        id: r.id,
        channel: r.channel,
        templateKey: r.templateKey,
        targetType: r.targetType,
        targetId: r.targetId,
        phone: r.phone,
        recipient: this.repairMojibakeText(r.recipient),
        provider: r.provider,
        remoteMessageId: r.remoteMessageId,
        providerStatus: r.providerStatus,
        errorMessage: this.repairMojibakeText(r.errorMessage),
        status: r.status,
        message: this.repairMojibakeText(r.message),
        meta: this.repairMojibakeValue(this.parseJson(r.metaJson)),
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

  private mailTemplatePlaceholders(templateKey: string) {
    const common = ['{{business_name}}', '{{user_name}}'];
    if (templateKey === 'verify_email') return [...common, '{{verify_url}}'];
    if (templateKey === 'reset_password') return [...common, '{{reset_url}}'];
    if (templateKey === 'order_created') return [...common, '{{order_id}}', '{{order_total}}'];
    return common;
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
    await this.adminSettingsService.upsertSingleSetting(key, value, group, label, type);
  }

  private async getAppSettingValue(key: string, fallback = '') {
    return this.adminSettingsService.getAppSettingValue(key, fallback);
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
    await this.adminSettingsService.upsertSettings([
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

  private repairMojibakeText(value?: string | null) {
    if (value == null || !/[ÃƒÃ‚Ã¢ï¿½�]/u.test(value)) return value ?? null;
    try {
      const decoded = Buffer.from(value, 'latin1').toString('utf8');
      const normalized = this.normalizeBrokenSpanishText(decoded);
      if (!/[ÃƒÃ‚Ã¢ï¿½�]/u.test(normalized)) return normalized;
      return this.normalizeBrokenSpanishText(value);
    } catch {
      return this.normalizeBrokenSpanishText(value);
    }
  }

  private repairMojibakeValue(value: unknown): unknown {
    if (typeof value === 'string') return this.repairMojibakeText(value);
    if (Array.isArray(value)) return value.map((item) => this.repairMojibakeValue(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, this.repairMojibakeValue(entry)]));
  }

  private normalizeBrokenSpanishText(value: string) {
    return value
      .replace(/Direcci(?:ï¿½|�)n/gi, 'Dirección')
      .replace(/Tel(?:ï¿½|�)fono/gi, 'Teléfono')
      .replace(/Hor(?:ï¿½|�)rios/gi, 'Horarios')
      .replace(/est(?:ï¿½|�)/gi, 'está')
      .replace(/(?:ï¿½|�)tems/gi, 'Ítems')
      .replace(/informaci(?:ï¿½|�)n/gi, 'información')
      .replace(/confirmaci(?:ï¿½|�)n/gi, 'confirmación')
      .replace(/preparaci(?:ï¿½|�)n/gi, 'preparación')
      .replace(/reparaci(?:ï¿½|�)n/gi, 'reparación')
      .replace(/cotizaci(?:ï¿½|�)n/gi, 'cotización')
      .replace(/direcci(?:ï¿½|�)n/gi, 'dirección')
      .replace(/tel(?:ï¿½|�)fono/gi, 'teléfono')
      .replace(/ci(?:ï¿½|�)n/gi, 'ción')
      .replace(/ï¿½/g, '')
      .replace(/�/g, '');
  }
}

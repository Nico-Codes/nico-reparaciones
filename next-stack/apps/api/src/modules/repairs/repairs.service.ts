import { ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, type Repair } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type CreateRepairInput = {
  customerName: string;
  customerPhone?: string | null;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  notes?: string | null;
  quotedPrice?: number | null;
  finalPrice?: number | null;
  userId?: string | null;
};

type UpdateRepairInput = Partial<Omit<CreateRepairInput, 'userId'>> & {
  customerName?: string;
  status?: string;
};

type QuoteApprovalTokenPayload = {
  type: 'repair_quote';
  repairId: string;
};

@Injectable()
export class RepairsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async publicLookup(repairIdRaw: string, customerPhoneRaw?: string | null) {
    const repairId = repairIdRaw.trim();
    const customerPhone = this.cleanNullable(customerPhoneRaw);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });

    if (!repair) {
      return { ok: false, found: false, message: 'Reparación no encontrada' };
    }

    if (customerPhone) {
      const inputPhoneNorm = this.normalizePhone(customerPhone);
      const repairPhoneNorm = this.normalizePhone(repair.customerPhone);
      if (!inputPhoneNorm || !repairPhoneNorm || inputPhoneNorm !== repairPhoneNorm) {
        return { ok: false, found: false, message: 'No coincide el teléfono de la reparación' };
      }
    }

    return {
      ok: true,
      found: true,
      item: this.serializePublicLookup(repair),
    };
  }

  async publicQuoteApproval(repairIdRaw: string, tokenRaw: string) {
    const repairId = repairIdRaw.trim();
    const token = tokenRaw.trim();
    await this.verifyQuoteApprovalToken(repairId, token);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });
    if (!repair) throw new NotFoundException('Reparacion no encontrada');
    return {
      ok: true,
      canDecide: repair.status === 'WAITING_APPROVAL',
      item: this.serializePublicQuoteApproval(repair),
    };
  }

  async publicQuoteApprove(repairIdRaw: string, tokenRaw: string) {
    return this.applyPublicQuoteDecision(repairIdRaw, tokenRaw, 'REPAIRING', 'Presupuesto aprobado. Empezamos con la reparacion.');
  }

  async publicQuoteReject(repairIdRaw: string, tokenRaw: string) {
    return this.applyPublicQuoteDecision(repairIdRaw, tokenRaw, 'CANCELLED', 'Presupuesto rechazado. La reparacion quedo cancelada.');
  }

  private async applyPublicQuoteDecision(
    repairIdRaw: string,
    tokenRaw: string,
    toStatus: 'REPAIRING' | 'CANCELLED',
    successMessage: string,
  ) {
    const repairId = repairIdRaw.trim();
    const token = tokenRaw.trim();
    await this.verifyQuoteApprovalToken(repairId, token);

    const current = await this.prisma.repair.findUnique({ where: { id: repairId } });
    if (!current) throw new NotFoundException('Reparacion no encontrada');

    if (current.status !== 'WAITING_APPROVAL') {
      return {
        ok: true,
        changed: false,
        canDecide: false,
        message: 'Esta reparacion ya no esta esperando aprobacion.',
        item: this.serializePublicQuoteApproval(current),
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const update = await tx.repair.updateMany({
        where: { id: repairId, status: 'WAITING_APPROVAL' },
        data: { status: toStatus },
      });

      const updated = await tx.repair.findUnique({ where: { id: repairId } });
      if (!updated) throw new NotFoundException('Reparacion no encontrada');

      if (update.count === 1) {
        const message =
          toStatus === 'REPAIRING'
            ? 'Cliente aprobo el presupuesto desde enlace publico.'
            : 'Cliente rechazo el presupuesto desde enlace publico.';
        await tx.repairEventLog.create({
          data: {
            repairId,
            eventType: 'STATUS_CHANGED',
            message,
            metaJson: JSON.stringify({
              fromStatus: 'WAITING_APPROVAL',
              toStatus,
              source: 'public_quote_approval',
            }),
          },
        });
      }

      return { updated, changed: update.count === 1 };
    });

    if (!result.changed) {
      return {
        ok: true,
        changed: false,
        canDecide: false,
        message: 'Esta reparacion ya no esta esperando aprobacion.',
        item: this.serializePublicQuoteApproval(result.updated),
      };
    }

    return {
      ok: true,
      changed: true,
      canDecide: false,
      message: successMessage,
      item: this.serializePublicQuoteApproval(result.updated),
    };
  }

  async create(input: CreateRepairInput) {
    const data: Prisma.RepairUncheckedCreateInput = {
      userId: input.userId ?? null,
      deviceTypeId: this.cleanNullable(input.deviceTypeId),
      deviceBrandId: this.cleanNullable(input.deviceBrandId),
      deviceModelId: this.cleanNullable(input.deviceModelId),
      deviceIssueTypeId: this.cleanNullable(input.deviceIssueTypeId),
      customerName: input.customerName.trim(),
      customerPhone: this.cleanNullable(input.customerPhone),
      deviceBrand: this.cleanNullable(input.deviceBrand),
      deviceModel: this.cleanNullable(input.deviceModel),
      issueLabel: this.cleanNullable(input.issueLabel),
      notes: this.cleanNullable(input.notes),
      quotedPrice: input.quotedPrice != null ? new Prisma.Decimal(input.quotedPrice) : null,
      finalPrice: input.finalPrice != null ? new Prisma.Decimal(input.finalPrice) : null,
      status: 'RECEIVED',
    };
    const repair = await this.prisma.repair.create({
      data,
    });

    await this.createEvent(repair.id, 'CREATED', 'Reparación creada', {
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
    });

    return this.serializeRepair(repair);
  }

  async adminList(params?: { status?: string; q?: string; from?: string; to?: string }) {
    const q = (params?.q ?? '').trim();
    const status = (params?.status ?? '').trim();
    const createdAtRange = this.buildCreatedAtRange(params?.from, params?.to);

    const items = await this.prisma.repair.findMany({
      where: {
        ...(status ? { status: this.normalizeStatus(status) } : {}),
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { customerName: { contains: q, mode: 'insensitive' } },
                { customerPhone: { contains: q, mode: 'insensitive' } },
                { deviceBrand: { contains: q, mode: 'insensitive' } },
                { deviceModel: { contains: q, mode: 'insensitive' } },
                { issueLabel: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { items: items.map((r) => this.serializeRepair(r)) };
  }

  async adminStats() {
    const [total, byStatusRows, readyPickup, deliveredToday] = await Promise.all([
      this.prisma.repair.count(),
      this.prisma.repair.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.repair.count({ where: { status: 'READY_PICKUP' } }),
      this.prisma.repair.count({
        where: {
          status: 'DELIVERED',
          updatedAt: { gte: this.startOfToday() },
        },
      }),
    ]);

    const byStatus = byStatusRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    return {
      total,
      readyPickup,
      deliveredToday,
      byStatus,
    };
  }

  async adminDetail(id: string) {
    const repair = await this.prisma.repair.findUnique({ where: { id } });
    if (!repair) throw new NotFoundException('Reparación no encontrada');
    const events = await this.prisma.repairEventLog.findMany({
      where: { repairId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { item: this.serializeRepair(repair), timeline: events.map((e) => this.serializeEvent(e)) };
  }

  async adminUpdateStatus(id: string, statusRaw: string, finalPrice?: number | null, notes?: string | null) {
    const status = this.normalizeStatus(statusRaw);
    const previous = await this.prisma.repair.findUnique({ where: { id } });
    const repair = await this.prisma.repair.update({
      where: { id },
      data: {
        status,
        ...(finalPrice !== undefined ? { finalPrice: finalPrice == null ? null : new Prisma.Decimal(finalPrice) } : {}),
        ...(notes !== undefined ? { notes: this.cleanNullable(notes) } : {}),
      },
    });
    await this.createEvent(repair.id, 'STATUS_CHANGED', `Estado: ${(previous?.status ?? 'UNKNOWN')} -> ${repair.status}`, {
      fromStatus: previous?.status ?? null,
      toStatus: repair.status,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notesUpdated: notes !== undefined,
    });
    await this.createRepairWhatsappLog(repair);
    return { item: this.serializeRepair(repair) };
  }

  async adminUpdate(id: string, input: UpdateRepairInput) {
    const previous = await this.prisma.repair.findUnique({ where: { id } });
    const data: Prisma.RepairUncheckedUpdateInput = {};

    if (input.customerName !== undefined) data.customerName = input.customerName.trim();
    if (input.customerPhone !== undefined) data.customerPhone = this.cleanNullable(input.customerPhone);
    if (input.deviceTypeId !== undefined) data.deviceTypeId = this.cleanNullable(input.deviceTypeId);
    if (input.deviceBrandId !== undefined) data.deviceBrandId = this.cleanNullable(input.deviceBrandId);
    if (input.deviceModelId !== undefined) data.deviceModelId = this.cleanNullable(input.deviceModelId);
    if (input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = this.cleanNullable(input.deviceIssueTypeId);
    if (input.deviceBrand !== undefined) data.deviceBrand = this.cleanNullable(input.deviceBrand);
    if (input.deviceModel !== undefined) data.deviceModel = this.cleanNullable(input.deviceModel);
    if (input.issueLabel !== undefined) data.issueLabel = this.cleanNullable(input.issueLabel);
    if (input.notes !== undefined) data.notes = this.cleanNullable(input.notes);
    if (input.quotedPrice !== undefined) data.quotedPrice = input.quotedPrice == null ? null : new Prisma.Decimal(input.quotedPrice);
    if (input.finalPrice !== undefined) data.finalPrice = input.finalPrice == null ? null : new Prisma.Decimal(input.finalPrice);
    if (input.status !== undefined) data.status = this.normalizeStatus(input.status);

    const repair = await this.prisma.repair.update({
      where: { id },
      data,
    });

    if (previous) {
      const changedFields = this.detectChangedFields(previous, repair);
      if (changedFields.length > 0) {
        await this.createEvent(repair.id, 'UPDATED', `Campos actualizados: ${changedFields.join(', ')}`, { changedFields });
      }
    }

    return { item: this.serializeRepair(repair) };
  }

  async myRepairs(userId: string) {
    const items = await this.prisma.repair.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: items.map((r) => this.serializeRepair(r)) };
  }

  async myRepairDetail(userId: string, id: string) {
    const repair = await this.prisma.repair.findUnique({ where: { id } });
    if (!repair) throw new NotFoundException('Reparación no encontrada');
    if (repair.userId !== userId) throw new ForbiddenException('No autorizado');
    return { item: this.serializeRepair(repair) };
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private normalizePhone(value?: string | null) {
    return (value ?? '').replace(/\D+/g, '');
  }

  private normalizeStatus(status: string) {
    const allowed = new Set([
      'RECEIVED',
      'DIAGNOSING',
      'WAITING_APPROVAL',
      'REPAIRING',
      'READY_PICKUP',
      'DELIVERED',
      'CANCELLED',
    ]);
    const normalized = status.toUpperCase();
    if (!allowed.has(normalized)) return 'RECEIVED';
    return normalized as
      | 'RECEIVED'
      | 'DIAGNOSING'
      | 'WAITING_APPROVAL'
      | 'REPAIRING'
      | 'READY_PICKUP'
      | 'DELIVERED'
      | 'CANCELLED';
  }

  private serializeRepair(repair: Repair) {
    return {
      id: repair.id,
      userId: repair.userId,
      deviceTypeId: (repair as any).deviceTypeId ?? null,
      deviceBrandId: repair.deviceBrandId ?? null,
      deviceModelId: repair.deviceModelId ?? null,
      deviceIssueTypeId: repair.deviceIssueTypeId ?? null,
      customerName: repair.customerName,
      customerPhone: repair.customerPhone,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notes: repair.notes,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }

  private serializePublicLookup(repair: Repair) {
    return {
      id: repair.id,
      customerName: repair.customerName,
      customerPhoneMasked: repair.customerPhone ? this.maskPhone(repair.customerPhone) : null,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }

  private serializePublicQuoteApproval(repair: Repair) {
    return {
      id: repair.id,
      customerName: repair.customerName,
      customerPhoneMasked: repair.customerPhone ? this.maskPhone(repair.customerPhone) : null,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      issueLabel: repair.issueLabel,
      status: repair.status,
      statusLabel: this.repairStatusLabel(repair.status),
      quotedPrice: repair.quotedPrice != null ? Number(repair.quotedPrice) : null,
      finalPrice: repair.finalPrice != null ? Number(repair.finalPrice) : null,
      notes: repair.notes,
      createdAt: repair.createdAt.toISOString(),
      updatedAt: repair.updatedAt.toISOString(),
    };
  }

  private maskPhone(phone: string) {
    const digits = this.normalizePhone(phone);
    if (!digits) return null;
    if (digits.length <= 4) return digits;
    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  }

  private startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private buildCreatedAtRange(fromRaw?: string, toRaw?: string) {
    const from = this.parseDateStart(fromRaw);
    const toExclusive = this.parseDateEndExclusive(toRaw);
    if (!from && !toExclusive) return undefined;
    return {
      ...(from ? { gte: from } : {}),
      ...(toExclusive ? { lt: toExclusive } : {}),
    };
  }

  private parseDateStart(value?: string) {
    const v = (value ?? '').trim();
    if (!v) return null;
    const d = new Date(`${v}T00:00:00.000`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private parseDateEndExclusive(value?: string) {
    const v = (value ?? '').trim();
    if (!v) return null;
    const d = new Date(`${v}T00:00:00.000`);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 1);
    return d;
  }

  private async createEvent(repairId: string, eventType: string, message?: string | null, meta?: unknown) {
    await this.prisma.repairEventLog.create({
      data: {
        repairId,
        eventType,
        message: message ?? null,
        metaJson: meta == null ? null : JSON.stringify(meta),
      },
    });
  }

  private serializeEvent(event: { id: string; eventType: string; message: string | null; metaJson: string | null; createdAt: Date }) {
    let meta: unknown = null;
    if (event.metaJson) {
      try {
        meta = JSON.parse(event.metaJson);
      } catch {
        meta = event.metaJson;
      }
    }
    return {
      id: event.id,
      eventType: event.eventType,
      message: event.message,
      meta,
      createdAt: event.createdAt.toISOString(),
    };
  }

  private detectChangedFields(before: Repair, after: Repair) {
    const changed: string[] = [];

    const baseFields: Array<[keyof Repair, string]> = [
      ['customerName', 'customerName'],
      ['customerPhone', 'customerPhone'],
      ['deviceTypeId', 'deviceTypeId'],
      ['deviceBrandId', 'deviceBrandId'],
      ['deviceModelId', 'deviceModelId'],
      ['deviceIssueTypeId', 'deviceIssueTypeId'],
      ['deviceBrand', 'deviceBrand'],
      ['deviceModel', 'deviceModel'],
      ['issueLabel', 'issueLabel'],
      ['status', 'status'],
      ['notes', 'notes'],
    ];

    for (const [field, label] of baseFields) {
      if (String(before[field] ?? '') !== String(after[field] ?? '')) changed.push(label);
    }

    const beforeQuoted = before.quotedPrice != null ? Number(before.quotedPrice) : null;
    const afterQuoted = after.quotedPrice != null ? Number(after.quotedPrice) : null;
    const beforeFinal = before.finalPrice != null ? Number(before.finalPrice) : null;
    const afterFinal = after.finalPrice != null ? Number(after.finalPrice) : null;
    if (beforeQuoted !== afterQuoted) changed.push('quotedPrice');
    if (beforeFinal !== afterFinal) changed.push('finalPrice');

    return changed;
  }

  private async createRepairWhatsappLog(repair: Repair) {
    try {
      const statusKey = this.repairStatusTemplateKey(repair.status);
      const webBase = this.getWebBaseUrl();
      const approvalUrl = statusKey === 'waiting_approval' ? await this.createPublicQuoteApprovalUrl(repair.id) : '';
      const settingsKeys = [
        `whatsapp_repairs_template.${statusKey}.body`,
        'shop_address',
        'shop_hours',
      ];
      const rows = await this.prisma.appSetting.findMany({ where: { key: { in: settingsKeys } } });
      const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
      const template = (map.get(`whatsapp_repairs_template.${statusKey}.body`) || '').trim() || this.defaultRepairWhatsappTemplate(statusKey);
      const vars: Record<string, string> = {
        customer_name: (repair.customerName || 'Cliente').trim(),
        code: repair.id,
        status: statusKey,
        status_label: this.repairStatusLabel(repair.status),
        lookup_url: `${webBase}/reparacion`,
        phone: (repair.customerPhone || '').trim(),
        device_brand: (repair.deviceBrand || '').trim(),
        device_model: (repair.deviceModel || '').trim(),
        device: [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' ').trim(),
        final_price: repair.finalPrice != null ? `$${Number(repair.finalPrice).toLocaleString('es-AR')}` : '',
        warranty_days: '',
        approval_url: approvalUrl,
        shop_address: (map.get('shop_address') || '').trim(),
        shop_hours: (map.get('shop_hours') || '').trim(),
      };
      const message = this.applyTemplateVars(template, vars);
      await this.prisma.whatsAppLog.create({
        data: {
          channel: 'repairs',
          templateKey: `repairs.${statusKey}`,
          targetType: 'repair',
          targetId: repair.id,
          phone: repair.customerPhone ?? null,
          recipient: repair.customerName ?? null,
          status: 'PENDING',
          message,
          metaJson: JSON.stringify({
            source: 'admin_status_change',
            repairId: repair.id,
            status: repair.status,
          }),
        },
      });
    } catch {
      // no bloquear flujo de negocio
    }
  }

  private repairStatusTemplateKey(status: Repair['status']) {
    if (status === 'RECEIVED') return 'received';
    if (status === 'DIAGNOSING') return 'diagnosing';
    if (status === 'WAITING_APPROVAL') return 'waiting_approval';
    if (status === 'REPAIRING') return 'repairing';
    if (status === 'READY_PICKUP') return 'ready_pickup';
    if (status === 'DELIVERED') return 'delivered';
    if (status === 'CANCELLED') return 'cancelled';
    return 'received';
  }

  private repairStatusLabel(status: Repair['status']) {
    const map: Record<string, string> = {
      RECEIVED: 'Recibido',
      DIAGNOSING: 'Diagnosticando',
      WAITING_APPROVAL: 'Esperando aprobación',
      REPAIRING: 'En reparación',
      READY_PICKUP: 'Listo para retirar',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return map[status] ?? status;
  }

  private defaultRepairWhatsappTemplate(statusKey: string) {
    const base = [
      'Hola {customer_name}',
      'Tu reparación ({code}) está en estado: *{status_label}*.',
      '',
      'Podés consultar el estado en: {lookup_url}',
      'Código: {code}',
      'Equipo: {device}',
      'NicoReparaciones',
    ];
    if (statusKey === 'waiting_approval') {
      base.splice(2, 0, 'Necesitamos tu aprobación para continuar.', 'Aprobá o rechazá acá: {approval_url}', '');
    }
    if (statusKey === 'ready_pickup') {
      base.splice(2, 0, '¡Ya está lista para retirar!', '', 'Dirección: {shop_address}', 'Horarios: {shop_hours}', '');
    }
    return base.join('\n');
  }

  private applyTemplateVars(template: string, vars: Record<string, string>) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_m, key) => vars[key] ?? '');
  }

  private async createPublicQuoteApprovalUrl(repairId: string) {
    const token = await this.signQuoteApprovalToken(repairId);
    const base = this.getWebBaseUrl();
    return `${base}/reparacion/${encodeURIComponent(repairId)}/presupuesto?token=${encodeURIComponent(token)}`;
  }

  private async signQuoteApprovalToken(repairId: string) {
    const payload: QuoteApprovalTokenPayload = {
      type: 'repair_quote',
      repairId,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.getQuoteApprovalSecret(),
      expiresIn: this.getQuoteApprovalTtlSeconds(),
    });
  }

  private async verifyQuoteApprovalToken(repairId: string, token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<QuoteApprovalTokenPayload>(token, {
        secret: this.getQuoteApprovalSecret(),
      });
      if (payload.type !== 'repair_quote' || payload.repairId !== repairId) {
        throw new UnauthorizedException('Enlace invalido o expirado');
      }
    } catch {
      throw new UnauthorizedException('Enlace invalido o expirado');
    }
  }

  private getQuoteApprovalSecret() {
    const explicit = (process.env.REPAIR_QUOTE_APPROVAL_SECRET ?? '').trim();
    if (explicit) return explicit;
    const accessSecret = (process.env.JWT_ACCESS_SECRET ?? '').trim();
    if (accessSecret) return `${accessSecret}.repair-quote`;
    return 'dev-access-secret-change-me.repair-quote';
  }

  private getQuoteApprovalTtlSeconds() {
    const raw = Number.parseInt((process.env.REPAIR_QUOTE_APPROVAL_TTL_SECONDS ?? '').trim(), 10);
    if (Number.isFinite(raw) && raw > 0) return raw;
    return 60 * 60 * 24 * 7;
  }

  private getWebBaseUrl() {
    return (((process.env.WEB_URL ?? '').trim() || 'http://localhost:5174')).replace(/\/+$/, '');
  }
}

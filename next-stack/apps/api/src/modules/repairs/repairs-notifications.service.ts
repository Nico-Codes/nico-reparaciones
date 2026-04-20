import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type Repair } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import {
  applyTemplateVars,
  buildWhatsappManualUrl,
  defaultRepairWhatsappTemplate,
  getRepairQuoteApprovalSecret,
  getRepairQuoteApprovalTtlSeconds,
  getRepairsWebBaseUrl,
  normalizeWhatsappPhone,
  repairStatusLabel,
  repairStatusTemplateKey,
} from './repairs.helpers.js';
import type { QuoteApprovalTokenPayload, RepairWhatsappDraft } from './repairs.types.js';

@Injectable()
export class RepairsNotificationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(WhatsappService) private readonly whatsappService: WhatsappService,
  ) {}

  async createRepairWhatsappLog(repair: Repair) {
    try {
      const draft = await this.buildRepairWhatsappDraft(repair);

      await this.whatsappService.createAndDispatchLog({
        channel: 'repairs',
        templateKey: draft.templateKey,
        targetType: 'repair',
        targetId: repair.id,
        phone: repair.customerPhone ?? null,
        recipient: repair.customerName ?? null,
        message: draft.message,
        meta: {
          source: 'admin_status_change',
          deliveryMode: 'cloud',
          repairId: repair.id,
          status: repair.status,
        },
      });
    } catch {
      // no bloquear flujo de negocio
    }
  }

  async buildRepairWhatsappDraft(repair: Repair): Promise<RepairWhatsappDraft> {
    const statusKey = repairStatusTemplateKey(repair.status);
    const webBase = getRepairsWebBaseUrl();
    const approvalUrl = statusKey === 'waiting_approval' ? await this.createPublicQuoteApprovalUrl(repair.id) : '';
    const settingsKeys = [`whatsapp_repairs_template.${statusKey}.body`, 'shop_address', 'shop_hours'];
    const rows = await this.prisma.appSetting.findMany({ where: { key: { in: settingsKeys } } });
    const map = new Map(rows.map((row) => [row.key, row.value ?? '']));
    const template =
      (map.get(`whatsapp_repairs_template.${statusKey}.body`) || '').trim() || defaultRepairWhatsappTemplate(statusKey);
    const vars: Record<string, string> = {
      customer_name: (repair.customerName || 'Cliente').trim(),
      code: repair.id,
      status: statusKey,
      status_label: repairStatusLabel(repair.status),
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
    const message = applyTemplateVars(template, vars);
    const normalizedPhone = normalizeWhatsappPhone(repair.customerPhone);
    const openUrl = buildWhatsappManualUrl(repair.customerPhone, message);

    return {
      repairId: repair.id,
      templateKey: `repairs.${statusKey}`,
      statusKey,
      statusLabel: repairStatusLabel(repair.status),
      phone: repair.customerPhone ?? null,
      normalizedPhone,
      message,
      openUrl,
      canSend: !!normalizedPhone && !!openUrl,
      reason: normalizedPhone ? null : 'Carga un telefono valido con codigo de area y pais para abrir WhatsApp.',
      deliveryMode: 'manual',
      cloudStatus: this.whatsappService.isCloudConfigured() ? 'configured' : 'unavailable',
    };
  }

  async createRepairManualWhatsappLog(repair: Repair) {
    const draft = await this.buildRepairWhatsappDraft(repair);

    return this.whatsappService.createManualLog({
      channel: 'repairs',
      templateKey: draft.templateKey,
      targetType: 'repair',
      targetId: repair.id,
      phone: repair.customerPhone ?? null,
      recipient: repair.customerName ?? null,
      message: draft.message,
      meta: {
        source: 'admin_manual_open',
        deliveryMode: 'manual',
        repairId: repair.id,
        status: repair.status,
        openUrl: draft.openUrl,
      },
    });
  }

  async createPublicQuoteApprovalUrl(repairId: string) {
    const token = await this.signQuoteApprovalToken(repairId);
    const base = getRepairsWebBaseUrl();
    return `${base}/reparacion/${encodeURIComponent(repairId)}/presupuesto?token=${encodeURIComponent(token)}`;
  }

  async verifyQuoteApprovalToken(repairId: string, token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<QuoteApprovalTokenPayload>(token, {
        secret: getRepairQuoteApprovalSecret(),
      });
      if (payload.type !== 'repair_quote' || payload.repairId !== repairId) {
        throw new UnauthorizedException('Enlace invalido o expirado');
      }
    } catch {
      throw new UnauthorizedException('Enlace invalido o expirado');
    }
  }

  private async signQuoteApprovalToken(repairId: string) {
    const payload: QuoteApprovalTokenPayload = {
      type: 'repair_quote',
      repairId,
    };
    return this.jwtService.signAsync(payload, {
      secret: getRepairQuoteApprovalSecret(),
      expiresIn: getRepairQuoteApprovalTtlSeconds(),
    });
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { cleanNullable, normalizePhone } from './repairs.helpers.js';
import { RepairsNotificationsService } from './repairs-notifications.service.js';
import { RepairsSupportService } from './repairs-support.service.js';

@Injectable()
export class RepairsPublicService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RepairsSupportService) private readonly repairsSupportService: RepairsSupportService,
    @Inject(RepairsNotificationsService) private readonly repairsNotificationsService: RepairsNotificationsService,
  ) {}

  async publicLookup(repairIdRaw: string, customerPhoneRaw?: string | null) {
    const repairId = repairIdRaw.trim();
    const customerPhone = cleanNullable(customerPhoneRaw);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });

    if (!repair) {
      return { ok: false, found: false, message: 'Reparacion no encontrada' };
    }

    if (customerPhone) {
      const inputPhoneNorm = normalizePhone(customerPhone);
      const repairPhoneNorm = normalizePhone(repair.customerPhone);
      if (!inputPhoneNorm || !repairPhoneNorm || inputPhoneNorm !== repairPhoneNorm) {
        return { ok: false, found: false, message: 'No coincide el telefono de la reparacion' };
      }
    }

    return {
      ok: true,
      found: true,
      item: this.repairsSupportService.serializePublicLookup(repair),
    };
  }

  async publicQuoteApproval(repairIdRaw: string, tokenRaw: string) {
    const repairId = repairIdRaw.trim();
    const token = tokenRaw.trim();
    await this.repairsNotificationsService.verifyQuoteApprovalToken(repairId, token);
    const repair = await this.prisma.repair.findUnique({ where: { id: repairId } });
    if (!repair) throw new NotFoundException('Reparacion no encontrada');
    return {
      ok: true,
      canDecide: repair.status === 'WAITING_APPROVAL',
      item: this.repairsSupportService.serializePublicQuoteApproval(repair),
    };
  }

  async publicQuoteApprove(repairIdRaw: string, tokenRaw: string) {
    return this.applyPublicQuoteDecision(
      repairIdRaw,
      tokenRaw,
      'REPAIRING',
      'Presupuesto aprobado. Empezamos con la reparacion.',
    );
  }

  async publicQuoteReject(repairIdRaw: string, tokenRaw: string) {
    return this.applyPublicQuoteDecision(
      repairIdRaw,
      tokenRaw,
      'CANCELLED',
      'Presupuesto rechazado. La reparacion quedo cancelada.',
    );
  }

  private async applyPublicQuoteDecision(
    repairIdRaw: string,
    tokenRaw: string,
    toStatus: 'REPAIRING' | 'CANCELLED',
    successMessage: string,
  ) {
    const repairId = repairIdRaw.trim();
    const token = tokenRaw.trim();
    await this.repairsNotificationsService.verifyQuoteApprovalToken(repairId, token);

    const current = await this.prisma.repair.findUnique({ where: { id: repairId } });
    if (!current) throw new NotFoundException('Reparacion no encontrada');

    if (current.status !== 'WAITING_APPROVAL') {
      return {
        ok: true,
        changed: false,
        canDecide: false,
        message: 'Esta reparacion ya no esta esperando aprobacion.',
        item: this.repairsSupportService.serializePublicQuoteApproval(current),
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
        item: this.repairsSupportService.serializePublicQuoteApproval(result.updated),
      };
    }

    return {
      ok: true,
      changed: true,
      canDecide: false,
      message: successMessage,
      item: this.repairsSupportService.serializePublicQuoteApproval(result.updated),
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { RepairsAdminService } from './repairs-admin.service.js';
import { RepairsPublicService } from './repairs-public.service.js';
import type { CreateRepairInput, RepairAdminListParams, UpdateRepairInput } from './repairs.types.js';

@Injectable()
export class RepairsService {
  constructor(
    @Inject(RepairsPublicService) private readonly repairsPublicService: RepairsPublicService,
    @Inject(RepairsAdminService) private readonly repairsAdminService: RepairsAdminService,
  ) {}

  async publicLookup(repairIdRaw: string, customerPhoneRaw?: string | null) {
    return this.repairsPublicService.publicLookup(repairIdRaw, customerPhoneRaw);
  }

  async publicQuoteApproval(repairIdRaw: string, tokenRaw: string) {
    return this.repairsPublicService.publicQuoteApproval(repairIdRaw, tokenRaw);
  }

  async publicQuoteApprove(repairIdRaw: string, tokenRaw: string) {
    return this.repairsPublicService.publicQuoteApprove(repairIdRaw, tokenRaw);
  }

  async publicQuoteReject(repairIdRaw: string, tokenRaw: string) {
    return this.repairsPublicService.publicQuoteReject(repairIdRaw, tokenRaw);
  }

  async create(input: CreateRepairInput) {
    return this.repairsAdminService.create(input);
  }

  async adminList(params?: RepairAdminListParams) {
    return this.repairsAdminService.adminList(params);
  }

  async adminStats() {
    return this.repairsAdminService.adminStats();
  }

  async adminDetail(id: string) {
    return this.repairsAdminService.adminDetail(id);
  }

  async adminWhatsappDraft(id: string) {
    return this.repairsAdminService.adminWhatsappDraft(id);
  }

  async adminCreateWhatsappManualLog(id: string) {
    return this.repairsAdminService.adminCreateWhatsappManualLog(id);
  }

  async adminUpdateStatus(id: string, statusRaw: string, finalPrice?: number | null, notes?: string | null) {
    return this.repairsAdminService.adminUpdateStatus(id, statusRaw, finalPrice, notes);
  }

  async adminUpdate(id: string, input: UpdateRepairInput) {
    return this.repairsAdminService.adminUpdate(id, input);
  }

  async myRepairs(userId: string) {
    return this.repairsAdminService.myRepairs(userId);
  }

  async myRepairDetail(userId: string, id: string) {
    return this.repairsAdminService.myRepairDetail(userId, id);
  }
}

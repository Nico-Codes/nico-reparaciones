import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma, type RepairPricingRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type ResolveInput = {
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
};

type CreateOrUpdateRuleInput = {
  name?: string;
  active?: boolean;
  priority?: number;

  deviceTypeId?: string | null;
  device_type_id?: string | null;
  deviceBrandId?: string | null;
  device_brand_id?: string | null;
  deviceModelGroupId?: string | null;
  device_model_group_id?: string | null;
  deviceModelId?: string | null;
  device_model_id?: string | null;
  deviceIssueTypeId?: string | null;
  device_issue_type_id?: string | null;
  repair_type_id?: string | null;

  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;

  basePrice?: number;
  profitPercent?: number;
  calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
  minProfit?: number | null;
  minFinalPrice?: number | null;
  shippingFee?: number | null;

  mode?: 'margin' | 'fixed';
  multiplier?: number | null;
  min_profit?: number | null;
  fixed_total?: number | null;
  shipping_default?: number | null;

  notes?: string | null;
};

type NormalizedRuleInput = {
  name?: string;
  active?: boolean;
  priority?: number;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  basePrice?: number;
  profitPercent?: number;
  calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
  minProfit?: number | null;
  minFinalPrice?: number | null;
  shippingFee?: number | null;
  notes?: string | null;
};

type RepairPricingRuleWithCatalogIds = RepairPricingRule & {
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  minProfit?: Prisma.Decimal | null;
};

@Injectable()
export class PricingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRepairRules() {
    const rules = await this.prisma.repairPricingRule.findMany({
      orderBy: [{ active: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });
    return { items: rules.map((r) => this.serializeRule(r)) };
  }

  async createRepairRule(input: CreateOrUpdateRuleInput) {
    const normalized = this.normalizeRuleInput(input, false);
    if (!normalized.name) throw new BadRequestException('name es requerido');
    if (normalized.basePrice == null || Number.isNaN(normalized.basePrice)) {
      throw new BadRequestException('basePrice es requerido');
    }

    normalized.calcMode = normalized.calcMode ?? 'BASE_PLUS_MARGIN';
    normalized.profitPercent = normalized.profitPercent ?? 0;
    if (normalized.calcMode === 'FIXED_TOTAL') {
      normalized.profitPercent = 0;
      normalized.minProfit = null;
    }

    await this.assertScopeConsistency({
      deviceTypeId: normalized.deviceTypeId ?? null,
      deviceBrandId: normalized.deviceBrandId ?? null,
      deviceModelGroupId: normalized.deviceModelGroupId ?? null,
      deviceModelId: normalized.deviceModelId ?? null,
      deviceIssueTypeId: normalized.deviceIssueTypeId ?? null,
    });

    const rule = await this.prisma.repairPricingRule.create({
      data: this.ruleCreateData(normalized),
    });
    return { item: this.serializeRule(rule) };
  }

  async updateRepairRule(id: string, input: Partial<CreateOrUpdateRuleInput>) {
    const existing = await this.prisma.repairPricingRule.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Regla no encontrada');

    const normalized = this.normalizeRuleInput(input, true);

    const mergedScope = {
      deviceTypeId: normalized.deviceTypeId !== undefined ? normalized.deviceTypeId : existing.deviceTypeId,
      deviceBrandId: normalized.deviceBrandId !== undefined ? normalized.deviceBrandId : existing.deviceBrandId,
      deviceModelGroupId: normalized.deviceModelGroupId !== undefined ? normalized.deviceModelGroupId : existing.deviceModelGroupId,
      deviceModelId: normalized.deviceModelId !== undefined ? normalized.deviceModelId : existing.deviceModelId,
      deviceIssueTypeId: normalized.deviceIssueTypeId !== undefined ? normalized.deviceIssueTypeId : existing.deviceIssueTypeId,
    };
    await this.assertScopeConsistency(mergedScope);

    const rule = await this.prisma.repairPricingRule.update({
      where: { id },
      data: this.ruleUpdateData(normalized),
    });
    return { item: this.serializeRule(rule) };
  }

  async deleteRepairRule(id: string) {
    await this.prisma.repairPricingRule.delete({ where: { id } });
    return { ok: true };
  }

  async resolveRepairPrice(input: ResolveInput) {
    let typeId = this.nullableId(input.deviceTypeId);
    const brandId = this.nullableId(input.deviceBrandId);
    let modelGroupId = this.nullableId(input.deviceModelGroupId);
    const modelId = this.nullableId(input.deviceModelId);
    const issueTypeId = this.nullableId(input.deviceIssueTypeId);
    const brand = this.norm(input.deviceBrand);
    const model = this.norm(input.deviceModel);
    const issue = this.norm(input.issueLabel);

    if (!typeId && brandId) {
      const brandRow = await this.prisma.deviceBrand.findUnique({ where: { id: brandId }, select: { deviceTypeId: true } });
      typeId = brandRow?.deviceTypeId ?? null;
    }
    if (!modelGroupId && modelId) {
      const modelRow = await this.prisma.deviceModel.findUnique({ where: { id: modelId }, select: { deviceModelGroupId: true } });
      modelGroupId = modelRow?.deviceModelGroupId ?? null;
    }

    const activeRules = await this.prisma.repairPricingRule.findMany({
      where: { active: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 300,
    });

    const scored = activeRules
      .map((rule) => {
        const score = this.matchRuleScore(rule, { typeId, brandId, modelGroupId, modelId, issueTypeId, brand, model, issue });
        return { rule, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority);

    const best = scored[0]?.rule ?? null;

    if (!best) {
      return {
        matched: false,
        input: { deviceTypeId: typeId, deviceBrandId: brandId, deviceModelGroupId: modelGroupId, deviceModelId: modelId, deviceIssueTypeId: issueTypeId, deviceBrand: brand, deviceModel: model, issueLabel: issue },
        suggestion: null,
      };
    }

    const basePrice = Number(best.basePrice);
    const profitPercent = Number(best.profitPercent);
    const calcMode = best.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN';
    const minProfit = best.minProfit != null ? Number(best.minProfit) : null;
    const minFinalPrice = best.minFinalPrice != null ? Number(best.minFinalPrice) : null;
    const shippingFee = best.shippingFee != null ? Number(best.shippingFee) : null;

    let suggestedTotal = basePrice;
    let calculatedProfit = 0;

    if (calcMode === 'BASE_PLUS_MARGIN') {
      calculatedProfit = Math.round((basePrice * (profitPercent / 100)) * 100) / 100;
      if (minProfit != null && calculatedProfit < minProfit) {
        calculatedProfit = minProfit;
      }
      suggestedTotal = basePrice + calculatedProfit;
    }

    if (shippingFee != null && shippingFee > 0) suggestedTotal += shippingFee;
    if (minFinalPrice != null && suggestedTotal < minFinalPrice) suggestedTotal = minFinalPrice;
    suggestedTotal = Math.round(suggestedTotal * 100) / 100;

    return {
      matched: true,
      input: { deviceTypeId: typeId, deviceBrandId: brandId, deviceModelGroupId: modelGroupId, deviceModelId: modelId, deviceIssueTypeId: issueTypeId, deviceBrand: brand, deviceModel: model, issueLabel: issue },
      rule: this.serializeRule(best),
      suggestion: {
        basePrice,
        profitPercent,
        calcMode,
        minProfit,
        minFinalPrice,
        shippingFee,
        suggestedTotal,
        mode: calcMode === 'FIXED_TOTAL' ? 'fixed' : 'margin',
        multiplier: calcMode === 'BASE_PLUS_MARGIN' ? Math.round((profitPercent / 100) * 10000) / 10000 : null,
        min_profit: calcMode === 'BASE_PLUS_MARGIN' ? minProfit : null,
        fixed_total: calcMode === 'FIXED_TOTAL' ? basePrice : null,
        shipping_default: shippingFee ?? 0,
      },
    };
  }

  private matchRuleScore(
    rule: RepairPricingRuleWithCatalogIds,
    text: { typeId: string | null; brandId: string | null; modelGroupId: string | null; modelId: string | null; issueTypeId: string | null; brand: string; model: string; issue: string },
  ) {
    const rTypeId = this.nullableId(rule.deviceTypeId);
    const rb = this.norm(rule.deviceBrand);
    const rGroupId = this.nullableId(rule.deviceModelGroupId);
    const rm = this.norm(rule.deviceModel);
    const ri = this.norm(rule.issueLabel);
    const rBrandId = this.nullableId(rule.deviceBrandId);
    const rModelId = this.nullableId(rule.deviceModelId);
    const rIssueTypeId = this.nullableId(rule.deviceIssueTypeId);
    let score = 0;
    let constrained = 0;

    if (rTypeId) {
      constrained++;
      if (!text.typeId || text.typeId !== rTypeId) return 0;
      score += 180;
    }
    if (rBrandId) {
      constrained++;
      if (!text.brandId || text.brandId !== rBrandId) return 0;
      score += 220;
    }
    if (rGroupId) {
      constrained++;
      if (!text.modelGroupId || text.modelGroupId !== rGroupId) return 0;
      score += 240;
    }
    if (rModelId) {
      constrained++;
      if (!text.modelId || text.modelId !== rModelId) return 0;
      score += 320;
    }
    if (rIssueTypeId) {
      constrained++;
      if (!text.issueTypeId || text.issueTypeId !== rIssueTypeId) return 0;
      score += 260;
    }

    if (rb) {
      constrained++;
      if (!text.brand) return 0;
      if (text.brand === rb) score += 80;
      else if (text.brand.includes(rb) || rb.includes(text.brand)) score += 50;
      else return 0;
    }
    if (rm) {
      constrained++;
      if (!text.model) return 0;
      if (text.model === rm) score += 140;
      else if (text.model.includes(rm) || rm.includes(text.model)) score += 90;
      else return 0;
    }
    if (ri) {
      constrained++;
      if (!text.issue) return 0;
      if (text.issue === ri) score += 110;
      else if (text.issue.includes(ri) || ri.includes(text.issue)) score += 60;
      else return 0;
    }

    if (constrained === 0) score += 1;
    score += Math.max(0, rule.priority);
    return score;
  }

  private normalizeRuleInput(input: Partial<CreateOrUpdateRuleInput>, partial: boolean): NormalizedRuleInput {
    const out: NormalizedRuleInput = {};

    if (!partial || input.name !== undefined) out.name = input.name?.trim();
    if (!partial || input.active !== undefined) out.active = input.active ?? true;
    if (!partial || input.priority !== undefined) out.priority = Number(input.priority ?? 0);

    if (!partial || input.deviceTypeId !== undefined || input.device_type_id !== undefined) {
      out.deviceTypeId = this.nullableId(input.deviceTypeId ?? input.device_type_id);
    }
    if (!partial || input.deviceBrandId !== undefined || input.device_brand_id !== undefined) {
      out.deviceBrandId = this.nullableId(input.deviceBrandId ?? input.device_brand_id);
    }
    if (!partial || input.deviceModelGroupId !== undefined || input.device_model_group_id !== undefined) {
      out.deviceModelGroupId = this.nullableId(input.deviceModelGroupId ?? input.device_model_group_id);
    }
    if (!partial || input.deviceModelId !== undefined || input.device_model_id !== undefined) {
      out.deviceModelId = this.nullableId(input.deviceModelId ?? input.device_model_id);
    }
    if (!partial || input.deviceIssueTypeId !== undefined || input.device_issue_type_id !== undefined || input.repair_type_id !== undefined) {
      out.deviceIssueTypeId = this.nullableId(input.deviceIssueTypeId ?? input.device_issue_type_id ?? input.repair_type_id);
    }

    if (!partial || input.deviceBrand !== undefined) out.deviceBrand = this.nullable(input.deviceBrand);
    if (!partial || input.deviceModel !== undefined) out.deviceModel = this.nullable(input.deviceModel);
    if (!partial || input.issueLabel !== undefined) out.issueLabel = this.nullable(input.issueLabel);

    const calcMode = input.calcMode ?? (input.mode === 'fixed' ? 'FIXED_TOTAL' : input.mode === 'margin' ? 'BASE_PLUS_MARGIN' : undefined);
    if (!partial || calcMode !== undefined) out.calcMode = calcMode ?? 'BASE_PLUS_MARGIN';

    const fixedTotal = input.fixed_total;
    if (!partial || input.basePrice !== undefined || fixedTotal !== undefined) {
      const base = input.basePrice ?? fixedTotal ?? 0;
      out.basePrice = Number(base);
    }

    if (!partial || input.profitPercent !== undefined || input.multiplier !== undefined) {
      const profit = input.profitPercent ?? (input.multiplier == null ? 0 : Number(input.multiplier) * 100);
      out.profitPercent = Number(profit ?? 0);
    }

    if (!partial || input.minProfit !== undefined || input.min_profit !== undefined) {
      const value = input.minProfit ?? input.min_profit;
      out.minProfit = value == null ? null : Number(value);
    }

    if (!partial || input.minFinalPrice !== undefined) {
      out.minFinalPrice = input.minFinalPrice == null ? null : Number(input.minFinalPrice);
    }

    if (!partial || input.shippingFee !== undefined || input.shipping_default !== undefined) {
      const shipping = input.shippingFee ?? input.shipping_default;
      out.shippingFee = shipping == null ? null : Number(shipping);
    }

    if (!partial || input.notes !== undefined) out.notes = this.nullable(input.notes);

    if (out.calcMode === 'FIXED_TOTAL') {
      out.profitPercent = 0;
      out.minProfit = null;
    }

    return out;
  }

  private ruleCreateData(input: NormalizedRuleInput): Prisma.RepairPricingRuleUncheckedCreateInput {
    const data: Prisma.RepairPricingRuleUncheckedCreateInput = {
      name: input.name ?? '',
      active: input.active ?? true,
      priority: Number(input.priority ?? 0),
      deviceTypeId: this.nullableId(input.deviceTypeId),
      deviceBrandId: this.nullableId(input.deviceBrandId),
      deviceModelGroupId: this.nullableId(input.deviceModelGroupId),
      deviceModelId: this.nullableId(input.deviceModelId),
      deviceIssueTypeId: this.nullableId(input.deviceIssueTypeId),
      deviceBrand: this.nullable(input.deviceBrand),
      deviceModel: this.nullable(input.deviceModel),
      issueLabel: this.nullable(input.issueLabel),
      basePrice: new Prisma.Decimal(Number(input.basePrice ?? 0)),
      profitPercent: new Prisma.Decimal(Number(input.profitPercent ?? 0)),
      calcMode: input.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN',
      minProfit: input.minProfit == null ? null : new Prisma.Decimal(Number(input.minProfit ?? 0)),
      minFinalPrice: input.minFinalPrice == null ? null : new Prisma.Decimal(Number(input.minFinalPrice ?? 0)),
      shippingFee: input.shippingFee == null ? null : new Prisma.Decimal(Number(input.shippingFee ?? 0)),
      notes: this.nullable(input.notes),
    };
    return data;
  }

  private ruleUpdateData(input: NormalizedRuleInput): Prisma.RepairPricingRuleUncheckedUpdateInput {
    const data: Prisma.RepairPricingRuleUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.active !== undefined) data.active = input.active;
    if (input.priority !== undefined) data.priority = Number(input.priority ?? 0);
    if (input.deviceTypeId !== undefined) data.deviceTypeId = this.nullableId(input.deviceTypeId);
    if (input.deviceBrandId !== undefined) data.deviceBrandId = this.nullableId(input.deviceBrandId);
    if (input.deviceModelGroupId !== undefined) data.deviceModelGroupId = this.nullableId(input.deviceModelGroupId);
    if (input.deviceModelId !== undefined) data.deviceModelId = this.nullableId(input.deviceModelId);
    if (input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = this.nullableId(input.deviceIssueTypeId);
    if (input.deviceBrand !== undefined) data.deviceBrand = this.nullable(input.deviceBrand);
    if (input.deviceModel !== undefined) data.deviceModel = this.nullable(input.deviceModel);
    if (input.issueLabel !== undefined) data.issueLabel = this.nullable(input.issueLabel);
    if (input.basePrice !== undefined) data.basePrice = new Prisma.Decimal(Number(input.basePrice ?? 0));
    if (input.profitPercent !== undefined) data.profitPercent = new Prisma.Decimal(Number(input.profitPercent ?? 0));
    if (input.calcMode !== undefined) data.calcMode = input.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN';
    if (input.minProfit !== undefined) data.minProfit = input.minProfit == null ? null : new Prisma.Decimal(Number(input.minProfit ?? 0));
    if (input.minFinalPrice !== undefined) data.minFinalPrice = input.minFinalPrice == null ? null : new Prisma.Decimal(Number(input.minFinalPrice ?? 0));
    if (input.shippingFee !== undefined) data.shippingFee = input.shippingFee == null ? null : new Prisma.Decimal(Number(input.shippingFee ?? 0));
    if (input.notes !== undefined) data.notes = this.nullable(input.notes);
    return data;
  }

  private serializeRule(rule: RepairPricingRuleWithCatalogIds) {
    const calcMode = rule.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN';
    const basePrice = Number(rule.basePrice);
    const profitPercent = Number(rule.profitPercent);
    const minProfit = rule.minProfit != null ? Number(rule.minProfit) : null;
    const minFinalPrice = rule.minFinalPrice != null ? Number(rule.minFinalPrice) : null;
    const shippingFee = rule.shippingFee != null ? Number(rule.shippingFee) : null;

    return {
      id: rule.id,
      name: rule.name,
      active: rule.active,
      priority: rule.priority,

      deviceTypeId: rule.deviceTypeId ?? null,
      deviceBrandId: rule.deviceBrandId ?? null,
      deviceModelGroupId: rule.deviceModelGroupId ?? null,
      deviceModelId: rule.deviceModelId ?? null,
      deviceIssueTypeId: rule.deviceIssueTypeId ?? null,
      device_type_id: rule.deviceTypeId ?? null,
      device_brand_id: rule.deviceBrandId ?? null,
      device_model_group_id: rule.deviceModelGroupId ?? null,
      device_model_id: rule.deviceModelId ?? null,
      device_issue_type_id: rule.deviceIssueTypeId ?? null,
      repair_type_id: rule.deviceIssueTypeId ?? null,

      deviceBrand: rule.deviceBrand,
      deviceModel: rule.deviceModel,
      issueLabel: rule.issueLabel,

      basePrice,
      profitPercent,
      calcMode,
      minProfit,
      minFinalPrice,
      shippingFee,

      mode: calcMode === 'FIXED_TOTAL' ? 'fixed' : 'margin',
      multiplier: calcMode === 'BASE_PLUS_MARGIN' ? Math.round((profitPercent / 100) * 10000) / 10000 : null,
      min_profit: calcMode === 'BASE_PLUS_MARGIN' ? minProfit : null,
      fixed_total: calcMode === 'FIXED_TOTAL' ? basePrice : null,
      shipping_default: shippingFee ?? 0,

      notes: rule.notes,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  private async assertScopeConsistency(input: {
    deviceTypeId?: string | null;
    deviceBrandId?: string | null;
    deviceModelGroupId?: string | null;
    deviceModelId?: string | null;
    deviceIssueTypeId?: string | null;
  }) {
    const typeId = this.nullableId(input.deviceTypeId);
    const brandId = this.nullableId(input.deviceBrandId);
    const groupId = this.nullableId(input.deviceModelGroupId);
    const modelId = this.nullableId(input.deviceModelId);
    const issueTypeId = this.nullableId(input.deviceIssueTypeId);

    if ((groupId || modelId) && !brandId) {
      throw new BadRequestException('Selecciona una marca cuando definas grupo o modelo');
    }

    if (brandId) {
      const brand = await this.prisma.deviceBrand.findUnique({ where: { id: brandId }, select: { id: true, deviceTypeId: true } });
      if (!brand) throw new BadRequestException('La marca seleccionada no existe');
      if (typeId && brand.deviceTypeId && brand.deviceTypeId !== typeId) {
        throw new BadRequestException('La marca no corresponde al tipo de dispositivo seleccionado');
      }
    }

    if (groupId) {
      const group = await this.prisma.deviceModelGroup.findUnique({ where: { id: groupId }, select: { id: true, deviceBrandId: true } });
      if (!group) throw new BadRequestException('El grupo de modelos seleccionado no existe');
      if (brandId && group.deviceBrandId !== brandId) {
        throw new BadRequestException('El grupo de modelos no corresponde a la marca seleccionada');
      }
    }

    if (modelId) {
      const model = await this.prisma.deviceModel.findUnique({ where: { id: modelId }, select: { id: true, brandId: true, deviceModelGroupId: true } });
      if (!model) throw new BadRequestException('El modelo seleccionado no existe');
      if (brandId && model.brandId !== brandId) {
        throw new BadRequestException('El modelo no corresponde a la marca seleccionada');
      }
      if (groupId && model.deviceModelGroupId !== groupId) {
        throw new BadRequestException('El modelo no corresponde al grupo seleccionado');
      }
    }

    if (issueTypeId && typeId) {
      const issue = await this.prisma.deviceIssueType.findUnique({ where: { id: issueTypeId }, select: { id: true, deviceTypeId: true } });
      if (!issue) throw new BadRequestException('La falla seleccionada no existe');
      if (issue.deviceTypeId && issue.deviceTypeId !== typeId) {
        throw new BadRequestException('La falla no corresponde al tipo de dispositivo seleccionado');
      }
    }
  }

  private nullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private nullableId(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }

  private norm(value?: string | null) {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

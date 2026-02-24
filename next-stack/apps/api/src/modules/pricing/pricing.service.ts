import { Injectable } from '@nestjs/common';
import { Prisma, type RepairPricingRule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type ResolveInput = {
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
};

type CreateOrUpdateRuleInput = {
  name: string;
  active?: boolean;
  priority?: number;
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  basePrice: number;
  profitPercent?: number;
  notes?: string | null;
};

type RepairPricingRuleWithCatalogIds = RepairPricingRule & {
  deviceBrandId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
};

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async listRepairRules() {
    const rules = await this.prisma.repairPricingRule.findMany({
      orderBy: [{ active: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });
    return { items: rules.map((r) => this.serializeRule(r)) };
  }

  async createRepairRule(input: CreateOrUpdateRuleInput) {
    const rule = await this.prisma.repairPricingRule.create({
      data: this.ruleCreateData(input),
    });
    return { item: this.serializeRule(rule) };
  }

  async updateRepairRule(id: string, input: Partial<CreateOrUpdateRuleInput>) {
    const rule = await this.prisma.repairPricingRule.update({
      where: { id },
      data: this.ruleUpdateData(input),
    });
    return { item: this.serializeRule(rule) };
  }

  async deleteRepairRule(id: string) {
    await this.prisma.repairPricingRule.delete({ where: { id } });
    return { ok: true };
  }

  async resolveRepairPrice(input: ResolveInput) {
    const brandId = this.nullableId(input.deviceBrandId);
    const modelId = this.nullableId(input.deviceModelId);
    const issueTypeId = this.nullableId(input.deviceIssueTypeId);
    const brand = this.norm(input.deviceBrand);
    const model = this.norm(input.deviceModel);
    const issue = this.norm(input.issueLabel);

    const activeRules = await this.prisma.repairPricingRule.findMany({
      where: { active: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 300,
    });

    const scored = activeRules
      .map((rule) => {
        const score = this.matchRuleScore(rule, { brandId, modelId, issueTypeId, brand, model, issue });
        return { rule, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority);

    const best = scored[0]?.rule ?? null;

    if (!best) {
      return {
        matched: false,
        input: { deviceBrandId: brandId, deviceModelId: modelId, deviceIssueTypeId: issueTypeId, deviceBrand: brand, deviceModel: model, issueLabel: issue },
        suggestion: null,
      };
    }

    const basePrice = Number(best.basePrice);
    const profitPercent = Number(best.profitPercent);
    const suggestedTotal = Math.round((basePrice * (1 + profitPercent / 100)) * 100) / 100;

    return {
      matched: true,
      input: { deviceBrandId: brandId, deviceModelId: modelId, deviceIssueTypeId: issueTypeId, deviceBrand: brand, deviceModel: model, issueLabel: issue },
      rule: this.serializeRule(best),
      suggestion: {
        basePrice,
        profitPercent,
        suggestedTotal,
      },
    };
  }

  private matchRuleScore(
    rule: RepairPricingRuleWithCatalogIds,
    text: { brandId: string | null; modelId: string | null; issueTypeId: string | null; brand: string; model: string; issue: string },
  ) {
    const rb = this.norm(rule.deviceBrand);
    const rm = this.norm(rule.deviceModel);
    const ri = this.norm(rule.issueLabel);
    const rBrandId = this.nullableId(rule.deviceBrandId);
    const rModelId = this.nullableId(rule.deviceModelId);
    const rIssueTypeId = this.nullableId(rule.deviceIssueTypeId);
    let score = 0;
    let constrained = 0;

    if (rBrandId) {
      constrained++;
      if (!text.brandId || text.brandId !== rBrandId) return 0;
      score += 220;
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

    if (constrained === 0) score += 1; // fallback global
    score += Math.max(0, rule.priority);
    return score;
  }

  private ruleCreateData(input: CreateOrUpdateRuleInput): Prisma.RepairPricingRuleUncheckedCreateInput {
    return {
      name: input.name.trim(),
      active: input.active ?? true,
      priority: Number(input.priority ?? 0),
      deviceBrandId: this.nullableId(input.deviceBrandId),
      deviceModelId: this.nullableId(input.deviceModelId),
      deviceIssueTypeId: this.nullableId(input.deviceIssueTypeId),
      deviceBrand: this.nullable(input.deviceBrand),
      deviceModel: this.nullable(input.deviceModel),
      issueLabel: this.nullable(input.issueLabel),
      basePrice: new Prisma.Decimal(Number(input.basePrice ?? 0)),
      profitPercent: new Prisma.Decimal(Number(input.profitPercent ?? 0)),
      notes: this.nullable(input.notes),
    };
  }

  private ruleUpdateData(input: Partial<CreateOrUpdateRuleInput>): Prisma.RepairPricingRuleUncheckedUpdateInput {
    const data: Prisma.RepairPricingRuleUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.active !== undefined) data.active = input.active;
    if (input.priority !== undefined) data.priority = Number(input.priority ?? 0);
    if (input.deviceBrandId !== undefined) data.deviceBrandId = this.nullableId(input.deviceBrandId);
    if (input.deviceModelId !== undefined) data.deviceModelId = this.nullableId(input.deviceModelId);
    if (input.deviceIssueTypeId !== undefined) data.deviceIssueTypeId = this.nullableId(input.deviceIssueTypeId);
    if (input.deviceBrand !== undefined) data.deviceBrand = this.nullable(input.deviceBrand);
    if (input.deviceModel !== undefined) data.deviceModel = this.nullable(input.deviceModel);
    if (input.issueLabel !== undefined) data.issueLabel = this.nullable(input.issueLabel);
    if (input.basePrice !== undefined) data.basePrice = new Prisma.Decimal(Number(input.basePrice ?? 0));
    if (input.profitPercent !== undefined) data.profitPercent = new Prisma.Decimal(Number(input.profitPercent ?? 0));
    if (input.notes !== undefined) data.notes = this.nullable(input.notes);
    return data;
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

  private serializeRule(rule: RepairPricingRuleWithCatalogIds) {
    return {
      id: rule.id,
      name: rule.name,
      active: rule.active,
      priority: rule.priority,
      deviceBrandId: rule.deviceBrandId ?? null,
      deviceModelId: rule.deviceModelId ?? null,
      deviceIssueTypeId: rule.deviceIssueTypeId ?? null,
      deviceBrand: rule.deviceBrand,
      deviceModel: rule.deviceModel,
      issueLabel: rule.issueLabel,
      basePrice: Number(rule.basePrice),
      profitPercent: Number(rule.profitPercent),
      notes: rule.notes,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}

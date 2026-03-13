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

type SupplierPartPreviewInput = ResolveInput & {
  supplierId: string;
  supplierSearchQuery?: string | null;
  quantity?: number;
  extraCost?: number | null;
  shippingCost?: number | null;
  part: {
    externalPartId?: string | null;
    name: string;
    sku?: string | null;
    brand?: string | null;
    price: number;
    availability?: 'in_stock' | 'out_of_stock' | 'unknown' | null;
    url?: string | null;
  };
};

type ResolvedRepairContext = {
  typeId: string | null;
  brandId: string | null;
  modelGroupId: string | null;
  modelId: string | null;
  issueTypeId: string | null;
  brand: string;
  model: string;
  issue: string;
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
    const context = await this.resolvePricingContext(input);
    const best = await this.findBestRule(context);

    if (!best) {
      return {
        matched: false,
        input: this.serializeResolvedContext(context),
        suggestion: null,
      };
    }

    const suggestion = this.buildRuleOnlySuggestion(best);

    return {
      matched: true,
      input: this.serializeResolvedContext(context),
      rule: this.serializeRule(best),
      suggestion,
    };
  }

  async previewRepairProviderPartPricing(input: SupplierPartPreviewInput) {
    const supplierId = this.nullableId(input.supplierId);
    if (!supplierId) throw new BadRequestException('supplierId es requerido');

    const quantity = Math.max(1, Math.min(999, Math.round(Number(input.quantity ?? 1))));
    const extraCost = this.toMoney(input.extraCost ?? 0);
    const shippingCost = this.toMoney(input.shippingCost ?? 0);
    const partName = this.nullable(input.part.name);
    if (!partName || partName.length < 2) throw new BadRequestException('Selecciona un repuesto válido');
    const partPrice = this.toMoney(input.part.price);
    if (partPrice < 0) throw new BadRequestException('El costo del repuesto no puede ser negativo');

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true, active: true, searchEnabled: true, searchEndpoint: true },
    });
    if (!supplier) throw new BadRequestException('Proveedor no encontrado');

    await this.assertScopeConsistency({
      deviceTypeId: input.deviceTypeId ?? null,
      deviceBrandId: input.deviceBrandId ?? null,
      deviceModelGroupId: input.deviceModelGroupId ?? null,
      deviceModelId: input.deviceModelId ?? null,
      deviceIssueTypeId: input.deviceIssueTypeId ?? null,
    });

    const context = await this.resolvePricingContext(input);
    this.assertProviderPartPreviewContext(context);

    const rule = await this.findBestRule(context);
    const baseCost = this.roundMoney(partPrice * quantity);
    const costSubtotal = this.roundMoney(baseCost + extraCost);

    if (!rule) {
      return {
        matched: false,
        input: this.serializeResolvedContext(context),
        supplier: {
          id: supplier.id,
          name: supplier.name,
          active: supplier.active,
          searchEnabled: supplier.searchEnabled,
          endpoint: supplier.searchEndpoint ?? null,
          searchQuery: this.nullable(input.supplierSearchQuery),
        },
        part: {
          externalPartId: this.nullableId(input.part.externalPartId),
          name: partName,
          sku: this.nullable(input.part.sku),
          brand: this.nullable(input.part.brand),
          price: partPrice,
          availability: input.part.availability ?? 'unknown',
          url: this.nullable(input.part.url),
          quantity,
        },
        calculation: {
          unitCost: partPrice,
          quantity,
          baseCost,
          extraCost,
          shippingCost,
          costSubtotal,
          marginAmount: null,
          appliedShippingFee: null,
          suggestedQuotedPrice: null,
          coversBaseCost: null,
        },
        rule: null,
        snapshotDraft: null,
      };
    }

    const pricing = this.buildProviderPartSuggestion(rule, {
      unitCost: partPrice,
      quantity,
      extraCost,
      shippingCost,
    });

    return {
      matched: true,
      input: this.serializeResolvedContext(context),
      supplier: {
        id: supplier.id,
        name: supplier.name,
        active: supplier.active,
        searchEnabled: supplier.searchEnabled,
        endpoint: supplier.searchEndpoint ?? null,
        searchQuery: this.nullable(input.supplierSearchQuery),
      },
      part: {
        externalPartId: this.nullableId(input.part.externalPartId),
        name: partName,
        sku: this.nullable(input.part.sku),
        brand: this.nullable(input.part.brand),
        price: partPrice,
        availability: input.part.availability ?? 'unknown',
        url: this.nullable(input.part.url),
        quantity,
      },
      rule: this.serializeRule(rule),
      calculation: pricing,
      snapshotDraft: {
        source: 'SUPPLIER_PART',
        status: 'DRAFT',
        supplierId: supplier.id,
        supplierNameSnapshot: supplier.name,
        supplierSearchQuery: this.nullable(input.supplierSearchQuery),
        supplierEndpointSnapshot: supplier.searchEndpoint ?? null,
        externalPartId: this.nullableId(input.part.externalPartId),
        partSkuSnapshot: this.nullable(input.part.sku),
        partNameSnapshot: partName,
        partBrandSnapshot: this.nullable(input.part.brand),
        partUrlSnapshot: this.nullable(input.part.url),
        partAvailabilitySnapshot: input.part.availability ?? 'unknown',
        quantity,
        deviceTypeIdSnapshot: context.typeId,
        deviceBrandIdSnapshot: context.brandId,
        deviceModelGroupIdSnapshot: context.modelGroupId,
        deviceModelIdSnapshot: context.modelId,
        deviceIssueTypeIdSnapshot: context.issueTypeId,
        deviceBrandSnapshot: context.brand || null,
        deviceModelSnapshot: context.model || null,
        issueLabelSnapshot: context.issue || null,
        baseCost,
        extraCost,
        shippingCost,
        pricingRuleId: rule.id,
        pricingRuleNameSnapshot: rule.name,
        calcModeSnapshot: rule.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN',
        marginPercentSnapshot: Number(rule.profitPercent),
        minProfitSnapshot: rule.minProfit != null ? Number(rule.minProfit) : null,
        minFinalPriceSnapshot: rule.minFinalPrice != null ? Number(rule.minFinalPrice) : null,
        shippingFeeSnapshot: rule.shippingFee != null ? Number(rule.shippingFee) : null,
        suggestedQuotedPrice: pricing.suggestedQuotedPrice,
        appliedQuotedPrice: null,
        manualOverridePrice: null,
      },
    };
  }

  private async resolvePricingContext(input: ResolveInput): Promise<ResolvedRepairContext> {
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

    return { typeId, brandId, modelGroupId, modelId, issueTypeId, brand, model, issue };
  }

  private async findBestRule(context: ResolvedRepairContext) {
    const activeRules = await this.prisma.repairPricingRule.findMany({
      where: { active: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 300,
    });

    const scored = activeRules
      .map((rule) => {
        const score = this.matchRuleScore(rule, context);
        return { rule, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority);

    return scored[0]?.rule ?? null;
  }

  private serializeResolvedContext(context: ResolvedRepairContext) {
    return {
      deviceTypeId: context.typeId,
      deviceBrandId: context.brandId,
      deviceModelGroupId: context.modelGroupId,
      deviceModelId: context.modelId,
      deviceIssueTypeId: context.issueTypeId,
      deviceBrand: context.brand,
      deviceModel: context.model,
      issueLabel: context.issue,
    };
  }

  private buildRuleOnlySuggestion(rule: RepairPricingRuleWithCatalogIds) {
    const basePrice = Number(rule.basePrice);
    const profitPercent = Number(rule.profitPercent);
    const calcMode = rule.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN';
    const minProfit = rule.minProfit != null ? Number(rule.minProfit) : null;
    const minFinalPrice = rule.minFinalPrice != null ? Number(rule.minFinalPrice) : null;
    const shippingFee = rule.shippingFee != null ? Number(rule.shippingFee) : null;

    let suggestedTotal = basePrice;
    let calculatedProfit = 0;

    if (calcMode === 'BASE_PLUS_MARGIN') {
      calculatedProfit = this.roundMoney(basePrice * (profitPercent / 100));
      if (minProfit != null && calculatedProfit < minProfit) {
        calculatedProfit = minProfit;
      }
      suggestedTotal = basePrice + calculatedProfit;
    }

    if (shippingFee != null && shippingFee > 0) suggestedTotal += shippingFee;
    if (minFinalPrice != null && suggestedTotal < minFinalPrice) suggestedTotal = minFinalPrice;
    suggestedTotal = this.roundMoney(suggestedTotal);

    return {
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
    };
  }

  private buildProviderPartSuggestion(
    rule: RepairPricingRuleWithCatalogIds,
    input: {
      unitCost: number;
      quantity: number;
      extraCost: number;
      shippingCost: number;
    },
  ) {
    const calcMode = rule.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN';
    const marginPercent = Number(rule.profitPercent);
    const minProfit = rule.minProfit != null ? Number(rule.minProfit) : null;
    const minFinalPrice = rule.minFinalPrice != null ? Number(rule.minFinalPrice) : null;
    const shippingFee = rule.shippingFee != null ? Number(rule.shippingFee) : null;
    const baseCost = this.roundMoney(input.unitCost * input.quantity);
    const extraCost = this.toMoney(input.extraCost);
    const shippingCost = this.toMoney(input.shippingCost);
    const costSubtotal = this.roundMoney(baseCost + extraCost);
    const appliedShippingFee = shippingFee != null && shippingFee > 0 ? shippingFee : 0;

    let marginAmount = 0;
    let suggestedQuotedPrice = Number(rule.basePrice);

    if (calcMode === 'BASE_PLUS_MARGIN') {
      marginAmount = this.roundMoney(costSubtotal * (marginPercent / 100));
      if (minProfit != null && marginAmount < minProfit) {
        marginAmount = minProfit;
      }
      suggestedQuotedPrice = costSubtotal + marginAmount;
    }

    suggestedQuotedPrice += appliedShippingFee + shippingCost;
    if (minFinalPrice != null && suggestedQuotedPrice < minFinalPrice) {
      suggestedQuotedPrice = minFinalPrice;
    }
    suggestedQuotedPrice = this.roundMoney(suggestedQuotedPrice);

    return {
      calcMode,
      unitCost: input.unitCost,
      quantity: input.quantity,
      baseCost,
      extraCost,
      shippingCost,
      costSubtotal,
      marginPercent,
      marginAmount: calcMode === 'BASE_PLUS_MARGIN' ? marginAmount : null,
      minProfit,
      minFinalPrice,
      appliedShippingFee,
      fixedRuleTotal: calcMode === 'FIXED_TOTAL' ? Number(rule.basePrice) : null,
      suggestedQuotedPrice,
      coversBaseCost: suggestedQuotedPrice >= costSubtotal + shippingCost,
    };
  }

  private assertProviderPartPreviewContext(context: ResolvedRepairContext) {
    const hasIssue = !!(context.issueTypeId || context.issue);
    const hasDeviceContext = !!(context.typeId || context.brandId || context.modelGroupId || context.modelId || context.brand || context.model);
    if (!hasIssue || !hasDeviceContext) {
      throw new BadRequestException('Faltan datos técnicos para calcular el presupuesto con repuesto');
    }
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

  private toMoney(value?: number | null) {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return this.roundMoney(parsed);
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
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

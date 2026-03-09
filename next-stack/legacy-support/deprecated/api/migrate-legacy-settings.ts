import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { loadCanonicalEnv } from '../../../apps/api/src/load-canonical-env.js';

// Transitional legacy-support script. Keep isolated from the runtime API code.
console.warn('[legacy:migrate:settings:deprecated] Script archivado. Usar solo como rescate manual.');

type CliOptions = {
  dryRun: boolean;
  cleanup: boolean;
};

type LegacySupplierRow = {
  id: string | null;
  name: string;
  phone: string | null;
  notes: string | null;
  active: boolean;
  searchPriority: number;
  searchEnabled: boolean;
  searchMode: 'json' | 'html';
  searchEndpoint: string | null;
  searchConfigJson: string | null;
  lastProbeStatus: string | null;
  lastProbeQuery: string | null;
  lastProbeCount: number;
  lastProbeError: string | null;
  lastProbeAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type LegacyWarrantyIncidentRow = {
  id: string | null;
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
  happenedAt: Date;
  resolvedAt: Date | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type LegacyDeviceTypeRow = {
  id: string | null;
  name: string;
  slug: string | null;
  active: boolean;
};

type LegacyModelGroupRow = {
  id: string | null;
  name: string;
  slug: string | null;
  active: boolean;
};

type MigrationStats = {
  suppliers: { source: number; created: number; updated: number; skipped: number };
  warranties: { source: number; created: number; updated: number; skipped: number };
  deviceTypes: { source: number; created: number; updated: number; skipped: number };
  modelGroups: {
    brands: number;
    sourceGroups: number;
    createdGroups: number;
    updatedGroups: number;
    assignmentsUpdated: number;
    assignmentsSkipped: number;
    skippedBrands: number;
  };
  cleanup: { keysFound: number; keysDeleted: number };
};

const FIXED_LEGACY_SETTING_KEYS = [
  'suppliers_registry',
  'warranty_incidents_registry',
  'device_types_catalog',
  'migration.legacy.suppliers_registry.done',
  'migration.legacy.warranty_incidents_registry.done',
  'migration.legacy.device_types_catalog.done',
] as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '..', '..', '..');

function loadEnvFiles() {
  loadCanonicalEnv();
}

function parseOptions(argv: string[]): CliOptions {
  const flags = new Set(argv.map((a) => a.trim().toLowerCase()).filter(Boolean));
  return {
    dryRun: flags.has('--dry-run'),
    cleanup: flags.has('--cleanup'),
  };
}

function cleanNullable(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, numeric);
}

function parseDate(value: unknown, fallback: Date): Date {
  const raw = cleanNullable(value);
  if (!raw) return fallback;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

class LegacySettingsMigrator {
  private readonly stats: MigrationStats = {
    suppliers: { source: 0, created: 0, updated: 0, skipped: 0 },
    warranties: { source: 0, created: 0, updated: 0, skipped: 0 },
    deviceTypes: { source: 0, created: 0, updated: 0, skipped: 0 },
    modelGroups: {
      brands: 0,
      sourceGroups: 0,
      createdGroups: 0,
      updatedGroups: 0,
      assignmentsUpdated: 0,
      assignmentsSkipped: 0,
      skippedBrands: 0,
    },
    cleanup: { keysFound: 0, keysDeleted: 0 },
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: CliOptions,
  ) {}

  async run() {
    console.log('[legacy:migrate] options', this.options);
    const supplierIdMap = await this.migrateSuppliers();
    await this.migrateWarrantyIncidents(supplierIdMap);
    await this.migrateDeviceTypes();
    await this.migrateModelGroups();
    if (this.options.cleanup) {
      await this.cleanupLegacyKeys();
    }
    this.printSummary();
  }

  private async getSettingValue(key: string): Promise<string | null> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? null;
  }

  private parseLegacySuppliers(raw: string | null): LegacySupplierRow[] {
    const now = new Date();
    const rows = safeJsonParse<unknown[]>(raw, []);
    return rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row))
      .map((row) => {
        const name = cleanNullable(row.name) ?? '';
        const searchMode = String(row.searchMode ?? '').trim().toLowerCase() === 'json' ? 'json' : 'html';
        const createdAt = parseDate(row.createdAt, now);
        const updatedAt = parseDate(row.updatedAt, now);
        return {
          id: cleanNullable(row.id),
          name,
          phone: cleanNullable(row.phone),
          notes: cleanNullable(row.notes),
          active: row.active == null ? true : Boolean(row.active),
          searchPriority: clampInt(row.searchPriority, 1, 99999, 100),
          searchEnabled: row.searchEnabled == null ? false : Boolean(row.searchEnabled),
          searchMode,
          searchEndpoint: cleanNullable(row.searchEndpoint),
          searchConfigJson: cleanNullable(row.searchConfigJson),
          lastProbeStatus: cleanNullable(row.lastProbeStatus),
          lastProbeQuery: cleanNullable(row.lastProbeQuery),
          lastProbeCount: clampInt(row.lastProbeCount, 0, 999999, 0),
          lastProbeError: cleanNullable(row.lastProbeError),
          lastProbeAt: cleanNullable(row.lastProbeAt) ? parseDate(row.lastProbeAt, now) : null,
          createdAt,
          updatedAt,
        } satisfies LegacySupplierRow;
      })
      .filter((row) => row.name.length > 0);
  }

  private async migrateSuppliers(): Promise<Map<string, string>> {
    const supplierIdMap = new Map<string, string>();
    const raw = await this.getSettingValue('suppliers_registry');
    const legacy = this.parseLegacySuppliers(raw);
    this.stats.suppliers.source = legacy.length;
    if (legacy.length === 0) {
      console.log('[legacy:migrate] suppliers_registry: no legacy rows found');
      return supplierIdMap;
    }

    for (const row of legacy) {
      const existingById = row.id
        ? await this.prisma.supplier.findUnique({
            where: { id: row.id },
            select: { id: true, name: true, createdAt: true },
          })
        : null;

      const existingByName = await this.prisma.supplier.findFirst({
        where: { name: { equals: row.name, mode: 'insensitive' } },
        select: { id: true, name: true, createdAt: true },
      });

      const target = existingById ?? existingByName;
      const targetId = target?.id ?? row.id;

      if (target) {
        if (row.id) supplierIdMap.set(row.id, target.id);
        const duplicateName = await this.prisma.supplier.findFirst({
          where: {
            id: { not: target.id },
            name: { equals: row.name, mode: 'insensitive' },
          },
          select: { id: true },
        });
        const safeName = duplicateName ? target.name : row.name;
        if (!this.options.dryRun) {
          await this.prisma.supplier.update({
            where: { id: target.id },
            data: {
              name: safeName,
              phone: row.phone,
              notes: row.notes,
              active: row.active,
              searchPriority: row.searchPriority,
              searchEnabled: row.searchEnabled,
              searchMode: row.searchMode,
              searchEndpoint: row.searchEndpoint,
              searchConfigJson: row.searchConfigJson,
              lastProbeStatus: row.lastProbeStatus ?? undefined,
              lastProbeQuery: row.lastProbeQuery,
              lastProbeCount: row.lastProbeCount,
              lastProbeError: row.lastProbeError,
              lastProbeAt: row.lastProbeAt,
              updatedAt: row.updatedAt,
            },
          });
        }
        this.stats.suppliers.updated += 1;
        continue;
      }

      if (!this.options.dryRun) {
        await this.prisma.supplier.create({
          data: {
            ...(targetId ? { id: targetId } : {}),
            name: row.name,
            phone: row.phone,
            notes: row.notes,
            active: row.active,
            searchPriority: row.searchPriority,
            searchEnabled: row.searchEnabled,
            searchMode: row.searchMode,
            searchEndpoint: row.searchEndpoint,
            searchConfigJson: row.searchConfigJson,
            lastProbeStatus: row.lastProbeStatus ?? undefined,
            lastProbeQuery: row.lastProbeQuery,
            lastProbeCount: row.lastProbeCount,
            lastProbeError: row.lastProbeError,
            lastProbeAt: row.lastProbeAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          select: { id: true },
        });
      }

      if (row.id && targetId) supplierIdMap.set(row.id, targetId);
      this.stats.suppliers.created += 1;
    }

    console.log('[legacy:migrate] suppliers_registry processed', this.stats.suppliers);
    return supplierIdMap;
  }

  private parseLegacyWarrantyIncidents(raw: string | null): LegacyWarrantyIncidentRow[] {
    const now = new Date();
    const rows = safeJsonParse<unknown[]>(raw, []);
    return rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row))
      .map((row) => {
        const sourceType = String(row.sourceType ?? '').trim().toLowerCase() === 'product' ? 'product' : 'repair';
        const status = String(row.status ?? '').trim().toLowerCase() === 'closed' ? 'closed' : 'open';
        const costOriginRaw = String(row.costOrigin ?? '').trim().toLowerCase();
        const costOrigin: LegacyWarrantyIncidentRow['costOrigin'] =
          costOriginRaw === 'repair' || costOriginRaw === 'product' ? costOriginRaw : 'manual';
        const quantity = clampInt(row.quantity, 1, 999, 1);
        const unitCost = toNonNegativeNumber(row.unitCost, 0);
        const extraCost = toNonNegativeNumber(row.extraCost, 0);
        const recoveredAmount = toNonNegativeNumber(row.recoveredAmount, 0);
        const computedLoss = Math.max(0, quantity * unitCost + extraCost - recoveredAmount);
        const rawLoss = toNonNegativeNumber(row.lossAmount, computedLoss);
        const lossAmount = Number.isFinite(rawLoss) ? rawLoss : computedLoss;
        return {
          id: cleanNullable(row.id),
          sourceType,
          status,
          title: cleanNullable(row.title) ?? '',
          reason: cleanNullable(row.reason),
          repairId: cleanNullable(row.repairId),
          productId: cleanNullable(row.productId),
          orderId: cleanNullable(row.orderId),
          supplierId: cleanNullable(row.supplierId),
          quantity,
          unitCost,
          costOrigin,
          extraCost,
          recoveredAmount,
          lossAmount,
          happenedAt: parseDate(row.happenedAt, now),
          resolvedAt: cleanNullable(row.resolvedAt) ? parseDate(row.resolvedAt, now) : null,
          notes: cleanNullable(row.notes),
          createdBy: cleanNullable(row.createdBy),
          createdAt: parseDate(row.createdAt, now),
          updatedAt: parseDate(row.updatedAt, now),
        } satisfies LegacyWarrantyIncidentRow;
      })
      .filter((row) => row.title.length > 0);
  }

  private async migrateWarrantyIncidents(supplierIdMap: Map<string, string>) {
    const raw = await this.getSettingValue('warranty_incidents_registry');
    const legacy = this.parseLegacyWarrantyIncidents(raw);
    this.stats.warranties.source = legacy.length;
    if (legacy.length === 0) {
      console.log('[legacy:migrate] warranty_incidents_registry: no legacy rows found');
      return;
    }

    for (const row of legacy) {
      const mappedSupplierId = row.supplierId
        ? (supplierIdMap.get(row.supplierId) ?? cleanNullable(row.supplierId))
        : null;
      const supplierExists = mappedSupplierId
        ? await this.prisma.supplier.findUnique({ where: { id: mappedSupplierId }, select: { id: true } })
        : null;
      const supplierId = supplierExists?.id ?? null;
      const incidentId = row.id;

      if (incidentId) {
        const existing = await this.prisma.warrantyIncident.findUnique({
          where: { id: incidentId },
          select: { id: true },
        });
        if (existing) {
          if (!this.options.dryRun) {
            await this.prisma.warrantyIncident.update({
              where: { id: incidentId },
              data: {
                sourceType: row.sourceType,
                status: row.status,
                title: row.title,
                reason: row.reason,
                repairId: row.repairId,
                productId: row.productId,
                orderId: row.orderId,
                supplierId,
                quantity: row.quantity,
                unitCost: row.unitCost,
                costOrigin: row.costOrigin,
                extraCost: row.extraCost,
                recoveredAmount: row.recoveredAmount,
                lossAmount: row.lossAmount,
                happenedAt: row.happenedAt,
                resolvedAt: row.resolvedAt,
                notes: row.notes,
                createdBy: row.createdBy,
                updatedAt: row.updatedAt,
              },
            });
          }
          this.stats.warranties.updated += 1;
          continue;
        }
      }

      if (!this.options.dryRun) {
        await this.prisma.warrantyIncident.create({
          data: {
            ...(incidentId ? { id: incidentId } : {}),
            sourceType: row.sourceType,
            status: row.status,
            title: row.title,
            reason: row.reason,
            repairId: row.repairId,
            productId: row.productId,
            orderId: row.orderId,
            supplierId,
            quantity: row.quantity,
            unitCost: row.unitCost,
            costOrigin: row.costOrigin,
            extraCost: row.extraCost,
            recoveredAmount: row.recoveredAmount,
            lossAmount: row.lossAmount,
            happenedAt: row.happenedAt,
            resolvedAt: row.resolvedAt,
            notes: row.notes,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
        });
      }
      this.stats.warranties.created += 1;
    }

    console.log('[legacy:migrate] warranty_incidents_registry processed', this.stats.warranties);
  }

  private parseLegacyDeviceTypes(raw: string | null): LegacyDeviceTypeRow[] {
    const rows = safeJsonParse<unknown[]>(raw, []);
    return rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row))
      .map((row) => {
        return {
          id: cleanNullable(row.id),
          name: cleanNullable(row.name) ?? '',
          slug: cleanNullable(row.slug),
          active: row.active == null ? true : Boolean(row.active),
        } satisfies LegacyDeviceTypeRow;
      })
      .filter((row) => row.name.length > 0);
  }

  private async resolveUniqueDeviceTypeSlug(base: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(base) || 'tipo';
    let candidate = baseSlug;
    let index = 2;
    while (true) {
      const existing = await this.prisma.deviceType.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || (excludeId && existing.id === excludeId)) return candidate;
      candidate = `${baseSlug}-${index++}`;
    }
  }

  private async migrateDeviceTypes() {
    const raw = await this.getSettingValue('device_types_catalog');
    const legacy = this.parseLegacyDeviceTypes(raw);
    this.stats.deviceTypes.source = legacy.length;
    if (legacy.length === 0) {
      console.log('[legacy:migrate] device_types_catalog: no legacy rows found');
      return;
    }

    for (const row of legacy) {
      const existingById = row.id
        ? await this.prisma.deviceType.findUnique({
            where: { id: row.id },
            select: { id: true, slug: true },
          })
        : null;
      const existingBySlug = row.slug
        ? await this.prisma.deviceType.findUnique({
            where: { slug: row.slug },
            select: { id: true, slug: true },
          })
        : null;
      const target = existingById ?? existingBySlug;
      const targetId = target?.id ?? row.id;
      const safeSlug = await this.resolveUniqueDeviceTypeSlug(row.slug ?? row.name, target?.id);

      if (target) {
        if (!this.options.dryRun) {
          await this.prisma.deviceType.update({
            where: { id: target.id },
            data: {
              name: row.name,
              slug: safeSlug,
              active: row.active,
            },
          });
        }
        this.stats.deviceTypes.updated += 1;
        continue;
      }

      if (!this.options.dryRun) {
        await this.prisma.deviceType.create({
          data: {
            ...(targetId ? { id: targetId } : {}),
            name: row.name,
            slug: safeSlug,
            active: row.active,
          },
        });
      }
      this.stats.deviceTypes.created += 1;
    }

    console.log('[legacy:migrate] device_types_catalog processed', this.stats.deviceTypes);
  }

  private parseLegacyModelGroups(raw: string | null): LegacyModelGroupRow[] {
    const rows = safeJsonParse<unknown[]>(raw, []);
    return rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row))
      .map((row) => ({
        id: cleanNullable(row.id),
        name: cleanNullable(row.name) ?? '',
        slug: cleanNullable(row.slug),
        active: row.active == null ? true : Boolean(row.active),
      }))
      .filter((row) => row.name.length > 0);
  }

  private parseLegacyAssignments(raw: string | null): Record<string, string> {
    const parsed = safeJsonParse<unknown>(raw, {});
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([modelId, groupId]) => {
        return cleanNullable(modelId) != null && cleanNullable(groupId) != null;
      }),
    ) as Record<string, string>;
  }

  private async resolveUniqueModelGroupSlug(brandId: string, base: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(base) || 'grupo';
    let candidate = baseSlug;
    let index = 2;
    while (true) {
      const existing = await this.prisma.deviceModelGroup.findFirst({
        where: { deviceBrandId: brandId, slug: candidate },
        select: { id: true },
      });
      if (!existing || (excludeId && existing.id === excludeId)) return candidate;
      candidate = `${baseSlug}-${index++}`;
    }
  }

  private async migrateModelGroups() {
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { startsWith: 'device_model_groups.' } },
      select: { key: true, value: true },
      orderBy: { key: 'asc' },
    });
    if (rows.length === 0) {
      console.log('[legacy:migrate] device_model_groups.*: no legacy rows found');
      return;
    }

    const byBrand = new Map<
      string,
      {
        groupsRaw: string | null;
        assignmentsRaw: string | null;
      }
    >();

    for (const row of rows) {
      const match = /^device_model_groups\.([^.]+)\.(groups|assignments)$/.exec(row.key);
      if (!match) continue;
      const brandId = match[1];
      const segment = match[2];
      const current = byBrand.get(brandId) ?? { groupsRaw: null, assignmentsRaw: null };
      if (segment === 'groups') current.groupsRaw = row.value ?? null;
      if (segment === 'assignments') current.assignmentsRaw = row.value ?? null;
      byBrand.set(brandId, current);
    }

    this.stats.modelGroups.brands = byBrand.size;
    for (const [brandId, payload] of byBrand.entries()) {
      const brand = await this.prisma.deviceBrand.findUnique({
        where: { id: brandId },
        select: { id: true },
      });
      if (!brand) {
        this.stats.modelGroups.skippedBrands += 1;
        continue;
      }

      const legacyGroups = this.parseLegacyModelGroups(payload.groupsRaw);
      const assignments = this.parseLegacyAssignments(payload.assignmentsRaw);
      this.stats.modelGroups.sourceGroups += legacyGroups.length;

      const groupIdMap = new Map<string, string>();

      for (const row of legacyGroups) {
        const existingById = row.id
          ? await this.prisma.deviceModelGroup.findUnique({
              where: { id: row.id },
              select: { id: true, deviceBrandId: true, slug: true },
            })
          : null;
        const existingBySlug = row.slug
          ? await this.prisma.deviceModelGroup.findFirst({
              where: { deviceBrandId: brandId, slug: row.slug },
              select: { id: true, deviceBrandId: true, slug: true },
            })
          : null;

        const sameBrandById = existingById && existingById.deviceBrandId === brandId ? existingById : null;
        const target = sameBrandById ?? existingBySlug;
        const safeSlug = await this.resolveUniqueModelGroupSlug(brandId, row.slug ?? row.name, target?.id);

        if (target) {
          if (!this.options.dryRun) {
            await this.prisma.deviceModelGroup.update({
              where: { id: target.id },
              data: { name: row.name, slug: safeSlug, active: row.active },
            });
          }
          if (row.id) groupIdMap.set(row.id, target.id);
          this.stats.modelGroups.updatedGroups += 1;
          continue;
        }

        const createData = {
          ...(row.id ? { id: row.id } : {}),
          deviceBrandId: brandId,
          name: row.name,
          slug: safeSlug,
          active: row.active,
        };

        if (!this.options.dryRun) {
          const created = await this.prisma.deviceModelGroup.create({
            data: createData,
            select: { id: true },
          });
          if (row.id) groupIdMap.set(row.id, created.id);
        } else if (row.id) {
          groupIdMap.set(row.id, row.id);
        }

        this.stats.modelGroups.createdGroups += 1;
      }

      for (const [modelId, legacyGroupId] of Object.entries(assignments)) {
        const targetGroupId = groupIdMap.get(legacyGroupId) ?? cleanNullable(legacyGroupId);
        if (!targetGroupId) {
          this.stats.modelGroups.assignmentsSkipped += 1;
          continue;
        }

        const [group, model] = await Promise.all([
          this.prisma.deviceModelGroup.findUnique({
            where: { id: targetGroupId },
            select: { id: true, deviceBrandId: true },
          }),
          this.prisma.deviceModel.findUnique({
            where: { id: modelId },
            select: { id: true, brandId: true, deviceModelGroupId: true },
          }),
        ]);

        if (!group || !model || model.brandId !== brandId || group.deviceBrandId !== brandId) {
          this.stats.modelGroups.assignmentsSkipped += 1;
          continue;
        }
        if (model.deviceModelGroupId === group.id) continue;

        if (!this.options.dryRun) {
          await this.prisma.deviceModel.update({
            where: { id: model.id },
            data: { deviceModelGroupId: group.id },
          });
        }
        this.stats.modelGroups.assignmentsUpdated += 1;
      }
    }

    console.log('[legacy:migrate] device_model_groups.* processed', this.stats.modelGroups);
  }

  private async collectLegacyKeys(): Promise<string[]> {
    const keys = new Set<string>();

    const fixedRows = await this.prisma.appSetting.findMany({
      where: { key: { in: [...FIXED_LEGACY_SETTING_KEYS] } },
      select: { key: true },
    });
    for (const row of fixedRows) keys.add(row.key);

    const dynamicRows = await this.prisma.appSetting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'device_model_groups.' } },
          { key: { startsWith: 'migration.legacy.device_model_groups.' } },
          { key: { startsWith: 'migration.legacy.' } },
        ],
      },
      select: { key: true },
    });
    for (const row of dynamicRows) keys.add(row.key);

    return [...keys].sort((a, b) => a.localeCompare(b));
  }

  private async cleanupLegacyKeys() {
    const keys = await this.collectLegacyKeys();
    this.stats.cleanup.keysFound = keys.length;
    if (keys.length === 0) {
      console.log('[legacy:migrate] cleanup: no keys to delete');
      return;
    }

    if (this.options.dryRun) {
      console.log('[legacy:migrate] cleanup dry-run keys', keys);
      return;
    }

    const deleted = await this.prisma.appSetting.deleteMany({
      where: { key: { in: keys } },
    });
    this.stats.cleanup.keysDeleted = deleted.count;
    console.log('[legacy:migrate] cleanup deleted keys', deleted.count);
  }

  private printSummary() {
    console.log('[legacy:migrate] summary', this.stats);
  }
}

async function main() {
  loadEnvFiles();
  const options = parseOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const migrator = new LegacySettingsMigrator(prisma, options);
    await migrator.run();
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error('[legacy:migrate] ERROR', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

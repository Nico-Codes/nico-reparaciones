import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminWarrantyRegistryService } from './admin-warranty-registry.service.js';
import type { WarrantyIncidentRegistryRow } from './admin-warranty-registry.types.js';
import type { ProviderStats, SupplierRegistryRow } from './admin-providers.types.js';

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
    searchMode: 'json',
    searchEnabled: true,
    searchEndpoint: 'https://api.elreparadordepc.com/api/web/tenant/www?in_stock=false&q={query}',
    searchConfigJson:
      '{"items_path":"productos","name_path":"nombre","sku_path":"sku","price_path":"precio","availability_path":"stock"}',
  },
  {
    name: 'Tienda Movil Rosario',
    searchPriority: 70,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://tiendamovilrosario.com.ar/?s={query}&post_type=product',
    searchConfigJson:
      '{"profile":"xstore","candidate_paths":["/product/"],"exclude_paths":["/product-category/","add-to-cart="],"context_window":2200}',
  },
];

@Injectable()
export class AdminProviderRegistryService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminWarrantyRegistryService)
    private readonly adminWarrantyRegistryService: AdminWarrantyRegistryService,
  ) {}

  async providers(params?: { q?: string; active?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const activeRaw = (params?.active ?? '').trim().toLowerCase();
    const suppliers = await this.readSuppliersRegistry();
    const statsByProvider = await this.getProviderStatsMap();

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

    const productCounts = await this.getProductCountMap(filtered.map((row) => row.id));
    const items = filtered.map((row) =>
      this.serializeProvider(row, statsByProvider.get(row.id), productCounts.get(row.id) ?? 0),
    );

    return {
      items,
      summary: {
        total: items.length,
        active: items.filter((i) => i.active).length,
        incidents: items.reduce((acc, i) => acc + i.incidents, 0),
        openIncidents: items.reduce((acc, i) => acc + i.warrantiesExpired, 0),
        closedIncidents: items.reduce((acc, i) => acc + i.warrantiesOk, 0),
        accumulatedLoss: items.reduce((acc, i) => acc + i.loss, 0),
      },
    };
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

    const stats = (await this.getProviderStatsMap()).get(updated.id);
    const productCount = await this.getProductCountForSupplier(updated.id);
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
    const stats = (await this.getProviderStatsMap()).get(items[index].id);
    const productCount = await this.getProductCountForSupplier(items[index].id);
    return { item: this.serializeProvider(items[index], stats, productCount) };
  }

  async importDefaultProviders() {
    const items = await this.readSuppliersRegistry();
    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    for (const seed of DEFAULT_SUPPLIER_CATALOG) {
      const index = items.findIndex((i) => i.name.trim().toLowerCase() === seed.name.toLowerCase());
      if (index >= 0) {
        items[index] = {
          ...items[index],
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
    const stats = await this.getProviderStatsMap();
    const productCounts = await this.getProductCountMap(items.map((row) => row.id));
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
    const stats = await this.getProviderStatsMap();
    const productCounts = await this.getProductCountMap(items.map((row) => row.id));
    return {
      ok: true,
      items: items
        .sort((a, b) => a.searchPriority - b.searchPriority)
        .map((row) => this.serializeProvider(row, stats.get(row.id), productCounts.get(row.id) ?? 0)),
    };
  }

  async getProviderStatsMap() {
    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    return this.buildProviderStats(incidents);
  }

  async getProductCountMap(supplierIds: string[]) {
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

  async getProductCountForSupplier(supplierId: string) {
    const map = await this.getProductCountMap([supplierId]);
    return map.get(supplierId) ?? 0;
  }

  async readSuppliersRegistry() {
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

  async writeSuppliersRegistry(items: SupplierRegistryRow[]) {
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
        await tx.supplier.deleteMany({ where: { id: { notIn: supplierIds } } });
      } else {
        await tx.supplier.deleteMany({});
      }
    });
  }

  serializeProvider(row: SupplierRegistryRow, statsInput?: ProviderStats, productCount = 0) {
    const stats = statsInput ?? this.emptyProviderStats();
    const baseScore = 80;
    const openPenalty = Math.min(12, stats.openIncidents * 3);
    const lossPenalty = Math.min(18, Math.round(stats.loss / 100000));
    const score = Math.max(0, Math.min(100, baseScore - openPenalty - lossPenalty));
    const confidenceLabel =
      score >= 90 ? 'Excelente' : score >= 75 ? 'Confiable' : score >= 60 ? 'En seguimiento' : 'Riesgo alto';

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

  private buildProviderStats(incidents: WarrantyIncidentRegistryRow[]) {
    const map = new Map<string, ProviderStats>();
    for (const row of incidents) {
      if (!row.supplierId) continue;
      const current = map.get(row.supplierId) ?? this.emptyProviderStats();
      current.incidents += 1;
      if (row.status === 'closed') current.closedIncidents += 1;
      else current.openIncidents += 1;
      current.loss += row.lossAmount;
      map.set(row.supplierId, current);
    }
    return map;
  }

  private emptyProviderStats(): ProviderStats {
    return { incidents: 0, openIncidents: 0, closedIncidents: 0, loss: 0 };
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

  private formatTime(date: Date) {
    if (Number.isNaN(date.getTime())) return '--:--';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatDateTimeShort(date: Date) {
    if (Number.isNaN(date.getTime())) return '-';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${this.formatTime(date)}`;
  }

  private clampInt(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  private randomEntityId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }
}

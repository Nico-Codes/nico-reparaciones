import { BadGatewayException, BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminWarrantyRegistryService } from './admin-warranty-registry.service.js';
import type { WarrantyIncidentRegistryRow } from './admin-warranty-registry.types.js';

type SupplierRegistryRow = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  active: boolean;
  searchPriority: number;
  searchEnabled: boolean;
  searchMode: 'json' | 'html';
  searchEndpoint: string | null;
  searchConfigJson: string | null;
  lastProbeStatus: 'ok' | 'none';
  lastProbeQuery: string | null;
  lastProbeCount: number;
  lastProbeError: string | null;
  lastProbeAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SupplierPartSearchInput = {
  q: string;
  limit?: number;
};

type SupplierPartAggregateSearchInput = {
  q: string;
  supplierId?: string | null;
  limitPerSupplier?: number;
  totalLimit?: number;
};

type NormalizedSupplierPart = {
  externalPartId: string;
  name: string;
  sku: string | null;
  brand: string | null;
  price: number | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  url: string | null;
  rawLabel: string | null;
};

type NormalizedSupplierPartWithProvider = NormalizedSupplierPart & {
  supplier: {
    id: string;
    name: string;
    priority: number;
    endpoint: string | null;
    mode: 'json' | 'html';
  };
};

type ProviderPartSearchOutcome = {
  supplier: SupplierRegistryRow;
  query: string;
  url: string;
  items: NormalizedSupplierPart[];
  error: string | null;
};

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
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://www.elreparadordepc.com/search_producto?term={query}',
    searchConfigJson:
      '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria","/carrito","/deseos"],"candidate_url_regex":"\\\\/producto\\\\/\\\\d+","context_window":12000}',
  },
  {
    name: 'Tienda Movil Rosario',
    searchPriority: 70,
    searchMode: 'html',
    searchEnabled: true,
    searchEndpoint: 'https://tiendamovilrosario.com.ar/?s={query}&post_type=product',
    searchConfigJson:
      '{"candidate_paths":["/product/"],"exclude_paths":["/product-category/","add-to-cart="],"context_window":12000}',
  },
];
@Injectable()
export class AdminProvidersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AdminWarrantyRegistryService)
    private readonly adminWarrantyRegistryService: AdminWarrantyRegistryService,
  ) {}
  async providers(params?: { q?: string; active?: string }) {
    const q = (params?.q ?? '').trim().toLowerCase();
    const activeRaw = (params?.active ?? '').trim().toLowerCase();
    const suppliers = await this.readSuppliersRegistry();
    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    const statsByProvider = this.buildProviderStats(incidents);

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

    const productCounts = await this.countProductsBySupplierIds(filtered.map((row) => row.id));
    const items = filtered.map((row) =>
      this.serializeProvider(row, statsByProvider.get(row.id), productCounts.get(row.id) ?? 0),
    );
    const summary = {
      total: items.length,
      active: items.filter((i) => i.active).length,
      incidents: items.reduce((acc, i) => acc + i.incidents, 0),
      openIncidents: items.reduce((acc, i) => acc + i.warrantiesExpired, 0),
      closedIncidents: items.reduce((acc, i) => acc + i.warrantiesOk, 0),
      accumulatedLoss: items.reduce((acc, i) => acc + i.loss, 0),
    };
    return { items, summary };
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

    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    const stats = this.buildProviderStats(incidents).get(updated.id);
    const productCount = await this.countProductsForSupplier(updated.id);
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
    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    const stats = this.buildProviderStats(incidents).get(items[index].id);
    const productCount = await this.countProductsForSupplier(items[index].id);
    return { item: this.serializeProvider(items[index], stats, productCount) };
  }

  async importDefaultProviders() {
    const items = await this.readSuppliersRegistry();
    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    for (const seed of DEFAULT_SUPPLIER_CATALOG) {
      const idx = items.findIndex((i) => i.name.trim().toLowerCase() === seed.name.toLowerCase());
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
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
    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    const stats = this.buildProviderStats(incidents);
    const productCounts = await this.countProductsBySupplierIds(items.map((row) => row.id));
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
    const incidents = await this.adminWarrantyRegistryService.readIncidents();
    const stats = this.buildProviderStats(incidents);
    const productCounts = await this.countProductsBySupplierIds(items.map((row) => row.id));
    return {
      ok: true,
      items: items
        .sort((a, b) => a.searchPriority - b.searchPriority)
        .map((row) => this.serializeProvider(row, stats.get(row.id), productCounts.get(row.id) ?? 0)),
    };
  }

  async probeProvider(id: string, queryRaw?: string) {
    const items = await this.readSuppliersRegistry();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) throw new BadRequestException('Proveedor no encontrado');
    const row = items[index];
    const q = (queryRaw ?? '').trim() || 'modulo a30';
    const now = new Date().toISOString();

    if (!row.searchEndpoint) {
      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: 'Sin endpoint configurado',
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);
      const incidents = await this.adminWarrantyRegistryService.readIncidents();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);
      return {
        item: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        probe: { query: q, count: 0 },
      };
    }

    const url = row.searchEndpoint.includes('{query}')
      ? row.searchEndpoint.replaceAll('{query}', encodeURIComponent(q))
      : `${row.searchEndpoint}${row.searchEndpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json,text/html,*/*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36 NicoReparaciones/1.0',
        },
      });
      const count = await this.estimateProbeResultCount(res, row.searchMode, row.searchConfigJson);
      const status: SupplierRegistryRow['lastProbeStatus'] = count > 0 ? 'ok' : 'none';
      items[index] = {
        ...row,
        lastProbeStatus: status,
        lastProbeQuery: q,
        lastProbeCount: count,
        lastProbeError: res.ok ? null : `HTTP ${res.status}`,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);
      const incidents = await this.adminWarrantyRegistryService.readIncidents();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);
      return {
        item: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        probe: { query: q, count, url, httpStatus: res.status },
      };
    } catch (e) {
      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: e instanceof Error ? e.message : 'Error de conexion',
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);
      const incidents = await this.adminWarrantyRegistryService.readIncidents();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);
      return {
        item: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        probe: { query: q, count: 0, url },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchProviderParts(id: string, input: SupplierPartSearchInput) {
    const items = await this.readSuppliersRegistry();
    const index = items.findIndex((i) => i.id === id);
    if (index < 0) throw new NotFoundException('Proveedor no encontrado');

    const row = items[index];
    if (!row.searchEnabled) throw new BadRequestException('El proveedor no tiene habilitada la busqueda de repuestos');
    if (!row.searchEndpoint) throw new BadRequestException('El proveedor no tiene endpoint de busqueda configurado');

    const q = input.q.trim();
    const limit = this.clampInt(input.limit ?? 8, 1, 30);
    const now = new Date().toISOString();
    const url = this.buildProviderSearchUrl(row, q);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json,text/html,*/*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        },
      });
      if (!res.ok) {
        throw new BadGatewayException(`El proveedor respondio HTTP ${res.status}`);
      }

      const body = await res.text();
      const normalized = row.searchMode === 'json'
        ? this.extractNormalizedPartsFromJsonPayload(body, row, limit)
        : this.extractNormalizedPartsFromHtml(body, row, url, limit);

      items[index] = {
        ...row,
        lastProbeStatus: normalized.length > 0 ? 'ok' : 'none',
        lastProbeQuery: q,
        lastProbeCount: normalized.length,
        lastProbeError: null,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);

      const incidents = await this.adminWarrantyRegistryService.readIncidents();
      const stats = this.buildProviderStats(incidents);
      const productCount = await this.countProductsForSupplier(items[index].id);

      return {
        supplier: this.serializeProvider(items[index], stats.get(items[index].id), productCount),
        query: q,
        total: normalized.length,
        url,
        items: normalized,
      };
    } catch (error) {
      const message = error instanceof BadGatewayException
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Error de conexion';

      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: message,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.writeSuppliersRegistry(items);

      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException('No se pudo consultar el proveedor');
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchPartsAcrossProviders(input: SupplierPartAggregateSearchInput) {
    const registry = await this.readSuppliersRegistry();
    const q = input.q.trim();
    const limitPerSupplier = this.clampInt(input.limitPerSupplier ?? 6, 1, 20);
    const totalLimit = this.clampInt(input.totalLimit ?? 24, 1, 80);
    const supplierId = this.cleanNullable(input.supplierId);
    const queryProfile = this.buildPartSearchQueryProfile(q);

    const selectedSupplier = supplierId ? registry.find((item) => item.id === supplierId) ?? null : null;
    if (supplierId && !selectedSupplier) throw new NotFoundException('Proveedor no encontrado');
    if (selectedSupplier && (!selectedSupplier.active || !selectedSupplier.searchEnabled || !selectedSupplier.searchEndpoint)) {
      throw new BadRequestException('El proveedor seleccionado no esta disponible para busqueda de repuestos');
    }

    const candidates = (selectedSupplier ? [selectedSupplier] : registry)
      .filter((item) => item.active && item.searchEnabled && !!item.searchEndpoint)
      .sort((left, right) => {
        if (left.searchPriority !== right.searchPriority) return left.searchPriority - right.searchPriority;
        return left.name.localeCompare(right.name, 'es');
      });

    if (candidates.length === 0) {
      throw new BadRequestException('No hay proveedores activos con busqueda habilitada');
    }

    const outcomes = await Promise.all(candidates.map((supplier) => this.runProviderPartsSearch(supplier, { q, limit: limitPerSupplier })));
    const now = new Date().toISOString();
    const outcomeBySupplier = new Map(outcomes.map((outcome) => [outcome.supplier.id, outcome]));
    let registryChanged = false;
    const nextRegistry: SupplierRegistryRow[] = registry.map((row) => {
      const outcome = outcomeBySupplier.get(row.id);
      if (!outcome) return row;
      registryChanged = true;
      return {
        ...row,
        lastProbeStatus: (outcome.error ? 'none' : outcome.items.length > 0 ? 'ok' : 'none') as 'ok' | 'none',
        lastProbeQuery: outcome.query,
        lastProbeCount: outcome.items.length,
        lastProbeError: outcome.error,
        lastProbeAt: now,
        updatedAt: now,
      };
    });
    if (registryChanged) {
      await this.writeSuppliersRegistry(nextRegistry);
    }

    const suppliers = outcomes.map((outcome) => ({
      supplier: {
        id: outcome.supplier.id,
        name: outcome.supplier.name,
        priority: outcome.supplier.searchPriority,
        endpoint: outcome.supplier.searchEndpoint ?? null,
        mode: outcome.supplier.searchMode,
      },
      status: outcome.error ? 'error' : outcome.items.length > 0 ? 'ok' : 'empty',
      total: outcome.items.length,
      error: outcome.error,
      url: outcome.url,
    }));

    const items = outcomes
      .flatMap((outcome) =>
        outcome.items.map((item) => ({
          ...item,
          supplier: {
            id: outcome.supplier.id,
            name: outcome.supplier.name,
            priority: outcome.supplier.searchPriority,
            endpoint: outcome.supplier.searchEndpoint ?? null,
            mode: outcome.supplier.searchMode,
          },
        })),
      )
      .map((item) => ({ item, rank: this.rankSupplierPart(item, queryProfile) }))
      .filter(({ rank }) => rank >= 0)
      .sort((left, right) => {
        if (left.rank !== right.rank) return right.rank - left.rank;

        const availabilityDiff = this.availabilityOrder(left.item.availability) - this.availabilityOrder(right.item.availability);
        if (availabilityDiff !== 0) return availabilityDiff;

        const leftPrice = left.item.price == null ? Number.POSITIVE_INFINITY : left.item.price;
        const rightPrice = right.item.price == null ? Number.POSITIVE_INFINITY : right.item.price;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;

        if (left.item.supplier.priority !== right.item.supplier.priority) return left.item.supplier.priority - right.item.supplier.priority;
        return left.item.name.localeCompare(right.item.name, 'es');
      })
      .map(({ item }) => item satisfies NormalizedSupplierPartWithProvider)
      .slice(0, totalLimit);

    return {
      query: q,
      items,
      suppliers,
      summary: {
        searchedSuppliers: suppliers.length,
        suppliersWithResults: suppliers.filter((item) => item.status === 'ok').length,
        failedSuppliers: suppliers.filter((item) => item.status === 'error').length,
        totalResults: items.length,
      },
    };
  }


  private async readSuppliersRegistry() {
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

  private async writeSuppliersRegistry(items: SupplierRegistryRow[]) {
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
        await tx.supplier.deleteMany({
          where: { id: { notIn: supplierIds } },
        });
      } else {
        await tx.supplier.deleteMany({});
      }
    });
  }

  private buildProviderStats(incidents: WarrantyIncidentRegistryRow[]) {
    const map = new Map<
      string,
      {
        incidents: number;
        openIncidents: number;
        closedIncidents: number;
        loss: number;
      }
    >();
    for (const row of incidents) {
      if (!row.supplierId) continue;
      const current = map.get(row.supplierId) ?? { incidents: 0, openIncidents: 0, closedIncidents: 0, loss: 0 };
      current.incidents += 1;
      if (row.status === 'closed') current.closedIncidents += 1;
      else current.openIncidents += 1;
      current.loss += row.lossAmount;
      map.set(row.supplierId, current);
    }
    return map;
  }

  private async countProductsBySupplierIds(supplierIds: string[]) {
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

  private async countProductsForSupplier(supplierId: string) {
    const map = await this.countProductsBySupplierIds([supplierId]);
    return map.get(supplierId) ?? 0;
  }

  private emptyProviderStats() {
    return {
      incidents: 0,
      openIncidents: 0,
      closedIncidents: 0,
      loss: 0,
    };
  }

  private serializeProvider(
    row: SupplierRegistryRow,
    statsInput?: { incidents: number; openIncidents: number; closedIncidents: number; loss: number },
    productCount = 0,
  ) {
    const stats = statsInput ?? this.emptyProviderStats();
    const baseScore = 80;
    const openPenalty = Math.min(12, stats.openIncidents * 3);
    const lossPenalty = Math.min(18, Math.round(stats.loss / 100000));
    const score = Math.max(0, Math.min(100, baseScore - openPenalty - lossPenalty));
    const confidenceLabel = score >= 90 ? 'Excelente' : score >= 75 ? 'Confiable' : score >= 60 ? 'En seguimiento' : 'Riesgo alto';

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

  private async runProviderPartsSearch(
    row: SupplierRegistryRow,
    input: SupplierPartSearchInput,
  ): Promise<ProviderPartSearchOutcome> {
    const q = input.q.trim();
    const limit = this.clampInt(input.limit ?? 8, 1, 30);
    const url = this.buildProviderSearchUrl(row, q);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        headers: {
          Accept: 'application/json,text/html,*/*',
          'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        },
      });
      if (!res.ok) {
        return {
          supplier: row,
          query: q,
          url,
          items: [],
          error: `El proveedor respondio HTTP ${res.status}`,
        };
      }

      const body = await res.text();
      const items =
        row.searchMode === 'json'
          ? this.extractNormalizedPartsFromJsonPayload(body, row, limit)
          : this.extractNormalizedPartsFromHtml(body, row, url, limit);

      return {
        supplier: row,
        query: q,
        url,
        items,
        error: null,
      };
    } catch (error) {
      return {
        supplier: row,
        query: q,
        url,
        items: [],
        error: error instanceof Error ? error.message : 'No se pudo consultar el proveedor',
      };
    } finally {
        clearTimeout(timeout);
    }
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

  private buildProviderSearchUrl(row: SupplierRegistryRow, query: string) {
    if (!row.searchEndpoint) throw new BadRequestException('El proveedor no tiene endpoint de busqueda configurado');
    return row.searchEndpoint.includes('{query}')
      ? row.searchEndpoint.replaceAll('{query}', encodeURIComponent(query))
      : `${row.searchEndpoint}${row.searchEndpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`;
  }

  private extractNormalizedPartsFromJsonPayload(
    rawBody: string,
    row: SupplierRegistryRow,
    limit: number,
  ): NormalizedSupplierPart[] {
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new BadGatewayException('El proveedor configurado como JSON devolvio una respuesta invalida');
    }

    const cfg = (this.parseJson(row.searchConfigJson) ?? {}) as Record<string, unknown>;
    const items = this.extractJsonItems(payload, cfg);
    if (items.length === 0) return [];

    const normalized = items
      .map((item, index) => this.normalizeJsonPart(item, cfg, row, index))
      .filter((item): item is NormalizedSupplierPart => !!item)
      .slice(0, limit);

    return this.dedupeNormalizedParts(normalized, limit);
  }

  private extractJsonItems(payload: unknown, cfg: Record<string, unknown>) {
    const itemsPath = typeof cfg.items_path === 'string' ? cfg.items_path.trim() : '';
    if (itemsPath) {
      const resolved = this.readObjectPath(payload, itemsPath);
      if (Array.isArray(resolved)) return resolved;
    }
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];

    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.results)) return record.results;
    if (Array.isArray(record.data)) return record.data;
    const firstArray = Object.values(record).find((value) => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
  }

  private normalizeJsonPart(
    item: unknown,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    index: number,
  ): NormalizedSupplierPart | null {
    if (!item || typeof item !== 'object') return null;

    const externalId = this.findJsonString(item, cfg, ['externalPartId', 'external_id_path', 'id_path'], ['id', 'productId', 'product_id', 'sku']);
    const name = this.findJsonString(item, cfg, ['name_path', 'title_path'], ['name', 'title', 'label', 'description', 'productName']);
    const sku = this.findJsonString(item, cfg, ['sku_path'], ['sku', 'code', 'barcode', 'partNumber', 'part_number']);
    const brand = this.findJsonString(item, cfg, ['brand_path'], ['brand', 'manufacturer']);
    const price = this.findJsonNumber(item, cfg, ['price_path'], ['price', 'salePrice', 'amount', 'finalPrice', 'unitPrice']);
    const availabilityRaw = this.findJsonValue(item, cfg, ['availability_path'], ['availability', 'stockStatus', 'stock_status', 'stock', 'available']);
    const url = this.normalizeUrl(
      this.findJsonString(item, cfg, ['url_path'], ['url', 'link', 'href']),
      row.searchEndpoint,
    );

    const normalizedName = this.cleanLabel(name);
    if (!normalizedName) return null;

    return {
      externalPartId: externalId || url || `${row.id}:${index}:${normalizedName.toLowerCase()}`,
      name: normalizedName,
      sku: this.cleanLabel(sku),
      brand: this.cleanLabel(brand),
      price,
      availability: this.normalizeAvailability(availabilityRaw),
      url,
      rawLabel: null,
    };
  }

  private extractNormalizedPartsFromHtml(
    html: string,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
  ): NormalizedSupplierPart[] {
    const cfg = (this.parseJson(row.searchConfigJson) ?? {}) as Record<string, unknown>;
    const profile = this.resolveHtmlSearchProfile(row, requestUrl, cfg);
    const providerSpecific = this.extractHtmlPartsFromKnownProviderHtml(html, cfg, row, requestUrl, limit, profile);
    if (providerSpecific.length > 0) {
      return this.dedupeNormalizedParts(providerSpecific, limit);
    }

    const parsedFromBlocks = this.extractHtmlPartsFromBlocks(html, cfg, row, requestUrl, limit, profile);
    if (parsedFromBlocks.length > 0) {
      return this.dedupeNormalizedParts(parsedFromBlocks, limit);
    }

    const parsedFromAnchors = this.extractHtmlPartsFromAnchors(html, cfg, row, requestUrl, limit, profile);
    return this.dedupeNormalizedParts(parsedFromAnchors, limit);
  }

  private resolveHtmlSearchProfile(row: SupplierRegistryRow, requestUrl: string, cfg: Record<string, unknown>) {
    const explicitProfile = typeof cfg.profile === 'string' ? cfg.profile.trim().toLowerCase() : '';
    if (explicitProfile) return explicitProfile;

    const host = this.safeHostname(requestUrl) || this.safeHostname(row.searchEndpoint);
    if (!host) return 'generic';
    if (host.includes('novocell.com.ar')) return 'wix';
    if (host.includes('evophone.com.ar')) return 'woodmart';
    if (host.includes('celuphone.com.ar')) return 'shoptimizer';
    if (host.includes('okeyrosario.com.ar') || host.includes('electrostore.com.ar')) return 'flatsome';
    return 'generic';
  }

  private extractHtmlPartsFromKnownProviderHtml(
    html: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
    profile: string,
  ) {
    const blockRegexes: Record<string, RegExp[]> = {
      woodmart: [/<div class="[^"]*\bwd-product\b[^"]*\bproduct-grid-item\b[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi],
      flatsome: [/<div class="product-small col has-hover product[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi],
      shoptimizer: [/<li class="product type-product[\s\S]*?<\/li>/gi],
      wix: [/<li data-hook="product-list-grid-item">[\s\S]*?<\/li>/gi],
    };
    const regexes = blockRegexes[profile] ?? [];
    if (regexes.length === 0) return [];

    const items: NormalizedSupplierPart[] = [];
    for (const regex of regexes) {
      for (const match of html.matchAll(regex)) {
        if (items.length >= limit) break;
        const normalized = this.normalizeHtmlPartFromSnippet(match[0] ?? '', cfg, row, requestUrl, items.length, profile);
        if (!normalized) continue;
        items.push(normalized);
      }
      if (items.length >= limit) break;
    }
    return items;
  }

  private extractHtmlPartsFromBlocks(
    html: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
    profile: string,
  ) {
    const itemRegexSource = typeof cfg.item_regex === 'string' ? cfg.item_regex : '';
    if (!itemRegexSource) return [];

    let itemRegex: RegExp;
    try {
      itemRegex = new RegExp(itemRegexSource, 'gi');
    } catch {
      return [];
    }

    const nameRegex = this.compileOptionalRegex(cfg.name_regex);
    const priceRegex = this.compileOptionalRegex(cfg.price_regex);
    const urlRegex = this.compileOptionalRegex(cfg.url_regex);
    const raw: NormalizedSupplierPart[] = [];

    for (const match of html.matchAll(itemRegex)) {
      if (raw.length >= limit) break;
      const block = match[0] ?? '';
      const rawName = nameRegex ? this.firstCapture(block, nameRegex) : '';
      const rawPrice = priceRegex ? this.firstCapture(block, priceRegex) : '';
      const rawUrl = urlRegex ? this.firstCapture(block, urlRegex) : '';
      const url = this.normalizeUrl(rawUrl, requestUrl);
      const normalized = this.normalizeHtmlPartFromSnippet(block, cfg, row, requestUrl, raw.length, profile, {
        url,
        name: this.cleanLabel(this.stripHtml(rawName || block)),
        price: this.parseMoneyValue(rawPrice || block),
      });
      if (!normalized) continue;

      raw.push(normalized);
    }

    return raw;
  }

  private extractHtmlPartsFromAnchors(
    html: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    limit: number,
    profile: string,
  ) {
    const candidatePaths = Array.isArray(cfg.candidate_paths) ? cfg.candidate_paths.filter((value): value is string => typeof value === 'string') : [];
    const excludePaths = Array.isArray(cfg.exclude_paths) ? cfg.exclude_paths.filter((value): value is string => typeof value === 'string') : [];
    const contextWindow = this.clampInt(typeof cfg.context_window === 'number' ? cfg.context_window : 1000, 240, 12000);
    const candidateUrlRegex = this.compileOptionalRegex(cfg.candidate_url_regex);
    const priceRegex = this.compileOptionalRegex(cfg.price_regex);
    const anchorRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
    const out: NormalizedSupplierPart[] = [];

    for (const match of html.matchAll(anchorRegex)) {
      if (out.length >= limit) break;
      const href = (match[2] ?? '').trim();
      if (!href) continue;
      const absoluteUrl = this.normalizeUrl(href, requestUrl);
      if (!absoluteUrl) continue;
      if (!this.isLikelyProductUrl(absoluteUrl, requestUrl, candidatePaths, excludePaths, candidateUrlRegex)) continue;

      const startIndex = match.index ?? 0;
      const contextStart = Math.max(0, startIndex - Math.round(contextWindow * 0.45));
      const contextEnd = Math.min(html.length, startIndex + contextWindow);
      const snippet = html.slice(contextStart, contextEnd);
      const normalized = this.normalizeHtmlPartFromSnippet(snippet, cfg, row, requestUrl, out.length, profile, {
        url: absoluteUrl,
        rawLabel: this.cleanLabel(this.stripHtml(match[3] ?? '')),
        price: this.parseMoneyValue(priceRegex ? this.firstCapture(snippet, priceRegex) : snippet),
      });
      if (!normalized) continue;
      out.push(normalized);
    }

    return out;
  }

  private normalizeHtmlPartFromSnippet(
    snippet: string,
    cfg: Record<string, unknown>,
    row: SupplierRegistryRow,
    requestUrl: string,
    index: number,
    profile: string,
    preferred?: {
      url?: string | null;
      name?: string | null;
      price?: number | null;
      rawLabel?: string | null;
    },
  ): NormalizedSupplierPart | null {
    const url =
      preferred?.url ??
      this.normalizeUrl(
        this.firstCapture(snippet, /href=(["'])([^"']*(?:\/producto\/|\/product-page\/)[^"']*)\1/i),
        requestUrl,
      );
    const name =
      this.cleanLabel(preferred?.name) ??
      this.extractHtmlPartName(snippet, preferred?.rawLabel ?? null, url, profile) ??
      this.extractProductNameFromContext(snippet);
    if (!this.isMeaningfulPartName(name, row.name)) return null;

    const brand = this.extractHtmlPartBrand(snippet, name, profile);
    const price = preferred?.price ?? this.extractHtmlPartPrice(snippet, profile);

    return {
      externalPartId: this.cleanLabel(this.firstCapture(snippet, /data-product_id=(["'])([^"']+)\1/i)) || url || `${row.id}:${index}:${name!.toLowerCase()}`,
      name: name!,
      sku: this.extractSku(snippet),
      brand,
      price,
      availability: this.extractHtmlPartAvailability(snippet),
      url,
      rawLabel: this.cleanLabel(preferred?.rawLabel ?? null) ?? name!,
    };
  }

  private dedupeNormalizedParts(items: NormalizedSupplierPart[], limit: number) {
    const seen = new Set<string>();
    const result: NormalizedSupplierPart[] = [];
    for (const item of items) {
      const key = `${item.externalPartId}::${this.normalizeSearchText(item.name)}::${item.price ?? 'na'}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= limit) break;
    }
    return result;
  }

  private isLikelyProductUrl(
    absoluteUrl: string,
    requestUrl: string,
    candidatePaths: string[],
    excludePaths: string[],
    candidateUrlRegex: RegExp | null,
  ) {
    if (excludePaths.some((pathChunk) => absoluteUrl.includes(pathChunk))) return false;
    if (candidateUrlRegex && !candidateUrlRegex.test(absoluteUrl)) return false;
    if (candidatePaths.length > 0 && !candidatePaths.some((pathChunk) => absoluteUrl.includes(pathChunk))) return false;

    const requestHost = this.safeHostname(requestUrl);
    const candidateHost = this.safeHostname(absoluteUrl);
    if (requestHost && candidateHost && requestHost !== candidateHost) return false;

    const pathname = this.safePathname(absoluteUrl);
    if (!pathname) return false;
    if (/\/(?:categoria-producto|product-category|search|tienda|shop)\/?$/i.test(pathname)) return false;
    if (/\/(?:producto|product-page)\//i.test(pathname)) return true;
    return candidatePaths.length > 0;
  }

  private readObjectPath(value: unknown, rawPath: string) {
    const parts = rawPath.split('.').map((part) => part.trim()).filter(Boolean);
    let cursor: unknown = value;
    for (const part of parts) {
      if (cursor == null) return null;
      if (Array.isArray(cursor)) {
        const index = Number(part);
        if (!Number.isInteger(index) || index < 0 || index >= cursor.length) return null;
        cursor = cursor[index];
        continue;
      }
      if (typeof cursor !== 'object') return null;
      cursor = (cursor as Record<string, unknown>)[part];
    }
    return cursor ?? null;
  }

  private findJsonValue(item: unknown, cfg: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
    for (const configKey of configPaths) {
      const path = typeof cfg[configKey] === 'string' ? String(cfg[configKey]).trim() : '';
      if (!path) continue;
      const value = this.readObjectPath(item, path);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    for (const key of fallbackKeys) {
      const value = record[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  }

  private findJsonString(item: unknown, cfg: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
    const value = this.findJsonValue(item, cfg, configPaths, fallbackKeys);
    if (value == null) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return null;
  }

  private findJsonNumber(item: unknown, cfg: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
    const value = this.findJsonValue(item, cfg, configPaths, fallbackKeys);
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100) / 100;
    if (typeof value === 'string') return this.parseMoneyValue(value);
    return null;
  }

  private compileOptionalRegex(raw: unknown) {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      return new RegExp(raw, 'i');
    } catch {
      return null;
    }
  }

  private firstCapture(value: string, regex: RegExp) {
    const match = value.match(regex);
    if (!match) return '';
    return (match[2] ?? match[1] ?? match[0] ?? '').trim();
  }

  private stripHtml(value: string) {
    return this.decodeHtmlEntities(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeHtmlEntities(value: string) {
    return value
      .replace(/&#(\d+);/g, (_match, digits) => {
        const code = Number(digits);
        return Number.isInteger(code) ? String.fromCharCode(code) : '';
      })
      .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
        const code = Number.parseInt(hex, 16);
        return Number.isInteger(code) ? String.fromCharCode(code) : '';
      });
  }

  private cleanLabel(value?: string | null) {
    const stripped = this.stripHtml(value ?? '');
    return stripped || null;
  }

  private normalizeUrl(rawUrl?: string | null, requestUrl?: string | null) {
    const value = (rawUrl ?? '').trim();
    if (!value) return null;
    try {
      return new URL(value, requestUrl ?? undefined).toString();
    } catch {
      return null;
    }
  }

  private parseMoneyValue(value?: string | null) {
    const raw = this.decodeHtmlEntities((value ?? '').trim());
    if (!raw) return null;
    const cleaned = raw
      .replace(/\s+/g, ' ')
      .replace(/\bprecio\b/gi, ' ')
      .replace(/\bars\b/gi, '$');
    const match = cleaned.match(/(?:\$|ars|usd)?\s*([0-9][0-9.,\s]*)/i);
    const amount = match?.[1] ?? cleaned;
    let normalized = amount
      .replace(/\s/g, '')
      .replace(/[^0-9.,]/g, '');
    if (!normalized) return null;

    const hasDot = normalized.includes('.');
    const hasComma = normalized.includes(',');
    if (hasDot && hasComma) {
      const lastDot = normalized.lastIndexOf('.');
      const lastComma = normalized.lastIndexOf(',');
      const decimalSeparator = lastDot > lastComma ? '.' : ',';
      const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
      const decimalSuffix = normalized.slice(normalized.lastIndexOf(decimalSeparator) + 1);
      if (/^\d{2}$/.test(decimalSuffix)) {
        normalized = normalized.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
        if (decimalSeparator === ',') normalized = normalized.replace(',', '.');
      } else {
        normalized = normalized.replace(/[.,]/g, '');
      }
    } else if (hasComma) {
      if (/^\d{1,3}(,\d{3})+$/.test(normalized)) normalized = normalized.replace(/,/g, '');
      else if (/,\d{2}$/.test(normalized)) normalized = normalized.replace(',', '.');
      else normalized = normalized.replace(/,/g, '');
    } else if (hasDot) {
      if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) normalized = normalized.replace(/\./g, '');
      else if (!/\.\d{2}$/.test(normalized)) normalized = normalized.replace(/\./g, '');
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
  }

  private extractSku(value?: string | null) {
    const raw = (value ?? '').trim();
    if (!raw) return null;
    const match = raw.match(/(?:sku|data-product_sku|c[oo]d(?:igo)?|part(?: number)?)[^A-Z0-9]{0,16}([A-Z0-9._\-]{4,})/i);
    const candidate = match?.[1]?.trim() ?? null;
    if (!candidate) return null;
    if (/^(bg_img|img|jpg|jpeg|png|webp|svg|gif|image|thumbnail)$/i.test(candidate)) return null;
    return candidate;
  }

  private normalizeAvailability(value: unknown): 'in_stock' | 'out_of_stock' | 'unknown' {
    if (typeof value === 'boolean') return value ? 'in_stock' : 'out_of_stock';
    if (typeof value === 'number') return value > 0 ? 'in_stock' : 'out_of_stock';
    const raw = typeof value === 'string' ? value.toLowerCase() : '';
    if (!raw) return 'unknown';
    if (/(sin stock|agotado|out of stock|outofstock|no disponible|no stock)/i.test(raw)) return 'out_of_stock';
    if (/(en stock|stock disponible|disponible|available|hay stock|instock)/i.test(raw)) return 'in_stock';
    return 'unknown';
  }

  private extractProductNameFromContext(snippet: string) {
    const headingMatch = snippet.match(/<(?:h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|h4)>/i);
    if (headingMatch) return this.cleanLabel(headingMatch[1]);
    const titleMatch = snippet.match(/title=(["'])(.*?)\1/i);
    if (titleMatch) return this.cleanLabel(titleMatch[2]);
    return null;
  }

  private extractHtmlPartName(snippet: string, rawLabel: string | null, url: string | null, profile: string) {
    const ariaLabel = this.cleanLabel(this.firstCapture(snippet, /aria-label=([\"'])(.*?)\1/i));
    const safeRawLabel = this.stripPartActionLabel(rawLabel);
    const safeAriaLabel = this.stripPartActionLabel(ariaLabel);
    const candidateNames = [
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bwd-entities-title\b[^\"']*\1[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /woocommerce-loop-product__title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bproduct-title\b[^\"']*\1[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bwoocommerce-LoopProduct-link\b[^\"']*\1[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /class=([\"'])[^\"']*\bproduct__categories\b[^\"']*\1[\s\S]*?<\/p>\s*<div[^>]*woocommerce-loop-product__title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
      this.cleanLabel(this.firstCapture(snippet, /data-hook=([\"'])product-item-root\1[^>]*aria-label=([\"'])(.*?)\2/i)),
      safeRawLabel,
      safeAriaLabel?.replace(/^galer[ií]a de\s+/i, '').trim() || null,
      this.extractProductNameFromContext(snippet),
      this.cleanLabel(this.slugToLabel(url)),
    ];
    const meaningful = candidateNames.find((value) => this.isMeaningfulPartName(value, null));
    if (!meaningful) return null;
    if (profile === 'wix') {
      return meaningful.replace(/^galer[ií]a de\s+/i, '').trim();
    }
    return meaningful;
  }

  private extractHtmlPartBrand(snippet: string, name: string | null, profile: string) {
    const categories = [...snippet.matchAll(/rel=(["'])tag\1[^>]*>([^<]+)</gi)].map((match) => this.cleanLabel(match[2])).filter(Boolean);
    const lastCategory = categories.at(-1) ?? null;
    if (lastCategory && !/(modulo|modulos|repuesto|repuestos|pantalla|display)/i.test(lastCategory)) {
      return lastCategory;
    }

    const categoryLabel = this.cleanLabel(this.firstCapture(snippet, /class=(["'])[^"']*\bproduct-cat\b[^"']*\1[^>]*>([\s\S]*?)<\/p>/i));
    if (categoryLabel && !/(modulo|modulos|repuesto|repuestos)/i.test(categoryLabel)) {
      return categoryLabel;
    }

    if (!name) return null;
    const brands = ['samsung', 'motorola', 'xiaomi', 'iphone', 'apple', 'lg', 'tcl', 'zte', 'realme', 'tecno', 'infinix', 'nokia', 'alcatel', 'huawei', 'oppo', 'vivo'];
    const normalized = this.normalizeSearchText(name);
    const found = brands.find((brand) => normalized.includes(brand));
    if (!found) return null;
    return found === 'apple' ? 'Apple' : found.charAt(0).toUpperCase() + found.slice(1);
  }

  private extractHtmlPartPrice(snippet: string, profile: string) {
    const candidates: string[] = [];
    if (profile === 'wix') {
      candidates.push(...[...snippet.matchAll(/data-wix-price=(["'])(.*?)\1/gi)].map((match) => match[2] ?? ''));
    }
    candidates.push(
      ...[...snippet.matchAll(/<span class="price">[\s\S]*?<\/span>/gi)].map((match) => this.stripHtml(match[0] ?? '')),
      ...[...snippet.matchAll(/woocommerce-Price-amount[^>]*>[\s\S]*?<span[^>]*woocommerce-Price-currencySymbol[^>]*>[\s\S]*?<\/span>\s*([^<]+)/gi)].map(
        (match) => match[1] ?? '',
      ),
      ...[...snippet.matchAll(/(?:\$|&#36;)\s*(?:&nbsp;|\s)*[0-9][0-9.,]*/gi)].map((match) => match[0] ?? ''),
      ...[...snippet.matchAll(/(?:\$|&#36;)\s*[0-9][0-9.,]*/gi)].map((match) => match[0] ?? ''),
    );
    const parsedValues = candidates
      .map((candidate) => this.parseMoneyValue(candidate))
      .filter((value): value is number => value != null);
    const realistic = parsedValues.find((value) => value >= 100 && value !== 0);
    if (realistic != null) return realistic;
    return null;
  }

  private extractHtmlPartAvailability(snippet: string) {
    if (/\binstock\b/i.test(snippet)) return 'in_stock' as const;
    if (/\boutofstock\b/i.test(snippet)) return 'out_of_stock' as const;
    return this.normalizeAvailability(snippet);
  }

  private safeHostname(value?: string | null) {
    try {
      return value ? new URL(value).hostname.toLowerCase().replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  }

  private safePathname(value?: string | null) {
    try {
      return value ? new URL(value).pathname.toLowerCase() : '';
    } catch {
      return '';
    }
  }

  private slugToLabel(url?: string | null) {
    const pathname = this.safePathname(url);
    const slug = pathname.split('/').filter(Boolean).pop();
    if (!slug) return null;
    return slug.replace(/[-_]+/g, ' ').trim();
  }

  private isMeaningfulPartName(value?: string | null, supplierName?: string | null) {
    const label = this.cleanLabel(value);
    if (!label) return false;
    const normalized = this.normalizeSearchText(label);
    if (!normalized || normalized.length < 4) return false;
    if (supplierName && normalized === this.normalizeSearchText(supplierName)) return false;
    if (/^(modulos?|repuestos?|samsung|apple|motorola|xiaomi|lg|nokia)$/.test(normalized)) return false;
    return /[a-z]/i.test(label);
  }

  private normalizeSearchText(value?: string | null) {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildPartSearchQueryProfile(query: string) {
    const genericTokens = new Set(['modulo', 'modulos', 'pantalla', 'display', 'touch', 'lcd', 'oled', 'incell', 'repuesto', 'repuestos', 'parte', 'partes', 'con', 'sin', 'marco', 'negro', 'blanco', 'original', 'premium']);
    const tokens = [...new Set(this.normalizeSearchText(query).split(' ').filter((token) => token.length >= 2))];
    const specificTokens = tokens.filter((token) => !genericTokens.has(token));
    return {
      normalized: this.normalizeSearchText(query),
      tokens,
      specificTokens,
      genericTokens,
    };
  }

  private availabilityOrder(value: 'in_stock' | 'out_of_stock' | 'unknown') {
    return value === 'in_stock' ? 0 : value === 'unknown' ? 1 : 2;
  }

  private rankSupplierPart(item: NormalizedSupplierPartWithProvider, profile: ReturnType<AdminProvidersService['buildPartSearchQueryProfile']>) {
    const nameTokens = this.normalizeSearchText(item.name).split(' ').filter(Boolean);
    const brandTokens = this.normalizeSearchText(item.brand).split(' ').filter(Boolean);
    const skuTokens = this.normalizeSearchText(item.sku).split(' ').filter(Boolean);
    const rawLabelTokens = this.normalizeSearchText(item.rawLabel).split(' ').filter(Boolean);
    const urlTokens = this.normalizeSearchText(this.slugToLabel(item.url)).split(' ').filter(Boolean);
    const haystack = [...nameTokens, ...brandTokens, ...skuTokens, ...rawLabelTokens, ...urlTokens].join(' ');
    const exactTokens = new Set(haystack.split(' ').filter(Boolean));
    let score = 0;
    let specificHits = 0;
    let totalHits = 0;
    if (profile.normalized && this.normalizeSearchText(item.name).includes(profile.normalized)) {
      score += 70;
    }
    for (const token of profile.tokens) {
      const exact = exactTokens.has(token);
      const partial = !exact && haystack.includes(token);
      if (!exact && !partial) continue;
      totalHits += 1;
      if (profile.specificTokens.includes(token)) {
        specificHits += 1;
        score += exact ? 22 : 9;
      } else {
        score += exact ? 5 : 2;
      }
    }
    if (item.price != null) score += 14;
    else score -= 8;
    if (item.price != null && item.price < 100) score -= 55;
    if (item.availability === 'in_stock') score += 12;
    else if (item.availability === 'out_of_stock') score -= 6;
    if (item.sku) score += 4;
    if (item.brand) score += 3;
    if (item.url && /\/(?:producto|product-page)\//i.test(item.url)) score += 6;
    if (item.name.length <= 64) score += 4;
    if (profile.specificTokens.length > 0 && specificHits === 0) score -= 45;
    if (profile.tokens.length >= 2 && totalHits < 2) score -= 18;
    if (item.price === 0) score -= 40;
    return score;
  }
  private stripPartActionLabel(value?: string | null) {
    const label = this.cleanLabel(value);
    if (!label) return null;

    const normalized = this.normalizeSearchText(label);
    if (normalized.startsWith('anadir al carrito')) {
      const quoted = label.match(/[:«“"]\s*(.+?)\s*[»”"]?$/);
      return quoted?.[1] ? this.cleanLabel(quoted[1]) : null;
    }
    if (normalized.startsWith('add to cart')) {
      const quoted = label.match(/[:«“"]\s*(.+?)\s*[»”"]?$/);
      return quoted?.[1] ? this.cleanLabel(quoted[1]) : null;
    }
    return label;
  }

  private async estimateProbeResultCount(
    response: { text: () => Promise<string> },
    searchMode: SupplierRegistryRow['searchMode'],
    configJson?: string | null,
  ) {
    if (searchMode === 'json') {
      const text = await response.text();
      try {
        const payload: unknown = JSON.parse(text);
        return this.extractCountFromJsonPayload(payload, configJson);
      } catch {
        return this.estimateHtmlResultCount(text);
      }
    }
    const html = await response.text();
    return this.estimateHtmlResultCount(html);
  }

  private extractCountFromJsonPayload(payload: unknown, configJson?: string | null) {
    if (Array.isArray(payload)) return payload.length;
    if (!payload || typeof payload !== 'object') return 0;

    const obj = payload as Record<string, unknown>;
    const cfg = this.parseJson(configJson) as { items_path?: string } | null;
    if (cfg?.items_path) {
      const parts = cfg.items_path.split('.').map((p) => p.trim()).filter(Boolean);
      let cursor: unknown = obj;
      for (const part of parts) {
        if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
          cursor = null;
          break;
        }
        cursor = (cursor as Record<string, unknown>)[part];
      }
      if (Array.isArray(cursor)) return cursor.length;
    }
    if (Array.isArray(obj.items)) return obj.items.length;
    return Object.keys(obj).length;
  }

  private estimateHtmlResultCount(html: string) {
    if (!html) return 0;
    const productLikeMatches = html.match(/(producto|product|price|precio|add-to-cart)/gi);
    if (productLikeMatches && productLikeMatches.length > 0) {
      return Math.min(99, Math.max(1, Math.round(productLikeMatches.length / 3)));
    }
    const linkMatches = html.match(/<a\s/gi);
    return Math.min(99, linkMatches?.length ?? 0);
  }


  private formatDate(date: Date) {
    if (Number.isNaN(date.getTime())) return '-';
    return [
      String(date.getDate()).padStart(2, '0'),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getFullYear()),
    ].join('/');
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

  private parseJson(value?: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private cleanNullable(value?: string | null) {
    const v = (value ?? '').trim();
    return v || null;
  }
}

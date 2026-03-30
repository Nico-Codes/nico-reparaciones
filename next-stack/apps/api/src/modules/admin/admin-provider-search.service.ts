import { BadGatewayException, BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { buildProviderSearchUrl, estimateProbeResultCount, extractNormalizedParts } from './admin-provider-search.parsers.js';
import { availabilityOrder, buildPartSearchQueryProfile, rankSupplierPart } from './admin-provider-search-ranking.js';
import { clampInt, cleanNullable } from './admin-provider-search.text.js';
import { AdminProviderRegistryService } from './admin-provider-registry.service.js';
import type {
  NormalizedSupplierPartWithProvider,
  ProviderPartSearchOutcome,
  SupplierPartAggregateSearchInput,
  SupplierPartSearchInput,
  SupplierRegistryRow,
} from './admin-providers.types.js';

const PROVIDER_SEARCH_HEADERS = {
  Accept: 'application/json,text/html,*/*',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.7',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36 NicoReparaciones/1.0',
};

@Injectable()
export class AdminProviderSearchService {
  constructor(
    @Inject(AdminProviderRegistryService)
    private readonly adminProviderRegistryService: AdminProviderRegistryService,
  ) {}

  private async serializeProviderSnapshot(row: SupplierRegistryRow) {
    const stats = (await this.adminProviderRegistryService.getProviderStatsMap()).get(row.id);
    const productCount = await this.adminProviderRegistryService.getProductCountForSupplier(row.id);
    return this.adminProviderRegistryService.serializeProvider(row, stats, productCount);
  }

  private async fetchProviderResponse(url: string, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: PROVIDER_SEARCH_HEADERS,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async probeProvider(id: string, queryRaw?: string) {
    const items = await this.adminProviderRegistryService.readSuppliersRegistry();
    const index = items.findIndex((item) => item.id === id);
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
      await this.adminProviderRegistryService.writeSuppliersRegistry(items);
      return {
        item: await this.serializeProviderSnapshot(items[index]),
        probe: { query: q, count: 0 },
      };
    }

    const url = buildProviderSearchUrl(row, q);

    try {
      const response = await this.fetchProviderResponse(url, 10_000);
      const count = await estimateProbeResultCount(response, row.searchMode, row.searchConfigJson);
      const status: SupplierRegistryRow['lastProbeStatus'] = count > 0 ? 'ok' : 'none';
      items[index] = {
        ...row,
        lastProbeStatus: status,
        lastProbeQuery: q,
        lastProbeCount: count,
        lastProbeError: response.ok ? null : `HTTP ${response.status}`,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.adminProviderRegistryService.writeSuppliersRegistry(items);

      return {
        item: await this.serializeProviderSnapshot(items[index]),
        probe: { query: q, count, url, httpStatus: response.status },
      };
    } catch (error) {
      items[index] = {
        ...row,
        lastProbeStatus: 'none',
        lastProbeQuery: q,
        lastProbeCount: 0,
        lastProbeError: error instanceof Error ? error.message : 'Error de conexion',
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.adminProviderRegistryService.writeSuppliersRegistry(items);

      return {
        item: await this.serializeProviderSnapshot(items[index]),
        probe: { query: q, count: 0, url },
      };
    }
  }

  async searchProviderParts(id: string, input: SupplierPartSearchInput) {
    const items = await this.adminProviderRegistryService.readSuppliersRegistry();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException('Proveedor no encontrado');

    const row = items[index];
    if (!row.searchEnabled) throw new BadRequestException('El proveedor no tiene habilitada la busqueda de repuestos');
    if (!row.searchEndpoint) throw new BadRequestException('El proveedor no tiene endpoint de busqueda configurado');

    const q = input.q.trim();
    const limit = clampInt(input.limit ?? 8, 1, 30);
    const now = new Date().toISOString();
    const url = buildProviderSearchUrl(row, q);

    try {
      const response = await this.fetchProviderResponse(url, 12_000);
      if (!response.ok) {
        throw new BadGatewayException(`El proveedor respondio HTTP ${response.status}`);
      }

      const body = await response.text();
      const normalized = extractNormalizedParts(body, row, url, limit);

      items[index] = {
        ...row,
        lastProbeStatus: normalized.length > 0 ? 'ok' : 'none',
        lastProbeQuery: q,
        lastProbeCount: normalized.length,
        lastProbeError: null,
        lastProbeAt: now,
        updatedAt: now,
      };
      await this.adminProviderRegistryService.writeSuppliersRegistry(items);

      return {
        supplier: await this.serializeProviderSnapshot(items[index]),
        query: q,
        total: normalized.length,
        url,
        items: normalized,
      };
    } catch (error) {
      const message =
        error instanceof BadGatewayException
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
      await this.adminProviderRegistryService.writeSuppliersRegistry(items);

      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException('No se pudo consultar el proveedor');
    }
  }

  async searchPartsAcrossProviders(input: SupplierPartAggregateSearchInput) {
    const registry = await this.adminProviderRegistryService.readSuppliersRegistry();
    const q = input.q.trim();
    const limitPerSupplier = clampInt(input.limitPerSupplier ?? 6, 1, 20);
    const totalLimit = clampInt(input.totalLimit ?? 24, 1, 80);
    const supplierId = cleanNullable(input.supplierId);
    const queryProfile = buildPartSearchQueryProfile(q);

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

    const outcomes = await Promise.all(
      candidates.map((supplier) => this.runProviderPartsSearch(supplier, { q, limit: limitPerSupplier })),
    );
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
      await this.adminProviderRegistryService.writeSuppliersRegistry(nextRegistry);
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
      .map((item) => ({ item, rank: rankSupplierPart(item, queryProfile) }))
      .filter(({ rank }) => rank >= 0)
      .sort((left, right) => {
        if (left.rank !== right.rank) return right.rank - left.rank;

        const availabilityDiff = availabilityOrder(left.item.availability) - availabilityOrder(right.item.availability);
        if (availabilityDiff !== 0) return availabilityDiff;

        const leftPrice = left.item.price == null ? Number.POSITIVE_INFINITY : left.item.price;
        const rightPrice = right.item.price == null ? Number.POSITIVE_INFINITY : right.item.price;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;

        if (left.item.supplier.priority !== right.item.supplier.priority) {
          return left.item.supplier.priority - right.item.supplier.priority;
        }
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

  private async runProviderPartsSearch(
    row: SupplierRegistryRow,
    input: SupplierPartSearchInput,
  ): Promise<ProviderPartSearchOutcome> {
    const q = input.q.trim();
    const limit = clampInt(input.limit ?? 8, 1, 30);
    const url = buildProviderSearchUrl(row, q);

    try {
      const response = await this.fetchProviderResponse(url, 12_000);
      if (!response.ok) {
        return {
          supplier: row,
          query: q,
          url,
          items: [],
          error: `El proveedor respondio HTTP ${response.status}`,
        };
      }

      const body = await response.text();
      const items = extractNormalizedParts(body, row, url, limit);

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
    }
  }
}

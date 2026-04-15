import { Inject, Injectable } from '@nestjs/common';
import { AdminProviderRegistryService } from './admin-provider-registry.service.js';
import { AdminProviderSearchService } from './admin-provider-search.service.js';
import type { SupplierPartAggregateSearchInput, SupplierPartSearchInput } from './admin-providers.types.js';

@Injectable()
export class AdminProvidersService {
  constructor(
    @Inject(AdminProviderRegistryService)
    private readonly adminProviderRegistryService: AdminProviderRegistryService,
    @Inject(AdminProviderSearchService)
    private readonly adminProviderSearchService: AdminProviderSearchService,
  ) {}

  async providers(params?: { q?: string; active?: string }) {
    return this.adminProviderRegistryService.providers(params);
  }

  async createProvider(input: {
    name: string;
    phone?: string | null;
    notes?: string | null;
    searchPriority?: number;
    searchEnabled?: boolean;
    searchInRepairs?: boolean;
    searchMode?: 'json' | 'html';
    searchEndpoint?: string | null;
    searchConfigJson?: string | null;
    active?: boolean;
  }) {
    return this.adminProviderRegistryService.createProvider(input);
  }

  async updateProvider(
    id: string,
    input: Partial<{
      name: string;
      phone: string | null;
      notes: string | null;
      searchPriority: number;
      searchEnabled: boolean;
      searchInRepairs: boolean;
      searchMode: 'json' | 'html';
      searchEndpoint: string | null;
      searchConfigJson: string | null;
      active: boolean;
    }>,
  ) {
    return this.adminProviderRegistryService.updateProvider(id, input);
  }

  async toggleProvider(id: string) {
    return this.adminProviderRegistryService.toggleProvider(id);
  }

  async importDefaultProviders() {
    return this.adminProviderRegistryService.importDefaultProviders();
  }

  async reorderProviders(orderedIds: string[]) {
    return this.adminProviderRegistryService.reorderProviders(orderedIds);
  }

  async probeProvider(id: string, queryRaw?: string) {
    return this.adminProviderSearchService.probeProvider(id, queryRaw);
  }

  async searchProviderParts(id: string, input: SupplierPartSearchInput) {
    return this.adminProviderSearchService.searchProviderParts(id, input);
  }

  async searchPartsAcrossProviders(input: SupplierPartAggregateSearchInput) {
    return this.adminProviderSearchService.searchPartsAcrossProviders(input);
  }
}

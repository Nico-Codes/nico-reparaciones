export type SupplierRegistryRow = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  active: boolean;
  searchPriority: number;
  searchEnabled: boolean;
  searchInRepairs: boolean;
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

export type ProviderStats = {
  incidents: number;
  openIncidents: number;
  closedIncidents: number;
  loss: number;
};

export type SupplierPartSearchInput = {
  q: string;
  limit?: number;
};

export type SupplierPartAggregateSearchInput = {
  q: string;
  supplierId?: string | null;
  limitPerSupplier?: number;
  totalLimit?: number;
};

export type NormalizedSupplierPart = {
  externalPartId: string;
  name: string;
  sku: string | null;
  brand: string | null;
  price: number | null;
  availability: 'in_stock' | 'out_of_stock' | 'unknown';
  url: string | null;
  rawLabel: string | null;
};

export type NormalizedSupplierPartWithProvider = NormalizedSupplierPart & {
  supplier: {
    id: string;
    name: string;
    priority: number;
    endpoint: string | null;
    mode: 'json' | 'html';
  };
};

export type ProviderPartSearchOutcome = {
  supplier: SupplierRegistryRow;
  query: string;
  url: string;
  items: NormalizedSupplierPart[];
  error: string | null;
};

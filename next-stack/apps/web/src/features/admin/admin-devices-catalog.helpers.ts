export type DeviceTypeItem = { id: string; name: string; slug: string; active: boolean };
export type BrandItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
export type ModelItem = {
  id: string;
  brandId: string;
  deviceModelGroupId?: string | null;
  name: string;
  slug: string;
  active: boolean;
  brand: { id: string; name: string; slug: string };
};
export type IssueItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
export type SimilarModelMatch = { item: ModelItem; exact: boolean };

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCatalogValue(value: string) {
  return slugify(value.trim());
}

function compactCatalogValue(value: string) {
  return normalizeCatalogValue(value).replace(/-/g, '');
}

function tokenizeCatalogValue(value: string) {
  return normalizeCatalogValue(value).split('-').filter(Boolean);
}

function countSharedTokens(leftTokens: string[], rightTokens: string[]) {
  return leftTokens.filter((leftToken) =>
    rightTokens.some(
      (rightToken) =>
        leftToken === rightToken ||
        leftToken.startsWith(rightToken) ||
        rightToken.startsWith(leftToken),
    ),
  ).length;
}

function getModelSimilarityScore(name: string, draft: string) {
  const normalizedDraft = normalizeCatalogValue(draft);
  if (!normalizedDraft) return { exact: false, score: 0 };

  const normalizedName = normalizeCatalogValue(name);
  const compactDraft = compactCatalogValue(draft);
  const compactName = compactCatalogValue(name);

  if (compactName === compactDraft) {
    return { exact: true, score: 100 };
  }

  if (compactName.includes(compactDraft) || compactDraft.includes(compactName)) {
    return { exact: false, score: 80 };
  }

  const draftTokens = tokenizeCatalogValue(draft);
  const nameTokens = tokenizeCatalogValue(name);
  const sharedTokens = countSharedTokens(draftTokens, nameTokens);

  if (sharedTokens === draftTokens.length && sharedTokens > 0) {
    return { exact: false, score: 60 };
  }

  if (sharedTokens > 0) {
    return { exact: false, score: 40 + sharedTokens };
  }

  return { exact: false, score: 0 };
}

export function getDefaultDeviceTypeId(deviceTypes: DeviceTypeItem[]) {
  return deviceTypes.find((item) => item.active)?.id || '';
}

export function getActiveBrands(brands: BrandItem[]) {
  return brands.filter((brand) => brand.active);
}

export function getFilteredModels(models: ModelItem[], selectedBrandId: string) {
  return selectedBrandId ? models.filter((model) => model.brandId === selectedBrandId) : [];
}

export function findSimilarModels(models: ModelItem[], draft: string, limit = 5): SimilarModelMatch[] {
  return models
    .map((item) => {
      const similarityByName = getModelSimilarityScore(item.name, draft);
      const similarityBySlug = getModelSimilarityScore(item.slug, draft);
      const similarity =
        similarityByName.score >= similarityBySlug.score ? similarityByName : similarityBySlug;
      return { item, exact: similarity.exact, score: similarity.score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.item.active !== right.item.active) return left.item.active ? -1 : 1;
      return left.item.name.localeCompare(right.item.name, 'es');
    })
    .slice(0, limit)
    .map(({ item, exact }) => ({ item, exact }));
}

export function hasExactModelMatch(models: ModelItem[], draft: string) {
  const compactDraft = compactCatalogValue(draft);
  if (!compactDraft) return false;
  return models.some(
    (item) =>
      compactCatalogValue(item.name) === compactDraft ||
      compactCatalogValue(item.slug) === compactDraft,
  );
}

export function buildDeviceTypeOptions(deviceTypes: DeviceTypeItem[]) {
  return [
    { value: '', label: 'Elegi...' },
    ...deviceTypes.map((type) => ({ value: type.id, label: type.name })),
  ];
}

export function buildBrandOptions(brands: BrandItem[]) {
  return [
    { value: '', label: 'Sin marca activa' },
    ...brands.map((brand) => ({
      value: brand.id,
      label: brand.active ? brand.name : `${brand.name} (inactiva)`,
    })),
  ];
}

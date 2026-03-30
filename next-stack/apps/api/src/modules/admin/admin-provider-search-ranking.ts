import type { NormalizedSupplierPartWithProvider } from './admin-providers.types.js';
import { normalizeSearchText, slugToLabel } from './admin-provider-search.text.js';

export type ProviderSearchQueryProfile = {
  normalized: string;
  tokens: string[];
  specificTokens: string[];
  genericTokens: Set<string>;
};

export function buildPartSearchQueryProfile(query: string): ProviderSearchQueryProfile {
  const genericTokens = new Set([
    'modulo',
    'modulos',
    'pantalla',
    'display',
    'touch',
    'lcd',
    'oled',
    'incell',
    'repuesto',
    'repuestos',
    'parte',
    'partes',
    'con',
    'sin',
    'marco',
    'negro',
    'blanco',
    'original',
    'premium',
  ]);
  const tokens = [...new Set(normalizeSearchText(query).split(' ').filter((token) => token.length >= 2))];
  const specificTokens = tokens.filter((token) => !genericTokens.has(token));

  return {
    normalized: normalizeSearchText(query),
    tokens,
    specificTokens,
    genericTokens,
  };
}

export function availabilityOrder(value: 'in_stock' | 'out_of_stock' | 'unknown') {
  return value === 'in_stock' ? 0 : value === 'unknown' ? 1 : 2;
}

export function rankSupplierPart(item: NormalizedSupplierPartWithProvider, profile: ProviderSearchQueryProfile) {
  const nameTokens = normalizeSearchText(item.name).split(' ').filter(Boolean);
  const brandTokens = normalizeSearchText(item.brand).split(' ').filter(Boolean);
  const skuTokens = normalizeSearchText(item.sku).split(' ').filter(Boolean);
  const rawLabelTokens = normalizeSearchText(item.rawLabel).split(' ').filter(Boolean);
  const urlTokens = normalizeSearchText(slugToLabel(item.url)).split(' ').filter(Boolean);
  const haystack = [...nameTokens, ...brandTokens, ...skuTokens, ...rawLabelTokens, ...urlTokens].join(' ');
  const exactTokens = new Set(haystack.split(' ').filter(Boolean));

  let score = 0;
  let specificHits = 0;
  let totalHits = 0;

  if (profile.normalized && normalizeSearchText(item.name).includes(profile.normalized)) {
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

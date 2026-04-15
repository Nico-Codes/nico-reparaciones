import type { NormalizedSupplierPartWithProvider } from './admin-providers.types.js';
import { normalizeSearchText, slugToLabel } from './admin-provider-search.text.js';

export type ProviderSearchQueryProfile = {
  normalized: string;
  tokens: string[];
  specificTokens: string[];
  requiredGenericTokens: string[];
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
  const requiredGenericTokens = tokens.filter((token) => genericTokens.has(token));

  return {
    normalized: normalizeSearchText(query),
    tokens,
    specificTokens,
    requiredGenericTokens,
    genericTokens,
  };
}

export function availabilityOrder(value: 'in_stock' | 'out_of_stock' | 'unknown') {
  return value === 'in_stock' ? 0 : value === 'unknown' ? 1 : 2;
}

export function rankSupplierPart(item: NormalizedSupplierPartWithProvider, profile: ProviderSearchQueryProfile) {
  const nameTokens = collectSupplierPartTokens(item.name);
  const brandTokens = collectSupplierPartTokens(item.brand);
  const skuTokens = collectSupplierPartTokens(item.sku);
  const rawLabelTokens = collectSupplierPartTokens(item.rawLabel);
  const urlTokens = collectSupplierPartTokens(slugToLabel(item.url));
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

export function matchesSupplierPartExactQuery(item: NormalizedSupplierPartWithProvider, profile: ProviderSearchQueryProfile) {
  if (!profile.tokens.length) return true;

  const exactTokens = collectAllSupplierPartTokens(item);
  if (!exactTokens.size) return false;

  const hasAllSpecificTokens = profile.specificTokens.every((token) => matchesSpecificQueryToken(token, exactTokens));
  if (!hasAllSpecificTokens) return false;

  if (!profile.requiredGenericTokens.length) return true;
  return profile.requiredGenericTokens.some((token) => exactTokens.has(token));
}

function collectAllSupplierPartTokens(item: NormalizedSupplierPartWithProvider) {
  return new Set(
    [
      ...collectSupplierPartTokens(item.name),
      ...collectSupplierPartTokens(item.brand),
      ...collectSupplierPartTokens(item.sku),
      ...collectSupplierPartTokens(item.rawLabel),
      ...collectSupplierPartTokens(slugToLabel(item.url)),
    ].filter(Boolean),
  );
}

function collectSupplierPartTokens(value?: string | null) {
  return normalizeSearchText(value).split(' ').filter(Boolean);
}

function matchesSpecificQueryToken(queryToken: string, candidateTokens: Set<string>) {
  if (candidateTokens.has(queryToken)) return true;

  const queryHasDigits = /\d/.test(queryToken);
  if (!queryHasDigits || queryToken.length < 3) return false;

  for (const candidateToken of candidateTokens) {
    if (candidateToken.startsWith(queryToken)) return true;
  }
  return false;
}

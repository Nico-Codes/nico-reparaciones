import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { availabilityOrder, buildPartSearchQueryProfile, rankSupplierPart } from './admin-provider-search-ranking.js';
import type { NormalizedSupplierPart, SupplierRegistryRow } from './admin-providers.types.js';
import {
  cleanLabel,
  extractSku,
  normalizeAvailability,
  normalizeSearchText,
  normalizeUrl,
  parseJson,
  parseMoneyValue,
  safeHostname,
  safePathname,
  slugToLabel,
  stripHtml,
} from './admin-provider-search.text.js';

export function buildProviderSearchUrl(row: SupplierRegistryRow, query: string) {
  if (!row.searchEndpoint) throw new BadRequestException('El proveedor no tiene endpoint de busqueda configurado');
  return row.searchEndpoint.includes('{query}')
    ? row.searchEndpoint.replaceAll('{query}', encodeURIComponent(query))
    : `${row.searchEndpoint}${row.searchEndpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`;
}

export function extractNormalizedParts(
  rawBody: string,
  row: SupplierRegistryRow,
  requestUrl: string,
  limit: number,
): NormalizedSupplierPart[] {
  return row.searchMode === 'json'
    ? extractNormalizedPartsFromJsonPayload(rawBody, row, limit, requestUrl)
    : extractNormalizedPartsFromHtml(rawBody, row, requestUrl, limit);
}

export async function estimateProbeResultCount(
  response: { text: () => Promise<string> },
  searchMode: SupplierRegistryRow['searchMode'],
  configJson?: string | null,
) {
  if (searchMode === 'json') {
    const text = await response.text();
    try {
      const payload: unknown = JSON.parse(text);
      return extractCountFromJsonPayload(payload, configJson);
    } catch {
      return estimateHtmlResultCount(text);
    }
  }

  const html = await response.text();
  return estimateHtmlResultCount(html);
}

function extractNormalizedPartsFromJsonPayload(
  rawBody: string,
  row: SupplierRegistryRow,
  limit: number,
  requestUrl: string,
): NormalizedSupplierPart[] {
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new BadGatewayException('El proveedor configurado como JSON devolvio una respuesta invalida');
  }

  const config = parseJson<Record<string, unknown>>(row.searchConfigJson) ?? {};
  const items = extractJsonItems(payload, config);
  if (items.length === 0) return [];

  const normalized = items
    .map((item, index) => normalizeJsonPart(item, config, row, index))
    .filter((item): item is NormalizedSupplierPart => !!item);

  const query = extractSearchQueryFromUrl(requestUrl);
  if (!query) {
    return dedupeNormalizedParts(normalized, limit);
  }

  const profile = buildPartSearchQueryProfile(query);
  const ranked = normalized
    .map((item) => ({
      item,
      rank: rankSupplierPart(
        {
          ...item,
          supplier: {
            id: row.id,
            name: row.name,
            priority: row.searchPriority,
            endpoint: row.searchEndpoint,
            mode: row.searchMode,
          },
        },
        profile,
      ),
    }))
    .filter(({ rank }) => rank >= 0)
    .sort((left, right) => right.rank - left.rank)
    .map(({ item }) => item);

  return dedupeNormalizedParts(ranked, limit);
}

function extractJsonItems(payload: unknown, config: Record<string, unknown>) {
  const itemsPath = typeof config.items_path === 'string' ? config.items_path.trim() : '';
  if (itemsPath) {
    const resolved = readObjectPath(payload, itemsPath);
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

function normalizeJsonPart(
  item: unknown,
  config: Record<string, unknown>,
  row: SupplierRegistryRow,
  index: number,
): NormalizedSupplierPart | null {
  if (!item || typeof item !== 'object') return null;
  if (shouldIgnoreJsonPart(item, config)) return null;

  const externalId = findJsonString(
    item,
    config,
    ['externalPartId', 'external_id_path', 'id_path'],
    ['id', 'productId', 'product_id', 'sku'],
  );
  const name = findJsonString(item, config, ['name_path', 'title_path'], ['name', 'title', 'label', 'description', 'productName', 'nombre', 'titulo']);
  const normalizedName = cleanLabel(name ?? findJsonString(item, config, ['nombre_path'], ['nombre', 'titulo']));
  const sku = findJsonString(item, config, ['sku_path'], ['sku', 'code', 'barcode', 'partNumber', 'part_number']);
  const brand = findJsonString(item, config, ['brand_path'], ['brand', 'manufacturer', 'marca']);
  const price = findJsonNumber(item, config, ['price_path'], ['price', 'salePrice', 'amount', 'finalPrice', 'unitPrice', 'precio']);
  const availabilityRaw = findJsonValue(
    item,
    config,
    ['availability_path'],
    ['availability', 'stockStatus', 'stock_status', 'stock', 'available'],
  );
  const url = normalizeUrl(findJsonString(item, config, ['url_path'], ['url', 'link', 'href']), row.searchEndpoint);

  if (!normalizedName) return null;

  return {
    externalPartId: externalId || url || `${row.id}:${index}:${normalizedName.toLowerCase()}`,
    name: normalizedName,
    sku: cleanLabel(sku),
    brand: cleanLabel(brand),
    price,
    availability: normalizeAvailability(availabilityRaw),
    url,
    rawLabel: null,
  };
}

function extractNormalizedPartsFromHtml(
  html: string,
  row: SupplierRegistryRow,
  requestUrl: string,
  limit: number,
): NormalizedSupplierPart[] {
  const config = parseJson<Record<string, unknown>>(row.searchConfigJson) ?? {};
  const profile = resolveHtmlSearchProfile(row, requestUrl, config);

  const singleProductPage = extractHtmlSingleProductPage(html, config, row, requestUrl, profile);
  if (singleProductPage) {
    return [singleProductPage];
  }

  const providerSpecific = extractHtmlPartsFromKnownProviderHtml(html, config, row, requestUrl, limit, profile);
  if (providerSpecific.length > 0) {
    return dedupeNormalizedParts(providerSpecific, limit);
  }

  const parsedFromBlocks = extractHtmlPartsFromBlocks(html, config, row, requestUrl, limit, profile);
  if (parsedFromBlocks.length > 0) {
    return dedupeNormalizedParts(parsedFromBlocks, limit);
  }

  const parsedFromAnchors = extractHtmlPartsFromAnchors(html, config, row, requestUrl, limit, profile);
  return dedupeNormalizedParts(parsedFromAnchors, limit);
}

function resolveHtmlSearchProfile(row: SupplierRegistryRow, requestUrl: string, config: Record<string, unknown>) {
  const explicitProfile = typeof config.profile === 'string' ? config.profile.trim().toLowerCase() : '';
  if (explicitProfile) return explicitProfile;

  const host = safeHostname(requestUrl) || safeHostname(row.searchEndpoint);
  if (!host) return 'generic';
  if (host.includes('novocell.com.ar')) return 'wix';
  if (host.includes('evophone.com.ar')) return 'woodmart';
  if (host.includes('celuphone.com.ar')) return 'shoptimizer';
  if (host.includes('okeyrosario.com.ar') || host.includes('electrostore.com.ar')) return 'flatsome';
  if (host.includes('tiendamovilrosario.com.ar')) return 'xstore';
  return 'generic';
}

function extractHtmlPartsFromKnownProviderHtml(
  html: string,
  config: Record<string, unknown>,
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
    xstore: [
      /<li\b[^>]*class=(["'])[^"']*\bproduct\b[^"']*\btype-product\b[^"']*\1[\s\S]*?<\/li>/gi,
      /<div\b[^>]*class=["'][^"']*\betheme-product-grid-item\b[^"']*\bproduct\b[^"']*["'][\s\S]*?(?=<div\b[^>]*class=["'][^"']*\betheme-product-grid-item\b[^"']*\bproduct\b[^"']*["']|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>|$)/gi,
    ],
  };
  const regexes = blockRegexes[profile] ?? [];
  if (regexes.length === 0) return [];

  const items: NormalizedSupplierPart[] = [];
  for (const regex of regexes) {
    for (const match of html.matchAll(regex)) {
      if (items.length >= limit) break;
      const normalized = normalizeHtmlPartFromSnippet(match[0] ?? '', config, row, requestUrl, items.length, profile);
      if (!normalized) continue;
      items.push(normalized);
    }
    if (items.length >= limit) break;
  }

  return items;
}

function extractHtmlPartsFromBlocks(
  html: string,
  config: Record<string, unknown>,
  row: SupplierRegistryRow,
  requestUrl: string,
  limit: number,
  profile: string,
) {
  const itemRegexSource = typeof config.item_regex === 'string' ? config.item_regex : '';
  if (!itemRegexSource) return [];

  let itemRegex: RegExp;
  try {
    itemRegex = new RegExp(itemRegexSource, 'gi');
  } catch {
    return [];
  }

  const nameRegex = compileOptionalRegex(config.name_regex);
  const priceRegex = compileOptionalRegex(config.price_regex);
  const urlRegex = compileOptionalRegex(config.url_regex);
  const raw: NormalizedSupplierPart[] = [];

  for (const match of html.matchAll(itemRegex)) {
    if (raw.length >= limit) break;
    const block = match[0] ?? '';
    const rawName = nameRegex ? firstCapture(block, nameRegex) : '';
    const rawPrice = priceRegex ? firstCapture(block, priceRegex) : '';
    const rawUrl = urlRegex ? firstCapture(block, urlRegex) : '';
    const url = normalizeUrl(rawUrl, requestUrl);
    const normalized = normalizeHtmlPartFromSnippet(block, config, row, requestUrl, raw.length, profile, {
      url,
      name: cleanLabel(stripHtml(rawName || block)),
      price: rawPrice ? parseMoneyValue(rawPrice) : null,
    });
    if (!normalized) continue;
    raw.push(normalized);
  }

  return raw;
}

function extractHtmlPartsFromAnchors(
  html: string,
  config: Record<string, unknown>,
  row: SupplierRegistryRow,
  requestUrl: string,
  limit: number,
  profile: string,
) {
  const candidatePaths = Array.isArray(config.candidate_paths)
    ? config.candidate_paths.filter((value): value is string => typeof value === 'string')
    : [];
  const excludePaths = Array.isArray(config.exclude_paths)
    ? config.exclude_paths.filter((value): value is string => typeof value === 'string')
    : [];
  const contextWindow = clampContextWindow(typeof config.context_window === 'number' ? config.context_window : 1000);
  const candidateUrlRegex = compileOptionalRegex(config.candidate_url_regex);
  const priceRegex = compileOptionalRegex(config.price_regex);
  const anchorRegex = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  const out: NormalizedSupplierPart[] = [];

  for (const match of html.matchAll(anchorRegex)) {
    if (out.length >= limit) break;
    const href = (match[2] ?? '').trim();
    if (!href) continue;

    const absoluteUrl = normalizeUrl(href, requestUrl);
    if (!absoluteUrl) continue;
    if (!isLikelyProductUrl(absoluteUrl, requestUrl, candidatePaths, excludePaths, candidateUrlRegex)) continue;

    const startIndex = match.index ?? 0;
    const contextStart = Math.max(0, startIndex - Math.round(contextWindow * 0.45));
    const contextEnd = Math.min(html.length, startIndex + contextWindow);
    const snippet = html.slice(contextStart, contextEnd);
    const normalized = normalizeHtmlPartFromSnippet(snippet, config, row, requestUrl, out.length, profile, {
      url: absoluteUrl,
      rawLabel: cleanLabel(stripHtml(match[3] ?? '')),
      price: priceRegex ? parseMoneyValue(firstCapture(snippet, priceRegex)) : null,
    });
    if (!normalized) continue;
    out.push(normalized);
  }

  return out;
}

function normalizeHtmlPartFromSnippet(
  snippet: string,
  config: Record<string, unknown>,
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
    normalizeUrl(firstCapture(snippet, /href=(["'])([^"']*(?:\/producto\/|\/product\/|\/product-page\/)[^"']*)\1/i), requestUrl);
  const name =
    cleanLabel(preferred?.name) ??
    extractHtmlPartName(snippet, preferred?.rawLabel ?? null, url, profile) ??
    extractProductNameFromContext(snippet);
  if (!isMeaningfulPartName(name, row.name)) return null;

  const brand = extractHtmlPartBrand(snippet, name, profile);
  const price = preferred?.price ?? extractHtmlPartPrice(snippet, profile);

  return {
    externalPartId:
      cleanLabel(firstCapture(snippet, /data-product_id=(["'])([^"']+)\1/i)) || url || `${row.id}:${index}:${name!.toLowerCase()}`,
    name: name!,
    sku: extractSku(snippet),
    brand,
    price,
    availability: extractHtmlPartAvailability(snippet),
    url,
    rawLabel: cleanLabel(preferred?.rawLabel ?? null) ?? name!,
  };
}

function dedupeNormalizedParts(items: NormalizedSupplierPart[], limit: number) {
  const indexByKey = new Map<string, number>();
  const result: NormalizedSupplierPart[] = [];

  for (const item of items) {
    const key = buildNormalizedPartDedupeKey(item);
    const existingIndex = indexByKey.get(key);
    if (existingIndex != null) {
      result[existingIndex] = mergeDuplicateNormalizedPart(result[existingIndex]!, item);
      continue;
    }
    indexByKey.set(key, result.length);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

function buildNormalizedPartDedupeKey(item: NormalizedSupplierPart) {
  const urlKey = (item.url ?? '').trim().toLowerCase();
  if (urlKey) return `url:${urlKey}`;

  const skuKey = (item.sku ?? '').trim().toLowerCase();
  if (skuKey) return `sku:${skuKey}`;

  return `name:${normalizeSearchText(item.name)}`;
}

function mergeDuplicateNormalizedPart(current: NormalizedSupplierPart, next: NormalizedSupplierPart) {
  const currentPrice = current.price == null ? Number.POSITIVE_INFINITY : current.price;
  const nextPrice = next.price == null ? Number.POSITIVE_INFINITY : next.price;
  const preferred = nextPrice < currentPrice ? next : current;
  const fallback = preferred === current ? next : current;

  return {
    ...preferred,
    sku: preferred.sku ?? fallback.sku,
    brand: preferred.brand ?? fallback.brand,
    price: Number.isFinite(Math.min(currentPrice, nextPrice)) ? Math.min(currentPrice, nextPrice) : null,
    availability:
      availabilityOrder(preferred.availability) <= availabilityOrder(fallback.availability)
        ? preferred.availability
        : fallback.availability,
    rawLabel: preferred.rawLabel ?? fallback.rawLabel,
  };
}

function shouldIgnoreJsonPart(item: unknown, config: Record<string, unknown>) {
  const typeValue = normalizeSearchText(findJsonString(item, config, ['type_path'], ['type', 'kind']));
  const ignoredTypes = Array.isArray(config.ignore_type_values)
    ? config.ignore_type_values
        .map((value) => (typeof value === 'string' ? normalizeSearchText(value) : ''))
        .filter(Boolean)
    : [];
  if (typeValue && ignoredTypes.includes(typeValue)) return true;

  const labelValue =
    cleanLabel(
      findJsonString(item, config, ['name_path', 'title_path', 'label_path'], [
        'name',
        'title',
        'label',
        'description',
        'productName',
        'nombre',
        'titulo',
        'value',
      ]),
    ) ?? null;
  const normalizedLabel = normalizeSearchText(labelValue);
  if (/^(no hay resultados|no se han encontrado productos|sin resultados?)$/.test(normalizedLabel)) return true;

  const ignoreNameRegex =
    typeof config.ignore_name_regex === 'string' && config.ignore_name_regex.trim()
      ? new RegExp(String(config.ignore_name_regex), 'i')
      : null;
  if (ignoreNameRegex && labelValue && ignoreNameRegex.test(labelValue)) return true;

  const externalId = findJsonString(item, config, ['externalPartId', 'external_id_path', 'id_path'], ['id']);
  return externalId === '-1';
}

function isLikelyProductUrl(
  absoluteUrl: string,
  requestUrl: string,
  candidatePaths: string[],
  excludePaths: string[],
  candidateUrlRegex: RegExp | null,
) {
  if (excludePaths.some((pathChunk) => absoluteUrl.includes(pathChunk))) return false;
  if (candidateUrlRegex && !candidateUrlRegex.test(absoluteUrl)) return false;
  if (candidatePaths.length > 0 && !candidatePaths.some((pathChunk) => absoluteUrl.includes(pathChunk))) return false;

  const requestHost = safeHostname(requestUrl);
  const candidateHost = safeHostname(absoluteUrl);
  if (requestHost && candidateHost && requestHost !== candidateHost) return false;

  const pathname = safePathname(absoluteUrl);
  if (!pathname) return false;
  if (/\/(?:categoria-producto|product-category|search|tienda|shop)\/?$/i.test(pathname)) return false;
  if (/\/(?:producto|product|product-page)\//i.test(pathname)) return true;
  return candidatePaths.length > 0;
}

function readObjectPath(value: unknown, rawPath: string) {
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

function findJsonValue(item: unknown, config: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
  for (const configKey of configPaths) {
    const path = typeof config[configKey] === 'string' ? String(config[configKey]).trim() : '';
    if (!path) continue;
    const value = readObjectPath(item, path);
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

function findJsonString(item: unknown, config: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
  const value = findJsonValue(item, config, configPaths, fallbackKeys);
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function findJsonNumber(item: unknown, config: Record<string, unknown>, configPaths: string[], fallbackKeys: string[]) {
  const value = findJsonValue(item, config, configPaths, fallbackKeys);
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100) / 100;
  if (typeof value === 'string') return parseMoneyValue(value);
  return null;
}

function compileOptionalRegex(raw: unknown) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return new RegExp(raw, 'i');
  } catch {
    return null;
  }
}

function firstCapture(value: string, regex: RegExp) {
  const match = value.match(regex);
  if (!match) return '';
  return (match[2] ?? match[1] ?? match[0] ?? '').trim();
}

function extractProductNameFromContext(snippet: string) {
  const headingMatch = snippet.match(/<(?:h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|h4)>/i);
  if (headingMatch) return cleanLabel(headingMatch[1]);

  const titleMatch = snippet.match(/title=(["'])(.*?)\1/i);
  if (titleMatch) return cleanLabel(titleMatch[2]);
  const metaTitle = cleanLabel(firstCapture(snippet, /property=(["'])og:title\1[^>]*content=["'](.*?)["']/i));
  if (metaTitle) return stripSiteSuffix(metaTitle);
  return null;
}

function extractHtmlPartName(snippet: string, rawLabel: string | null, url: string | null, profile: string) {
  const ariaLabel = cleanLabel(firstCapture(snippet, /aria-label=(["'])(.*?)\1/i));
  const safeRawLabel = stripPartActionLabel(rawLabel);
  const safeAriaLabel = stripPartActionLabel(ariaLabel);
  const candidateNames = [
    cleanLabel(firstCapture(snippet, /class=(["'])[^"']*\bwd-entities-title\b[^"']*\1[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
    cleanLabel(firstCapture(snippet, /woocommerce-loop-product__title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
    cleanLabel(firstCapture(snippet, /class=(["'])[^"']*\bproduct-title\b[^"']*\1[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)),
    cleanLabel(firstCapture(snippet, /class=(["'])[^"']*\bwoocommerce-LoopProduct-link\b[^"']*\1[^>]*>([\s\S]*?)<\/a>/i)),
    cleanLabel(firstCapture(snippet, /<(?:h1|h2)[^>]*class=(["'])[^"']*\bproduct_title\b[^"']*\1[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i)),
    cleanLabel(
      firstCapture(
        snippet,
        /class=(["'])[^"']*\bproduct__categories\b[^"']*\1[\s\S]*?<\/p>\s*<div[^>]*woocommerce-loop-product__title[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i,
      ),
    ),
    cleanLabel(firstCapture(snippet, /data-hook=(["'])product-item-root\1[^>]*aria-label=(["'])(.*?)\2/i)),
    safeRawLabel,
    stripGalleryPrefix(safeAriaLabel),
    extractProductNameFromContext(snippet),
    cleanLabel(slugToLabel(url)),
  ];

  const meaningful = candidateNames.find((value) => isMeaningfulPartName(value, null));
  if (!meaningful) return null;
  return profile === 'wix' ? stripGalleryPrefix(meaningful) : meaningful;
}

function extractHtmlPartBrand(snippet: string, name: string | null, profile: string) {
  const categories = [...snippet.matchAll(/rel=(["'])tag\1[^>]*>([^<]+)</gi)]
    .map((match) => cleanLabel(match[2]))
    .filter(Boolean);
  const lastCategory = categories.at(-1) ?? null;
  if (lastCategory && !/(modulo|modulos|repuesto|repuestos|pantalla|display)/i.test(lastCategory)) {
    return lastCategory;
  }

  const categoryLabel = cleanLabel(firstCapture(snippet, /class=(["'])[^"']*\bproduct-cat\b[^"']*\1[^>]*>([\s\S]*?)<\/p>/i));
  if (categoryLabel && !/(modulo|modulos|repuesto|repuestos)/i.test(categoryLabel)) {
    return categoryLabel;
  }

  if (!name) return null;
  const brands = ['samsung', 'motorola', 'xiaomi', 'iphone', 'apple', 'lg', 'tcl', 'zte', 'realme', 'tecno', 'infinix', 'nokia', 'alcatel', 'huawei', 'oppo', 'vivo'];
  const normalized = normalizeSearchText(name);
  const found = brands.find((brand) => normalized.includes(brand));
  if (!found) return null;
  return found === 'apple' ? 'Apple' : found.charAt(0).toUpperCase() + found.slice(1);
}

function extractHtmlPartPrice(snippet: string, profile: string) {
  const candidates = extractPrioritizedPriceCandidates(snippet, profile);
  if (candidates.length === 0) return null;
  const best = candidates.sort((left, right) => {
    if (left.priority !== right.priority) return right.priority - left.priority;
    if (left.position !== right.position) return right.position - left.position;
    return right.value - left.value;
  })[0];
  return best?.value ?? null;
}

function extractHtmlSingleProductPage(
  html: string,
  config: Record<string, unknown>,
  row: SupplierRegistryRow,
  requestUrl: string,
  profile: string,
) {
  const productJson = extractProductJsonLd(html);
  const candidateUrl =
    normalizeUrl(productJson?.url, requestUrl) ??
    normalizeUrl(firstCapture(html, /<link[^>]*rel=(["'])canonical\1[^>]*href=["'](.*?)["']/i), requestUrl) ??
    normalizeUrl(firstCapture(html, /property=(["'])og:url\1[^>]*content=["'](.*?)["']/i), requestUrl);
  const candidatePaths = Array.isArray(config.candidate_paths)
    ? config.candidate_paths.filter((value): value is string => typeof value === 'string')
    : [];
  const excludePaths = Array.isArray(config.exclude_paths)
    ? config.exclude_paths.filter((value): value is string => typeof value === 'string')
    : [];
  const candidateUrlRegex = compileOptionalRegex(config.candidate_url_regex);

  if (
    !candidateUrl ||
    !isLikelyProductUrl(candidateUrl, requestUrl, candidatePaths, excludePaths, candidateUrlRegex)
  ) {
    return null;
  }

  const name =
    cleanLabel(productJson?.name) ??
    cleanLabel(firstCapture(html, /<(?:h1|h2)[^>]*class=(["'])[^"']*\bproduct_title\b[^"']*\1[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i)) ??
    stripSiteSuffix(cleanLabel(firstCapture(html, /property=(["'])og:title\1[^>]*content=["'](.*?)["']/i))) ??
    extractProductNameFromContext(html);
  if (!isMeaningfulPartName(name, row.name)) return null;

  return {
    externalPartId: cleanLabel(productJson?.sku) || candidateUrl || `${row.id}:single:${name!.toLowerCase()}`,
    name: name!,
    sku: cleanLabel(productJson?.sku) ?? extractSku(html),
    brand: cleanLabel(productJson?.brand) ?? extractHtmlPartBrand(html, name, profile),
    price: productJson?.price ?? extractHtmlPartPrice(html, profile),
    availability: productJson?.availability ? normalizeAvailability(productJson.availability) : extractHtmlPartAvailability(html),
    url: candidateUrl,
    rawLabel: name!,
  };
}

function extractPrioritizedPriceCandidates(snippet: string, profile: string) {
  const candidates: Array<{ value: number; priority: number; position: number }> = [];
  const seen = new Set<string>();

  const addCandidates = (matches: IterableIterator<RegExpMatchArray>, priority: number) => {
    for (const match of matches) {
      const raw = match[0] ?? '';
      const value = parseMoneyValue(raw);
      if (value == null || value < 100 || value === 0) continue;
      const key = `${priority}:${value}:${raw}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ value, priority, position: match.index ?? 0 });
    }
  };

  if (profile === 'wix') {
    addCandidates(snippet.matchAll(/data-wix-price=(["'])(.*?)\1/gi), 90);
  }

  addCandidates(snippet.matchAll(/<ins\b[^>]*>[\s\S]*?(?:\$|&#36;)[\s\S]*?<\/ins>/gi), 120);
  addCandidates(
    snippet.matchAll(
      /<(?:span|div|p)\b[^>]*class=(["'])[^"']*\b(?:sale-price|current-price|final-price|product-price-current|price-final)\b[^"']*\1[^>]*>[\s\S]*?(?:\$|&#36;)[\s\S]*?<\/(?:span|div|p)>/gi,
    ),
    110,
  );
  addCandidates(snippet.matchAll(/<bdi\b[^>]*>[\s\S]*?(?:\$|&#0?36;)[\s\S]*?[0-9][0-9.,]*[\s\S]*?<\/bdi>/gi), 92);
  addCandidates(snippet.matchAll(/<(?:span|p)\b[^>]*class=(["'])price\1[^>]*>[\s\S]*?(?:\$|&#36;)[\s\S]*?<\/(?:span|p)>/gi), 85);
  addCandidates(snippet.matchAll(/woocommerce-Price-amount[^>]*>[\s\S]*?(?:\$|&#36;)[\s\S]*?<\/span>/gi), 75);
  addCandidates(snippet.matchAll(/(?:\$|&#36;)\s*(?:&nbsp;|\s)*[0-9][0-9.,]*/gi), 40);

  return candidates;
}

function extractProductJsonLd(html: string) {
  const scripts = [...html.matchAll(/<script[^>]*type=(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    const parsed = parseJson<unknown>((match[2] ?? '').trim());
    const node = findJsonLdProductNode(parsed);
    if (!node) continue;
    const product = node as Record<string, unknown>;
    const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    const offer = offers && typeof offers === 'object' ? (offers as Record<string, unknown>) : null;
    const brandNode = product.brand && typeof product.brand === 'object' ? (product.brand as Record<string, unknown>) : null;
    return {
      name: typeof product.name === 'string' ? product.name : null,
      url: typeof product.url === 'string' ? product.url : null,
      sku: typeof product.sku === 'string' ? product.sku : null,
      brand: typeof product.brand === 'string' ? product.brand : typeof brandNode?.name === 'string' ? brandNode.name : null,
      price:
        (offer && typeof offer.price === 'string' ? parseMoneyValue(offer.price) : null) ??
        (offer && typeof offer.price === 'number' && Number.isFinite(offer.price) ? offer.price : null) ??
        extractPriceFromPriceSpecification(offer),
      availability: offer && typeof offer.availability === 'string' ? offer.availability : null,
    };
  }

  return null;
}

function findJsonLdProductNode(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const node = findJsonLdProductNode(item);
      if (node) return node;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = record['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((entry) => typeof entry === 'string' && entry.toLowerCase() === 'product')) {
    return record;
  }

  if (Array.isArray(record['@graph'])) {
    return findJsonLdProductNode(record['@graph']);
  }

  return null;
}

function extractPriceFromPriceSpecification(offer: Record<string, unknown> | null) {
  if (!offer) return null;
  const priceSpecification = offer.priceSpecification;
  const items = Array.isArray(priceSpecification) ? priceSpecification : priceSpecification ? [priceSpecification] : [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.price === 'number' && Number.isFinite(record.price)) return record.price;
    if (typeof record.price === 'string') {
      const parsed = parseMoneyValue(record.price);
      if (parsed != null) return parsed;
    }
  }
  return null;
}

function stripSiteSuffix(value?: string | null) {
  const label = cleanLabel(value);
  if (!label) return null;
  return label.replace(/\s+[|-]\s+[^|-]+$/g, '').trim() || label;
}

function extractHtmlPartAvailability(snippet: string) {
  if (/\binstock\b/i.test(snippet)) return 'in_stock' as const;
  if (/\boutofstock\b/i.test(snippet)) return 'out_of_stock' as const;
  return normalizeAvailability(snippet);
}

function isMeaningfulPartName(value?: string | null, supplierName?: string | null) {
  const label = cleanLabel(value);
  if (!label) return false;

  const normalized = normalizeSearchText(label);
  if (!normalized || normalized.length < 4) return false;
  if (supplierName && normalized === normalizeSearchText(supplierName)) return false;
  if (/^(modulos?|repuestos?|samsung|apple|motorola|xiaomi|lg|nokia)$/.test(normalized)) return false;
  return /[a-z]/i.test(label);
}

function stripPartActionLabel(value?: string | null) {
  const label = cleanLabel(value);
  if (!label) return null;

  const normalized = normalizeSearchText(label);
  if (!normalized.startsWith('anadir al carrito') && !normalized.startsWith('add to cart')) {
    return label;
  }

  const fromColon = label.match(/:\s*(.+)$/);
  if (fromColon?.[1]) return cleanLabel(fromColon[1]);

  const quoted = label.match(/["']\s*(.+?)\s*["']?$/);
  return quoted?.[1] ? cleanLabel(quoted[1]) : null;
}

function stripGalleryPrefix(value?: string | null) {
  const label = cleanLabel(value);
  if (!label) return null;
  return label.replace(/^galer(?:ia|ía)\s+de\s+/i, '').trim() || label;
}

function extractCountFromJsonPayload(payload: unknown, configJson?: string | null) {
  if (Array.isArray(payload)) return payload.length;
  if (!payload || typeof payload !== 'object') return 0;

  const obj = payload as Record<string, unknown>;
  const config = parseJson<{ items_path?: string }>(configJson);
  if (config?.items_path) {
    const parts = config.items_path.split('.').map((part) => part.trim()).filter(Boolean);
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

function estimateHtmlResultCount(html: string) {
  if (!html) return 0;
  const productLikeMatches = html.match(/(producto|product|price|precio|add-to-cart)/gi);
  if (productLikeMatches && productLikeMatches.length > 0) {
    return Math.min(99, Math.max(1, Math.round(productLikeMatches.length / 3)));
  }

  const linkMatches = html.match(/<a\s/gi);
  return Math.min(99, linkMatches?.length ?? 0);
}

function clampContextWindow(value: number) {
  if (!Number.isFinite(value)) return 1000;
  return Math.max(240, Math.min(12000, Math.round(value)));
}

function extractSearchQueryFromUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.searchParams.get('q') ??
      url.searchParams.get('s') ??
      url.searchParams.get('term') ??
      url.searchParams.get('query') ??
      url.searchParams.get('search') ??
      ''
    ).trim();
  } catch {
    return '';
  }
}

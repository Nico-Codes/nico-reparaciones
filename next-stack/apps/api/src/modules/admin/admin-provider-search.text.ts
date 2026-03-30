export function cleanNullable(value?: string | null) {
  const normalized = (value ?? '').trim();
  return normalized || null;
}

export function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function parseJson<T = unknown>(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string) {
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

export function stripHtml(value: string) {
  return decodeHtmlEntities(value)
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

export function cleanLabel(value?: string | null) {
  const stripped = stripHtml(value ?? '');
  return stripped || null;
}

export function normalizeUrl(rawUrl?: string | null, requestUrl?: string | null) {
  const normalized = (rawUrl ?? '').trim();
  if (!normalized) return null;
  try {
    return new URL(normalized, requestUrl ?? undefined).toString();
  } catch {
    return null;
  }
}

export function parseMoneyValue(value?: string | null) {
  const raw = decodeHtmlEntities((value ?? '').trim());
  if (!raw) return null;

  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/\bprecio\b/gi, ' ')
    .replace(/\bars\b/gi, '$');
  const match = cleaned.match(/(?:\$|ars|usd)?\s*([0-9][0-9.,\s]*)/i);
  const amount = match?.[1] ?? cleaned;

  let normalized = amount.replace(/\s/g, '').replace(/[^0-9.,]/g, '');
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

export function extractSku(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) return null;

  const match = raw.match(/(?:sku|data-product_sku|c[oo]d(?:igo)?|part(?: number)?)[^A-Z0-9]{0,16}([A-Z0-9._\-]{4,})/i);
  const candidate = match?.[1]?.trim() ?? null;
  if (!candidate) return null;
  if (/^(bg_img|img|jpg|jpeg|png|webp|svg|gif|image|thumbnail)$/i.test(candidate)) return null;
  return candidate;
}

export function normalizeAvailability(value: unknown): 'in_stock' | 'out_of_stock' | 'unknown' {
  if (typeof value === 'boolean') return value ? 'in_stock' : 'out_of_stock';
  if (typeof value === 'number') return value > 0 ? 'in_stock' : 'out_of_stock';

  const raw = typeof value === 'string' ? value.toLowerCase() : '';
  if (!raw) return 'unknown';
  if (/(sin stock|agotado|out of stock|outofstock|no disponible|no stock)/i.test(raw)) return 'out_of_stock';
  if (/(en stock|stock disponible|disponible|available|hay stock|instock)/i.test(raw)) return 'in_stock';
  return 'unknown';
}

export function safeHostname(value?: string | null) {
  try {
    return value ? new URL(value).hostname.toLowerCase().replace(/^www\./, '') : '';
  } catch {
    return '';
  }
}

export function safePathname(value?: string | null) {
  try {
    return value ? new URL(value).pathname.toLowerCase() : '';
  } catch {
    return '';
  }
}

export function slugToLabel(url?: string | null) {
  const pathname = safePathname(url);
  const slug = pathname.split('/').filter(Boolean).pop();
  if (!slug) return null;
  return slug.replace(/[-_]+/g, ' ').trim();
}

export function normalizeSearchText(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

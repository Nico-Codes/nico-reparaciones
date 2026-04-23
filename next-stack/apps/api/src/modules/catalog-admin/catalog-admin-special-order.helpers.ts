export type ParsedSpecialOrderSection = {
  sectionKey: string;
  sectionName: string;
};

export type ParsedSpecialOrderRow = {
  rowId: string;
  sectionKey: string;
  sectionName: string;
  title: string;
  sourceKey: string;
  sourcePriceUsd: number | null;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  lineNumber: number;
  rawLine: string;
};

export type SpecialOrderPreviewStatus =
  | 'new'
  | 'price_update'
  | 'availability_update'
  | 'unchanged'
  | 'missing_deactivate'
  | 'conflict';

export type ExistingSpecialOrderSnapshot = {
  sourcePriceUsd: number | null;
  price: number;
  costPrice: number | null;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  categoryId: string | null;
  supplierId: string | null;
  active: boolean;
  fulfillmentMode: 'INVENTORY' | 'SPECIAL_ORDER';
};

export type NextSpecialOrderSnapshot = {
  sourcePriceUsd: number | null;
  price: number;
  costPrice: number | null;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  categoryId: string | null;
  supplierId: string | null;
};

export function normalizeSpecialOrderText(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSpecialOrderSourceKey(sectionName: string, title: string) {
  return normalizeSpecialOrderText(`${sectionName} ${title}`);
}

export function slugifySpecialOrderLabel(value: string) {
  return normalizeSpecialOrderText(value).replace(/\s+/g, '-');
}

export function parseSpecialOrderUsdAmount(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const normalized = raw.replace(/[^0-9.,]/g, '').trim();
  if (!normalized) return null;
  const numeric = normalized.replace(/,/g, '');
  const parsed = Number(numeric);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function parseSpecialOrderListing(rawText: string) {
  const sections: ParsedSpecialOrderSection[] = [];
  const rows: ParsedSpecialOrderRow[] = [];
  const keyOccurrences = new Map<string, number>();
  const sectionIndex = new Map<string, ParsedSpecialOrderSection>();
  let currentSection: ParsedSpecialOrderSection | null = null;

  rawText.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.replace(/\u00a0/g, ' ').trim();
    if (!line) return;

    const sectionMatch = line.match(/^\*+\s*(.+?)\s*\*+$/);
    if (sectionMatch) {
      const sectionName = cleanSectionLabel(sectionMatch[1] ?? '');
      if (!sectionName) {
        currentSection = null;
        return;
      }
      const sectionKey = slugifySpecialOrderLabel(sectionName);
      const section =
        sectionIndex.get(sectionKey) ??
        (() => {
          const nextSection = { sectionKey, sectionName };
          sectionIndex.set(sectionKey, nextSection);
          sections.push(nextSection);
          return nextSection;
        })();
      currentSection = section;
      return;
    }

    if (!currentSection) return;

    const row = parseProductRow(line, currentSection, index + 1);
    if (!row) return;

    const occurrence = (keyOccurrences.get(row.sourceKey) ?? 0) + 1;
    keyOccurrences.set(row.sourceKey, occurrence);
    rows.push({
      ...row,
      rowId: `${row.sourceKey}::${occurrence}`,
    });
  });

  return { sections, rows };
}

export function resolveSpecialOrderPreviewStatus(
  existing: ExistingSpecialOrderSnapshot | null,
  next: NextSpecialOrderSnapshot,
) : SpecialOrderPreviewStatus {
  if (!existing) return 'new';

  const availabilityChanged =
    existing.supplierAvailability !== next.supplierAvailability ||
    existing.active !== true ||
    existing.fulfillmentMode !== 'SPECIAL_ORDER';

  const priceChanged =
    !sameMoney(existing.sourcePriceUsd, next.sourcePriceUsd) ||
    !sameMoney(existing.price, next.price) ||
    !sameMoney(existing.costPrice, next.costPrice) ||
    existing.categoryId !== next.categoryId ||
    existing.supplierId !== next.supplierId;

  if (priceChanged) return 'price_update';
  if (availabilityChanged) return 'availability_update';
  return 'unchanged';
}

function parseProductRow(
  rawLine: string,
  section: ParsedSpecialOrderSection,
  lineNumber: number,
): Omit<ParsedSpecialOrderRow, 'rowId'> | null {
  const normalized = normalizeSpecialOrderText(rawLine);
  if (!normalized) return null;
  if (
    normalized.includes('difusion pda') ||
    normalized.startsWith('http ') ||
    normalized.startsWith('https ') ||
    normalized.includes('docs google com') ||
    normalized.startsWith('recuerden que') ||
    /^\d{1,2} \d{1,2} \d{2,4}$/.test(normalized)
  ) {
    return null;
  }

  const availability = /sin stock/i.test(rawLine) ? 'OUT_OF_STOCK' : 'IN_STOCK';
  const priceMatch = [...rawLine.matchAll(/\$\s*([0-9][0-9.,]*)/g)].pop();
  const sourcePriceUsd = priceMatch ? parseSpecialOrderUsdAmount(priceMatch[1]) : null;

  if (availability === 'IN_STOCK' && sourcePriceUsd == null) return null;

  const title = rawLine
    .replace(/\$\s*[0-9][0-9.,]*/g, ' ')
    .replace(/\bsin stock\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) return null;

  return {
    sectionKey: section.sectionKey,
    sectionName: section.sectionName,
    title,
    sourceKey: normalizeSpecialOrderSourceKey(section.sectionName, title),
    sourcePriceUsd,
    supplierAvailability: availability,
    lineNumber,
    rawLine,
  };
}

function cleanSectionLabel(raw: string) {
  return raw.replace(/\s+/g, ' ').trim();
}

function sameMoney(left: number | null | undefined, right: number | null | undefined) {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return Math.abs(left - right) < 0.005;
}

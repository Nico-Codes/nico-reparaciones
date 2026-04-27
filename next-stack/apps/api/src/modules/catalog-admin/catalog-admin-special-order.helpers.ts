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

export type ParsedSpecialOrderColorRow = {
  rowId: string;
  rowNumber: number;
  sectionKey: string;
  sectionName: string;
  title: string;
  normalizedTitle: string;
  supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
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
  return normalizeCapacitySpacing(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSpecialOrderProductBaseTitle(title: string) {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();
  const parentheticalMatch = normalizedTitle.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!parentheticalMatch) return normalizedTitle;

  const base = parentheticalMatch[1]?.trim() ?? '';
  const hint = parentheticalMatch[2]?.trim() ?? '';
  if (!base || !looksLikeColorHint(hint)) return normalizedTitle;
  return base;
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

export function parseSpecialOrderColorCsv(rawCsv: string) {
  const extractedLines = extractCsvMeaningfulLines(rawCsv);
  return parseSpecialOrderColorLines(extractedLines);
}

export function parseSpecialOrderColorText(rawText: string) {
  return parseSpecialOrderColorLines(rawText.split(/\r?\n/));
}

export function googleSheetUrlToCsvExportUrl(rawUrl: string) {
  const url = new URL(rawUrl.trim());
  const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/i);
  if (!match?.[1]) {
    throw new Error('La URL de Google Sheets no es valida');
  }
  const gid = url.searchParams.get('gid')?.trim() || '0';
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

export function buildSpecialOrderColorSourceKey(productSourceKey: string, colorLabel: string) {
  return `${productSourceKey}::${normalizeSpecialOrderText(colorLabel)}`;
}

export function extractSpecialOrderColorLabel(input: {
  rowTitle: string;
  normalizedRowTitle: string;
  productTitle: string;
  productSectionName: string;
}) {
  const rawRow = cleanColorRowLabel(input.rowTitle);
  const rawBaseCandidates = [
    input.productTitle.trim(),
    `${input.productSectionName} ${input.productTitle}`.trim(),
  ].filter(Boolean);

  for (const rawBase of rawBaseCandidates) {
    if (startsWithInsensitive(rawRow, rawBase)) {
      const remainder = cleanColorRowLabel(rawRow.slice(rawBase.length));
      if (remainder) return stripTechnicalColorPrefix(remainder);
    }
  }

  const normalizedBaseCandidates = [
    normalizeSpecialOrderText(input.productTitle),
    normalizeSpecialOrderText(`${input.productSectionName} ${input.productTitle}`),
  ].filter(Boolean);

  for (const normalizedBase of normalizedBaseCandidates) {
    if (input.normalizedRowTitle === normalizedBase) continue;
    if (input.normalizedRowTitle.startsWith(`${normalizedBase} `)) {
      const remainder = input.normalizedRowTitle.slice(normalizedBase.length).trim();
      if (remainder) return humanizeNormalizedColorLabel(remainder);
    }
  }

  return null;
}

export function resolveSpecialOrderPreviewStatus(
  existing: ExistingSpecialOrderSnapshot | null,
  next: NextSpecialOrderSnapshot,
): SpecialOrderPreviewStatus {
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
  const baseTitle = normalizeSpecialOrderProductBaseTitle(title);

  return {
    sectionKey: section.sectionKey,
    sectionName: section.sectionName,
    title: baseTitle,
    sourceKey: normalizeSpecialOrderSourceKey(section.sectionName, baseTitle),
    sourcePriceUsd,
    supplierAvailability: availability,
    lineNumber,
    rawLine,
  };
}

function parseSpecialOrderColorLines(rawLines: string[]) {
  const sections: ParsedSpecialOrderSection[] = [];
  const rows: ParsedSpecialOrderColorRow[] = [];
  const sectionIndex = new Map<string, ParsedSpecialOrderSection>();
  let currentSection: ParsedSpecialOrderSection | null = null;

  rawLines.forEach((rawLine, index) => {
    const line = rawLine.replace(/\u00a0/g, ' ').trim();
    if (!line) return;

    if (isIgnorableColorLine(line)) return;

    if (isColorSectionLine(line)) {
      const sectionName = cleanSectionLabel(line);
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

    const row = parseColorRow(line, currentSection, index + 1);
    if (!row) return;
    rows.push(row);
  });

  return { sections, rows };
}

function parseColorRow(rawLine: string, section: ParsedSpecialOrderSection, rowNumber: number): ParsedSpecialOrderColorRow | null {
  const availabilityMatch = rawLine.match(/(?:\s*)(sin\s+stock|stock)\s*$/i);
  if (!availabilityMatch) return null;

  const title = cleanColorRowLabel(rawLine.slice(0, availabilityMatch.index ?? rawLine.length));
  if (!title) return null;

  return {
    rowId: `${section.sectionKey}::${rowNumber}`,
    rowNumber,
    sectionKey: section.sectionKey,
    sectionName: section.sectionName,
    title,
    normalizedTitle: normalizeSpecialOrderText(title),
    supplierAvailability: /sin\s+stock/i.test(availabilityMatch[1] ?? '') ? 'OUT_OF_STOCK' : 'IN_STOCK',
    rawLine,
  };
}

function extractCsvMeaningfulLines(rawCsv: string) {
  return rawCsv
    .split(/\r?\n/)
    .map((line) => parseCsvMeaningfulLine(line))
    .filter((value): value is string => Boolean(value));
}

function parseCsvMeaningfulLine(line: string) {
  if (!line.trim()) return null;
  const commaCells = parseCsvLine(line, ',');
  const semicolonCells = parseCsvLine(line, ';');
  const cells = semicolonCells.length > commaCells.length ? semicolonCells : commaCells;
  const meaningfulCells = cells
    .map((cell) => cell.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean);
  if (meaningfulCells.length === 0) return null;
  return meaningfulCells.join(' ');
}

function parseCsvLine(line: string, delimiter: ',' | ';') {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
        continue;
      }
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function cleanSectionLabel(raw: string) {
  return raw.replace(/\s+/g, ' ').trim();
}

function cleanColorRowLabel(raw: string) {
  return raw
    .replace(/([)\]])([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function isIgnorableColorLine(rawLine: string) {
  const normalized = normalizeSpecialOrderText(rawLine);
  if (!normalized) return true;
  return (
    normalized.startsWith('http ') ||
    normalized.startsWith('https ') ||
    normalized.includes('docs google com') ||
    normalized.includes('ocurrio un error en el navegador') ||
    normalized.includes('exoneracion de responsabilidad') ||
    normalized.includes('as cotacoes nao sao provenientes') ||
    normalized === 'tab' ||
    normalized === 'externos' ||
    normalized === 'celus' ||
    /^\d+$/.test(normalized)
  );
}

function isColorSectionLine(rawLine: string) {
  if (!rawLine) return false;
  if (/(sin\s+stock|stock)\s*$/i.test(rawLine)) return false;
  const letters = rawLine.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, '').trim();
  if (!letters) return false;
  const words = letters.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  if (/\d/.test(rawLine)) return false;
  return rawLine === rawLine.toUpperCase();
}

function startsWithInsensitive(value: string, prefix: string) {
  return value.slice(0, prefix.length).localeCompare(prefix, 'es', { sensitivity: 'accent' }) === 0;
}

function humanizeNormalizedColorLabel(value: string) {
  return stripTechnicalColorPrefix(
    value
      .replace(/\b(\d+)\s+g\b/gi, '$1G')
      .replace(/\b(\d+)\s+t\b/gi, '$1T')
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' '),
  );
}

function sameMoney(left: number | null | undefined, right: number | null | undefined) {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return Math.abs(left - right) < 0.005;
}

function normalizeCapacitySpacing(value: string) {
  return value
    .replace(/(\d+)\s*(gb|tb)\b/gi, '$1 $2')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2');
}

function looksLikeColorHint(value: string) {
  const normalized = normalizeSpecialOrderText(value);
  if (!normalized || /\d/.test(normalized)) return false;

  const segments = value
    .split(/[,/|+]|\s+y\s+|\s+o\s+/i)
    .map((segment) => normalizeSpecialOrderText(segment))
    .filter(Boolean);
  if (segments.length === 0) return false;

  return segments.every((segment) => {
    const tokens = segment.split(/\s+/).filter(Boolean);
    return tokens.length > 0 && tokens.every((token) => COLOR_HINT_TOKENS.has(token));
  });
}

function stripTechnicalColorPrefix(rawValue: string) {
  let value = cleanColorRowLabel(rawValue);
  let previous = '';
  while (value && value !== previous) {
    previous = value;
    value = value
      .replace(/^(?:5\s*g|4\s*g|3\s*g|2\s*g)\b[\s,./-]*/i, '')
      .replace(/^(?:ds|dual\s*sim|dual|sim)\b[\s,./-]*/i, '')
      .trim();
  }
  return value;
}

const COLOR_HINT_TOKENS = new Set([
  'azul',
  'azulado',
  'beige',
  'black',
  'blanca',
  'blanco',
  'blue',
  'cafe',
  'celeste',
  'champagne',
  'claro',
  'coral',
  'crema',
  'dark',
  'dorado',
  'gold',
  'grafito',
  'graphite',
  'gray',
  'green',
  'grey',
  'gris',
  'lila',
  'light',
  'marron',
  'menta',
  'midnight',
  'morado',
  'naranja',
  'natural',
  'negra',
  'negro',
  'oscuro',
  'pink',
  'plata',
  'plateado',
  'purple',
  'red',
  'rojo',
  'rosa',
  'rosado',
  'silver',
  'starlight',
  'teal',
  'titanio',
  'turquesa',
  'verde',
  'violeta',
  'white',
]);

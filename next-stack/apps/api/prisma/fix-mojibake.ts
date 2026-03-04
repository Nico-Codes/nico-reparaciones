import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';

type CliOptions = {
  dryRun: boolean;
  includeProducts: boolean;
};

type ModelSpec = {
  model: string;
  label: string;
  fields: string[];
  enabled?: (options: CliOptions) => boolean;
};

type ModelStats = {
  scanned: number;
  changed: number;
  fieldsChanged: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(apiRoot, '..', '..');
const envCandidates = [path.join(apiRoot, '.env'), path.join(monorepoRoot, '.env')];

const suspiciousPattern = /Ã|Â|â|�|Ð|Ñ/u;
const invalidControlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u;

function loadEnvFiles() {
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      loadEnv({ path: envPath, override: false });
    }
  }
}

function parseOptions(argv: string[]): CliOptions {
  const flags = new Set(argv.map((a) => a.trim().toLowerCase()).filter(Boolean));
  const dryRun = !flags.has('--apply');
  return {
    dryRun,
    includeProducts: flags.has('--include-products'),
  };
}

function suspiciousScore(value: string): number {
  const suspicious =
    (value.match(/Ã/g) ?? []).length * 3 +
    (value.match(/Â/g) ?? []).length * 3 +
    (value.match(/â/g) ?? []).length * 2 +
    (value.match(/�/g) ?? []).length * 5 +
    (value.match(/Ð/g) ?? []).length * 2 +
    (value.match(/Ñ/g) ?? []).length * 2;
  const spanishGood = (value.match(/[áéíóúÁÉÍÓÚñÑ¿¡]/g) ?? []).length;
  return suspicious - spanishGood;
}

function maybeFixMojibake(input: string): string {
  if (!suspiciousPattern.test(input)) return input;

  let current = input;
  let currentScore = suspiciousScore(current);

  for (let i = 0; i < 3; i += 1) {
    const candidate = Buffer.from(current, 'latin1').toString('utf8');
    if (!candidate || candidate === current) break;
    if (invalidControlChars.test(candidate)) break;

    const candidateScore = suspiciousScore(candidate);
    if (candidateScore < currentScore) {
      current = candidate;
      currentScore = candidateScore;
      continue;
    }
    break;
  }

  return current;
}

async function processModel(
  prisma: PrismaClient,
  spec: ModelSpec,
  options: CliOptions,
): Promise<ModelStats> {
  if (spec.enabled && !spec.enabled(options)) {
    return { scanned: 0, changed: 0, fieldsChanged: 0 };
  }

  const delegate = (prisma as Record<string, any>)[spec.model];
  if (!delegate?.findMany || !delegate?.update) {
    throw new Error(`Modelo no soportado: ${spec.model}`);
  }

  const select: Record<string, boolean> = { id: true };
  for (const field of spec.fields) select[field] = true;

  const rows = (await delegate.findMany({ select })) as Array<Record<string, unknown>>;
  let changed = 0;
  let fieldsChanged = 0;

  for (const row of rows) {
    const patch: Record<string, string | null> = {};

    for (const field of spec.fields) {
      const current = row[field];
      if (typeof current !== 'string') continue;
      const fixed = maybeFixMojibake(current);
      if (fixed !== current) {
        patch[field] = fixed;
        fieldsChanged += 1;
      }
    }

    if (!Object.keys(patch).length) continue;
    changed += 1;

    if (!options.dryRun) {
      await delegate.update({
        where: { id: row.id },
        data: patch,
      });
    }
  }

  return {
    scanned: rows.length,
    changed,
    fieldsChanged,
  };
}

async function main() {
  loadEnvFiles();
  const options = parseOptions(process.argv.slice(2));
  const prisma = new PrismaClient();

  const specs: ModelSpec[] = [
    { model: 'appSetting', label: 'AppSetting', fields: ['value', 'label'] },
    { model: 'helpFaqItem', label: 'HelpFaqItem', fields: ['question', 'answer', 'category'] },
    { model: 'deviceType', label: 'DeviceType', fields: ['name'] },
    { model: 'deviceBrand', label: 'DeviceBrand', fields: ['name'] },
    { model: 'deviceModel', label: 'DeviceModel', fields: ['name'] },
    { model: 'deviceIssueType', label: 'DeviceIssueType', fields: ['name'] },
    { model: 'deviceModelGroup', label: 'DeviceModelGroup', fields: ['name'] },
    {
      model: 'repairPricingRule',
      label: 'RepairPricingRule',
      fields: ['name', 'deviceBrand', 'deviceModel', 'issueLabel', 'notes'],
    },
    { model: 'supplier', label: 'Supplier', fields: ['name', 'notes'] },
    { model: 'warrantyIncident', label: 'WarrantyIncident', fields: ['title', 'reason', 'notes'] },
    {
      model: 'product',
      label: 'Product',
      fields: ['name', 'description'],
      enabled: (opts) => opts.includeProducts,
    },
  ];

  const summary: Record<string, ModelStats> = {};
  let totalScanned = 0;
  let totalChanged = 0;
  let totalFieldsChanged = 0;

  try {
    await prisma.$connect();
    console.log(
      `[mojibake] mode=${options.dryRun ? 'dry-run' : 'apply'} includeProducts=${options.includeProducts}`,
    );

    for (const spec of specs) {
      const stats = await processModel(prisma, spec, options);
      summary[spec.label] = stats;
      totalScanned += stats.scanned;
      totalChanged += stats.changed;
      totalFieldsChanged += stats.fieldsChanged;
      console.log(
        `[mojibake] ${spec.label}: scanned=${stats.scanned} changed=${stats.changed} fields=${stats.fieldsChanged}`,
      );
    }

    console.log(
      `[mojibake] done scanned=${totalScanned} rowsChanged=${totalChanged} fieldsChanged=${totalFieldsChanged}`,
    );
    if (options.dryRun && totalChanged > 0) {
      console.log('[mojibake] run again with --apply to persist changes');
    }
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error('[mojibake] ERROR', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

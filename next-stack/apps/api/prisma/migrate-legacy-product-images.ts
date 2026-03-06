import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { loadCanonicalEnv, resolveCanonicalEnvPaths } from '../src/load-canonical-env.js';

type CliOptions = {
  dryRun: boolean;
  cleanupLegacy: boolean;
};

type MigrationSummary = {
  scanned: number;
  updated: number;
  skipped: number;
  copied: number;
  copyMissing: number;
  copySkipped: number;
  legacyCleared: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const nextStackRoot = path.resolve(apiRoot, '..', '..');
const repoRoot = path.resolve(nextStackRoot, '..');

const envCandidates = resolveCanonicalEnvPaths();
const targetStorageRoot = path.join(nextStackRoot, 'apps', 'web', 'public', 'storage');
const sourceStorageCandidates = [
  path.join(repoRoot, 'storage', 'app', 'public'),
  path.join(repoRoot, 'public', 'storage'),
  targetStorageRoot,
];

function parseOptions(argv: string[]): CliOptions {
  const flags = new Set(argv.map((v) => v.trim().toLowerCase()).filter(Boolean));
  return {
    dryRun: flags.has('--dry-run'),
    cleanupLegacy: flags.has('--cleanup-legacy'),
  };
}

function loadEnvFiles() {
  loadCanonicalEnv();
}

function cleanNullable(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function normalizeImagePath(rawValue?: string | null) {
  const raw = cleanNullable(rawValue);
  if (!raw) return null;
  if (isHttpUrl(raw)) return raw;

  let normalized = raw.replace(/\\/g, '/').trim();
  if (normalized.startsWith('/')) normalized = normalized.replace(/^\/+/, '');
  if (normalized.startsWith('storage/')) normalized = normalized.slice('storage/'.length);
  if (!normalized.includes('/')) normalized = `products/${normalized}`;

  normalized = path.posix.normalize(normalized).replace(/^\/+/, '');
  if (!normalized || normalized.startsWith('..') || normalized.includes('../')) return null;
  return normalized;
}

function toAbsolute(root: string, relativePath: string) {
  return path.join(root, ...relativePath.split('/'));
}

class LegacyProductImageMigrator {
  private readonly summary: MigrationSummary = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    copied: 0,
    copyMissing: 0,
    copySkipped: 0,
    legacyCleared: 0,
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: CliOptions,
    private readonly sourceRoots: string[],
  ) {}

  async run() {
    if (!this.options.dryRun) {
      await mkdir(targetStorageRoot, { recursive: true });
    }

    const products = await this.prisma.product.findMany({
      select: { id: true, imageLegacy: true, imagePath: true },
      orderBy: { createdAt: 'asc' },
    });
    this.summary.scanned = products.length;

    for (const product of products) {
      const currentImagePath = normalizeImagePath(product.imagePath);
      const legacyImagePath = normalizeImagePath(product.imageLegacy);
      const resolvedImagePath = currentImagePath ?? legacyImagePath;

      if (resolvedImagePath && !isHttpUrl(resolvedImagePath)) {
        await this.copyImageIfNeeded(resolvedImagePath);
      }

      const updateData: { imagePath?: string | null; imageLegacy?: string | null } = {};
      const normalizedCurrentRaw = cleanNullable(product.imagePath);
      const normalizedResolvedRaw = cleanNullable(resolvedImagePath);
      if (normalizedResolvedRaw !== normalizedCurrentRaw) {
        updateData.imagePath = normalizedResolvedRaw;
      }
      if (this.options.cleanupLegacy && product.imageLegacy != null) {
        updateData.imageLegacy = null;
      }

      if (Object.keys(updateData).length === 0) {
        this.summary.skipped += 1;
        continue;
      }

      if (!this.options.dryRun) {
        await this.prisma.product.update({
          where: { id: product.id },
          data: updateData,
        });
      }
      if (updateData.imageLegacy === null) this.summary.legacyCleared += 1;
      this.summary.updated += 1;
    }

    this.printSummary();
  }

  private async copyImageIfNeeded(relativePath: string) {
    const source = this.findSourceFile(relativePath);
    if (!source) {
      this.summary.copyMissing += 1;
      return;
    }

    const target = toAbsolute(targetStorageRoot, relativePath);
    if (path.resolve(source) === path.resolve(target)) {
      this.summary.copySkipped += 1;
      return;
    }

    if (!this.options.dryRun) {
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
    this.summary.copied += 1;
  }

  private findSourceFile(relativePath: string): string | null {
    for (const root of this.sourceRoots) {
      const absolute = toAbsolute(root, relativePath);
      if (fs.existsSync(absolute)) return absolute;
    }
    return null;
  }

  private printSummary() {
    console.log('[products:image:migrate] summary', {
      ...this.summary,
      dryRun: this.options.dryRun,
      cleanupLegacy: this.options.cleanupLegacy,
      sourceRoots: this.sourceRoots,
      targetStorageRoot,
    });
  }
}

async function main() {
  loadEnvFiles();
  const options = parseOptions(process.argv.slice(2));
  const sourceRoots = sourceStorageCandidates.filter((candidate) => fs.existsSync(candidate));
  if (sourceRoots.length === 0) {
    throw new Error(`No source storage roots found. Candidates: ${sourceStorageCandidates.join(', ')}`);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const migrator = new LegacyProductImageMigrator(prisma, options, sourceRoots);
    await migrator.run();
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error(
    '[products:image:migrate] ERROR',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

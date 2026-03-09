import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { copyFile, cp, mkdir, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { loadCanonicalEnv } from '../../../apps/api/src/load-canonical-env.js';
import { CANONICAL_PUBLIC_ROOT } from '../../assets/sync-canonical-assets-to-legacy-root.mjs';

// Transitional legacy-support script. Keep isolated from the runtime API code.
console.warn('[legacy:migrate:visual-assets:deprecated] Script archivado. Usar solo como rescate manual.');

type CliOptions = {
  dryRun: boolean;
};

type SettingUpsert = {
  key: string;
  value: string;
  group: string;
  label: string;
  type: string;
};

type MigrationSummary = {
  sourceCandidates: string[];
  targetPublic: string;
  filesCopied: number;
  filesSkipped: number;
  settingsUpserted: number;
  settingsSkipped: number;
  dryRun: boolean;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nextStackRoot = path.resolve(__dirname, '..', '..', '..');
const repoRoot = path.resolve(nextStackRoot, '..');
const targetWebPublic = path.join(nextStackRoot, 'apps', 'web', 'public');
const sourcePublicCandidates = [CANONICAL_PUBLIC_ROOT, path.join(repoRoot, 'public')];

const ROOT_FILES = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'site.webmanifest',
] as const;

const COPY_DIRS = ['brand', 'icons', 'img', 'brand-assets'] as const;

function parseOptions(argv: string[]): CliOptions {
  const flags = new Set(argv.map((v) => v.trim().toLowerCase()).filter(Boolean));
  return {
    dryRun: flags.has('--dry-run'),
  };
}

function loadEnvFiles() {
  loadCanonicalEnv();
}

function exists(p: string) {
  return fs.existsSync(p);
}

function cleanNullable(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

function relativePosix(from: string, absolutePath: string) {
  return path.relative(from, absolutePath).replace(/\\/g, '/');
}

function isImageOrIconFile(name: string) {
  const lower = name.toLowerCase();
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.ico')
  );
}

async function pickLatestFileByPrefix(dir: string, prefix: string): Promise<string | null> {
  if (!exists(dir)) return null;
  const entries = await readdir(dir, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.toLowerCase().startsWith(prefix.toLowerCase()))
    .filter((name) => isImageOrIconFile(name));

  if (candidates.length === 0) return null;

  const withMtime = await Promise.all(
    candidates.map(async (name) => {
      const full = path.join(dir, name);
      const s = await stat(full);
      return { name, mtime: s.mtimeMs };
    }),
  );
  withMtime.sort((a, b) => b.mtime - a.mtime || a.name.localeCompare(b.name));
  return withMtime[0]?.name ?? null;
}

class LegacyVisualAssetsMigrator {
  private readonly summary: MigrationSummary = {
    sourceCandidates: sourcePublicCandidates,
    targetPublic: targetWebPublic,
    filesCopied: 0,
    filesSkipped: 0,
    settingsUpserted: 0,
    settingsSkipped: 0,
    dryRun: false,
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: CliOptions,
  ) {
    this.summary.dryRun = options.dryRun;
  }

  async run() {
    await this.ensureDir(targetWebPublic);
    await this.copyVisualFiles();
    const settings = await this.buildSettingsUpserts(targetWebPublic);
    await this.applySettings(settings);
    await this.ensureBusinessNameSetting();
    this.printSummary();
  }

  private async ensureDir(dir: string) {
    if (this.options.dryRun) return;
    await mkdir(dir, { recursive: true });
  }

  private resolveExistingSource(relativePath: string) {
    for (const candidateRoot of sourcePublicCandidates) {
      const candidatePath = path.join(candidateRoot, ...relativePath.split('/'));
      if (exists(candidatePath)) return candidatePath;
    }
    return null;
  }

  private async copyVisualFiles() {
    for (const dirName of COPY_DIRS) {
      const sourceDir = this.resolveExistingSource(dirName);
      const targetDir = path.join(targetWebPublic, dirName);
      if (!sourceDir) {
        this.summary.filesSkipped += 1;
        continue;
      }
      if (path.resolve(sourceDir) === path.resolve(targetDir)) {
        this.summary.filesSkipped += 1;
        continue;
      }
      if (!this.options.dryRun) {
        await mkdir(path.dirname(targetDir), { recursive: true });
        await cp(sourceDir, targetDir, { recursive: true, force: true, errorOnExist: false });
      }
      this.summary.filesCopied += 1;
      console.log(`[visual:migrate] ${this.options.dryRun ? 'would copy' : 'copied'} dir`, {
        from: sourceDir,
        to: targetDir,
      });
    }

    for (const fileName of ROOT_FILES) {
      const sourceFile = this.resolveExistingSource(fileName);
      const targetFile = path.join(targetWebPublic, fileName);
      if (!sourceFile) {
        this.summary.filesSkipped += 1;
        continue;
      }
      if (path.resolve(sourceFile) === path.resolve(targetFile)) {
        this.summary.filesSkipped += 1;
        continue;
      }
      if (!this.options.dryRun) {
        await mkdir(path.dirname(targetFile), { recursive: true });
        await copyFile(sourceFile, targetFile);
      }
      this.summary.filesCopied += 1;
      console.log(`[visual:migrate] ${this.options.dryRun ? 'would copy' : 'copied'} file`, {
        from: sourceFile,
        to: targetFile,
      });
    }
  }

  private async buildSettingsUpserts(webPublicDir: string): Promise<SettingUpsert[]> {
    const upserts: SettingUpsert[] = [];

    const assetSettings: Array<{
      filePath: string;
      key: string;
      group: string;
      label: string;
      type: string;
    }> = [
      {
        filePath: 'favicon.ico',
        key: 'brand_asset.favicon_ico.path',
        group: 'branding_assets',
        label: 'Favicon ICO',
        type: 'text',
      },
      {
        filePath: 'favicon-16x16.png',
        key: 'brand_asset.favicon_16.path',
        group: 'branding_assets',
        label: 'Favicon 16x16',
        type: 'text',
      },
      {
        filePath: 'favicon-32x32.png',
        key: 'brand_asset.favicon_32.path',
        group: 'branding_assets',
        label: 'Favicon 32x32',
        type: 'text',
      },
      {
        filePath: 'android-chrome-192x192.png',
        key: 'brand_asset.android_192.path',
        group: 'branding_assets',
        label: 'Icon Android 192',
        type: 'text',
      },
      {
        filePath: 'android-chrome-512x512.png',
        key: 'brand_asset.android_512.path',
        group: 'branding_assets',
        label: 'Icon Android 512',
        type: 'text',
      },
      {
        filePath: 'apple-touch-icon.png',
        key: 'brand_asset.apple_touch.path',
        group: 'branding_assets',
        label: 'Apple touch icon',
        type: 'text',
      },
      {
        filePath: 'brand/logo.png',
        key: 'brand_asset.logo_principal.path',
        group: 'branding_assets',
        label: 'Logo principal',
        type: 'text',
      },
      {
        filePath: 'icons/settings.svg',
        key: 'brand_asset.icon_settings.path',
        group: 'branding_assets',
        label: 'Icon settings',
        type: 'text',
      },
      {
        filePath: 'icons/carrito.svg',
        key: 'brand_asset.icon_carrito.path',
        group: 'branding_assets',
        label: 'Icon carrito',
        type: 'text',
      },
      {
        filePath: 'icons/logout.svg',
        key: 'brand_asset.icon_logout.path',
        group: 'branding_assets',
        label: 'Icon logout',
        type: 'text',
      },
      {
        filePath: 'icons/consultar-reparacion.svg',
        key: 'brand_asset.icon_consultar_reparacion.path',
        group: 'branding_assets',
        label: 'Icon consultar reparacion',
        type: 'text',
      },
      {
        filePath: 'icons/mis-pedidos.svg',
        key: 'brand_asset.icon_mis_pedidos.path',
        group: 'branding_assets',
        label: 'Icon mis pedidos',
        type: 'text',
      },
      {
        filePath: 'icons/mis-reparaciones.svg',
        key: 'brand_asset.icon_mis_reparaciones.path',
        group: 'branding_assets',
        label: 'Icon mis reparaciones',
        type: 'text',
      },
      {
        filePath: 'icons/dashboard.svg',
        key: 'brand_asset.icon_dashboard.path',
        group: 'branding_assets',
        label: 'Icon dashboard',
        type: 'text',
      },
      {
        filePath: 'icons/tienda.svg',
        key: 'brand_asset.icon_tienda.path',
        group: 'branding_assets',
        label: 'Icon tienda',
        type: 'text',
      },
    ];

    for (const spec of assetSettings) {
      const full = path.join(webPublicDir, ...spec.filePath.split('/'));
      if (!exists(full)) {
        this.summary.settingsSkipped += 1;
        continue;
      }
      upserts.push({
        key: spec.key,
        value: spec.filePath,
        group: spec.group,
        label: spec.label,
        type: spec.type,
      });
    }

    const brandAssetsDir = path.join(webPublicDir, 'brand-assets');
    const desktopHeroName = await pickLatestFileByPrefix(brandAssetsDir, 'store_home_hero_desktop');
    const mobileHeroName = await pickLatestFileByPrefix(brandAssetsDir, 'store_home_hero_mobile');

    if (desktopHeroName) {
      upserts.push({
        key: 'store_hero_image_desktop',
        value: relativePosix(webPublicDir, path.join(brandAssetsDir, desktopHeroName)),
        group: 'branding',
        label: 'Imagen portada tienda (desktop)',
        type: 'text',
      });
    }
    if (mobileHeroName) {
      upserts.push({
        key: 'store_hero_image_mobile',
        value: relativePosix(webPublicDir, path.join(brandAssetsDir, mobileHeroName)),
        group: 'branding',
        label: 'Imagen portada tienda (mobile)',
        type: 'text',
      });
    }
    if (!desktopHeroName) this.summary.settingsSkipped += 1;
    if (!mobileHeroName) this.summary.settingsSkipped += 1;

    return upserts;
  }

  private async applySettings(items: SettingUpsert[]) {
    for (const item of items) {
      if (!this.options.dryRun) {
        await this.prisma.appSetting.upsert({
          where: { key: item.key },
          create: {
            key: item.key,
            value: item.value,
            group: item.group,
            label: item.label,
            type: item.type,
          },
          update: {
            value: item.value,
            group: item.group,
            label: item.label,
            type: item.type,
          },
        });
      }
      this.summary.settingsUpserted += 1;
    }
  }

  private async ensureBusinessNameSetting() {
    const existingBusiness = await this.prisma.appSetting.findUnique({
      where: { key: 'business_name' },
      select: { value: true },
    });
    const existingShop = await this.prisma.appSetting.findUnique({
      where: { key: 'shop_name' },
      select: { value: true },
    });

    const resolvedName =
      cleanNullable(existingBusiness?.value) ??
      cleanNullable(existingShop?.value) ??
      cleanNullable(process.env.APP_NAME) ??
      'NicoReparaciones';

    if (!this.options.dryRun) {
      await this.prisma.appSetting.upsert({
        where: { key: 'business_name' },
        create: {
          key: 'business_name',
          value: resolvedName,
          group: 'business',
          label: 'Nombre del negocio',
          type: 'text',
        },
        update: {
          value: resolvedName,
          group: 'business',
          label: 'Nombre del negocio',
          type: 'text',
        },
      });
    }
    this.summary.settingsUpserted += 1;
  }

  private printSummary() {
    console.log('[visual:migrate] summary', this.summary);
  }
}

async function main() {
  loadEnvFiles();
  const options = parseOptions(process.argv.slice(2));
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const migrator = new LegacyVisualAssetsMigrator(prisma, options);
    await migrator.run();
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error('[visual:migrate] ERROR', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

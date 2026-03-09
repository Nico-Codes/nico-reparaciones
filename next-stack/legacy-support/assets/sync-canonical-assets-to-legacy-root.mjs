import { copyFile, cp, mkdir } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEGACY_SUPPORT_ROOT = path.resolve(__dirname, '..');
const NEXT_STACK_ROOT = path.resolve(LEGACY_SUPPORT_ROOT, '..');
const REPO_ROOT = path.resolve(NEXT_STACK_ROOT, '..');
const CANONICAL_PUBLIC_ROOT = path.join(NEXT_STACK_ROOT, 'apps', 'web', 'public');
const LEGACY_PUBLIC_ROOT = path.join(REPO_ROOT, 'public');

const ROOT_FILES = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'apple-touch-icon.png',
  'site.webmanifest',
];

const COPY_DIRS = ['brand', 'icons', 'img', 'brand-assets'];

function parseOptions(argv) {
  const flags = new Set(argv.map((value) => value.trim().toLowerCase()).filter(Boolean));
  return {
    dryRun: flags.has('--dry-run'),
  };
}

function exists(absolutePath) {
  return fs.existsSync(absolutePath);
}

async function syncCanonicalAssetsToLegacyRoot(options = { dryRun: false }) {
  const summary = {
    canonicalPublicRoot: CANONICAL_PUBLIC_ROOT,
    legacyPublicRoot: LEGACY_PUBLIC_ROOT,
    copiedDirs: 0,
    copiedFiles: 0,
    skippedMissing: 0,
    dryRun: options.dryRun,
  };

  for (const dirName of COPY_DIRS) {
    const sourceDir = path.join(CANONICAL_PUBLIC_ROOT, dirName);
    const targetDir = path.join(LEGACY_PUBLIC_ROOT, dirName);

    if (!exists(sourceDir)) {
      summary.skippedMissing += 1;
      continue;
    }

    if (!options.dryRun) {
      await mkdir(path.dirname(targetDir), { recursive: true });
      await cp(sourceDir, targetDir, { recursive: true, force: true, errorOnExist: false });
    }
    summary.copiedDirs += 1;
  }

  for (const fileName of ROOT_FILES) {
    const sourceFile = path.join(CANONICAL_PUBLIC_ROOT, fileName);
    const targetFile = path.join(LEGACY_PUBLIC_ROOT, fileName);

    if (!exists(sourceFile)) {
      summary.skippedMissing += 1;
      continue;
    }

    if (!options.dryRun) {
      await mkdir(path.dirname(targetFile), { recursive: true });
      await copyFile(sourceFile, targetFile);
    }
    summary.copiedFiles += 1;
  }

  return summary;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const summary = await syncCanonicalAssetsToLegacyRoot(options);
  console.log('[legacy:assets:sync] summary', summary);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  main().catch((error) => {
    console.error(
      '[legacy:assets:sync] ERROR',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  });
}

export { CANONICAL_PUBLIC_ROOT, LEGACY_PUBLIC_ROOT, syncCanonicalAssetsToLegacyRoot };

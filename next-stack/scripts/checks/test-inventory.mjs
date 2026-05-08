import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const REQUIRED_NPM_SCRIPTS = [
  'env:check',
  'deploy:check',
  'db:backup:check',
  'typecheck',
  'test',
  'build',
  'smoke:backend',
  'smoke:web',
  'qa:backend:full',
  'qa:frontend:e2e',
  'qa:admin:visual',
  'qa:route-parity',
  'qa:performance',
  'qa:responsive:visual',
];

const REQUIRED_SCRIPT_FILES = [
  'scripts/checks/env-check.mjs',
  'scripts/checks/deploy-check.mjs',
  'scripts/checks/db-backup-check.mjs',
  'scripts/smoke/smoke-backend.mjs',
  'scripts/smoke/smoke-web.mjs',
  'scripts/qa/qa-backend-full.mjs',
  'scripts/qa/qa-frontend-e2e.mjs',
  'scripts/qa/qa-admin-visual-audit.mjs',
  'scripts/qa/qa-route-parity.mjs',
  'scripts/qa/qa-performance.mjs',
  'scripts/qa/qa-responsive-visual.mjs',
];

const REQUIRED_TEST_FILES = [
  {
    label: 'API auth',
    path: 'apps/api/src/modules/auth/auth.service.test.ts',
  },
  {
    label: 'API health',
    path: 'apps/api/src/modules/health/health.controller.test.ts',
  },
  {
    label: 'API help',
    path: 'apps/api/src/modules/help/help.service.test.ts',
  },
  {
    label: 'API mail',
    path: 'apps/api/src/modules/mail/mail.service.test.ts',
  },
  {
    label: 'API cart quote',
    path: 'apps/api/src/modules/cart/cart.controller.test.ts',
  },
  {
    label: 'API store',
    path: 'apps/api/src/modules/store/store.service.test.ts',
  },
  {
    label: 'API orders',
    path: 'apps/api/src/modules/orders/orders.helpers.test.ts',
  },
  {
    label: 'API repairs',
    path: 'apps/api/src/modules/repairs/repairs.helpers.test.ts',
  },
  {
    label: 'API provider parsers',
    path: 'apps/api/src/modules/admin/admin-provider-search.parsers.test.ts',
  },
  {
    label: 'API pricing',
    path: 'apps/api/src/modules/pricing/pricing.service.test.ts',
  },
  {
    label: 'API prisma lifecycle',
    path: 'apps/api/src/modules/prisma/prisma.service.test.ts',
  },
  {
    label: 'API special-order importer',
    path: 'apps/api/src/modules/catalog-admin/catalog-admin-special-order.helpers.test.ts',
  },
  {
    label: 'API SEO',
    path: 'apps/api/src/modules/seo/seo.helpers.test.ts',
  },
  {
    label: 'API telemetry',
    path: 'apps/api/src/modules/telemetry/telemetry.controller.test.ts',
  },
  {
    label: 'API WhatsApp',
    path: 'apps/api/src/modules/whatsapp/whatsapp.service.test.ts',
  },
  {
    label: 'WEB store listing',
    path: 'apps/web/src/features/store/store-page.helpers.test.ts',
  },
  {
    label: 'WEB product detail',
    path: 'apps/web/src/features/store/store-product-detail.helpers.test.ts',
  },
  {
    label: 'WEB cart',
    path: 'apps/web/src/features/cart/cart.helpers.test.ts',
  },
  {
    label: 'WEB checkout',
    path: 'apps/web/src/features/orders/checkout.helpers.test.ts',
  },
  {
    label: 'WEB special-order reservation',
    path: 'apps/web/src/features/orders/order-reservation.helpers.test.ts',
  },
  {
    label: 'WEB visual identity',
    path: 'apps/web/src/features/admin/admin-visual-identity.helpers.test.ts',
  },
  {
    label: 'WEB app shell',
    path: 'apps/web/src/layouts/app-shell/helpers.test.ts',
  },
  {
    label: 'WEB device catalog',
    path: 'apps/web/src/features/deviceCatalog/device-catalog.helpers.test.ts',
  },
  {
    label: 'WEB help',
    path: 'apps/web/src/features/help/help.helpers.test.ts',
  },
];

const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx)$/;
const QA_FILE_RE = /\.(mjs|js|ts)$/;

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

async function exists(filePath) {
  try {
    await stat(path.join(ROOT, filePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dirPath, predicate, acc = []) {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, predicate, acc);
    } else if (predicate(fullPath)) {
      acc.push(fullPath);
    }
  }

  return acc;
}

async function readPackageScripts() {
  const raw = await readFile(path.join(ROOT, 'package.json'), 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.scripts && typeof parsed.scripts === 'object' ? parsed.scripts : {};
}

async function listDirectories(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

function countByArea(files, areaRoot, areas) {
  const normalizedFiles = files.map((file) => toPosix(path.relative(ROOT, file)));
  return areas.map((area) => {
    const prefix = `${areaRoot}/${area}/`;
    const count = normalizedFiles.filter((file) => file.startsWith(prefix)).length;
    return { area, count };
  });
}

function printAreaCoverage(title, rows) {
  console.log(`\n[test-inventory] ${title}`);
  for (const row of rows) {
    const marker = row.count > 0 ? 'OK' : 'WARN';
    console.log(`  ${marker.padEnd(4)} ${row.area.padEnd(18)} ${row.count} test file(s)`);
  }
}

async function main() {
  const errors = [];
  const warnings = [];
  const scripts = await readPackageScripts();

  for (const scriptName of REQUIRED_NPM_SCRIPTS) {
    if (!scripts[scriptName]) errors.push(`Missing package script: ${scriptName}`);
  }

  for (const scriptFile of REQUIRED_SCRIPT_FILES) {
    if (!(await exists(scriptFile))) errors.push(`Missing QA script file: ${scriptFile}`);
  }

  for (const testFile of REQUIRED_TEST_FILES) {
    if (!(await exists(testFile.path))) errors.push(`Missing critical test: ${testFile.label} (${testFile.path})`);
  }

  const apiTests = await collectFiles(path.join(ROOT, 'apps/api/src'), (file) => TEST_FILE_RE.test(file));
  const webTests = await collectFiles(path.join(ROOT, 'apps/web/src'), (file) => TEST_FILE_RE.test(file));
  const qaScripts = await collectFiles(path.join(ROOT, 'scripts'), (file) => QA_FILE_RE.test(file));

  if (apiTests.length < 15) errors.push(`API test suite unexpectedly small: ${apiTests.length} files`);
  if (webTests.length < 40) errors.push(`WEB test suite unexpectedly small: ${webTests.length} files`);
  if (qaScripts.length < 12) errors.push(`QA/check script suite unexpectedly small: ${qaScripts.length} files`);

  const apiModules = await listDirectories(path.join(ROOT, 'apps/api/src/modules'));
  const webFeatures = await listDirectories(path.join(ROOT, 'apps/web/src/features'));
  const apiCoverage = countByArea(apiTests, 'apps/api/src/modules', apiModules);
  const webCoverage = countByArea(webTests, 'apps/web/src/features', webFeatures);
  const uncoveredApi = apiCoverage.filter((row) => row.count === 0).map((row) => row.area);
  const uncoveredWeb = webCoverage.filter((row) => row.count === 0).map((row) => row.area);

  if (uncoveredApi.length > 0) {
    warnings.push(`API modules without direct unit tests: ${uncoveredApi.join(', ')}`);
  }
  if (uncoveredWeb.length > 0) {
    warnings.push(`WEB features without direct unit tests: ${uncoveredWeb.join(', ')}`);
  }

  console.log('[test-inventory] Summary');
  console.log(`  API test files: ${apiTests.length}`);
  console.log(`  WEB test files: ${webTests.length}`);
  console.log(`  QA/check scripts: ${qaScripts.length}`);
  console.log(`  Required npm scripts: ${REQUIRED_NPM_SCRIPTS.length}`);
  console.log(`  Required critical tests: ${REQUIRED_TEST_FILES.length}`);

  printAreaCoverage('API module direct test coverage', apiCoverage);
  printAreaCoverage('WEB feature direct test coverage', webCoverage);

  if (warnings.length > 0) {
    console.log('\n[test-inventory] Warnings');
    for (const warning of warnings) console.log(`  WARN ${warning}`);
  }

  if (errors.length > 0) {
    console.error('\n[test-inventory] FAIL');
    for (const error of errors) console.error(`  ERROR ${error}`);
    process.exit(1);
  }

  console.log('\n[test-inventory] OK');
}

main().catch((err) => {
  console.error('[test-inventory] ERROR', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

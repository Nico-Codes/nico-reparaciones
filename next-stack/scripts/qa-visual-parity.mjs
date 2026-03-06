import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const REPO_ROOT = resolve(ROOT, '..');
const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://127.0.0.1:8000';
const NEXT_BASE_URL = process.env.NEXT_BASE_URL || 'http://127.0.0.1:4174';
const API_HEALTH_URL = process.env.API_HEALTH_URL || 'http://127.0.0.1:3001/api/health';
const LEGACY_HEALTH_URL = process.env.LEGACY_HEALTH_URL || `${LEGACY_BASE_URL}/login`;
const START_LEGACY = process.env.VISUAL_PARITY_START_LEGACY !== '0';
const REQUEST_TIMEOUT_MS = Number(process.env.VISUAL_PARITY_REQUEST_TIMEOUT_MS || 15000);
const QA_THROTTLE_LIMIT = process.env.QA_THROTTLE_LIMIT || process.env.THROTTLE_LIMIT || '1000';
const LEGACY_PARITY_DB_MODE = (process.env.LEGACY_PARITY_DB_MODE || 'auto').trim().toLowerCase();
const LEGACY_SQLITE_DB = process.env.LEGACY_SQLITE_DB || resolve(REPO_ROOT, 'database', 'legacy-visual-parity.sqlite');
const MOJIBAKE_PATTERN = /\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]{1,2}|\uFFFD/u;

const ROUTES = [
  { key: 'store', legacyPath: '/tienda', nextPath: '/store' },
  { key: 'help', legacyPath: '/ayuda', nextPath: '/help' },
  { key: 'cart', legacyPath: '/carrito', nextPath: '/cart' },
  { key: 'login', legacyPath: '/login', nextPath: '/auth/login' },
  { key: 'register', legacyPath: '/registro', nextPath: '/auth/register' },
  { key: 'forgot-password', legacyPath: '/olvide-contrasena', nextPath: '/auth/forgot-password' },
  { key: 'repair-lookup', legacyPath: '/reparacion', nextPath: '/reparacion' },
];

function run(command, args, opts = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
      ...opts,
    });
    child.on('exit', (code) =>
      code === 0 ? resolvePromise() : rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code}`)),
    );
  });
}

function start(command, args, opts = {}) {
  return spawn(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
}

async function runNpm(args, opts = {}) {
  if (process.platform === 'win32') {
    await run('cmd', ['/c', 'npm', ...args], opts);
    return;
  }
  await run('npm', args, opts);
}

function startNpm(args, opts = {}) {
  if (process.platform === 'win32') {
    return start('cmd', ['/c', 'npm', ...args], opts);
  }
  return start('npm', args, opts);
}

function startLegacyServer(legacyEnv = process.env) {
  if (process.platform === 'win32') {
    return start('cmd', ['/c', 'php', 'artisan', 'serve', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: REPO_ROOT,
      env: legacyEnv,
    });
  }
  return start('php', ['artisan', 'serve', '--host', '127.0.0.1', '--port', '8000'], { cwd: REPO_ROOT, env: legacyEnv });
}

async function runLegacyArtisan(args, legacyEnv = process.env) {
  if (process.platform === 'win32') {
    await run('cmd', ['/c', 'php', 'artisan', ...args], { cwd: REPO_ROOT, env: legacyEnv });
    return;
  }
  await run('php', ['artisan', ...args], { cwd: REPO_ROOT, env: legacyEnv });
}

function buildLegacySqliteEnv() {
  return {
    ...process.env,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: LEGACY_SQLITE_DB,
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
    SESSION_DRIVER: 'file',
  };
}

async function canUseLegacyMySqlEnv() {
  try {
    await runLegacyArtisan(['migrate:status', '--no-ansi', '--no-interaction']);
    return true;
  } catch {
    return false;
  }
}

async function prepareLegacySqliteFallback() {
  await mkdir(dirname(LEGACY_SQLITE_DB), { recursive: true });
  await writeFile(LEGACY_SQLITE_DB, '', { flag: 'a' });
  const sqliteEnv = buildLegacySqliteEnv();
  console.log(`[qa:visual-parity] Preparing legacy SQLite fallback at ${LEGACY_SQLITE_DB}...`);
  await runLegacyArtisan(['migrate:fresh', '--seed', '--force', '--no-interaction'], sqliteEnv);
  return sqliteEnv;
}

function buildCorsOriginsForVisualParity() {
  const requestedOrigin = new URL(NEXT_BASE_URL).origin;
  const requestedPort = new URL(NEXT_BASE_URL).port || '4174';
  const localhostVariant = `http://localhost:${requestedPort}`;
  const loopbackVariant = `http://127.0.0.1:${requestedPort}`;
  const raw = process.env.CORS_ORIGINS || '';
  const existing = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return Array.from(new Set([...existing, requestedOrigin, localhostVariant, loopbackVariant])).join(',');
}

async function waitFor(url, { timeoutMs = 45000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timer);
      if (response.status < 500) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Timeout esperando ${url}`);
}

async function isUp(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    return response.status < 500;
  } catch {
    return false;
  }
}

async function killTree(child) {
  if (!child || child.exitCode != null) return;
  if (process.platform === 'win32') {
    await run('cmd', ['/c', 'taskkill', '/PID', String(child.pid), '/T', '/F']).catch(() => {});
    return;
  }
  child.kill('SIGTERM');
}

function timestampLabel() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

async function capturePage(page, url, outputPath) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: outputPath, fullPage: true });
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const mojibake = bodyText.match(MOJIBAKE_PATTERN)?.[0] ?? null;
  return {
    finalUrl: page.url(),
    mojibake,
  };
}

async function main() {
  let apiProcess;
  let previewProcess;
  let legacyProcess;
  let browser;
  let legacyEnabled = true;
  let legacyBlockReason = null;
  let legacyDbModeUsed = 'default';

  const outDir = resolve(ROOT, 'artifacts', 'visual-parity', timestampLabel());
  await mkdir(outDir, { recursive: true });

  const startedServices = [];

  try {
    const apiUp = await isUp(API_HEALTH_URL);
    if (!apiUp) {
      console.log(`[qa:visual-parity] Starting API because ${API_HEALTH_URL} is not reachable...`);
      apiProcess = startNpm(['run', 'dev', '--workspace', '@nico/api'], {
        env: {
          ...process.env,
          CORS_ORIGINS: buildCorsOriginsForVisualParity(),
          THROTTLE_LIMIT: QA_THROTTLE_LIMIT,
        },
      });
      await waitFor(API_HEALTH_URL);
      startedServices.push('api');
    } else {
      console.log('[qa:visual-parity] API already running.');
    }

    const nextUp = await isUp(`${NEXT_BASE_URL}/`);
    if (!nextUp) {
      console.log('[qa:visual-parity] Building web app...');
      await runNpm(['run', 'build', '--workspace', '@nico/web']);
      console.log('[qa:visual-parity] Starting web preview...');
      previewProcess = startNpm(['run', 'preview:prod', '--workspace', '@nico/web']);
      await waitFor(`${NEXT_BASE_URL}/`);
      startedServices.push('web');
    } else {
      console.log('[qa:visual-parity] Next web already running.');
    }

    const legacyUp = await isUp(LEGACY_HEALTH_URL);
    if (legacyUp) {
      console.log('[qa:visual-parity] Legacy already running.');
    } else if (START_LEGACY) {
      let legacyEnv = process.env;
      if (LEGACY_PARITY_DB_MODE === 'sqlite') {
        legacyEnv = await prepareLegacySqliteFallback();
        legacyDbModeUsed = `sqlite (${LEGACY_SQLITE_DB})`;
      } else if (LEGACY_PARITY_DB_MODE === 'auto') {
        const mysqlReady = await canUseLegacyMySqlEnv();
        if (!mysqlReady) {
          console.warn('[qa:visual-parity] Legacy MySQL no disponible; using SQLite fallback.');
          legacyEnv = await prepareLegacySqliteFallback();
          legacyDbModeUsed = `sqlite (${LEGACY_SQLITE_DB})`;
        } else {
          legacyDbModeUsed = 'mysql/env';
        }
      } else {
        legacyDbModeUsed = 'mysql/env';
      }

      console.log(`[qa:visual-parity] Starting legacy server at ${LEGACY_BASE_URL}...`);
      legacyProcess = startLegacyServer(legacyEnv);
      try {
        await waitFor(LEGACY_HEALTH_URL, { timeoutMs: 120000 });
        startedServices.push('legacy');
      } catch {
        legacyEnabled = false;
        legacyBlockReason = `Legacy no disponible en ${LEGACY_HEALTH_URL}. Verificar DB/entorno legacy (ej: MySQL).`;
        console.warn(`[qa:visual-parity] WARN: ${legacyBlockReason}`);
      }
    } else {
      legacyEnabled = false;
      legacyBlockReason = `Legacy deshabilitado por VISUAL_PARITY_START_LEGACY=0 (${LEGACY_BASE_URL}).`;
      console.warn(`[qa:visual-parity] WARN: ${legacyBlockReason}`);
    }

    browser = await chromium.launch({ headless: true });
    const pageLegacy = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const pageNext = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    const reportRows = [];

    for (const route of ROUTES) {
      const legacyUrl = `${LEGACY_BASE_URL}${route.legacyPath}`;
      const nextUrl = `${NEXT_BASE_URL}${route.nextPath}`;
      const legacyShot = resolve(outDir, `${route.key}.legacy.png`);
      const nextShot = resolve(outDir, `${route.key}.next.png`);

      console.log(`[qa:visual-parity] Capturing ${route.key}`);
      let legacyMeta = {
        finalUrl: null,
        mojibake: null,
      };
      if (legacyEnabled) {
        legacyMeta = await capturePage(pageLegacy, legacyUrl, legacyShot);
      }
      const nextMeta = await capturePage(pageNext, nextUrl, nextShot);

      reportRows.push({
        key: route.key,
        legacyUrl,
        nextUrl,
        legacyFinalUrl: legacyMeta.finalUrl,
        nextFinalUrl: nextMeta.finalUrl,
        legacyMojibake: legacyMeta.mojibake,
        nextMojibake: nextMeta.mojibake,
        legacyFile: `${route.key}.legacy.png`,
        nextFile: `${route.key}.next.png`,
      });
    }

    const md = [
      '# Visual Parity Capture Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Legacy base: ${LEGACY_BASE_URL}`,
      `Next base: ${NEXT_BASE_URL}`,
      `Legacy DB mode: ${legacyDbModeUsed}`,
      `Started by script: ${startedServices.length ? startedServices.join(', ') : 'none'}`,
      legacyBlockReason ? `Legacy status: BLOCKED - ${legacyBlockReason}` : 'Legacy status: OK',
      '',
      '| Route | Legacy URL | Next URL | Legacy Final | Next Final | Legacy Mojibake | Next Mojibake | Legacy Shot | Next Shot |',
      '|---|---|---|---|---|---|---|---|---|',
      ...reportRows.map(
        (r) =>
          `| ${r.key} | ${r.legacyUrl} | ${r.nextUrl} | ${r.legacyFinalUrl ?? 'N/A'} | ${r.nextFinalUrl} | ${r.legacyFinalUrl ? (r.legacyMojibake ? `yes (${JSON.stringify(r.legacyMojibake)})` : 'no') : 'N/A'} | ${r.nextMojibake ? `yes (${JSON.stringify(r.nextMojibake)})` : 'no'} | ${r.legacyFinalUrl ? `\`${r.legacyFile}\`` : 'N/A'} | \`${r.nextFile}\` |`,
      ),
      '',
      'Use these pairs for side-by-side manual visual validation.',
    ].join('\n');

    await writeFile(resolve(outDir, 'report.md'), md, 'utf8');
    console.log(`[qa:visual-parity] OK. Report: ${resolve(outDir, 'report.md')}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (legacyProcess) await killTree(legacyProcess);
    if (previewProcess) await killTree(previewProcess);
    if (apiProcess) await killTree(apiProcess);
  }
}

main().catch((err) => {
  console.error('\n[qa:visual-parity] failed:', err);
  process.exit(1);
});

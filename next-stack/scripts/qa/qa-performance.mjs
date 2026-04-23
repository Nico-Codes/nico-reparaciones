import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const WEB_URL = process.env.PERF_WEB_URL || process.env.E2E_WEB_URL || 'http://127.0.0.1:4174';
const API_BASE_URL = process.env.PERF_API_URL || process.env.SMOKE_API_URL || process.env.API_URL || 'http://127.0.0.1:3001';
const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api`;
const API_HEALTH_URL = `${API_URL}/health`;
const REQUEST_TIMEOUT_MS = Number(process.env.PERF_REQUEST_TIMEOUT_MS || 15000);
const WARN_JS_CSS_KB = Number(process.env.PERF_WARN_JS_CSS_KB || 700);
const WARN_REQUESTS = Number(process.env.PERF_WARN_REQUESTS || 45);

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
      ...opts,
    });
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`)),
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
  if (process.platform === 'win32') return run('cmd', ['/c', 'npm', ...args], opts);
  return run('npm', args, opts);
}

function startNpm(args, opts = {}) {
  if (process.platform === 'win32') return start('cmd', ['/c', 'npm', ...args], opts);
  return start('npm', args, opts);
}

async function waitFor(url, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timer);
      if (response.status < 500) return true;
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

async function apiRequest(path, init = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function extractTokens(payload) {
  const root = payload && typeof payload === 'object' ? payload : {};
  const nested = root && typeof root.tokens === 'object' ? root.tokens : null;
  const src = nested ?? root;
  return {
    accessToken: typeof src.accessToken === 'string' ? src.accessToken : null,
    refreshToken: typeof src.refreshToken === 'string' ? src.refreshToken : null,
    user: root.user && typeof root.user === 'object' ? root.user : null,
  };
}

async function loginSession(email, password) {
  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!login.response.ok) return null;
  const tokens = extractTokens(login.data);
  if (!tokens.accessToken || !tokens.refreshToken || !tokens.user) return null;
  return tokens;
}

async function createAdminSession() {
  const setupKey = process.env.ADMIN_BOOTSTRAP_KEY || 'nico-dev-admin';
  const email = process.env.PERF_ADMIN_EMAIL || 'performance-admin@local.test';
  const password = process.env.PERF_ADMIN_PASSWORD || 'smokePass123!';
  const name = process.env.PERF_ADMIN_NAME || 'Performance Admin';
  const existing = await loginSession(email, password);
  if (existing) return existing;

  const bootstrap = await apiRequest('/auth/bootstrap-admin', {
    method: 'POST',
    body: JSON.stringify({ setupKey, name, email, password }),
  });
  if (!bootstrap.response.ok && bootstrap.response.status !== 409) {
    throw new Error(`bootstrap-admin fallo (${bootstrap.response.status})`);
  }

  const session = await loginSession(email, password);
  if (!session) throw new Error('No se pudo crear sesion admin para performance QA');
  return session;
}

async function firstProductSlug() {
  const response = await apiRequest('/store/products?page=1&pageSize=1');
  const item = response.data?.items?.[0];
  return typeof item?.slug === 'string' ? item.slug : null;
}

function contentLengthKb(response) {
  const raw = response.headers()['content-length'];
  const bytes = raw ? Number(raw) : 0;
  return Number.isFinite(bytes) && bytes > 0 ? bytes / 1024 : 0;
}

async function measureRoute(browser, route) {
  const context = await browser.newContext();
  if (route.session) {
    await context.addInitScript((session) => {
      localStorage.setItem('nico_next_user', JSON.stringify(session.user));
      localStorage.setItem('nico_next_access_token', session.accessToken);
      localStorage.setItem('nico_next_refresh_token', session.refreshToken);
    }, route.session);
  }

  const page = await context.newPage();
  const stats = {
    label: route.label,
    path: route.path,
    requests: 0,
    jsKb: 0,
    cssKb: 0,
    imageKb: 0,
    totalKb: 0,
    domContentLoadedMs: 0,
    warnings: [],
  };

  page.on('response', (response) => {
    const type = response.request().resourceType();
    const kb = contentLengthKb(response);
    stats.requests += 1;
    stats.totalKb += kb;
    if (type === 'script') stats.jsKb += kb;
    if (type === 'stylesheet') stats.cssKb += kb;
    if (type === 'image') stats.imageKb += kb;
  });

  await page.goto(`${WEB_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
  if (route.selector) await page.waitForSelector(route.selector, { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const domContentLoadedMs = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType('navigation');
    return entry && 'domContentLoadedEventEnd' in entry
      ? Math.round(entry.domContentLoadedEventEnd)
      : Math.round(performance.now());
  });
  stats.domContentLoadedMs = domContentLoadedMs;

  const jsCssKb = stats.jsKb + stats.cssKb;
  if (jsCssKb > WARN_JS_CSS_KB) stats.warnings.push(`JS+CSS ${Math.round(jsCssKb)}KB > ${WARN_JS_CSS_KB}KB`);
  if (stats.requests > WARN_REQUESTS) stats.warnings.push(`requests ${stats.requests} > ${WARN_REQUESTS}`);

  await context.close();
  return stats;
}

function printResults(results) {
  console.log('\n[qa:performance] Resultados');
  for (const result of results) {
    console.log(
      [
        `- ${result.label} (${result.path})`,
        `requests=${result.requests}`,
        `domcontentloaded=${result.domContentLoadedMs}ms`,
        `js=${Math.round(result.jsKb)}KB`,
        `css=${Math.round(result.cssKb)}KB`,
        `img=${Math.round(result.imageKb)}KB`,
        `total=${Math.round(result.totalKb)}KB`,
      ].join(' | '),
    );
    for (const warning of result.warnings) {
      console.log(`  WARN ${warning}`);
    }
  }
}

async function main() {
  let apiProcess;
  let previewProcess;
  let browser;

  try {
    if (!(await isUp(API_HEALTH_URL))) {
      console.log(`[qa:performance] Starting API: ${API_HEALTH_URL}`);
      apiProcess = startNpm(['run', 'dev', '--workspace', '@nico/api'], {
        env: { ...process.env, THROTTLE_LIMIT: process.env.THROTTLE_LIMIT || '1000' },
      });
      await waitFor(API_HEALTH_URL);
    }

    if (!(await isUp(`${WEB_URL}/`))) {
      console.log('[qa:performance] Building web...');
      await runNpm(['run', 'build', '--workspace', '@nico/web']);
      console.log('[qa:performance] Starting web preview...');
      previewProcess = startNpm(['run', 'preview:prod', '--workspace', '@nico/web']);
      await waitFor(`${WEB_URL}/`);
    }

    const adminSession = await createAdminSession();
    const productSlug = await firstProductSlug();
    const routes = [
      { label: 'store', path: '/store', selector: '[data-store-shell]' },
      { label: 'auth-login', path: '/auth/login', selector: 'button:has-text("Ingresar")' },
      ...(productSlug
        ? [
            {
              label: 'store-product',
              path: `/store/${encodeURIComponent(productSlug)}`,
              selector: '.commerce-layout--product, .empty-state',
            },
          ]
        : []),
      { label: 'admin', path: '/admin', selector: 'text=/Panel Admin/i', session: adminSession },
    ];

    browser = await chromium.launch({ headless: true });
    const results = [];
    for (const route of routes) {
      results.push(await measureRoute(browser, route));
    }
    printResults(results);
    console.log('\n[qa:performance] OK');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (previewProcess) await killTree(previewProcess);
    if (apiProcess) await killTree(apiProcess);
  }
}

main().catch((err) => {
  console.error('\n[qa:performance] FAIL:', err);
  process.exit(1);
});

import { spawn } from 'node:child_process';
import process from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const WEB_BASE_URL = process.env.E2E_WEB_URL || process.env.NEXT_BASE_URL || 'http://127.0.0.1:4174';
const API_BASE_URL = process.env.SMOKE_API_URL || process.env.API_URL || 'http://127.0.0.1:3001';
const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api`;
const API_HEALTH_URL = `${API_URL}/health`;
const REQUEST_TIMEOUT_MS = Number(process.env.RESPONSIVE_VISUAL_TIMEOUT_MS || 15000);
const QA_THROTTLE_LIMIT = process.env.QA_THROTTLE_LIMIT || process.env.THROTTLE_LIMIT || '1000';
const MOJIBAKE_PATTERN = /\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]{1,2}|\uFFFD/u;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 1366 },
  { name: 'mobile', width: 390, height: 844 },
];

const PUBLIC_ROUTES = [
  { path: '/store', selectors: ['text=/tienda|productos|destacados/i'] },
  { path: '/help', selectors: ['text=/ayuda|preguntas/i'] },
  { path: '/reparacion', selectors: ['text=/reparaci|consultar/i'] },
  { path: '/cart', selectors: ['text=/carrito/i'] },
  { path: '/checkout', selectors: ['text=/checkout|compra|pedido/i'], allowedFinalPaths: ['/checkout', '/auth/login'] },
];

const USER_ROUTES = [
  { path: '/orders', selectors: ['text=/mis pedidos|pedidos/i'] },
  { path: '/repairs', selectors: ['text=/mis reparaciones|reparaciones/i'] },
  { path: '/mi-cuenta', selectors: ['text=/mi cuenta|cuenta/i'] },
];

const ADMIN_ROUTES = [
  { path: '/admin', selectors: ['text=/panel admin|admin/i'] },
  { path: '/admin/orders', selectors: ['text=/pedidos/i'] },
  { path: '/admin/repairs', selectors: ['text=/repar/i'] },
  { path: '/admin/productos', selectors: ['text=/productos/i'] },
  { path: '/admin/configuraciones', selectors: ['text=/configuraci/i'] },
  { path: '/admin/configuracion/identidadvisual', selectors: ['text=/identidad visual/i'] },
  { path: '/admin/configuracion/portadatienda', selectors: ['text=/portada de tienda/i'] },
  { path: '/admin/whatsapp', selectors: ['text=/plantillas whatsapp/i'] },
  { path: '/admin/whatsapppedidos', selectors: ['text=/whatsapp.*pedidos/i'] },
  { path: '/admin/seguridad/2fa', selectors: ['text=/seguridad 2fa/i'] },
  { path: '/admin/help', selectors: ['text=/ayuda editable|centro de ayuda|faq/i'] },
  { path: '/admin/users', selectors: ['text=/usuarios/i'] },
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

function buildCorsOrigins() {
  const requestedOrigin = new URL(WEB_BASE_URL).origin;
  const requestedPort = new URL(WEB_BASE_URL).port || '4174';
  const localhostVariant = `http://localhost:${requestedPort}`;
  const loopbackVariant = `http://127.0.0.1:${requestedPort}`;
  const raw = process.env.CORS_ORIGINS || '';
  const existing = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return Array.from(new Set([...existing, requestedOrigin, localhostVariant, loopbackVariant])).join(',');
}

async function waitFor(url, { timeoutMs = 60000 } = {}) {
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

function sanitizeRoutePath(routePath) {
  return routePath.replace(/^\//, '').replace(/[\/:]+/g, '__');
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

async function apiRequest(path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function loginSession(email, password) {
  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!login.res.ok) return null;

  const tokens = extractTokens(login.data);
  if (!tokens.accessToken || !tokens.refreshToken || !tokens.user) return null;
  return {
    user: tokens.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function createAdminSession() {
  const setupKey = process.env.ADMIN_BOOTSTRAP_KEY || 'nico-dev-admin';
  const email = process.env.E2E_ADMIN_EMAIL || 'e2e-admin@local.test';
  const password = process.env.E2E_ADMIN_PASSWORD || 'smokePass123!';
  const name = process.env.E2E_ADMIN_NAME || 'E2E Admin';

  const existing = await loginSession(email, password);
  if (existing) return existing;

  const bootstrap = await apiRequest('/auth/bootstrap-admin', {
    method: 'POST',
    body: JSON.stringify({ setupKey, name, email, password }),
  });
  if (!bootstrap.res.ok && bootstrap.res.status !== 409) {
    throw new Error(`bootstrap-admin fallo (${bootstrap.res.status})`);
  }

  const session = await loginSession(email, password);
  if (!session) {
    throw new Error('No se pudo loguear admin después de bootstrap');
  }
  return session;
}

async function createUserSession() {
  const email = process.env.E2E_USER_EMAIL || 'e2e-user@local.test';
  const password = process.env.E2E_USER_PASSWORD || 'smokePass123!';
  const name = process.env.E2E_USER_NAME || 'E2E User';

  const existing = await loginSession(email, password);
  if (existing) return existing;

  const register = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (!register.res.ok && register.res.status !== 409) {
    throw new Error(`register user falló (${register.res.status})`);
  }

  const session = await loginSession(email, password);
  if (!session) {
    throw new Error('No se pudo loguear user después de register');
  }
  return session;
}

async function setSession(page, session) {
  await page.goto(`${WEB_BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((nextSession) => {
    localStorage.setItem('nico_next_user', JSON.stringify(nextSession.user));
    localStorage.setItem('nico_next_access_token', nextSession.accessToken);
    localStorage.setItem('nico_next_refresh_token', nextSession.refreshToken);
    window.dispatchEvent(new Event('nico:auth-changed'));
  }, session);
}

async function clearSession(page) {
  await page.goto(`${WEB_BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.removeItem('nico_next_user');
    localStorage.removeItem('nico_next_access_token');
    localStorage.removeItem('nico_next_refresh_token');
    window.dispatchEvent(new Event('nico:auth-changed'));
  });
}

async function captureRoute(page, { viewportName, area, route, outDir }) {
  const targetUrl = `${WEB_BASE_URL}${route.path}`;
  const filename = `${viewportName}__${area}__${sanitizeRoutePath(route.path)}.png`;
  const outputPath = resolve(outDir, filename);

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (const selector of route.selectors ?? []) {
    await page.locator(selector).first().waitFor({ state: 'attached', timeout: 15000 });
  }
  await page.waitForTimeout(500);

  const finalPath = new URL(page.url()).pathname;
  const allowedFinalPaths = route.allowedFinalPaths ?? [route.path];
  if (!allowedFinalPaths.includes(finalPath)) {
    throw new Error(`Se esperaba path ${allowedFinalPaths.join(' o ')} y terminó en ${finalPath}`);
  }

  await page.screenshot({ path: outputPath, fullPage: true });
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const mojibake = bodyText.match(MOJIBAKE_PATTERN)?.[0] ?? null;

  return {
    viewport: viewportName,
    area,
    route: route.path,
    targetUrl,
    finalUrl: page.url(),
    screenshot: filename,
    mojibake,
    status: 'ok',
    error: null,
  };
}

async function captureBlock(page, { viewportName, area, routes, outDir, rows }) {
  for (const route of routes) {
    try {
      console.log(`[qa:responsive:visual] ${viewportName} ${area} ${route.path}`);
      const row = await captureRoute(page, { viewportName, area, route, outDir });
      rows.push(row);
    } catch (error) {
      rows.push({
        viewport: viewportName,
        area,
        route: route.path,
        targetUrl: `${WEB_BASE_URL}${route.path}`,
        finalUrl: page.url(),
        screenshot: null,
        mojibake: null,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function main() {
  let apiProcess;
  let webProcess;
  let browser;

  const outDir = resolve(ROOT, 'artifacts', 'responsive-visual', timestampLabel());
  await mkdir(outDir, { recursive: true });

  try {
    const apiUp = await isUp(API_HEALTH_URL);
    if (!apiUp) {
      console.log(`[qa:responsive:visual] Starting API: ${API_HEALTH_URL}`);
      apiProcess = startNpm(['run', 'dev', '--workspace', '@nico/api'], {
        env: {
          ...process.env,
          CORS_ORIGINS: buildCorsOrigins(),
          THROTTLE_LIMIT: QA_THROTTLE_LIMIT,
        },
      });
      await waitFor(API_HEALTH_URL);
    } else {
      console.log('[qa:responsive:visual] API already running.');
    }

    const webUp = await isUp(`${WEB_BASE_URL}/`);
    if (!webUp) {
      console.log('[qa:responsive:visual] Building web...');
      await runNpm(['run', 'build', '--workspace', '@nico/web']);
      console.log('[qa:responsive:visual] Starting web preview...');
      webProcess = startNpm(['run', 'preview:prod', '--workspace', '@nico/web']);
      await waitFor(`${WEB_BASE_URL}/`);
    } else {
      console.log('[qa:responsive:visual] Web already running.');
    }

    const adminSession = await createAdminSession();
    const userSession = await createUserSession();

    browser = await chromium.launch({ headless: true });
    const rows = [];

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
      try {
        await clearSession(page);
        await captureBlock(page, {
          viewportName: viewport.name,
          area: 'public',
          routes: PUBLIC_ROUTES,
          outDir,
          rows,
        });

        await setSession(page, userSession);
        await captureBlock(page, {
          viewportName: viewport.name,
          area: 'user',
          routes: USER_ROUTES,
          outDir,
          rows,
        });

        await setSession(page, adminSession);
        await captureBlock(page, {
          viewportName: viewport.name,
          area: 'admin',
          routes: ADMIN_ROUTES,
          outDir,
          rows,
        });
      } finally {
        await page.close().catch(() => {});
      }
    }

    const failed = rows.filter((r) => r.status !== 'ok');
    const mojibakeHits = rows.filter((r) => r.mojibake);

    const markdown = [
      '# Responsive Visual Audit Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Web base: ${WEB_BASE_URL}`,
      `API base: ${API_URL}`,
      `Viewports: ${VIEWPORTS.map((v) => `${v.name}(${v.width}x${v.height})`).join(', ')}`,
      `Routes audited: ${rows.length}`,
      `Failed routes: ${failed.length}`,
      `Mojibake hits: ${mojibakeHits.length}`,
      '',
      '| Viewport | Area | Route | Status | Final URL | Mojibake | Screenshot | Error |',
      '|---|---|---|---|---|---|---|---|',
      ...rows.map((r) => {
        const mojibakeLabel = r.mojibake ? `yes (${JSON.stringify(r.mojibake)})` : 'no';
        const shot = r.screenshot ? `\`${r.screenshot}\`` : '-';
        const err = r.error ? `\`${r.error.replace(/\|/g, '\\|')}\`` : '-';
        return `| ${r.viewport} | ${r.area} | ${r.route} | ${r.status} | ${r.finalUrl} | ${mojibakeLabel} | ${shot} | ${err} |`;
      }),
      '',
      'Screenshots are located in this same folder.',
    ].join('\n');

    await writeFile(resolve(outDir, 'report.md'), markdown, 'utf8');
    console.log(`[qa:responsive:visual] Report: ${resolve(outDir, 'report.md')}`);

    if (failed.length > 0 || mojibakeHits.length > 0) {
      throw new Error(
        `Audit failed: failedRoutes=${failed.length}, mojibakeHits=${mojibakeHits.length}. Ver reporte en ${resolve(outDir, 'report.md')}`,
      );
    }

    console.log('[qa:responsive:visual] OK');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (webProcess) await killTree(webProcess);
    if (apiProcess) await killTree(apiProcess);
  }
}

main().catch((err) => {
  console.error('\n[qa:responsive:visual] failed:', err);
  process.exit(1);
});

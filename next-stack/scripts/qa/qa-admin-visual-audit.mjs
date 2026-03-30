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
const REQUEST_TIMEOUT_MS = Number(process.env.ADMIN_VISUAL_AUDIT_TIMEOUT_MS || 15000);
const QA_THROTTLE_LIMIT = process.env.QA_THROTTLE_LIMIT || process.env.THROTTLE_LIMIT || '1000';
const MOJIBAKE_PATTERN = /\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]{1,2}|\uFFFD/u;

const ADMIN_ROUTES = [
  { path: '/admin', selectors: ['text=/Panel Admin/i'] },
  { path: '/admin/orders', selectors: ['[data-admin-orders-page]'] },
  { path: '/admin/repairs', selectors: ['[data-admin-repairs-page]'] },
  { path: '/admin/productos', selectors: ['text=/Productos/i'] },
  { path: '/admin/categorias', selectors: ['text=/Categor/i'] },
  { path: '/admin/ventas-rapidas', selectors: ['text=/Venta r.pida/i'] },
  { path: '/admin/ventas-rapidas/historial', selectors: ['text=/Historial de ventas/i'] },
  { path: '/admin/alertas', selectors: ['text=/alertas/i'] },
  { path: '/admin/proveedores', selectors: ['text=/Proveedores/i'] },
  { path: '/admin/garantias', selectors: ['text=/Garant/i'] },
  { path: '/admin/garantias/crear', selectors: ['text=/incidente de garant/i'] },
  { path: '/admin/contabilidad', selectors: ['text=/Contabilidad/i'] },
  { path: '/admin/configuraciones', selectors: ['text=/Configuraci/i'] },
  { path: '/admin/configuracion/mail', selectors: ['text=/Correo SMTP/i'] },
  { path: '/admin/configuracion/reportes', selectors: ['text=/Reportes autom/i'] },
  { path: '/admin/configuracion/negocio', selectors: ['text=/Datos del negocio/i'] },
  { path: '/admin/configuracion/identidadvisual', selectors: ['text=/Identidad visual/i'] },
  { path: '/admin/configuracion/portadatienda', selectors: ['text=/Portada de tienda/i'] },
  { path: '/admin/seguridad/2fa', selectors: ['text=/Seguridad 2FA/i'] },
  { path: '/admin/calculos', selectors: ['text=/calculo|c.lculo/i'] },
  { path: '/admin/calculos/productos', selectors: ['text=/Reglas de productos|regla de productos/i'] },
  { path: '/admin/precios', selectors: ['text=/Reglas de precios|precios de repar/i'] },
  { path: '/admin/precios/crear', selectors: ['text=/Crear regla/i'] },
  { path: '/admin/gruposmodelos', selectors: ['text=/Grupos de modelos/i'] },
  { path: '/admin/tiposreparacion', selectors: ['text=/Tipos de reparaci/i'] },
  { path: '/admin/tiposdispositivo', selectors: ['text=/Tipos de dispositivo/i'] },
  { path: '/admin/catalogodispositivos', selectors: ['text=/Cat/i', 'text=/dispositivos/i'] },
  { path: '/admin/mail-templates', selectors: ['text=/Plantillas de correo/i'] },
  { path: '/admin/whatsapp', selectors: ['text=/Plantillas WhatsApp/i'] },
  { path: '/admin/whatsapppedidos', selectors: ['text=/Plantillas WhatsApp - Pedidos/i'] },
  { path: '/admin/help', selectors: ['text=/Ayuda editable/i'] },
  { path: '/admin/users', selectors: ['text=/Usuarios/i'] },
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

function buildCorsOriginsForAdminAudit() {
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

async function createAdminSession() {
  const unique = Date.now().toString(36);
  const setupKey = process.env.ADMIN_BOOTSTRAP_KEY || 'nico-dev-admin';
  const email = process.env.SMOKE_ADMIN_EMAIL || `visual-admin-${unique}@local.test`;
  const password = process.env.SMOKE_ADMIN_PASSWORD || 'smokePass123!';
  const name = process.env.SMOKE_ADMIN_NAME || 'Visual Admin';

  const bootstrap = await apiRequest('/auth/bootstrap-admin', {
    method: 'POST',
    body: JSON.stringify({ setupKey, name, email, password }),
  });
  if (!bootstrap.res.ok) {
    throw new Error(`bootstrap-admin fallo (${bootstrap.res.status})`);
  }

  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!login.res.ok) {
    throw new Error(`login admin fallo (${login.res.status})`);
  }
  const tokens = extractTokens(login.data);
  if (!tokens.accessToken || !tokens.refreshToken || !tokens.user) {
    throw new Error('login admin sin tokens o user');
  }

  return {
    user: tokens.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
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

async function captureRoute(page, route, outDir) {
  const targetUrl = `${WEB_BASE_URL}${route.path}`;
  const filename = `${sanitizeRoutePath(route.path)}.png`;
  const outputPath = resolve(outDir, filename);

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (const selector of route.selectors) {
    await page.waitForSelector(selector, { timeout: 15000 });
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: outputPath, fullPage: true });
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const mojibake = bodyText.match(MOJIBAKE_PATTERN)?.[0] ?? null;

  return {
    route: route.path,
    targetUrl,
    finalUrl: page.url(),
    screenshot: filename,
    mojibake,
    status: 'ok',
    error: null,
  };
}

async function main() {
  let apiProcess;
  let webProcess;
  let browser;

  const outDir = resolve(ROOT, 'artifacts', 'admin-visual-audit', timestampLabel());
  await mkdir(outDir, { recursive: true });

  try {
    const apiUp = await isUp(API_HEALTH_URL);
    if (!apiUp) {
      console.log(`[qa:admin-visual-audit] Starting API: ${API_HEALTH_URL}`);
      apiProcess = startNpm(['run', 'dev', '--workspace', '@nico/api'], {
        env: {
          ...process.env,
          CORS_ORIGINS: buildCorsOriginsForAdminAudit(),
          THROTTLE_LIMIT: QA_THROTTLE_LIMIT,
        },
      });
      await waitFor(API_HEALTH_URL);
    } else {
      console.log('[qa:admin-visual-audit] API already running.');
    }

    const webUp = await isUp(`${WEB_BASE_URL}/`);
    if (!webUp) {
      console.log('[qa:admin-visual-audit] Building web...');
      await runNpm(['run', 'build', '--workspace', '@nico/web']);
      console.log('[qa:admin-visual-audit] Starting web preview...');
      webProcess = startNpm(['run', 'preview:prod', '--workspace', '@nico/web']);
      await waitFor(`${WEB_BASE_URL}/`);
    } else {
      console.log('[qa:admin-visual-audit] Web already running.');
    }

    const session = await createAdminSession();
    console.log('[qa:admin-visual-audit] Admin session created.');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await setSession(page, session);

    const rows = [];
    for (const route of ADMIN_ROUTES) {
      try {
        console.log(`[qa:admin-visual-audit] Capturing ${route.path}`);
        const row = await captureRoute(page, route, outDir);
        rows.push(row);
      } catch (error) {
        rows.push({
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

    const failed = rows.filter((r) => r.status !== 'ok');
    const mojibakeHits = rows.filter((r) => r.mojibake);

    const markdown = [
      '# Admin Visual Audit Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Web base: ${WEB_BASE_URL}`,
      `API base: ${API_URL}`,
      `Routes audited: ${rows.length}`,
      `Failed routes: ${failed.length}`,
      `Mojibake hits: ${mojibakeHits.length}`,
      '',
      '| Route | Status | Target | Final | Mojibake | Screenshot | Error |',
      '|---|---|---|---|---|---|---|',
      ...rows.map((r) => {
        const mojibakeLabel = r.mojibake ? `yes (${JSON.stringify(r.mojibake)})` : 'no';
        const shot = r.screenshot ? `\`${r.screenshot}\`` : '-';
        const err = r.error ? `\`${r.error.replace(/\|/g, '\\|')}\`` : '-';
        return `| ${r.route} | ${r.status} | ${r.targetUrl} | ${r.finalUrl} | ${mojibakeLabel} | ${shot} | ${err} |`;
      }),
      '',
      'Screenshots are located in this same folder.',
    ].join('\n');

    await writeFile(resolve(outDir, 'report.md'), markdown, 'utf8');
    console.log(`[qa:admin-visual-audit] Report: ${resolve(outDir, 'report.md')}`);

    if (failed.length > 0 || mojibakeHits.length > 0) {
      throw new Error(
        `Audit failed: failedRoutes=${failed.length}, mojibakeHits=${mojibakeHits.length}. Ver reporte en ${resolve(outDir, 'report.md')}`,
      );
    }

    console.log('[qa:admin-visual-audit] OK');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (webProcess) await killTree(webProcess);
    if (apiProcess) await killTree(apiProcess);
  }
}

main().catch((err) => {
  console.error('\n[qa:admin-visual-audit] failed:', err);
  process.exit(1);
});

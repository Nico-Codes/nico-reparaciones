import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const WEB_URL = process.env.E2E_WEB_URL || 'http://127.0.0.1:4174';

function run(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
      ...opts,
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))));
  });
}

function start(command, args, opts = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
  return child;
}

async function waitFor(url, { timeoutMs = 30000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error(`Timeout esperando ${url}`);
}

async function killTree(child) {
  if (!child || child.exitCode != null) return;
  if (process.platform === 'win32') {
    await run('cmd', ['/c', 'taskkill', '/PID', String(child.pid), '/T', '/F']).catch(() => {});
  } else {
    child.kill('SIGTERM');
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  let preview;
  let browser;
  try {
    await run('cmd', ['/c', 'npm', 'run', 'build', '--workspace', '@nico/web']);

    preview = start('cmd', ['/c', 'npm', 'run', 'preview:prod', '--workspace', '@nico/web']);
    await waitFor(`${WEB_URL}/`);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Home
    await page.goto(`${WEB_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=NicoReparaciones');
    await page.waitForSelector('text=Nuevo stack');

    // Store
    await page.goto(`${WEB_URL}/store`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Catálogo público migrado');
    await page.waitForSelector('input[placeholder*="Buscar productos"]');
    await page.waitForSelector('text=Todas');

    // Help
    await page.goto(`${WEB_URL}/help`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Ayuda');
    await page.waitForSelector('input[placeholder*="Buscar problema"]');

    // Public repair lookup
    await page.goto(`${WEB_URL}/reparacion`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Consulta publica de reparacion');
    await page.waitForSelector('input[placeholder*="cmabcd123"]');

    // Protected routes (unauthenticated)
    await page.goto(`${WEB_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    assert(page.url().includes('/auth/login'), 'Ruta /admin debe redirigir a /auth/login sin sesion');
    await page.waitForSelector('text=Iniciar sesión');

    await page.goto(`${WEB_URL}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    assert(page.url().includes('/auth/login'), 'Ruta /orders debe redirigir a /auth/login sin sesion');

    // Simular admin local para validar layout admin routes (sin depender de backend)
    await page.addInitScript(() => {
      localStorage.setItem('nico_next_user', JSON.stringify({ id: 'e2e-admin', name: 'E2E Admin', email: 'e2e@example.com', role: 'ADMIN', emailVerified: true }));
      localStorage.setItem('nico_next_access_token', 'fake-access');
      localStorage.setItem('nico_next_refresh_token', 'fake-refresh');
    });

    await page.goto(`${WEB_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Dashboard');

    await page.goto(`${WEB_URL}/admin/repairs`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Admin Reparaciones');
    await page.waitForSelector('input[placeholder*="Buscar ID"]');

    await page.goto(`${WEB_URL}/admin/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Configuración');

    console.log('\n[E2E] Frontend smoke OK');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (preview) await killTree(preview);
  }
}

main().catch((err) => {
  console.error('\n[E2E] Frontend smoke failed:', err);
  process.exit(1);
});


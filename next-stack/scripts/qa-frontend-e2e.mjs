import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const WEB_URL = process.env.E2E_WEB_URL || 'http://127.0.0.1:4174';
const MOJIBAKE_PATTERN = /\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]{1,2}|\uFFFD/u;

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

async function assertNoMojibake(page, routeLabel) {
  const text = await page.locator('body').innerText();
  const hit = text.match(MOJIBAKE_PATTERN);
  if (hit) {
    throw new Error(`Mojibake detectado en ${routeLabel}. Fragmento: ${JSON.stringify(hit[0])}`);
  }
}

async function gotoAndCheck(page, url, { selectors = [], label = url } = {}) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  for (const selector of selectors) {
    await page.waitForSelector(selector);
  }
  await assertNoMojibake(page, label);
}

async function gotoAndExpect(page, url, { pathname, urlMatcher, selectors = [], label = url } = {}) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (urlMatcher) {
    await page.waitForURL(urlMatcher, { timeout: 10000 });
  } else if (pathname) {
    await page.waitForURL((nextUrl) => nextUrl.pathname === pathname, { timeout: 10000 });
  }
  for (const selector of selectors) {
    await page.waitForSelector(selector);
  }
  await assertNoMojibake(page, label);
}

async function clearSession(page) {
  await page.goto(`${WEB_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.removeItem('nico_next_user');
    localStorage.removeItem('nico_next_access_token');
    localStorage.removeItem('nico_next_refresh_token');
  });
}

async function setSession(page, user) {
  await page.goto(`${WEB_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((nextUser) => {
    localStorage.setItem('nico_next_user', JSON.stringify(nextUser));
    localStorage.setItem('nico_next_access_token', 'fake-access');
    localStorage.setItem('nico_next_refresh_token', 'fake-refresh');
  }, user);
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

    // Root -> Store
    await gotoAndExpect(page, `${WEB_URL}/`, {
      pathname: '/store',
      label: '/ (redirect to /store)',
      selectors: ['[data-store-shell]', 'input[placeholder*="iPhone"]'],
    });

    // Store
    await gotoAndCheck(page, `${WEB_URL}/store`, {
      label: '/store',
      selectors: ['[data-store-shell]', 'input[placeholder*="iPhone"]'],
    });

    // Help
    await gotoAndCheck(page, `${WEB_URL}/help`, {
      label: '/help',
      selectors: ['text=Ayuda', 'input[placeholder*="Buscar problema"]'],
    });

    // Public repair lookup
    await gotoAndCheck(page, `${WEB_URL}/reparacion`, {
      label: '/reparacion',
      selectors: ['label:has-text("Código"), label:has-text("Codigo")', 'input[placeholder*="NR-"]'],
    });

    // Public aliases
    await gotoAndExpect(page, `${WEB_URL}/repair-lookup`, {
      pathname: '/repair-lookup',
      label: '/repair-lookup',
      selectors: ['label:has-text("Código"), label:has-text("Codigo")', 'input[placeholder*="NR-"]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/store/category/repuestos`, {
      urlMatcher: (url) => url.pathname === '/store' && url.searchParams.get('category') === 'repuestos',
      label: '/store/category/:slug (alias)',
      selectors: ['[data-store-shell]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/api/auth/login`, {
      pathname: '/auth/login',
      label: '/api/auth/login (alias)',
      selectors: ['button:has-text("Ingresar")'],
    });

    await gotoAndExpect(page, `${WEB_URL}/api/auth/register`, {
      pathname: '/auth/register',
      label: '/api/auth/register (alias)',
      selectors: ['button:has-text("Crear cuenta")'],
    });

    await gotoAndExpect(page, `${WEB_URL}/api/auth/forgot-password`, {
      pathname: '/auth/forgot-password',
      label: '/api/auth/forgot-password (alias)',
      selectors: ['button:has-text("Enviar enlace")'],
    });

    await gotoAndExpect(page, `${WEB_URL}/api/admin/dashboard`, {
      pathname: '/store',
      label: '/api/* (fallback redirect)',
      selectors: ['[data-store-shell]'],
    });

    await clearSession(page);

    // Protected routes (unauthenticated)
    await gotoAndExpect(page, `${WEB_URL}/admin`, {
      pathname: '/auth/login',
      label: '/admin (sin sesion)',
      selectors: ['button:has-text("Ingresar")'],
    });

    await gotoAndExpect(page, `${WEB_URL}/orders`, {
      pathname: '/auth/login',
      label: '/orders (sin sesion)',
      selectors: ['button:has-text("Ingresar")'],
    });

    // Simulated admin user to validate admin route layout.
    await setSession(page, {
      id: 'e2e-admin',
      name: 'E2E Admin',
      email: 'e2e-admin@example.com',
      role: 'ADMIN',
      emailVerified: true,
    });

    const adminRoutes = [
      { path: '/admin', selectors: ['text=/Panel Admin/i'] },
      { path: '/admin/orders', selectors: ['text=/Pedidos/i'] },
      { path: '/admin/repairs', selectors: ['text=CODIGO', 'text=CLIENTE'] },
      { path: '/admin/productos', selectors: ['text=/Productos/i'] },
      { path: '/admin/productos/crear', selectors: ['text=/Cargando formulario|Datos del producto|Nuevo/i'] },
      { path: '/admin/alertas', selectors: ['text=/Centro de alertas/i'] },
      { path: '/admin/proveedores', selectors: ['text=/Proveedores/i'] },
      { path: '/admin/garantias', selectors: ['text=/Garant/i'] },
      { path: '/admin/garantias/crear', selectors: ['text=/Nuevo incidente de garant/i'] },
      { path: '/admin/contabilidad', selectors: ['text=/Contabilidad/i'] },
      { path: '/admin/configuraciones', selectors: ['text=/Configuraci/i'] },
      { path: '/admin/configuracion/mail', selectors: ['text=/Correo SMTP/i'] },
      { path: '/admin/configuracion/reportes', selectors: ['text=/Reportes autom/i'] },
      { path: '/admin/configuracion/negocio', selectors: ['text=/Datos del negocio/i'] },
      { path: '/admin/configuracion/identidadvisual', selectors: ['text=/Identidad visual/i'] },
      { path: '/admin/configuracion/portadatienda', selectors: ['text=/Portada de tienda/i'] },
      { path: '/admin/calculos', selectors: ['text=/Reglas de c/i'] },
      { path: '/admin/calculos/productos', selectors: ['text=/Reglas de productos/i'] },
      { path: '/admin/precios', selectors: ['text=/Reglas de precios/i'] },
      { path: '/admin/precios/crear', selectors: ['text=/Crear regla/i'] },
      { path: '/admin/gruposmodelos', selectors: ['text=/Grupos de modelos/i'] },
      { path: '/admin/tiposreparacion', selectors: ['text=/Tipos de reparaci/i'] },
      { path: '/admin/catalogodispositivos', selectors: ['text=/Cat/i', 'text=/dispositivos/i'] },
      { path: '/admin/tiposdispositivo', selectors: ['text=/Tipos de dispositivo/i'] },
      { path: '/admin/device-catalog', selectors: ['text=/Cat/i', 'text=Marcas'] },
      { path: '/admin/mail-templates', selectors: ['text=/Plantillas de correo/i'] },
      { path: '/admin/help', selectors: ['text=/Ayuda editable/i'] },
      { path: '/admin/seguridad/2fa', selectors: ['text=/Seguridad 2FA/i'] },
      { path: '/admin/whatsapp', selectors: ['text=/Plantillas WhatsApp/i'] },
      { path: '/admin/whatsapppedidos', selectors: ['text=/Plantillas WhatsApp - Pedidos/i'] },
      { path: '/admin/users', selectors: ['text=/Usuarios/i'] },
    ];

    for (const route of adminRoutes) {
      await gotoAndCheck(page, `${WEB_URL}${route.path}`, {
        label: route.path,
        selectors: route.selectors,
      });
    }

    const adminAliases = [
      { from: '/admin/alerts', to: '/admin/alertas', selectors: ['text=/Centro de alertas/i'] },
      { from: '/admin/products', to: '/admin/productos', selectors: ['text=/Productos/i'] },
      { from: '/admin/products/create', to: '/admin/productos/crear', selectors: ['text=/Cargando formulario|Datos del producto|Nuevo/i'] },
      { from: '/admin/settings', to: '/admin/configuraciones', selectors: ['text=/Configuraci/i'] },
      { from: '/admin/device-types', to: '/admin/tiposdispositivo', selectors: ['text=/Tipos de dispositivo/i'] },
      { from: '/admin/suppliers', to: '/admin/proveedores', selectors: ['text=/Proveedores/i'] },
      { from: '/admin/warranties', to: '/admin/garantias', selectors: ['text=/Garant/i'] },
      { from: '/admin/accounting', to: '/admin/contabilidad', selectors: ['text=/Contabilidad/i'] },
    ];

    for (const alias of adminAliases) {
      await gotoAndExpect(page, `${WEB_URL}${alias.from}`, {
        pathname: alias.to,
        label: `${alias.from} -> ${alias.to}`,
        selectors: alias.selectors,
      });
    }

    // Simulated customer user to validate store protected routes.
    await setSession(page, {
      id: 'e2e-user',
      name: 'E2E User',
      email: 'e2e-user@example.com',
      role: 'USER',
      emailVerified: true,
    });

    await gotoAndExpect(page, `${WEB_URL}/orders`, {
      pathname: '/orders',
      label: '/orders (sesion USER)',
      selectors: ['text=/Mis pedidos/i'],
    });

    await gotoAndExpect(page, `${WEB_URL}/repairs`, {
      pathname: '/repairs',
      label: '/repairs (sesion USER)',
      selectors: ['text=/Mis reparaciones/i'],
    });

    await gotoAndExpect(page, `${WEB_URL}/checkout`, {
      pathname: '/checkout',
      label: '/checkout (sesion USER)',
      selectors: ['text=/Checkout/i'],
    });

    await gotoAndExpect(page, `${WEB_URL}/admin`, {
      pathname: '/store',
      label: '/admin (sesion USER)',
      selectors: ['[data-store-shell]'],
    });

    await clearSession(page);

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

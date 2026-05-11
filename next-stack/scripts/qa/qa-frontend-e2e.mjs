import { spawn } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const WEB_URL = process.env.E2E_WEB_URL || process.env.NEXT_BASE_URL || 'http://127.0.0.1:4174';
const API_BASE_URL = process.env.SMOKE_API_URL || process.env.API_URL || 'http://127.0.0.1:3001';
const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/api`;
const API_HEALTH_URL = `${API_URL}/health`;
const REQUEST_TIMEOUT_MS = Number(process.env.E2E_REQUEST_TIMEOUT_MS || 15000);
const QA_THROTTLE_LIMIT = process.env.QA_THROTTLE_LIMIT || process.env.THROTTLE_LIMIT || '1000';
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

function buildCorsOriginsForFrontendE2E() {
  const requestedOrigin = new URL(WEB_URL).origin;
  const requestedPort = new URL(WEB_URL).port || '4174';
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
    await page.waitForSelector(selector, { timeout: 15000 });
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
    await page.waitForSelector(selector, { timeout: 15000 });
  }
  await assertNoMojibake(page, label);
}

async function clearSession(page) {
  await page.goto(`${WEB_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.removeItem('nico_next_user');
    localStorage.removeItem('nico_next_access_token');
    localStorage.removeItem('nico_next_refresh_token');
    window.dispatchEvent(new Event('nico:auth-changed'));
  });
}

async function setSession(page, session) {
  await page.goto(`${WEB_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((nextSession) => {
    localStorage.setItem('nico_next_user', JSON.stringify(nextSession.user));
    localStorage.setItem('nico_next_access_token', nextSession.accessToken);
    localStorage.setItem('nico_next_refresh_token', nextSession.refreshToken);
    window.dispatchEvent(new Event('nico:auth-changed'));
  }, session);
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function authApiRequest(session, path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function assertApiOk(result, label) {
  if (result.res.ok) return;
  throw new Error(`${label} fallo (${result.res.status}): ${JSON.stringify(result.data).slice(0, 500)}`);
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
    throw new Error('No se pudo loguear admin despues de bootstrap');
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
    throw new Error(`register user fallo (${register.res.status})`);
  }

  const session = await loginSession(email, password);
  if (!session) {
    throw new Error('No se pudo loguear user despues de register');
  }
  return session;
}

function flattenAdminCategories(items = []) {
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    out.push(item);
    out.push(...flattenAdminCategories(Array.isArray(item.children) ? item.children : []));
  }
  return out;
}

async function ensureE2ECategory(session) {
  const slug = 'e2e-qa';
  const name = 'E2E QA';
  const categories = await authApiRequest(session, '/catalog-admin/categories');
  assertApiOk(categories, 'listar categorias fixture');
  const existing = flattenAdminCategories(categories.data.items).find((item) => item.slug === slug);
  if (existing) return existing;

  const created = await authApiRequest(session, '/catalog-admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name, slug, parentId: null, active: true }),
  });
  assertApiOk(created, 'crear categoria fixture');
  return created.data.item;
}

async function ensureE2EInventoryProduct(session, categoryId) {
  const slug = 'e2e-stock-product';
  const payload = {
    name: 'E2E Stock Product',
    slug,
    description: 'Producto fixture para simulaciones E2E de carrito y checkout.',
    price: 12345,
    costPrice: 8000,
    stock: 2,
    active: true,
    featured: true,
    categoryId,
    sku: null,
    barcode: null,
  };

  const listed = await authApiRequest(session, `/catalog-admin/products?q=${encodeURIComponent(slug)}`);
  assertApiOk(listed, 'buscar producto stock fixture');
  const existing = (listed.data.items ?? []).find((item) => item.slug === slug);
  if (existing) {
    const updated = await authApiRequest(session, `/catalog-admin/products/${encodeURIComponent(existing.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    assertApiOk(updated, 'actualizar producto stock fixture');
    return updated.data.item;
  }

  const created = await authApiRequest(session, '/catalog-admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  assertApiOk(created, 'crear producto stock fixture');
  return created.data.item;
}

async function ensureE2ESupplier(session) {
  const name = 'E2E Encargues';
  const listed = await authApiRequest(session, `/admin/providers?q=${encodeURIComponent(name)}`);
  assertApiOk(listed, 'buscar proveedor fixture');
  const existing = (listed.data.items ?? []).find((item) => item.name === name);
  if (existing) return existing;

  const created = await authApiRequest(session, '/admin/providers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      active: true,
      searchPriority: 999,
      searchEnabled: false,
      searchInRepairs: false,
      searchMode: 'html',
      searchEndpoint: null,
      searchConfigJson: null,
      notes: 'Proveedor fixture para QA E2E.',
    }),
  });
  assertApiOk(created, 'crear proveedor fixture');
  return created.data.item;
}

async function ensureE2ESpecialOrderProfile(session, supplierId) {
  const name = 'E2E Encargues';
  const listed = await authApiRequest(session, '/catalog-admin/special-order-profiles');
  assertApiOk(listed, 'listar perfiles de encargue fixture');
  const payload = {
    supplierId,
    name,
    active: true,
    defaultUsdRate: 1000,
    defaultShippingUsd: 10,
    fallbackMarginPercent: 20,
    defaultColorSheetUrl: null,
    rememberColorSheet: false,
    requiresColorVariants: true,
  };
  const existing = (listed.data.items ?? []).find((item) => item.name === name);
  if (existing) {
    const updated = await authApiRequest(session, `/catalog-admin/special-order-profiles/${encodeURIComponent(existing.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    assertApiOk(updated, 'actualizar perfil de encargue fixture');
    return updated.data.item;
  }

  const created = await authApiRequest(session, '/catalog-admin/special-order-profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  assertApiOk(created, 'crear perfil de encargue fixture');
  return created.data.item;
}

async function applyE2ESpecialOrderImport(session, profileId) {
  const rawText = `
*SAMSUNG*
Samsung E2E S25 12/1TB 5G DS $1000
`;
  const colorCsvText = `
SAMSUNG;;;
Samsung E2E S25 1TB 5G DS;Negro;;Stock
Samsung E2E S25 1TB 5G DS;Azul;;Sin Stock
`;
  const applied = await authApiRequest(session, '/catalog-admin/special-order-imports/apply', {
    method: 'POST',
    body: JSON.stringify({
      profileId,
      rawText,
      usdRate: 1000,
      shippingUsd: 10,
      colorCsvText,
      excludedSectionKeys: [],
      excludedSourceKeys: [],
      excludedRowIds: [],
      rememberExclusions: false,
    }),
  });
  assertApiOk(applied, 'aplicar importacion de encargue fixture');
}

async function findPublicProductByQuery(query, predicate) {
  const result = await apiRequest(`/store/products?q=${encodeURIComponent(query)}&pageSize=10`);
  assertApiOk(result, `buscar producto publico ${query}`);
  const item = (result.data.items ?? []).find(predicate);
  if (!item) throw new Error(`No se encontro producto publico fixture para ${query}`);
  return item;
}

async function ensureE2EStoreFixtures(adminSession) {
  const category = await ensureE2ECategory(adminSession);
  const inventoryProduct = await ensureE2EInventoryProduct(adminSession, category.id);
  const supplier = await ensureE2ESupplier(adminSession);
  const profile = await ensureE2ESpecialOrderProfile(adminSession, supplier.id);
  await applyE2ESpecialOrderImport(adminSession, profile.id);

  const settings = await authApiRequest(adminSession, '/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify({
      items: [
        {
          key: 'shop_phone',
          value: '+5493410000000',
          group: 'business',
          label: 'Telefono WhatsApp',
          type: 'text',
        },
      ],
    }),
  });
  assertApiOk(settings, 'configurar WhatsApp local fixture');

  const publicInventoryProduct = await findPublicProductByQuery(
    inventoryProduct.name,
    (item) => item.slug === inventoryProduct.slug && item.fulfillmentMode === 'INVENTORY',
  );
  const specialOrderProduct = await findPublicProductByQuery(
    'Samsung E2E S25',
    (item) => item.fulfillmentMode === 'SPECIAL_ORDER' && item.name.includes('Samsung E2E S25'),
  );
  const availableSpecialOrderColor = specialOrderProduct.colorOptions.find(
    (option) => option.active && option.supplierAvailability === 'IN_STOCK',
  );
  assert(availableSpecialOrderColor, 'El producto por encargue fixture no tiene color disponible');

  return {
    category,
    inventoryProduct: publicInventoryProduct,
    specialOrderProduct,
    availableSpecialOrderColor,
  };
}

async function clearCartStorage(page) {
  await page.evaluate(() => {
    localStorage.removeItem('nico_next_cart');
    window.dispatchEvent(new Event('nico-next-cart-changed'));
  });
}

async function exerciseStoreCatalogInteractions(page, fixtures) {
  await gotoAndCheck(page, `${WEB_URL}/store`, {
    label: '/store catalog interactions',
    selectors: ['[data-store-shell]', 'input[placeholder*="iPhone"]'],
  });

  await page.locator('.store-desktop-search input').fill(fixtures.inventoryProduct.name);
  await page.locator('.store-filter-grid__apply').click();
  await page.waitForURL((url) => url.pathname === '/store' && url.searchParams.get('q') === fixtures.inventoryProduct.name, {
    timeout: 10000,
  });
  await page.locator('.product-card').filter({ hasText: fixtures.inventoryProduct.name }).first().waitFor({ timeout: 15000 });

  await page.locator('.store-categories__trigger--category').click();
  await page.locator('.store-category-picker__search input').fill(fixtures.category.name);
  await page.locator('.store-category-option').filter({ hasText: fixtures.category.name }).first().click();
  await page.locator('.store-category-child').filter({ hasText: `Todo en ${fixtures.category.name}` }).first().click();
  await page.waitForURL((url) => url.pathname === '/store' && url.searchParams.get('category') === fixtures.category.slug, {
    timeout: 10000,
  });

  await page.locator('button[aria-label="Ordenar productos"]').click();
  const priceAscendingOption = page.locator('button[role="option"]').filter({ hasText: 'Menor precio' }).first();
  await priceAscendingOption.waitFor({ state: 'attached', timeout: 10000 });
  await priceAscendingOption.evaluate((option) => option.click());
  await page.waitForURL((url) => url.pathname === '/store' && url.searchParams.get('sort') === 'price_asc', {
    timeout: 10000,
  });

  await assertNoMojibake(page, '/store catalog interactions');
}

async function exerciseInventoryCartCheckoutFlow(page, fixtures) {
  await clearCartStorage(page);
  await gotoAndCheck(page, `${WEB_URL}/store?q=${encodeURIComponent(fixtures.inventoryProduct.name)}`, {
    label: '/store inventory add to cart',
    selectors: ['[data-store-shell]'],
  });

  const productCard = page.locator('.product-card').filter({ hasText: fixtures.inventoryProduct.name }).first();
  await productCard.waitFor({ timeout: 15000 });
  await productCard.locator('button[aria-label="Agregar al carrito"]').click();
  await page.waitForFunction(
    (productId) => {
      const items = JSON.parse(localStorage.getItem('nico_next_cart') || '[]');
      return Array.isArray(items) && items.some((item) => item.productId === productId && item.quantity === 1);
    },
    fixtures.inventoryProduct.id,
    { timeout: 10000 },
  );

  await gotoAndCheck(page, `${WEB_URL}/cart`, {
    label: '/cart inventory line',
    selectors: ['text=/Carrito/i', `text=${fixtures.inventoryProduct.name}`],
  });

  const line = page.locator('.cart-line-item').filter({ hasText: fixtures.inventoryProduct.name }).first();
  const plus = line.locator('button[aria-label="Sumar"]');
  await plus.click();
  await line.locator('.quantity-stepper__value').filter({ hasText: '2' }).waitFor({ timeout: 10000 });
  await plus.dispatchEvent('click');
  await page.locator('.cart-stock-popup').filter({ hasText: 'Stock maximo alcanzado' }).waitFor({ timeout: 10000 });

  await page.getByRole('button', { name: /Finalizar compra/i }).click();
  await page.waitForURL((url) => url.pathname === '/checkout', { timeout: 10000 });
  await page.waitForSelector('text=/Pago/i', { timeout: 15000 });
  await page.getByRole('button', { name: /Confirmar pedido/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith('/orders/'), { timeout: 15000 });
  await page.waitForSelector('text=/Detalle del pedido/i', { timeout: 15000 });
  await page.waitForSelector(`text=${fixtures.inventoryProduct.name}`, { timeout: 15000 });
}

async function exerciseSpecialOrderReservationFlow(page, fixtures) {
  await clearCartStorage(page);
  await gotoAndCheck(page, `${WEB_URL}/store?q=${encodeURIComponent('Samsung E2E S25')}`, {
    label: '/store special order card',
    selectors: ['[data-store-shell]'],
  });

  const productCard = page.locator('.product-card').filter({ hasText: fixtures.specialOrderProduct.name }).first();
  await productCard.waitFor({ timeout: 15000 });
  await productCard.getByRole('button', { name: /Encargar/i }).click();
  await page.waitForURL((url) => url.pathname === `/store/${fixtures.specialOrderProduct.slug}`, { timeout: 10000 });
  await page.waitForSelector('text=/Elegi un color/i', { timeout: 15000 });
  await page.getByRole('button', { name: new RegExp(`^${fixtures.availableSpecialOrderColor.label}$`, 'i') }).click();
  await page.getByRole('button', { name: /Encargar ahora/i }).click();
  await page.waitForURL((url) => url.pathname === '/checkout' && url.searchParams.get('mode') === 'special-order', {
    timeout: 10000,
  });
  await page.waitForSelector('text=/Reserva por WhatsApp/i', { timeout: 15000 });

  const confirm = page.getByRole('button', { name: /Confirmar reserva/i });
  assert(await confirm.isDisabled(), 'La reserva por encargue debe exigir aceptar condiciones antes de confirmar');
  await page.getByRole('checkbox').check();
  assert(!(await confirm.isDisabled()), 'La reserva por encargue no habilito confirmar despues de aceptar condiciones');
  await confirm.click();
  await page.waitForURL((url) => url.pathname.startsWith('/orders/') && url.searchParams.get('reservation') === '1', {
    timeout: 15000,
  });
  await page.waitForSelector('text=/Finaliza la gestion por WhatsApp/i', { timeout: 15000 });
  await page.waitForSelector('text=/Reserva por encargo/i', { timeout: 15000 });
}

async function main() {
  let apiProcess;
  let preview;
  let browser;

  try {
    const apiUp = await isUp(API_HEALTH_URL);
    if (!apiUp) {
      console.log(`[E2E] Starting API: ${API_HEALTH_URL}`);
      apiProcess = startNpm(['run', 'dev', '--workspace', '@nico/api'], {
        env: {
          ...process.env,
          CORS_ORIGINS: buildCorsOriginsForFrontendE2E(),
          THROTTLE_LIMIT: QA_THROTTLE_LIMIT,
        },
      });
      await waitFor(API_HEALTH_URL);
    } else {
      console.log('[E2E] API already running.');
    }

    const webUp = await isUp(`${WEB_URL}/`);
    if (!webUp) {
      console.log('[E2E] Building web...');
      await runNpm(['run', 'build', '--workspace', '@nico/web'], {
        env: {
          ...process.env,
          VITE_API_URL: API_BASE_URL,
        },
      });
      console.log('[E2E] Starting web preview...');
      preview = startNpm(['run', 'preview:prod', '--workspace', '@nico/web']);
      await waitFor(`${WEB_URL}/`);
    } else {
      console.log('[E2E] Web already running.');
    }

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

    // Public aliases
    await gotoAndExpect(page, `${WEB_URL}/tienda`, {
      pathname: '/store',
      label: '/tienda (alias)',
      selectors: ['[data-store-shell]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/ayuda`, {
      pathname: '/help',
      label: '/ayuda (alias)',
      selectors: ['text=Ayuda'],
    });

    await gotoAndExpect(page, `${WEB_URL}/carrito`, {
      pathname: '/cart',
      label: '/carrito (alias)',
      selectors: ['text=/Carrito/i'],
    });

    await gotoAndExpect(page, `${WEB_URL}/login`, {
      pathname: '/auth/login',
      label: '/login (alias)',
      selectors: ['button:has-text("Ingresar")'],
    });

    await gotoAndExpect(page, `${WEB_URL}/registro`, {
      pathname: '/auth/register',
      label: '/registro (alias)',
      selectors: ['button:has-text("Crear cuenta")'],
    });

    await gotoAndExpect(page, `${WEB_URL}/olvide-contrasena`, {
      pathname: '/auth/forgot-password',
      label: '/olvide-contrasena (alias)',
      selectors: ['button:has-text("Enviar enlace")'],
    });

    await gotoAndCheck(page, `${WEB_URL}/help`, {
      label: '/help',
      selectors: ['text=Ayuda', 'text=/Buscar en ayuda/i'],
    });

    await gotoAndCheck(page, `${WEB_URL}/reparacion`, {
      label: '/reparacion',
      selectors: ['text=/C[oó]digo/i', 'input[placeholder*="NR-"]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/repair-lookup`, {
      pathname: '/repair-lookup',
      label: '/repair-lookup',
      selectors: ['text=/C[oó]digo/i', 'input[placeholder*="NR-"]'],
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

    // Protected routes (without session)
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

    // Real admin session
    const adminSession = await createAdminSession();
    const fixtures = await ensureE2EStoreFixtures(adminSession);
    await setSession(page, adminSession);

    const adminRoutes = [
      { path: '/admin', selectors: ['text=/Panel Admin/i'] },
      { path: '/admin/orders', selectors: ['[data-admin-orders-page]'] },
      { path: '/admin/repairs', selectors: ['[data-admin-repairs-page]'] },
      { path: '/admin/repairs/create', selectors: ['[data-admin-repair-create-page]'] },
      { path: '/admin/categorias', selectors: ['text=/Categor/i', 'input[placeholder*="Ej: Fundas"]'] },
      { path: '/admin/categorias/crear', selectors: ['text=/Categor/i', 'input[placeholder*="Ej: Fundas"]'] },
      { path: '/admin/productos', selectors: ['text=/Productos/i'] },
      { path: '/admin/productos/crear', selectors: ['text=/Cargando formulario|Datos del producto|Nuevo/i'] },
      { path: '/admin/ventas-rapidas', selectors: ['text=/Venta r.pida/i', '[data-qa="quick-sale-scan-code"]'] },
      { path: '/admin/ventas-rapidas/historial', selectors: ['text=/Historial de ventas/i'] },
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
      { path: '/admin/seguridad/2fa', selectors: ['[data-admin-2fa-page]'] },
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
      { from: '/admin/configuracion', to: '/admin/configuraciones', selectors: ['text=/Configuraci/i'] },
      { from: '/admin/configuracion/identidad-visual', to: '/admin/configuracion/identidadvisual', selectors: ['text=/Identidad visual/i'] },
      { from: '/admin/configuracion/portada-tienda', to: '/admin/configuracion/portadatienda', selectors: ['text=/Portada de tienda/i'] },
      { from: '/admin/products', to: '/admin/productos', selectors: ['text=/Productos/i'] },
      { from: '/admin/products/create', to: '/admin/productos/crear', selectors: ['text=/Cargando formulario|Datos del producto|Nuevo/i'] },
      { from: '/admin/settings', to: '/admin/configuraciones', selectors: ['text=/Configuraci/i'] },
      { from: '/admin/device-types', to: '/admin/tiposdispositivo', selectors: ['text=/Tipos de dispositivo/i'] },
      { from: '/admin/usuarios', to: '/admin/users', selectors: ['text=/Usuarios/i'] },
      { from: '/admin/grupos-modelos', to: '/admin/gruposmodelos', selectors: ['text=/Grupos de modelos/i'] },
      { from: '/admin/tipos-reparacion', to: '/admin/tiposreparacion', selectors: ['text=/Tipos de reparaci/i'] },
      { from: '/admin/tipos-dispositivo', to: '/admin/tiposdispositivo', selectors: ['text=/Tipos de dispositivo/i'] },
      { from: '/admin/catalogo-dispositivos', to: '/admin/catalogodispositivos', selectors: ['text=/Cat/i', 'text=/dispositivos/i'] },
      { from: '/admin/whatsapp-pedidos', to: '/admin/whatsapppedidos', selectors: ['text=/Plantillas WhatsApp - Pedidos/i'] },
      { from: '/admin/suppliers', to: '/admin/proveedores', selectors: ['text=/Proveedores/i'] },
      { from: '/admin/warranties', to: '/admin/garantias', selectors: ['text=/Garant/i'] },
      { from: '/admin/accounting', to: '/admin/contabilidad', selectors: ['text=/Contabilidad/i'] },
      { from: '/admin/pedidos', to: '/admin/orders', selectors: ['[data-admin-orders-page]'] },
      { from: '/admin/reparaciones', to: '/admin/repairs', selectors: ['[data-admin-repairs-page]'] },
      { from: '/admin/reparaciones/crear', to: '/admin/repairs/create', selectors: ['[data-admin-repair-create-page]'] },
    ];

    for (const alias of adminAliases) {
      await gotoAndExpect(page, `${WEB_URL}${alias.from}`, {
        pathname: alias.to,
        label: `${alias.from} -> ${alias.to}`,
        selectors: alias.selectors,
      });
    }

    await gotoAndCheck(page, `${WEB_URL}/admin/repairs`, {
      label: '/admin/repairs create CTA',
      selectors: ['[data-admin-repairs-page]', '[data-admin-repair-create-cta]'],
    });
    await page.click('[data-admin-repair-create-cta]');
    await page.waitForURL((url) => url.pathname === '/admin/repairs/create', { timeout: 10000 });
    await page.waitForSelector('[data-admin-repair-create-page]', { timeout: 15000 });

    // Real customer session
    const userSession = await createUserSession();
    await setSession(page, userSession);

    await gotoAndExpect(page, `${WEB_URL}/orders`, {
      pathname: '/orders',
      label: '/orders (sesion USER)',
      selectors: ['[data-my-orders-page]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/repairs`, {
      pathname: '/repairs',
      label: '/repairs (sesion USER)',
      selectors: ['[data-my-repairs-page]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/checkout`, {
      pathname: '/checkout',
      label: '/checkout (sesion USER)',
      selectors: ['text=/Checkout/i'],
    });

    await gotoAndExpect(page, `${WEB_URL}/mi-cuenta`, {
      pathname: '/mi-cuenta',
      label: '/mi-cuenta (sesion USER)',
      selectors: ['[data-my-account-page]'],
    });

    await gotoAndExpect(page, `${WEB_URL}/admin`, {
      pathname: '/store',
      label: '/admin (sesion USER)',
      selectors: ['[data-store-shell]'],
    });

    await exerciseStoreCatalogInteractions(page, fixtures);
    await exerciseInventoryCartCheckoutFlow(page, fixtures);
    await exerciseSpecialOrderReservationFlow(page, fixtures);

    await clearSession(page);

    console.log('\n[E2E] Frontend smoke OK (real backend session + habitual interactions)');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (preview) await killTree(preview);
    if (apiProcess) await killTree(apiProcess);
  }
}

main().catch((err) => {
  console.error('\n[E2E] Frontend smoke failed:', err);
  process.exit(1);
});

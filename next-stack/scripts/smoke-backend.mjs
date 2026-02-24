const baseUrl = (process.env.SMOKE_API_URL || process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const api = `${baseUrl}/api`;
const adminBootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY || 'nico-dev-admin';
const unique = Date.now().toString(36);
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || `smoke-admin-${unique}@local.test`;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'smokePass123!';
const adminName = process.env.SMOKE_ADMIN_NAME || 'Smoke Admin';

function logStep(name, detail) {
  console.log(`[smoke:backend] ${name}`, detail ?? '');
}

async function req(path, init = {}) {
  const res = await fetch(`${api}${path}`, {
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

function assert(condition, message, context) {
  if (!condition) {
    const err = new Error(message);
    err.context = context;
    throw err;
  }
}

function extractTokens(payload) {
  const root = payload && typeof payload === 'object' ? payload : {};
  const nested = root && typeof root.tokens === 'object' ? root.tokens : null;
  const src = nested ?? root;
  return {
    accessToken: typeof src.accessToken === 'string' ? src.accessToken : null,
    refreshToken: typeof src.refreshToken === 'string' ? src.refreshToken : null,
  };
}

async function main() {
  const startedAt = Date.now();
  logStep('START', { api });

  const health = await req('/health');
  assert(health.res.ok, 'Health HTTP error', { status: health.res.status, body: health.data });
  assert(health.data?.ok === true, 'Health payload invalido', health.data);
  logStep('health', { ok: true });

  const bootstrap = await req('/auth/bootstrap-admin', {
    method: 'POST',
    body: JSON.stringify({
      setupKey: adminBootstrapKey,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    }),
  });
  assert(bootstrap.res.ok, 'bootstrap-admin fallo', { status: bootstrap.res.status, body: bootstrap.data });
  logStep('bootstrap-admin', { email: adminEmail });

  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  assert(login.res.ok, 'login fallo', { status: login.res.status, body: login.data });
  const loginTokens = extractTokens(login.data);
  assert(loginTokens.accessToken && loginTokens.refreshToken, 'login sin tokens', login.data);
  const accessToken = loginTokens.accessToken;
  const refreshToken = loginTokens.refreshToken;
  logStep('login', { ok: true });

  const me = await req('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(me.res.ok, 'auth/me fallo', { status: me.res.status, body: me.data });
  assert(me.data?.user?.email === adminEmail, 'auth/me email no coincide', me.data);
  logStep('auth/me', { role: me.data?.user?.role });

  const refresh = await req('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  assert(refresh.res.ok, 'refresh fallo', { status: refresh.res.status, body: refresh.data });
  const refreshTokens = extractTokens(refresh.data);
  assert(refreshTokens.accessToken && refreshTokens.refreshToken, 'refresh sin tokens', refresh.data);
  logStep('auth/refresh', { ok: true });

  const categories = await req('/store/categories');
  assert(categories.res.ok, 'store/categories fallo', { status: categories.res.status, body: categories.data });
  assert(Array.isArray(categories.data?.items), 'categories payload invalido', categories.data);
  logStep('store/categories', { count: categories.data.items.length });

  const products = await req('/store/products?page=1&pageSize=5');
  assert(products.res.ok, 'store/products fallo', { status: products.res.status, body: products.data });
  assert(Array.isArray(products.data?.items), 'products payload invalido', products.data);
  logStep('store/products', {
    count: products.data.items.length,
    total: typeof products.data?.total === 'number' ? products.data.total : undefined,
  });

  const cartInvalid = await req('/cart/quote', {
    method: 'POST',
    body: JSON.stringify({ items: [{ productId: '', quantity: 0 }] }),
  });
  assert(cartInvalid.res.ok, 'cart/quote HTTP fallo', { status: cartInvalid.res.status, body: cartInvalid.data });
  assert(Array.isArray(cartInvalid.data?.errors), 'cart/quote invalido no devolvio errors', cartInvalid.data);
  logStep('cart/quote invalid', { errors: cartInvalid.data.errors.length });

  let createdOrderId = null;
  const firstBuyable = products.data.items.find((p) => p?.id);
  if (firstBuyable) {
    const cartValid = await req('/cart/quote', {
      method: 'POST',
      body: JSON.stringify({ items: [{ productId: firstBuyable.id, quantity: 1 }] }),
    });
    assert(cartValid.res.ok, 'cart/quote valido fallo', { status: cartValid.res.status, body: cartValid.data });
    assert(Array.isArray(cartValid.data?.items), 'cart/quote valido payload invalido', cartValid.data);
    logStep('cart/quote valid', { items: cartValid.data.items.length, subtotal: cartValid.data?.totals?.subtotal });

    const checkout = await req('/orders/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
      body: JSON.stringify({
        items: [{ productId: firstBuyable.id, quantity: 1 }],
        paymentMethod: 'EFECTIVO',
      }),
    });
    assert(checkout.res.ok, 'orders/checkout fallo', { status: checkout.res.status, body: checkout.data });
    const checkoutOrder = checkout.data?.item ?? checkout.data;
    assert(checkoutOrder?.id, 'orders/checkout sin item.id', checkout.data);
    createdOrderId = checkoutOrder.id;
    logStep('orders/checkout', { orderId: createdOrderId, total: checkoutOrder.total });
  } else {
    logStep('orders/checkout', { skipped: 'sin productos disponibles' });
  }

  const orderMy = await req('/orders/my', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(orderMy.res.ok, 'orders/my fallo', { status: orderMy.res.status, body: orderMy.data });
  assert(Array.isArray(orderMy.data?.items), 'orders/my payload invalido', orderMy.data);
  logStep('orders/my', { count: orderMy.data.items.length });

  if (createdOrderId) {
    const orderMyDetail = await req(`/orders/my/${encodeURIComponent(createdOrderId)}`, {
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    });
    assert(orderMyDetail.res.ok, 'orders/my/:id fallo', { status: orderMyDetail.res.status, body: orderMyDetail.data });
    assert(orderMyDetail.data?.item?.id === createdOrderId, 'orders/my/:id no coincide', orderMyDetail.data);
    logStep('orders/my/:id', { ok: true });
  }

  const adminPing = await req('/admin/ping', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(adminPing.res.ok, 'admin/ping fallo', { status: adminPing.res.status, body: adminPing.data });
  logStep('admin/ping', { ok: true });

  const adminDashboard = await req('/admin/dashboard', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(adminDashboard.res.ok, 'admin/dashboard fallo', { status: adminDashboard.res.status, body: adminDashboard.data });
  logStep('admin/dashboard', { ok: true });

  const adminSettings = await req('/admin/settings', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(adminSettings.res.ok, 'admin/settings fallo', { status: adminSettings.res.status, body: adminSettings.data });
  assert(Array.isArray(adminSettings.data?.items), 'admin/settings payload invalido', adminSettings.data);
  logStep('admin/settings', { count: adminSettings.data.items.length });

  const help = await req('/help');
  assert(help.res.ok, 'help publico fallo', { status: help.res.status, body: help.data });
  assert(Array.isArray(help.data?.items), 'help payload invalido', help.data);
  logStep('help', { count: help.data.items.length });

  const pricingResolve = await req('/pricing/repairs/resolve?deviceBrand=Samsung&deviceModel=A10&issueLabel=Modulo', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(pricingResolve.res.ok, 'pricing resolve fallo', { status: pricingResolve.res.status, body: pricingResolve.data });
  assert(typeof pricingResolve.data?.matched === 'boolean', 'pricing resolve payload invalido', pricingResolve.data);
  logStep('pricing/repairs/resolve', { matched: pricingResolve.data.matched });

  const createRepair = await req('/repairs/admin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({
      customerName: 'Cliente Smoke',
      customerPhone: '+5491111111111',
      deviceBrand: 'Samsung',
      deviceModel: 'A10',
      issueLabel: 'Modulo',
      quotedPrice: 25000,
      notes: 'Creado por smoke test',
    }),
  });
  assert(createRepair.res.ok, 'repairs/admin create fallo', { status: createRepair.res.status, body: createRepair.data });
  const repairId = createRepair.data?.id || createRepair.data?.item?.id;
  assert(repairId, 'repairs/admin create sin id', createRepair.data);
  logStep('repairs/admin create', { repairId });

  const repairsAdminList = await req('/repairs/admin', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(repairsAdminList.res.ok, 'repairs/admin list fallo', { status: repairsAdminList.res.status, body: repairsAdminList.data });
  assert(Array.isArray(repairsAdminList.data?.items), 'repairs/admin list payload invalido', repairsAdminList.data);
  logStep('repairs/admin list', { count: repairsAdminList.data.items.length });

  const repairDetail = await req(`/repairs/admin/${encodeURIComponent(repairId)}`, {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(repairDetail.res.ok, 'repairs/admin/:id fallo', { status: repairDetail.res.status, body: repairDetail.data });
  assert(repairDetail.data?.item?.id === repairId, 'repairs/admin/:id no coincide', repairDetail.data);
  logStep('repairs/admin/:id', { ok: true });

  const repairUpdate = await req(`/repairs/admin/${encodeURIComponent(repairId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({
      status: 'DIAGNOSING',
      finalPrice: 0,
      notes: 'Actualizado por smoke test',
    }),
  });
  assert(repairUpdate.res.ok, 'repairs/admin PATCH fallo', { status: repairUpdate.res.status, body: repairUpdate.data });
  assert(repairUpdate.data?.item?.status === 'DIAGNOSING', 'repairs/admin PATCH no aplico estado', repairUpdate.data);
  logStep('repairs/admin PATCH', { status: repairUpdate.data.item.status });

  const whatsappTemplates = await req('/admin/whatsapp-templates', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(whatsappTemplates.res.ok, 'admin/whatsapp-templates fallo', { status: whatsappTemplates.res.status, body: whatsappTemplates.data });
  assert(Array.isArray(whatsappTemplates.data?.items), 'whatsapp templates payload invalido', whatsappTemplates.data);
  logStep('admin/whatsapp-templates', { count: whatsappTemplates.data.items.length });

  const elapsedMs = Date.now() - startedAt;
  logStep('DONE', { elapsedMs });
}

main().catch((error) => {
  console.error('[smoke:backend] FAIL', {
    message: error instanceof Error ? error.message : String(error),
    context: error && typeof error === 'object' ? error.context : undefined,
  });
  process.exit(1);
});

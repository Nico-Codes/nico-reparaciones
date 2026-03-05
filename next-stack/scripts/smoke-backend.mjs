const baseUrl = (process.env.SMOKE_API_URL || process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const api = `${baseUrl}/api`;
const adminBootstrapKey = process.env.ADMIN_BOOTSTRAP_KEY || 'nico-dev-admin';
const unique = Date.now().toString(36);
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || `smoke-admin-${unique}@local.test`;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'smokePass123!';
const adminName = process.env.SMOKE_ADMIN_NAME || 'Smoke Admin';
const MOJIBAKE_PATTERN = /\u00C3[\u0080-\u00BF]|\u00C2[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]{1,2}|\uFFFD/u;

function logStep(name, detail) {
  console.log(`[smoke:backend] ${name}`, detail ?? '');
}

async function req(path, init = {}) {
  const { allowMojibake = false, ...fetchInit } = init;
  const res = await fetch(`${api}${path}`, {
    ...fetchInit,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(fetchInit.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!allowMojibake) {
    const hits = findMojibakePaths(data);
    if (hits.length > 0) {
      const err = new Error(`Mojibake detectado en ${path}`);
      err.context = { hits: hits.slice(0, 10), sampleSize: hits.length };
      throw err;
    }
  }
  return { res, data };
}

function findMojibakePaths(value, currentPath = '$', hits = [], seen = new Set()) {
  if (value == null) return hits;
  if (typeof value === 'string') {
    if (MOJIBAKE_PATTERN.test(value)) hits.push({ path: currentPath, value: value.slice(0, 180) });
    return hits;
  }
  if (typeof value !== 'object') return hits;
  if (seen.has(value)) return hits;
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      findMojibakePaths(value[i], `${currentPath}[${i}]`, hits, seen);
      if (hits.length >= 30) break;
    }
    return hits;
  }

  for (const [key, nested] of Object.entries(value)) {
    findMojibakePaths(nested, `${currentPath}.${key}`, hits, seen);
    if (hits.length >= 30) break;
  }
  return hits;
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
  const productsTotal =
    typeof products.data?.total === 'number'
      ? products.data.total
      : typeof products.data?.meta?.total === 'number'
        ? products.data.meta.total
        : undefined;
  logStep('store/products', {
    count: products.data.items.length,
    total: productsTotal,
  });

  const cartInvalid = await req('/cart/quote', {
    method: 'POST',
    body: JSON.stringify({ items: [{ productId: '', quantity: 0 }] }),
  });
  assert(cartInvalid.res.ok, 'cart/quote HTTP fallo', { status: cartInvalid.res.status, body: cartInvalid.data });
  assert(Array.isArray(cartInvalid.data?.errors), 'cart/quote invalido no devolvio errors', cartInvalid.data);
  logStep('cart/quote invalid', { errors: cartInvalid.data.errors.length });

  let createdOrderId = null;
  let quickSaleOrderId = null;
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

    const quickSale = await req('/orders/admin/quick-sales/confirm', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
      body: JSON.stringify({
        items: [{ productId: firstBuyable.id, quantity: 1 }],
        paymentMethod: 'local',
        customerName: 'Cliente mostrador',
        customerPhone: '+5491111111111',
        notes: 'Smoke quick sale',
      }),
    });
    assert(quickSale.res.ok, 'orders/admin/quick-sales/confirm fallo', { status: quickSale.res.status, body: quickSale.data });
    assert(quickSale.data?.item?.isQuickSale === true, 'quick sale sin flag isQuickSale', quickSale.data);
    assert(quickSale.data?.item?.status === 'ENTREGADO', 'quick sale sin estado ENTREGADO', quickSale.data);
    quickSaleOrderId = quickSale.data.item.id;
    logStep('orders/admin/quick-sales/confirm', { orderId: quickSaleOrderId });
  } else {
    logStep('orders/checkout', { skipped: 'sin productos disponibles' });
  }

  const orderMy = await req('/orders/my', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(orderMy.res.ok, 'orders/my fallo', { status: orderMy.res.status, body: orderMy.data });
  assert(Array.isArray(orderMy.data?.items), 'orders/my payload invalido', orderMy.data);
  logStep('orders/my', { count: orderMy.data.items.length });

  const ordersAdmin = await req('/orders/admin', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(ordersAdmin.res.ok, 'orders/admin fallo', { status: ordersAdmin.res.status, body: ordersAdmin.data });
  assert(Array.isArray(ordersAdmin.data?.items), 'orders/admin payload invalido', ordersAdmin.data);
  logStep('orders/admin', { count: ordersAdmin.data.items.length });

  const today = new Date().toISOString().slice(0, 10);
  const quickSalesHistory = await req(`/orders/admin/quick-sales?from=${today}&to=${today}`, {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(quickSalesHistory.res.ok, 'orders/admin/quick-sales fallo', {
    status: quickSalesHistory.res.status,
    body: quickSalesHistory.data,
  });
  assert(Array.isArray(quickSalesHistory.data?.items), 'orders/admin/quick-sales payload invalido', quickSalesHistory.data);
  assert(Array.isArray(quickSalesHistory.data?.paymentMethods), 'orders/admin/quick-sales sin paymentMethods', quickSalesHistory.data);
  if (quickSaleOrderId) {
    assert(
      quickSalesHistory.data.items.some((row) => row?.id === quickSaleOrderId),
      'orders/admin/quick-sales no incluye quick sale creada',
      { quickSaleOrderId, count: quickSalesHistory.data.items.length },
    );
  }
  logStep('orders/admin/quick-sales', { count: quickSalesHistory.data.items.length });

  if (createdOrderId) {
    const orderMyDetail = await req(`/orders/my/${encodeURIComponent(createdOrderId)}`, {
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    });
    assert(orderMyDetail.res.ok, 'orders/my/:id fallo', { status: orderMyDetail.res.status, body: orderMyDetail.data });
    assert(orderMyDetail.data?.item?.id === createdOrderId, 'orders/my/:id no coincide', orderMyDetail.data);
    logStep('orders/my/:id', { ok: true });

    const orderAdminDetail = await req(`/orders/admin/${encodeURIComponent(createdOrderId)}`, {
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    });
    assert(orderAdminDetail.res.ok, 'orders/admin/:id fallo', {
      status: orderAdminDetail.res.status,
      body: orderAdminDetail.data,
    });
    assert(orderAdminDetail.data?.item?.id === createdOrderId, 'orders/admin/:id no coincide', orderAdminDetail.data);
    logStep('orders/admin/:id', { ok: true });

    const orderStatusUpdate = await req(`/orders/admin/${encodeURIComponent(createdOrderId)}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
      body: JSON.stringify({ status: 'CONFIRMADO' }),
    });
    assert(orderStatusUpdate.res.ok, 'orders/admin/:id/status fallo', {
      status: orderStatusUpdate.res.status,
      body: orderStatusUpdate.data,
    });
    assert(orderStatusUpdate.data?.item?.status === 'CONFIRMADO', 'orders/admin/:id/status no aplico estado', orderStatusUpdate.data);
    logStep('orders/admin/:id/status', { status: orderStatusUpdate.data.item.status });
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

  const adminUsers = await req('/admin/users?q=smoke-admin', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(adminUsers.res.ok, 'admin/users fallo', { status: adminUsers.res.status, body: adminUsers.data });
  assert(Array.isArray(adminUsers.data?.items), 'admin/users payload invalido', adminUsers.data);
  assert(adminUsers.data.items.some((u) => u?.email === adminEmail), 'admin/users no encontro admin smoke', {
    adminEmail,
    usersCount: adminUsers.data.items.length,
  });
  logStep('admin/users', { count: adminUsers.data.items.length });

  const smtpStatus = await req('/admin/smtp/status', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(smtpStatus.res.ok, 'admin/smtp/status fallo', { status: smtpStatus.res.status, body: smtpStatus.data });
  assert(typeof smtpStatus.data?.smtpHealth?.status === 'string', 'admin/smtp/status payload invalido', smtpStatus.data);
  logStep('admin/smtp/status', { status: smtpStatus.data.smtpHealth.status });

  const mailTemplates = await req('/admin/mail-templates', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(mailTemplates.res.ok, 'admin/mail-templates fallo', { status: mailTemplates.res.status, body: mailTemplates.data });
  assert(Array.isArray(mailTemplates.data?.items), 'admin/mail-templates payload invalido', mailTemplates.data);
  logStep('admin/mail-templates', { count: mailTemplates.data.items.length });

  const firstMailTemplate = mailTemplates.data.items?.[0];
  if (firstMailTemplate?.templateKey) {
    const saveMailTemplates = await req('/admin/mail-templates', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
      body: JSON.stringify({
        items: [
          {
            templateKey: firstMailTemplate.templateKey,
            subject: firstMailTemplate.subject,
            body: firstMailTemplate.body,
            enabled: firstMailTemplate.enabled !== false,
          },
        ],
      }),
    });
    assert(saveMailTemplates.res.ok, 'admin/mail-templates PATCH fallo', {
      status: saveMailTemplates.res.status,
      body: saveMailTemplates.data,
    });
    assert(saveMailTemplates.data?.ok === true, 'admin/mail-templates PATCH payload invalido', saveMailTemplates.data);
    logStep('admin/mail-templates PATCH', { saved: saveMailTemplates.data.savedTemplates?.length ?? 0 });
  }

  const storeHero = await req('/store/hero');
  assert(storeHero.res.ok, 'store/hero fallo', { status: storeHero.res.status, body: storeHero.data });
  assert(typeof storeHero.data?.imageDesktop === 'string', 'store/hero payload invalido', storeHero.data);
  logStep('store/hero', {
    desktop: storeHero.data.imageDesktop,
    mobile: storeHero.data.imageMobile,
  });

  const storeBranding = await req('/store/branding');
  assert(storeBranding.res.ok, 'store/branding fallo', { status: storeBranding.res.status, body: storeBranding.data });
  assert(typeof storeBranding.data?.siteTitle === 'string', 'store/branding payload invalido', storeBranding.data);
  logStep('store/branding', {
    siteTitle: storeBranding.data.siteTitle,
    logo: storeBranding.data.logoPrincipal,
  });

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

  const whatsappTemplatesOrders = await req('/admin/whatsapp-templates?channel=orders', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(whatsappTemplatesOrders.res.ok, 'admin/whatsapp-templates orders fallo', {
    status: whatsappTemplatesOrders.res.status,
    body: whatsappTemplatesOrders.data,
  });
  assert(Array.isArray(whatsappTemplatesOrders.data?.items), 'whatsapp templates orders payload invalido', whatsappTemplatesOrders.data);
  logStep('admin/whatsapp-templates?channel=orders', { count: whatsappTemplatesOrders.data.items.length });

  const whatsappLogsOrders = await req('/admin/whatsapp-logs?channel=orders', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(whatsappLogsOrders.res.ok, 'admin/whatsapp-logs orders fallo', { status: whatsappLogsOrders.res.status, body: whatsappLogsOrders.data });
  assert(Array.isArray(whatsappLogsOrders.data?.items), 'whatsapp logs orders payload invalido', whatsappLogsOrders.data);
  logStep('admin/whatsapp-logs?channel=orders', { count: whatsappLogsOrders.data.items.length });

  const whatsappLogsRepairs = await req('/admin/whatsapp-logs?channel=repairs', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(whatsappLogsRepairs.res.ok, 'admin/whatsapp-logs repairs fallo', {
    status: whatsappLogsRepairs.res.status,
    body: whatsappLogsRepairs.data,
  });
  assert(Array.isArray(whatsappLogsRepairs.data?.items), 'whatsapp logs repairs payload invalido', whatsappLogsRepairs.data);
  logStep('admin/whatsapp-logs?channel=repairs', { count: whatsappLogsRepairs.data.items.length });

  const createWhatsappLog = await req('/admin/whatsapp-logs', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({
      channel: 'orders',
      templateKey: 'confirmado',
      targetType: 'order',
      targetId: createdOrderId,
      phone: '+5491111111111',
      recipient: 'Cliente Smoke',
      status: 'queued',
      message: 'Log de prueba smoke',
      meta: { source: 'smoke-backend' },
    }),
  });
  assert(createWhatsappLog.res.ok, 'admin/whatsapp-logs PATCH fallo', {
    status: createWhatsappLog.res.status,
    body: createWhatsappLog.data,
  });
  assert(typeof createWhatsappLog.data?.item?.id === 'string', 'admin/whatsapp-logs PATCH payload invalido', createWhatsappLog.data);
  logStep('admin/whatsapp-logs PATCH', { id: createWhatsappLog.data.item.id });

  const helpFaqAdmin = await req('/admin/help-faq', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(helpFaqAdmin.res.ok, 'admin/help-faq fallo', { status: helpFaqAdmin.res.status, body: helpFaqAdmin.data });
  assert(Array.isArray(helpFaqAdmin.data?.items), 'admin/help-faq payload invalido', helpFaqAdmin.data);
  logStep('admin/help-faq', { count: helpFaqAdmin.data.items.length });

  const twoFactorStatus = await req('/admin/security/2fa', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(twoFactorStatus.res.ok, 'admin/security/2fa GET fallo', { status: twoFactorStatus.res.status, body: twoFactorStatus.data });
  assert(typeof twoFactorStatus.data?.enabled === 'boolean', 'admin/security/2fa GET payload invalido', twoFactorStatus.data);
  logStep('admin/security/2fa GET', { enabled: twoFactorStatus.data.enabled });

  const twoFactorGenerate = await req('/admin/security/2fa/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: '{}',
  });
  assert(twoFactorGenerate.res.ok, 'admin/security/2fa/generate fallo', {
    status: twoFactorGenerate.res.status,
    body: twoFactorGenerate.data,
  });
  assert(typeof twoFactorGenerate.data?.secretMasked === 'string', 'admin/security/2fa/generate payload invalido', twoFactorGenerate.data);
  logStep('admin/security/2fa/generate', { secretMasked: twoFactorGenerate.data.secretMasked });

  const providers = await req('/admin/providers', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(providers.res.ok, 'admin/providers fallo', { status: providers.res.status, body: providers.data });
  assert(Array.isArray(providers.data?.items), 'admin/providers payload invalido', providers.data);
  logStep('admin/providers', { count: providers.data.items.length });

  const providerName = `Smoke Supplier ${unique}`;
  const createProvider = await req('/admin/providers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({
      name: providerName,
      searchPriority: 15,
      searchEnabled: true,
      searchMode: 'json',
      searchEndpoint: 'https://example.com/search?q={query}',
      searchConfigJson: '{"items_path":"items"}',
      active: true,
    }),
  });
  assert(createProvider.res.ok, 'admin/providers POST fallo', {
    status: createProvider.res.status,
    body: createProvider.data,
  });
  const providerId = createProvider.data?.item?.id;
  assert(typeof providerId === 'string' && providerId.length > 0, 'admin/providers POST sin item.id', createProvider.data);
  logStep('admin/providers POST', { providerId, name: providerName });

  const updateProvider = await req(`/admin/providers/${encodeURIComponent(providerId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({
      phone: '+5491112345678',
      notes: 'Proveedor creado por smoke test',
      searchPriority: 20,
      searchEnabled: true,
      active: true,
    }),
  });
  assert(updateProvider.res.ok, 'admin/providers PATCH fallo', {
    status: updateProvider.res.status,
    body: updateProvider.data,
  });
  assert(updateProvider.data?.item?.id === providerId, 'admin/providers PATCH no coincide proveedor', updateProvider.data);
  logStep('admin/providers PATCH', { providerId, priority: updateProvider.data.item.priority });

  const providersAfterCreate = await req('/admin/providers', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(providersAfterCreate.res.ok, 'admin/providers list post-create fallo', {
    status: providersAfterCreate.res.status,
    body: providersAfterCreate.data,
  });
  assert(Array.isArray(providersAfterCreate.data?.items), 'admin/providers list post-create payload invalido', providersAfterCreate.data);
  const orderedIds = providersAfterCreate.data.items
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((row) => row.id);
  assert(orderedIds.length > 0, 'admin/providers list vacio tras create', providersAfterCreate.data);

  const reorderProviders = await req('/admin/providers/reorder', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({ orderedIds }),
  });
  assert(reorderProviders.res.ok, 'admin/providers/reorder fallo', {
    status: reorderProviders.res.status,
    body: reorderProviders.data,
  });
  assert(reorderProviders.data?.ok === true, 'admin/providers/reorder payload invalido', reorderProviders.data);
  logStep('admin/providers/reorder', { count: reorderProviders.data.items?.length ?? 0 });

  const probeProvider = await req(`/admin/providers/${encodeURIComponent(providerId)}/probe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({ q: 'modulo a30' }),
  });
  assert(probeProvider.res.ok, 'admin/providers/:id/probe fallo', {
    status: probeProvider.res.status,
    body: probeProvider.data,
  });
  assert(probeProvider.data?.item?.id === providerId, 'admin/providers/:id/probe payload invalido', probeProvider.data);
  logStep('admin/providers/:id/probe', {
    providerId,
    query: probeProvider.data?.probe?.query,
    count: probeProvider.data?.probe?.count,
  });

  const warranties = await req('/admin/warranties', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(warranties.res.ok, 'admin/warranties fallo', { status: warranties.res.status, body: warranties.data });
  assert(Array.isArray(warranties.data?.items), 'admin/warranties payload invalido', warranties.data);
  logStep('admin/warranties', { count: warranties.data.items.length });

  const createWarranty = await req('/admin/warranties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: JSON.stringify({
      sourceType: 'repair',
      title: `Garantia smoke ${unique}`,
      reason: 'Prueba automatizada',
      repairId,
      supplierId: providerId,
      quantity: 1,
      unitCost: 12000,
      costOrigin: 'manual',
      extraCost: 500,
      recoveredAmount: 2500,
      notes: 'Incidente generado por smoke test',
    }),
  });
  assert(createWarranty.res.ok, 'admin/warranties POST fallo', {
    status: createWarranty.res.status,
    body: createWarranty.data,
  });
  const warrantyId = createWarranty.data?.item?.id;
  assert(typeof warrantyId === 'string' && warrantyId.length > 0, 'admin/warranties POST sin item.id', createWarranty.data);
  logStep('admin/warranties POST', { warrantyId });

  const closeWarranty = await req(`/admin/warranties/${encodeURIComponent(warrantyId)}/close`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
    body: '{}',
  });
  assert(closeWarranty.res.ok, 'admin/warranties/:id/close fallo', {
    status: closeWarranty.res.status,
    body: closeWarranty.data,
  });
  assert(closeWarranty.data?.item?.status === 'closed', 'admin/warranties/:id/close no cerro incidente', closeWarranty.data);
  logStep('admin/warranties/:id/close', { warrantyId, status: closeWarranty.data.item.status });

  const accounting = await req('/admin/accounting', {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(accounting.res.ok, 'admin/accounting fallo', { status: accounting.res.status, body: accounting.data });
  assert(Array.isArray(accounting.data?.items), 'admin/accounting payload invalido', accounting.data);
  logStep('admin/accounting', { count: accounting.data.items.length });

  const accountingWarranty = await req(`/admin/accounting?q=${encodeURIComponent(warrantyId)}`, {
    headers: { Authorization: `Bearer ${refreshTokens.accessToken}` },
  });
  assert(accountingWarranty.res.ok, 'admin/accounting warranty query fallo', {
    status: accountingWarranty.res.status,
    body: accountingWarranty.data,
  });
  assert(Array.isArray(accountingWarranty.data?.items), 'admin/accounting warranty query payload invalido', accountingWarranty.data);
  const warrantyAccountingRows = accountingWarranty.data.items.filter((row) => String(row.source || '').includes(warrantyId));
  assert(warrantyAccountingRows.length > 0, 'admin/accounting no refleja incidente de garantia', accountingWarranty.data);
  logStep('admin/accounting warranty query', { warrantyRows: warrantyAccountingRows.length });

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

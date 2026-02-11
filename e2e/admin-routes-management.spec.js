import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

const expectRedirectStatus = (status) => {
  expect([301, 302, 303, 307, 308]).toContain(status);
};

const loginAdmin = async (page) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);
};

const csrfFromPage = async (page) => page.locator('input[name="_token"]').first().inputValue();

const firstNonEmptyOptionValue = async (selectLocator) =>
  selectLocator.evaluate((el) => {
    const options = Array.from(el.options || []);
    const first = options.find((o) => o.value && !o.disabled);
    return first ? first.value : '';
  });

const parseJsonWithBom = async (response) => JSON.parse((await response.text()).replace(/^\uFEFF/, ''));

test.setTimeout(140000);

test('admin management routes handle create/update/toggle flows', async ({ page }) => {
  const stamp = Date.now();
  await loginAdmin(page);

  const csrf = await csrfFromPage(page);
  expect(csrf).toBeTruthy();

  const settingsUpdate = await page.request.post('/admin/configuracion', {
    form: {
      _token: csrf || '',
      shop_phone: `34155${String(stamp).slice(-5)}`,
      shop_address: `Direccion E2E ${stamp}`,
      shop_hours: 'Lun a Vie 09:00-18:00',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(settingsUpdate.status());

  const repairTplUpdate = await page.request.post('/admin/whatsapp', {
    form: {
      _token: csrf || '',
      'templates[received]': `Plantilla E2E ${stamp}`,
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(repairTplUpdate.status());

  const orderTplUpdate = await page.request.post('/admin/whatsapp-pedidos', {
    form: {
      _token: csrf || '',
      'templates[pendiente]': `Plantilla pedido E2E ${stamp}`,
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(orderTplUpdate.status());

  await page.goto('/admin/usuarios?q=e2e.customer@nico.local');
  const userLink = page.locator('a[href*="/admin/usuarios/"]', { hasText: 'Gestionar' }).first();
  await expect(userLink).toBeVisible();
  const userHref = await userLink.getAttribute('href');
  const userMatch = userHref?.match(/\/admin\/usuarios\/(\d+)$/);
  expect(userMatch).toBeTruthy();
  const userId = userMatch?.[1];

  const userRoleUpdate = await page.request.post(`/admin/usuarios/${userId}/rol`, {
    form: {
      _token: csrf || '',
      role: 'user',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(userRoleUpdate.status());

  await page.goto('/admin/precios/crear');
  const pricingTypeId = await firstNonEmptyOptionValue(page.locator('select[name="device_type_id"]'));
  const pricingRepairTypeId = await firstNonEmptyOptionValue(page.locator('select[name="repair_type_id"]'));
  expect(pricingTypeId).not.toBe('');
  expect(pricingRepairTypeId).not.toBe('');

  const pricingStore = await page.request.post('/admin/precios', {
    form: {
      _token: csrf || '',
      device_type_id: pricingTypeId,
      repair_type_id: pricingRepairTypeId,
      mode: 'fixed',
      fixed_total: '46000',
      shipping_default: '9000',
      priority: '2',
      active: '1',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(pricingStore.status());

  await page.goto('/admin/precios');
  const pricingEditHref = await page.locator('a[href*="/admin/precios/"][href*="/editar"]').first().getAttribute('href');
  expect(pricingEditHref).toBeTruthy();
  const pricingEditMatch = pricingEditHref?.match(/\/admin\/precios\/(\d+)\/editar$/);
  expect(pricingEditMatch).toBeTruthy();
  const pricingRuleId = pricingEditMatch?.[1];

  const pricingUpdate = await page.request.post(`/admin/precios/${pricingRuleId}`, {
    form: {
      _token: csrf || '',
      _method: 'PUT',
      device_type_id: pricingTypeId,
      repair_type_id: pricingRepairTypeId,
      mode: 'fixed',
      fixed_total: '47000',
      shipping_default: '9500',
      priority: '3',
      active: '1',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(pricingUpdate.status());

  const pricingResolve = await page.request.get(
    `/admin/precios/resolve?device_type_id=${pricingTypeId}&repair_type_id=${pricingRepairTypeId}`
  );
  expect(pricingResolve.status()).toBe(200);
  const pricingResolveText = (await pricingResolve.text()).replace(/^\uFEFF/, '');
  const pricingResolveJson = JSON.parse(pricingResolveText);
  expect(pricingResolveJson.ok).toBeTruthy();

  const repairTypeName = `E2E RT ${stamp}`;
  const repairTypeStore = await page.request.post('/admin/tipos-reparacion', {
    form: { _token: csrf || '', name: repairTypeName, active: '1' },
    maxRedirects: 0,
  });
  expectRedirectStatus(repairTypeStore.status());

  await page.goto('/admin/tipos-reparacion');
  let repairTypeForm = page
    .locator('form[action*="/admin/tipos-reparacion/"]')
    .filter({ has: page.locator(`input[name="name"][value="${repairTypeName}"]`) })
    .first();
  if ((await repairTypeForm.count()) === 0) {
    repairTypeForm = page.locator('form[action*="/admin/tipos-reparacion/"]').first();
  }
  const repairTypeAction = await repairTypeForm.getAttribute('action');
  const repairTypeMatch = repairTypeAction?.match(/\/admin\/tipos-reparacion\/(\d+)$/);
  expect(repairTypeMatch).toBeTruthy();
  const repairTypeId = repairTypeMatch?.[1];

  const repairTypeUpdate = await page.request.post(`/admin/tipos-reparacion/${repairTypeId}`, {
    form: { _token: csrf || '', _method: 'PUT', name: `${repairTypeName} Up`, active: '1' },
    maxRedirects: 0,
  });
  expectRedirectStatus(repairTypeUpdate.status());

  const deviceTypeName = `E2E Device ${stamp}`;
  const deviceTypeStore = await page.request.post('/admin/tipos-dispositivo', {
    form: { _token: csrf || '', name: deviceTypeName, active: '1' },
    maxRedirects: 0,
  });
  expectRedirectStatus(deviceTypeStore.status());

  await page.goto('/admin/tipos-dispositivo');
  let deviceTypeForm = page
    .locator('form[action*="/admin/tipos-dispositivo/"]')
    .filter({ has: page.locator(`input[name="name"][value="${deviceTypeName}"]`) })
    .first();
  if ((await deviceTypeForm.count()) === 0) {
    deviceTypeForm = page.locator('form[action*="/admin/tipos-dispositivo/"]').first();
  }
  const deviceTypeAction = await deviceTypeForm.getAttribute('action');
  const deviceTypeMatch = deviceTypeAction?.match(/\/admin\/tipos-dispositivo\/(\d+)$/);
  expect(deviceTypeMatch).toBeTruthy();
  const deviceTypeId = deviceTypeMatch?.[1];

  const deviceTypeUpdate = await page.request.post(`/admin/tipos-dispositivo/${deviceTypeId}`, {
    form: { _token: csrf || '', _method: 'PUT', name: `${deviceTypeName} Up`, active: '1' },
    maxRedirects: 0,
  });
  expectRedirectStatus(deviceTypeUpdate.status());

  await page.goto('/admin/grupos-modelos');
  const modelGroupTypeId = await firstNonEmptyOptionValue(page.locator('select[name="device_type_id"]'));
  expect(modelGroupTypeId).not.toBe('');
  await page.locator('select[name="device_type_id"]').selectOption(modelGroupTypeId);
  await page.waitForLoadState('domcontentloaded');
  await expect.poll(async () => page.locator('select[name="device_brand_id"] option').count(), { timeout: 15000 }).toBeGreaterThan(1);
  const modelGroupBrandId = await firstNonEmptyOptionValue(page.locator('select[name="device_brand_id"]'));
  expect(modelGroupBrandId).not.toBe('');
  await page.locator('select[name="device_brand_id"]').selectOption(modelGroupBrandId);
  await page.waitForLoadState('domcontentloaded');

  const modelGroupName = `E2E Group ${stamp}`;
  const modelGroupStore = await page.request.post('/admin/grupos-modelos', {
    form: {
      _token: csrf || '',
      device_brand_id: modelGroupBrandId,
      name: modelGroupName,
      active: '1',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(modelGroupStore.status());

  await page.goto(`/admin/grupos-modelos?device_type_id=${modelGroupTypeId}&device_brand_id=${modelGroupBrandId}`);
  let modelGroupForm = page
    .locator('form[action*="/admin/grupos-modelos/"]')
    .filter({ has: page.locator(`input[name="name"][value="${modelGroupName}"]`) })
    .first();
  if ((await modelGroupForm.count()) === 0) {
    modelGroupForm = page.locator('form[action*="/admin/grupos-modelos/"]').first();
  }
  const modelGroupAction = await modelGroupForm.getAttribute('action');
  const modelGroupMatch = modelGroupAction?.match(/\/admin\/grupos-modelos\/(\d+)$/);
  expect(modelGroupMatch).toBeTruthy();
  const modelGroupId = modelGroupMatch?.[1];

  const modelGroupUpdate = await page.request.post(`/admin/grupos-modelos/${modelGroupId}`, {
    form: {
      _token: csrf || '',
      _method: 'PUT',
      name: `${modelGroupName} Up`,
      active: '1',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(modelGroupUpdate.status());

  const assignSelect = page.locator('select[data-model-id]').first();
  await expect(assignSelect).toBeVisible();
  const modelId = await assignSelect.getAttribute('data-model-id');
  expect(modelId).toBeTruthy();
  const assignGroupId = await firstNonEmptyOptionValue(assignSelect);
  expect(assignGroupId).not.toBe('');

  const assignModel = await page.request.post(`/admin/grupos-modelos/modelo/${modelId}/asignar`, {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    form: {
      _token: csrf || '',
      device_model_group_id: assignGroupId,
    },
  });
  expect(assignModel.status()).toBe(200);
  const assignModelText = (await assignModel.text()).replace(/^\uFEFF/, '');
  const assignModelJson = JSON.parse(assignModelText);
  expect(assignModelJson.ok).toBeTruthy();

  await page.goto('/admin/catalogo-dispositivos');
  let catalogTypeId = await page.locator('select[name="type_id"]').inputValue();
  if (!catalogTypeId) {
    catalogTypeId = await firstNonEmptyOptionValue(page.locator('select[name="type_id"]'));
    await page.locator('select[name="type_id"]').selectOption(catalogTypeId);
    await page.waitForLoadState('domcontentloaded');
  }
  expect(catalogTypeId).not.toBe('');

  const ajaxGetBrands = await page.request.get(`/admin/device-catalog/brands?type_id=${catalogTypeId}`);
  expect(ajaxGetBrands.status()).toBe(200);
  const ajaxGetBrandsJson = await parseJsonWithBom(ajaxGetBrands);
  expect(ajaxGetBrandsJson.ok).toBeTruthy();

  const ajaxBrandName = `E2E Ajax Brand ${stamp}`;
  const ajaxStoreBrand = await page.request.post('/admin/device-catalog/brands', {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    form: {
      _token: csrf || '',
      device_type_id: catalogTypeId,
      name: ajaxBrandName,
    },
  });
  expect(ajaxStoreBrand.status()).toBe(200);
  const ajaxStoreBrandJson = await parseJsonWithBom(ajaxStoreBrand);
  expect(ajaxStoreBrandJson.ok).toBeTruthy();
  const ajaxBrandId = String(ajaxStoreBrandJson.brand?.id || '');
  expect(ajaxBrandId).not.toBe('');

  const manageUpdateBrand = await page.request.post(`/admin/catalogo-dispositivos/marcas/${ajaxBrandId}`, {
    form: {
      _token: csrf || '',
      _method: 'PUT',
      name: `${ajaxBrandName} Up`,
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(manageUpdateBrand.status());

  const manageToggleBrand = await page.request.post(`/admin/catalogo-dispositivos/marcas/${ajaxBrandId}/toggle`, {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(manageToggleBrand.status());

  const ajaxModelName = `E2E Ajax Model ${stamp}`;
  const ajaxStoreModel = await page.request.post('/admin/device-catalog/models', {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    form: {
      _token: csrf || '',
      device_brand_id: ajaxBrandId,
      name: ajaxModelName,
    },
  });
  expect(ajaxStoreModel.status()).toBe(200);
  const ajaxStoreModelJson = await parseJsonWithBom(ajaxStoreModel);
  expect(ajaxStoreModelJson.ok).toBeTruthy();
  const ajaxModelId = String(ajaxStoreModelJson.model?.id || '');
  expect(ajaxModelId).not.toBe('');

  const ajaxGetModels = await page.request.get(`/admin/device-catalog/models?brand_id=${ajaxBrandId}`);
  expect(ajaxGetModels.status()).toBe(200);
  const ajaxGetModelsJson = await parseJsonWithBom(ajaxGetModels);
  expect(ajaxGetModelsJson.ok).toBeTruthy();

  const manageUpdateModel = await page.request.post(`/admin/catalogo-dispositivos/modelos/${ajaxModelId}`, {
    form: {
      _token: csrf || '',
      _method: 'PUT',
      name: `${ajaxModelName} Up`,
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(manageUpdateModel.status());

  const manageToggleModel = await page.request.post(`/admin/catalogo-dispositivos/modelos/${ajaxModelId}/toggle`, {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(manageToggleModel.status());

  const ajaxIssueName = `E2E Ajax Issue ${stamp}`;
  const ajaxStoreIssue = await page.request.post('/admin/device-catalog/issues', {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    form: {
      _token: csrf || '',
      type_id: catalogTypeId,
      name: ajaxIssueName,
    },
  });
  expect(ajaxStoreIssue.status()).toBe(200);
  const ajaxStoreIssueJson = await parseJsonWithBom(ajaxStoreIssue);
  expect(ajaxStoreIssueJson.ok).toBeTruthy();
  const ajaxIssueId = String(ajaxStoreIssueJson.issue?.id || '');
  expect(ajaxIssueId).not.toBe('');

  const ajaxGetIssues = await page.request.get(`/admin/device-catalog/issues?type_id=${catalogTypeId}`);
  expect(ajaxGetIssues.status()).toBe(200);
  const ajaxGetIssuesJson = await parseJsonWithBom(ajaxGetIssues);
  expect(ajaxGetIssuesJson.ok).toBeTruthy();

  const manageUpdateIssue = await page.request.post(`/admin/catalogo-dispositivos/fallas/${ajaxIssueId}`, {
    form: {
      _token: csrf || '',
      _method: 'PUT',
      name: `${ajaxIssueName} Up`,
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(manageUpdateIssue.status());

  const manageToggleIssue = await page.request.post(`/admin/catalogo-dispositivos/fallas/${ajaxIssueId}/toggle`, {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(manageToggleIssue.status());

  const logoUpload = await page.request.post('/admin/configuracion/identidad-visual/logo_main', {
    headers: { 'X-CSRF-TOKEN': csrf || '' },
    multipart: {
      _token: csrf || '',
      file: {
        name: 'favicon-32x32.png',
        mimeType: 'image/png',
        buffer: readFileSync('public/favicon-32x32.png'),
      },
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(logoUpload.status());

  const logoReset = await page.request.post('/admin/configuracion/identidad-visual/logo_main', {
    form: {
      _token: csrf || '',
      _method: 'DELETE',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(logoReset.status());

  const twoFaRegenerate = await page.request.post('/admin/seguridad/2fa/regenerar', {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(twoFaRegenerate.status());

  const twoFaEnable = await page.request.post('/admin/seguridad/2fa/activar', {
    form: {
      _token: csrf || '',
      current_password: adminPassword,
      code: '000000',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(twoFaEnable.status());

  const twoFaRecoveryRegenerate = await page.request.post('/admin/seguridad/2fa/codigos-regenerar', {
    form: {
      _token: csrf || '',
      current_password: adminPassword,
      code: '000000',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(twoFaRecoveryRegenerate.status());

  const twoFaRecoveryDownload = await page.request.get('/admin/seguridad/2fa/codigos/txt?token=e2e-invalid', {
    maxRedirects: 0,
  });
  expect(twoFaRecoveryDownload.status()).toBe(404);

  const twoFaRecoveryPrint = await page.request.get('/admin/seguridad/2fa/codigos/imprimir?token=e2e-invalid', {
    maxRedirects: 0,
  });
  expect(twoFaRecoveryPrint.status()).toBe(404);

  const twoFaRecoveryClear = await page.request.post('/admin/seguridad/2fa/codigos/ocultar', {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(twoFaRecoveryClear.status());

  const twoFaDisable = await page.request.post('/admin/seguridad/2fa/desactivar', {
    form: {
      _token: csrf || '',
      current_password: adminPassword,
      code: '000000',
    },
    maxRedirects: 0,
  });
  expectRedirectStatus(twoFaDisable.status());

  const productName = `E2E Bulk Delete ${stamp}`;
  await page.goto('/admin/productos/crear');
  await page.locator('input[name="name"]').fill(productName);
  const productCategoryId = await firstNonEmptyOptionValue(page.locator('select[name="category_id"]'));
  expect(productCategoryId).not.toBe('');
  await page.locator('select[name="category_id"]').selectOption(productCategoryId);
  await page.locator('input[name="price"]').fill('12345');
  await page.locator('input[name="stock"]').fill('4');
  await page.locator('textarea[name="description"]').fill('Producto E2E para cubrir bulk y delete');
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page).toHaveURL(/\/admin\/productos/);

  await page.goto(`/admin/productos?q=${encodeURIComponent(productName)}`);
  const productRow = page.locator('table tbody tr', { hasText: productName }).first();
  await expect(productRow).toBeVisible();

  const productId = await productRow.locator('[data-bulk-checkbox]').getAttribute('value');
  expect(productId).toBeTruthy();
  const bulkResponse = await page.request.post('/admin/productos/bulk', {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    form: {
      _token: csrf || '',
      'ids[0]': productId || '',
      action: 'set_stock',
      stock: '9',
    },
  });
  expect(bulkResponse.status()).toBe(200);
  const bulkJson = await parseJsonWithBom(bulkResponse);
  expect(bulkJson.ok).toBeTruthy();

  await page.goto(`/admin/productos?q=${encodeURIComponent(productName)}`);
  const updatedProductRow = page.locator('table tbody tr', { hasText: productName }).first();
  await expect(updatedProductRow).toBeVisible();
  await expect(updatedProductRow.locator('[data-stock-label-for]')).toContainText('Stock: 9');

  await updatedProductRow.getByRole('link', { name: 'Editar' }).click();
  await expect(page).toHaveURL(/\/admin\/productos\/\d+\/editar$/);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Eliminar producto' }).click();
  await expect(page).toHaveURL(/\/admin\/productos/);
});

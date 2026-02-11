import { test, expect } from '@playwright/test';

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

test.setTimeout(70000);

test('admin detail, print, ticket and whatsapp routes for orders/repairs', async ({ page }) => {
  await loginAdmin(page);
  const csrf = await csrfFromPage(page);
  expect(csrf).toBeTruthy();

  await page.goto('/admin/pedidos?q=E2E%20Transition');
  const orderId = await page
    .locator('[data-admin-order-card]', { hasText: 'E2E Transition' })
    .first()
    .getAttribute('data-order-id');
  expect(orderId).toBeTruthy();

  await page.goto(`/admin/pedidos/${orderId}`);
  await expect(page.getByText(/Pedido #\d+/).first()).toBeVisible();

  const orderPrint = await page.goto(`/admin/pedidos/${orderId}/imprimir`);
  expect(orderPrint?.status()).toBe(200);
  await expect(page.locator('body')).toContainText(/Pedido|Comprobante|Nico/i);

  const orderTicket = await page.goto(`/admin/pedidos/${orderId}/ticket`);
  expect(orderTicket?.status()).toBe(200);
  await expect(page.locator('body')).toContainText(/Pedido|Ticket|Nico/i);

  const orderWaClassic = await page.request.post(`/admin/pedidos/${orderId}/whatsapp`, {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(orderWaClassic.status());

  const orderWaAjax = await page.request.post(`/admin/pedidos/${orderId}/whatsapp-ajax`, {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    maxRedirects: 0,
  });
  expect([200, 422]).toContain(orderWaAjax.status());

  await page.goto('/admin/reparaciones');
  const repairLink = page.locator('a[href*="/admin/reparaciones/"]:has-text("Ver"):visible').first();
  await expect(repairLink).toBeVisible();
  const repairHref = await repairLink.getAttribute('href');
  const repairMatch = repairHref?.match(/\/admin\/reparaciones\/(\d+)$/);
  expect(repairMatch).toBeTruthy();
  const repairId = repairMatch?.[1];

  await page.goto(`/admin/reparaciones/${repairId}`);
  await expect(page.locator('.page-title')).toBeVisible();

  const diagnosisValue = `E2E diagnóstico update ${Date.now()}`;
  await page.locator('textarea[name="diagnosis"]').fill(diagnosisValue);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('textarea[name="diagnosis"]')).toHaveValue(diagnosisValue);

  const repairPrint = await page.goto(`/admin/reparaciones/${repairId}/imprimir`);
  expect(repairPrint?.status()).toBe(200);
  await expect(page.locator('body')).toContainText(/Reparación|Reparacion|Nico/i);

  const repairTicket = await page.goto(`/admin/reparaciones/${repairId}/ticket`);
  expect(repairTicket?.status()).toBe(200);
  await expect(page.locator('body')).toContainText(/Ticket|Reparación|Reparacion/i);

  const repairWaClassic = await page.request.post(`/admin/reparaciones/${repairId}/whatsapp`, {
    form: { _token: csrf || '' },
    maxRedirects: 0,
  });
  expectRedirectStatus(repairWaClassic.status());

  const repairWaAjax = await page.request.post(`/admin/reparaciones/${repairId}/whatsapp-ajax`, {
    headers: {
      'X-CSRF-TOKEN': csrf || '',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    maxRedirects: 0,
  });
  expect([200, 422]).toContain(repairWaAjax.status());
});

test('admin challenge routes respond without breaking session', async ({ page }) => {
  await loginAdmin(page);
  const csrf = await csrfFromPage(page);
  expect(csrf).toBeTruthy();

  const challengeGet = await page.request.get('/admin/two-factor/challenge', { maxRedirects: 0 });
  expect([200, 301, 302, 303]).toContain(challengeGet.status());

  const challengeVerify = await page.request.post('/admin/two-factor/challenge', {
    form: { _token: csrf || '', code: '000000' },
    maxRedirects: 0,
  });
  expect([301, 302, 303, 422]).toContain(challengeVerify.status());
});

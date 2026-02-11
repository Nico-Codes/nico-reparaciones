import { test, expect } from '@playwright/test';

const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

const expectRedirectStatus = (status) => {
  expect([301, 302, 303, 307, 308]).toContain(status);
};

const loginCustomer = async (page) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(customerEmail);
  await page.locator('input[name="password"]').fill(customerPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/$/);
};

test.setTimeout(60000);

test('public infra routes respond as expected', async ({ page }) => {
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const manifestText = (await manifest.text()).replace(/^\uFEFF/, '');
  const manifestJson = JSON.parse(manifestText);
  expect(typeof manifestJson.name).toBe('string');
  expect(Array.isArray(manifestJson.icons)).toBeTruthy();

  const googleRedirect = await page.request.get('/auth/google', { maxRedirects: 0 });
  expectRedirectStatus(googleRedirect.status());
  const googleLocation = googleRedirect.headers().location || '';
  expect(
    googleLocation.includes('google') ||
      googleLocation.includes('/login') ||
      googleLocation.includes('/auth/google')
  ).toBeTruthy();

  const googleCallback = await page.request.get('/auth/google/callback', { maxRedirects: 0 });
  expectRedirectStatus(googleCallback.status());

  const storageBlocked = await page.request.get('/storage/e2e-no-file.txt', { maxRedirects: 0 });
  expect([403, 404]).toContain(storageBlocked.status());
});

test('customer cart update remove clear and logout routes work', async ({ page }) => {
  await loginCustomer(page);

  await page.goto('/producto/e2e-stock-sync-product');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('/carrito');

  const qtyForm = page.locator('form[data-cart-qty]').first();
  await expect(qtyForm).toBeVisible();
  await qtyForm.locator('input[name="quantity"]').fill('2');
  await qtyForm.evaluate((form) => form.submit());
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('form[data-cart-qty] input[name="quantity"]').first()).toHaveValue('2');

  const removeForm = page.locator('form[data-cart-remove]').first();
  await expect(removeForm).toBeVisible();
  await removeForm.evaluate((form) => form.submit());
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('empty-cart-message').first()).toBeVisible();

  await page.goto('/producto/e2e-stock-sync-product');
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.goto('/carrito');
  await page.locator('form[data-cart-clear] button[type="submit"]').click();
  await expect(page.getByTestId('empty-cart-message').first()).toBeVisible();

  const logoutForm = page.locator('form[action$="/logout"]').first();
  await expect(logoutForm).toHaveCount(1);
  await logoutForm.evaluate((form) => form.submit());
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/mi-cuenta');
  await expect(page).toHaveURL(/\/login/);
});


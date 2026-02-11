import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('checkout removes cart item when product becomes inactive in admin', async ({ browser }) => {
  const shopperContext = await browser.newContext();
  const shopperPage = await shopperContext.newPage();

  await shopperPage.goto('/login');
  await shopperPage.locator('input[name="email"]').fill(customerEmail);
  await shopperPage.locator('input[name="password"]').fill(customerPassword);
  await shopperPage.getByRole('button', { name: 'Ingresar' }).click();

  await shopperPage.goto('/producto/e2e-inactive-sync-product');
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Inactive Sync Product' })).toBeVisible();
  await shopperPage.getByRole('button', { name: 'Agregar al carrito' }).click();

  await shopperPage.goto('/carrito');
  await expect(shopperPage.locator('[data-cart-item]', { hasText: 'E2E Inactive Sync Product' }).first()).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/login');
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole('button', { name: 'Ingresar' }).click();
  await expect(adminPage).toHaveURL(/\/admin(\/dashboard)?$/);

  await adminPage.goto('/admin/productos?q=E2E%20Inactive%20Sync%20Product');
  const adminRow = adminPage.locator('table tbody tr', { hasText: 'E2E Inactive Sync Product' }).first();
  await expect(adminRow).toBeVisible();

  const activeForm = adminRow.locator('form[data-admin-product-toggle="active"]').first();
  await activeForm.evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/productos?q=E2E%20Inactive%20Sync%20Product');
  const adminRowAfterToggle = adminPage.locator('table tbody tr', { hasText: 'E2E Inactive Sync Product' }).first();
  await expect(adminRowAfterToggle.locator('form[data-admin-product-toggle="active"] [data-toggle-btn]')).toContainText(/Inactivo/i);

  await shopperPage.goto('/checkout');
  await expect(shopperPage).toHaveURL(/\/carrito$/);
  await expect(shopperPage.locator('.alert-success').first()).toContainText(/Quitamos/i);
  await expect(shopperPage.getByTestId('empty-cart-message').first()).toBeVisible();

  await adminContext.close();
  await shopperContext.close();
});


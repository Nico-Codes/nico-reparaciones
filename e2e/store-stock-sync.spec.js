import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('admin stock change to zero syncs shopper cart and blocks checkout flow', async ({ browser }) => {
  const shopperContext = await browser.newContext();
  const shopperPage = await shopperContext.newPage();

  await shopperPage.goto('/login');
  await shopperPage.locator('input[name="email"]').fill(customerEmail);
  await shopperPage.locator('input[name="password"]').fill(customerPassword);
  await shopperPage.getByRole('button', { name: 'Ingresar' }).click();

  await shopperPage.goto('/producto/e2e-stock-sync-product');
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Stock Sync Product' })).toBeVisible();
  await expect(shopperPage.getByRole('button', { name: 'Agregar al carrito' })).toBeEnabled();
  await shopperPage.getByRole('button', { name: 'Agregar al carrito' }).click();

  await shopperPage.goto('/checkout');
  await expect(shopperPage).toHaveURL(/\/checkout$/);
  await expect(shopperPage.locator('[data-checkout-form]')).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/login');
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole('button', { name: 'Ingresar' }).click();
  await expect(adminPage).toHaveURL(/\/admin(\/dashboard)?$/);

  await adminPage.goto('/admin/productos?q=E2E%20Stock%20Sync%20Product');
  const row = adminPage.locator('table tbody tr', { hasText: 'E2E Stock Sync Product' }).first();
  await expect(row).toBeVisible();

  const stockForm = row.locator('form[data-admin-product-stock]').first();
  await stockForm.locator('input[name="stock"]').fill('0');
  await stockForm.evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/productos?q=E2E%20Stock%20Sync%20Product');
  const rowAfterStockChange = adminPage.locator('table tbody tr', { hasText: 'E2E Stock Sync Product' }).first();
  await expect(rowAfterStockChange.locator('[data-stock-label-for]')).toContainText(/Sin stock/i);

  await shopperPage.goto('/checkout');
  await expect(shopperPage).toHaveURL(/\/carrito$/);
  await expect(shopperPage.getByTestId('empty-cart-message').first()).toBeVisible();

  await adminContext.close();
  await shopperContext.close();
});


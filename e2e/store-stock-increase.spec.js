import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('customer can increase quantity again after admin raises stock', async ({ browser }) => {
  const shopperContext = await browser.newContext();
  const shopperPage = await shopperContext.newPage();

  await shopperPage.goto('/login');
  await shopperPage.locator('input[name="email"]').fill(customerEmail);
  await shopperPage.locator('input[name="password"]').fill(customerPassword);
  await shopperPage.getByRole('button', { name: 'Ingresar' }).click();

  await shopperPage.goto('/producto/e2e-stock-clamp-product');
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Stock Clamp Product' })).toBeVisible();
  await shopperPage.getByRole('button', { name: 'Agregar al carrito' }).click();

  await shopperPage.goto('/carrito');
  const cartRow = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(cartRow).toBeVisible();

  const qtyForm = cartRow.locator('form[data-cart-qty]').first();
  await qtyForm.locator('input[name="quantity"]').fill('5');
  await qtyForm.evaluate((form) => form.submit());
  await shopperPage.waitForURL(/\/carrito$/);

  const rowAtStockLimit = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(rowAtStockLimit.locator('input[name="quantity"]')).toHaveValue('5');
  await expect(rowAtStockLimit.locator('[data-qty-plus]')).toBeDisabled();
  await expect(rowAtStockLimit.locator('[data-stock-available]')).toContainText('5');

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/login');
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole('button', { name: 'Ingresar' }).click();
  await expect(adminPage).toHaveURL(/\/admin(\/dashboard)?$/);

  await adminPage.goto('/admin/productos?q=E2E%20Stock%20Clamp%20Product');
  const adminRow = adminPage.locator('table tbody tr', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(adminRow).toBeVisible();

  const stockForm = adminRow.locator('form[data-admin-product-stock]').first();
  await stockForm.locator('input[name="stock"]').fill('8');
  await stockForm.evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/productos?q=E2E%20Stock%20Clamp%20Product');
  const adminRowAfter = adminPage.locator('table tbody tr', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(adminRowAfter.locator('[data-stock-label-for]')).toContainText('Stock: 8');

  await shopperPage.goto('/carrito');
  const rowAfterStockIncrease = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(rowAfterStockIncrease).toBeVisible();
  await expect(rowAfterStockIncrease.locator('[data-stock-available]')).toContainText('8');
  await expect(rowAfterStockIncrease.locator('input[name="quantity"]')).toHaveAttribute('max', '8');
  await expect(rowAfterStockIncrease.locator('[data-qty-plus]')).toBeEnabled();

  const qtyFormAfterIncrease = rowAfterStockIncrease.locator('form[data-cart-qty]').first();
  await qtyFormAfterIncrease.locator('input[name="quantity"]').fill('6');
  await qtyFormAfterIncrease.evaluate((form) => form.submit());
  await shopperPage.waitForURL(/\/carrito$/);

  const rowAfterQtyIncrease = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(rowAfterQtyIncrease.locator('input[name="quantity"]')).toHaveValue('6');
  await expect(shopperPage.locator('[data-checkout-btn]')).toHaveAttribute('aria-disabled', 'false');

  await adminContext.close();
  await shopperContext.close();
});

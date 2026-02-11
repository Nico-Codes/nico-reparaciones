import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('checkout clamps cart quantity when admin reduces stock and shows sync message', async ({ browser }) => {
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
  await qtyForm.locator('input[name="quantity"]').fill('4');
  await qtyForm.evaluate((form) => form.submit());
  await shopperPage.waitForURL(/\/carrito$/);
  await expect(
    shopperPage.locator('[data-cart-item]', { hasText: 'E2E Stock Clamp Product' }).first().locator('input[name="quantity"]')
  ).toHaveValue('4');

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
  await stockForm.locator('input[name="stock"]').fill('2');
  await stockForm.evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/productos?q=E2E%20Stock%20Clamp%20Product');
  const adminRowAfter = adminPage.locator('table tbody tr', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(adminRowAfter.locator('[data-stock-label-for]')).toContainText('Stock: 2');

  await shopperPage.goto('/checkout');
  await expect(shopperPage).toHaveURL(/\/carrito$/);
  await expect(shopperPage.locator('.alert-success').first()).toContainText(/Ajustamos/i);

  const adjustedRow = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Stock Clamp Product' }).first();
  await expect(adjustedRow).toBeVisible();
  await expect(adjustedRow.locator('input[name="quantity"]')).toHaveValue('2');
  await expect(adjustedRow.locator('[data-stock-available]')).toContainText('2');
  await expect(shopperPage.locator('[data-checkout-btn]')).toHaveAttribute('aria-disabled', 'false');

  await adminContext.close();
  await shopperContext.close();
});

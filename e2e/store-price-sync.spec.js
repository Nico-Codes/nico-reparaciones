import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('checkout syncs updated product price and cart totals after admin price change', async ({ browser }) => {
  const shopperContext = await browser.newContext();
  const shopperPage = await shopperContext.newPage();

  await shopperPage.goto('/login');
  await shopperPage.locator('input[name="email"]').fill(customerEmail);
  await shopperPage.locator('input[name="password"]').fill(customerPassword);
  await shopperPage.getByRole('button', { name: 'Ingresar' }).click();

  await shopperPage.goto('/producto/e2e-price-sync-product');
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Price Sync Product' })).toBeVisible();
  await shopperPage.getByRole('button', { name: 'Agregar al carrito' }).click();

  await shopperPage.goto('/carrito');
  let cartRow = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Price Sync Product' }).first();
  await expect(cartRow).toBeVisible();

  const qtyForm = cartRow.locator('form[data-cart-qty]').first();
  await qtyForm.locator('input[name="quantity"]').fill('2');
  await qtyForm.evaluate((form) => form.submit());
  await shopperPage.waitForURL(/\/carrito$/);

  cartRow = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Price Sync Product' }).first();
  await expect(cartRow.locator('input[name="quantity"]')).toHaveValue('2');
  await expect(cartRow).toContainText(/10\.000/);
  await expect(cartRow.locator('[data-line-subtotal]')).toContainText(/20\.000/);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/login');
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole('button', { name: 'Ingresar' }).click();
  await expect(adminPage).toHaveURL(/\/admin(\/dashboard)?$/);

  await adminPage.goto('/admin/productos?q=E2E%20Price%20Sync%20Product');
  const adminRow = adminPage.locator('table tbody tr', { hasText: 'E2E Price Sync Product' }).first();
  await expect(adminRow).toBeVisible();
  await adminRow.getByRole('link', { name: 'Editar' }).click();

  await expect(adminPage).toHaveURL(/\/admin\/productos\/\d+\/editar$/);
  await adminPage.locator('input[name="price"]').fill('15000');
  await adminPage.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(adminPage).toHaveURL(/\/admin\/productos/);

  await shopperPage.goto('/checkout');
  await expect(shopperPage).toHaveURL(/\/carrito$/);
  await expect(shopperPage.locator('.alert-success').first()).toContainText(/Actualizamos el precio/i);

  cartRow = shopperPage.locator('[data-cart-item]', { hasText: 'E2E Price Sync Product' }).first();
  await expect(cartRow).toBeVisible();
  await expect(cartRow.locator('input[name="quantity"]')).toHaveValue('2');
  await expect(cartRow).toContainText(/15\.000/);
  await expect(cartRow.locator('[data-line-subtotal]')).toContainText(/30\.000/);

  await adminContext.close();
  await shopperContext.close();
});

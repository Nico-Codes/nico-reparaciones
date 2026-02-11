import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('checkout removes cart item when its category becomes inactive in admin', async ({ browser }) => {
  const shopperContext = await browser.newContext();
  const shopperPage = await shopperContext.newPage();

  await shopperPage.goto('/login');
  await shopperPage.locator('input[name="email"]').fill(customerEmail);
  await shopperPage.locator('input[name="password"]').fill(customerPassword);
  await shopperPage.getByRole('button', { name: 'Ingresar' }).click();

  await shopperPage.goto('/producto/e2e-category-inactive-sync-product');
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Category Inactive Sync Product' })).toBeVisible();
  await shopperPage.getByRole('button', { name: 'Agregar al carrito' }).click();

  await shopperPage.goto('/carrito');
  await expect(
    shopperPage.locator('[data-cart-item]', { hasText: 'E2E Category Inactive Sync Product' }).first()
  ).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/login');
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole('button', { name: 'Ingresar' }).click();
  await expect(adminPage).toHaveURL(/\/admin(\/dashboard)?$/);

  await adminPage.goto('/admin/categorias');
  const categoryRow = adminPage.locator('table tbody tr', { hasText: 'E2E Category Sync Active' }).first();
  await expect(categoryRow).toBeVisible();

  const toggleForm = categoryRow.locator('form[data-admin-category-toggle]').first();
  await toggleForm.evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/categorias');
  const categoryRowAfter = adminPage.locator('table tbody tr', { hasText: 'E2E Category Sync Active' }).first();
  await expect(categoryRowAfter.locator('[data-active-btn]')).toContainText(/Inactiva/i);

  await shopperPage.goto('/checkout');
  await expect(shopperPage).toHaveURL(/\/carrito$/);
  await expect(shopperPage.locator('.alert-success').first()).toContainText(/Quitamos/i);
  await expect(shopperPage.getByTestId('empty-cart-message').first()).toBeVisible();

  await adminContext.close();
  await shopperContext.close();
});


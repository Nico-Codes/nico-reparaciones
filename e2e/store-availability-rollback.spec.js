import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

test.setTimeout(60000);

test('admin can reactivate product/category and shopper can buy again', async ({ browser }) => {
  const shopperContext = await browser.newContext();
  const shopperPage = await shopperContext.newPage();

  const initialProductResponse = await shopperPage.goto('/producto/e2e-rollback-product');
  expect(initialProductResponse?.status()).toBe(200);
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Rollback Product' })).toBeVisible();
  await expect(shopperPage.getByRole('button', { name: 'Agregar al carrito' })).toBeEnabled();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  await adminPage.goto('/login');
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole('button', { name: 'Ingresar' }).click();
  await expect(adminPage).toHaveURL(/\/admin(\/dashboard)?$/);

  await adminPage.goto('/admin/productos?q=E2E%20Rollback%20Product');
  let productRow = adminPage.locator('table tbody tr', { hasText: 'E2E Rollback Product' }).first();
  await expect(productRow).toBeVisible();
  await expect(productRow.locator('form[data-admin-product-toggle="active"] [data-toggle-btn]')).toContainText(/Activo/i);
  await productRow.locator('form[data-admin-product-toggle="active"]').first().evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/productos?q=E2E%20Rollback%20Product');
  productRow = adminPage.locator('table tbody tr', { hasText: 'E2E Rollback Product' }).first();
  await expect(productRow.locator('form[data-admin-product-toggle="active"] [data-toggle-btn]')).toContainText(/Inactivo/i);

  await adminPage.goto('/admin/categorias');
  let categoryRow = adminPage.locator('table tbody tr', { hasText: 'E2E Category Rollback Active' }).first();
  await expect(categoryRow).toBeVisible();
  await expect(categoryRow.locator('[data-active-btn]')).toContainText(/Activa/i);
  await categoryRow.locator('form[data-admin-category-toggle]').first().evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');

  await adminPage.goto('/admin/categorias');
  categoryRow = adminPage.locator('table tbody tr', { hasText: 'E2E Category Rollback Active' }).first();
  await expect(categoryRow.locator('[data-active-btn]')).toContainText(/Inactiva/i);

  const unavailableResponse = await shopperPage.goto('/producto/e2e-rollback-product');
  expect(unavailableResponse?.status()).toBe(404);

  await categoryRow.locator('form[data-admin-category-toggle]').first().evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');
  await adminPage.goto('/admin/categorias');
  categoryRow = adminPage.locator('table tbody tr', { hasText: 'E2E Category Rollback Active' }).first();
  await expect(categoryRow.locator('[data-active-btn]')).toContainText(/Activa/i);

  await adminPage.goto('/admin/productos?q=E2E%20Rollback%20Product');
  productRow = adminPage.locator('table tbody tr', { hasText: 'E2E Rollback Product' }).first();
  await productRow.locator('form[data-admin-product-toggle="active"]').first().evaluate((form) => form.submit());
  await adminPage.waitForLoadState('domcontentloaded');
  await adminPage.goto('/admin/productos?q=E2E%20Rollback%20Product');
  productRow = adminPage.locator('table tbody tr', { hasText: 'E2E Rollback Product' }).first();
  await expect(productRow.locator('form[data-admin-product-toggle="active"] [data-toggle-btn]')).toContainText(/Activo/i);

  await shopperPage.goto('/tienda');
  await expect(shopperPage.locator('a.nav-pill', { hasText: 'E2E Category Rollback Active' })).toBeVisible();

  const availableAgainResponse = await shopperPage.goto('/producto/e2e-rollback-product');
  expect(availableAgainResponse?.status()).toBe(200);
  await expect(shopperPage.locator('.page-title', { hasText: 'E2E Rollback Product' })).toBeVisible();
  await expect(shopperPage.getByRole('button', { name: 'Agregar al carrito' })).toBeEnabled();
  await shopperPage.getByRole('button', { name: 'Agregar al carrito' }).click();

  await shopperPage.goto('/carrito');
  await expect(shopperPage.locator('[data-cart-item]', { hasText: 'E2E Rollback Product' }).first()).toBeVisible();

  await adminContext.close();
  await shopperContext.close();
});

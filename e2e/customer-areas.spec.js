import { test, expect } from '@playwright/test';

const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test.setTimeout(60000);

test('authenticated customer can navigate account, orders and repairs pages', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(customerEmail);
  await page.locator('input[name="password"]').fill(customerPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/mi-cuenta');
  await expect(page).toHaveURL(/\/mi-cuenta$/);
  await expect(page.locator('.page-title', { hasText: 'Mi cuenta' })).toBeVisible();

  await page.goto('/mis-pedidos');
  await expect(page).toHaveURL(/\/mis-pedidos$/);
  await expect(page.locator('.page-title', { hasText: 'Mis pedidos' })).toBeVisible();

  const firstOrderCard = page.locator('a.card', { hasText: 'Pedido #' }).first();
  await expect(firstOrderCard).toBeVisible();
  await firstOrderCard.click();

  await expect(page).toHaveURL(/\/mis-pedidos\/\d+$/);
  await expect(page.locator('.page-title', { hasText: 'Pedido #' })).toBeVisible();

  await page.goto('/mis-reparaciones');
  await expect(page).toHaveURL(/\/mis-reparaciones$/);
  await expect(page.locator('.page-title', { hasText: 'Mis reparaciones' })).toBeVisible();

  const firstRepairCard = page.locator('a.card', { hasText: 'E2EBrand' }).first();
  await expect(firstRepairCard).toBeVisible();
  await firstRepairCard.click();

  await expect(page).toHaveURL(/\/mis-reparaciones\/\d+$/);
  await expect(page.locator('.page-title', { hasText: /Reparaci/i })).toBeVisible();
});

import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

test('admin whatsapp filters keep selected tab and show matching rows', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/pedidos?q=E2E%20WA&wa=pending');
  await expect(page).toHaveURL(/wa=pending/);
  await expect(page.locator('a.nav-pill.nav-pill-active', { hasText: 'WA pendiente' })).toBeVisible();
  await expect(page.locator('[data-admin-order-card]', { hasText: 'E2E WA Pending' }).first()).toBeVisible();

  await page.locator('a.nav-pill', { hasText: 'WA enviado' }).click();
  await expect(page).toHaveURL(/wa=sent/);
  await expect(page.locator('a.nav-pill.nav-pill-active', { hasText: 'WA enviado' })).toBeVisible();
  await expect(page.locator('[data-admin-order-card]', { hasText: 'E2E WA Sent' }).first()).toBeVisible();

  await page.locator('a.nav-pill', { hasText: 'Sin teléfono' }).click();
  await expect(page).toHaveURL(/wa=no_phone/);
  await expect(page.locator('a.nav-pill.nav-pill-active', { hasText: 'Sin teléfono' })).toBeVisible();
  await expect(page.locator('[data-admin-order-card]', { hasText: 'E2E WA NoPhone' }).first()).toBeVisible();
});

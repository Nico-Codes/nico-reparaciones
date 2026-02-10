import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

test('admin panel requires login and allows seeded admin user', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);

  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);
  await expect(page.getByText('Panel Admin')).toBeVisible();
});

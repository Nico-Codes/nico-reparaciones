import { test, expect } from '@playwright/test';

test('repair lookup rejects invalid phone format', async ({ page }) => {
  await page.goto('/reparacion');

  await page.locator('#code').fill('R-20260101-00001');
  await page.locator('#phone').fill('----++++');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page).toHaveURL(/\/reparacion$/);
  await expect(page.locator('.alert-error')).toBeVisible();
});

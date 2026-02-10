import { test, expect } from '@playwright/test';

test('repair lookup shows result for valid seeded code and phone', async ({ page }) => {
  await page.goto('/reparacion');

  await page.locator('#code').fill('R-E2E-OK-0001');
  await page.locator('#phone').fill('341 555-0111');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByText('Resultado')).toBeVisible();
  await expect(page.getByText('R-E2E-OK-0001')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('@return');
});

import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

test('admin can change seeded order status from pendiente to confirmado', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/pedidos?q=E2E%20Transition');

  const card = page.locator('[data-admin-order-card]', { hasText: 'E2E Transition' }).first();
  await expect(card).toBeVisible();

  const statusBadge = card.locator('[data-admin-order-status-badge]').first();
  await expect(statusBadge).toContainText(/Pendiente/i);

  const statusForm = card.locator('form[data-admin-order-status-form]').first();
  await statusForm.locator('input[name="status"]').evaluate((input) => {
    input.value = 'confirmado';
  });
  await statusForm.evaluate((form) => form.submit());
  await page.waitForLoadState('domcontentloaded');
  await page.goto('/admin/pedidos?q=E2E%20Transition');

  const updatedCard = page.locator('[data-admin-order-card]', { hasText: 'E2E Transition' }).first();
  await expect(updatedCard).toHaveAttribute('data-status', 'confirmado');
  await expect(updatedCard.locator('[data-admin-order-status-badge]').first()).toContainText(/Confirmado/i);
});

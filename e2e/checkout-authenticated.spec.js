import { test, expect } from '@playwright/test';

const customerEmail = process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@nico.local';
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD || 'e2e12345';

test('authenticated user can complete checkout and reach thank you page', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(customerEmail);
  await page.locator('input[name="password"]').fill(customerPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/producto/e2e-stock-sync-product');
  const addButton = page.locator('form[action*="/carrito/agregar/"] button[type="submit"]:not([disabled])');
  await expect(addButton).toBeVisible();
  await addButton.click();

  await page.goto('/checkout');
  await expect(page.locator('[data-checkout-form]')).toBeVisible();
  await expect(page.locator('[data-checkout-submit]')).toBeEnabled();

  await page.locator('[data-checkout-submit]').click();

  await expect(page).toHaveURL(/\/pedido\/\d+$/);
  await expect(page.getByText('Pedido recibido')).toBeVisible();
});

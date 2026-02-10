import { test, expect } from '@playwright/test';

test('authenticated user can complete checkout and reach thank you page', async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e.checkout.${stamp}@nico.local`;
  const password = 'e2e12345';

  await page.goto('/registro');
  await page.locator('input[name="name"]').fill('E2E');
  await page.locator('input[name="last_name"]').fill('Checkout');
  await page.locator('input[name="phone"]').fill('3415550123');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="password_confirmation"]').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await page.goto('/tienda');
  const addButton = page
    .locator('form[action*="/carrito/agregar/"] button[type="submit"]:not([disabled])')
    .first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  await page.goto('/checkout');
  await expect(page.locator('[data-checkout-form]')).toBeVisible();
  await expect(page.locator('[data-checkout-submit]')).toBeEnabled();

  await page.locator('[data-checkout-submit]').click();

  await expect(page).toHaveURL(/\/pedido\/\d+$/);
  await expect(page.getByText('Pedido recibido')).toBeVisible();
});

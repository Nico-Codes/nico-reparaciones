import { test, expect } from '@playwright/test';

test('guest can add product to cart and checkout redirects to login', async ({ page }) => {
  await page.goto('/tienda');

  const addButton = page
    .locator('form[action*="/carrito/agregar/"] button[type="submit"]:not([disabled])')
    .first();

  await expect(addButton).toBeVisible();
  await addButton.click();

  await page.goto('/carrito');
  await expect(page.locator('[data-cart-item]').first()).toBeVisible();

  await page.locator('[data-checkout-btn]').click();
  await expect(page).toHaveURL(/\/login/);
});

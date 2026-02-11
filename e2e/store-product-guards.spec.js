import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('store product detail applies stock and active/category guards', async ({ page }) => {
  const noStockResponse = await page.goto('/producto/e2e-store-no-stock-product');
  expect(noStockResponse?.status()).toBe(200);
  await expect(page.getByText(/Sin stock por ahora/i)).toBeVisible();
  await expect(page.getByTestId('product-add-to-cart')).toBeDisabled();

  const inactiveProductResponse = await page.goto('/producto/e2e-store-inactive-product');
  expect(inactiveProductResponse?.status()).toBe(404);

  const inactiveCategoryResponse = await page.goto('/producto/e2e-store-inactive-category-product');
  expect(inactiveCategoryResponse?.status()).toBe(404);
});


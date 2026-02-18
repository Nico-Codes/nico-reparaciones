import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

test('store category visibility follows admin active toggle', async ({ page }) => {
  const suffix = Date.now();
  const categoryName = `E2E Store Categoria ${suffix}`;
  const productName = `E2E Store Producto ${suffix}`;
  const categorySlug = `e2e-store-categoria-${suffix}`;

  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/categorias/crear');
  await expect(page).toHaveURL(/\/admin\/categorias\/crear$/);
  await page.locator('input[name="name"]').fill(categoryName);
  await page.locator('input[name="slug"]').fill(categorySlug);
  await page.locator('input[name="description"]').fill('Categoría para validación admin->tienda');
  await page.getByRole('button', { name: 'Crear categoría' }).click();
  await expect(page).toHaveURL(/\/admin\/categorias\/\d+\/editar$/);

  await page.goto('/admin/productos/crear');
  await expect(page).toHaveURL(/\/admin\/productos\/crear$/);
  await page.locator('input[name="name"]').fill(productName);
  await page.locator('input[name="sku"]').fill(`E2E-STORE-${suffix}`);
  await page.locator('select[name="category_id"]').selectOption({ label: categoryName });
  await page.locator('input[name="cost_price"]').fill('12000');
  await page.locator('input[name="price"]').fill('15999');
  await page.locator('input[name="stock"]').fill('3');
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await expect(page).toHaveURL(/\/admin\/productos$/);

  await page.goto('/tienda');
  await expect(page.locator('a.nav-pill', { hasText: categoryName })).toBeVisible();

  const activeCategoryResponse = await page.goto(`/tienda/categoria/${categorySlug}`);
  expect(activeCategoryResponse?.status()).toBe(200);
  await expect(page.locator('a.nav-pill.nav-pill-active', { hasText: categoryName })).toBeVisible();
  await expect(page.locator('a.product-title', { hasText: productName }).first()).toBeVisible();

  await page.goto('/admin/categorias');
  const categoryRow = page.locator('table tbody tr', { hasText: categoryName }).first();
  await expect(categoryRow).toBeVisible();

  const toggleBtn = categoryRow.locator('form[data-admin-category-toggle] [data-active-btn]').first();
  await expect(toggleBtn).toContainText(/Activa/i);
  await toggleBtn.click();
  await expect.poll(async () => (await toggleBtn.innerText()).trim()).toMatch(/Inactiva/i);

  await page.goto('/tienda');
  await expect(page.locator('a.nav-pill', { hasText: categoryName })).toHaveCount(0);

  const inactiveCategoryResponse = await page.goto(`/tienda/categoria/${categorySlug}`);
  expect(inactiveCategoryResponse?.status()).toBe(404);
});

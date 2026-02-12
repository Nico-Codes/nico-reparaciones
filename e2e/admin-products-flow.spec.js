import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
test.setTimeout(60000);

const selectFirstNonEmptyOption = async (locator) => {
  const value = await locator.evaluate((el) => {
    const options = Array.from(el.options || []);
    const found = options.find((o) => o.value && !o.disabled);
    return found ? found.value : '';
  });
  if (!value) {
    throw new Error('No se encontró una opción válida para el select');
  }
  await locator.selectOption(value);
};

test('admin products flow: create, toggle, stock update and edit', async ({ page }) => {
  const suffix = Date.now();
  const initialName = `E2E Producto ${suffix}`;
  const updatedName = `${initialName} Editado`;

  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/productos/crear');
  await expect(page).toHaveURL(/\/admin\/productos\/crear$/);

  await page.locator('input[name="name"]').fill(initialName);
  await page.locator('input[name="sku"]').fill(`E2E-${suffix}`);
  await page.locator('input[name="barcode"]').fill(`${suffix}`);
  await selectFirstNonEmptyOption(page.locator('select[name="category_id"]'));
  await page.locator('input[name="price"]').fill('12999');
  await page.locator('input[name="stock"]').fill('7');
  await page.locator('textarea[name="description"]').fill('Producto creado por flujo E2E');
  await page.getByRole('button', { name: 'Crear producto' }).click();

  await expect(page).toHaveURL(/\/admin\/productos/);
  await expect(page.locator('.alert-success').first()).toContainText(/Producto creado/i);

  await page.goto(`/admin/productos?q=${encodeURIComponent(initialName)}`);
  const row = page.locator('table tbody tr', { hasText: initialName }).first();
  await expect(row).toBeVisible();

  const activeForm = row.locator('form[data-admin-product-toggle="active"]').first();
  await activeForm.evaluate((form) => form.submit());
  await page.waitForLoadState('domcontentloaded');
  await page.goto(`/admin/productos?q=${encodeURIComponent(initialName)}`);
  const rowAfterActive = page.locator('table tbody tr', { hasText: initialName }).first();
  await expect(rowAfterActive.locator('form[data-admin-product-toggle="active"] [data-toggle-btn]')).toContainText(/Inactivo/i);

  const featuredForm = rowAfterActive.locator('form[data-admin-product-toggle="featured"]').first();
  await featuredForm.evaluate((form) => form.submit());
  await page.waitForLoadState('domcontentloaded');
  await page.goto(`/admin/productos?q=${encodeURIComponent(initialName)}`);
  const rowAfterFeatured = page.locator('table tbody tr', { hasText: initialName }).first();
  await expect(rowAfterFeatured.locator('form[data-admin-product-toggle="featured"] [data-toggle-btn]')).toContainText(/Destacado/i);

  const stockForm = rowAfterFeatured.locator('form[data-admin-product-stock]').first();
  await stockForm.locator('input[name="stock"]').fill('13');
  await stockForm.locator('button[type="submit"]').click();
  await expect(rowAfterFeatured.locator('[data-stock-label-for]')).toContainText('Stock: 13');

  await rowAfterFeatured.getByRole('link', { name: 'Editar' }).click();
  await expect(page).toHaveURL(/\/admin\/productos\/\d+\/editar$/);

  await page.locator('input[name="name"]').fill(updatedName);
  await page.locator('input[name="price"]').fill('14999');
  await page.locator('input[name="stock"]').fill('15');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page).toHaveURL(/\/admin\/productos/);
  await expect(page.locator('.alert-success').first()).toContainText(/Producto actualizado/i);

  await page.goto(`/admin/productos?q=${encodeURIComponent(updatedName)}`);
  const updatedRow = page.locator('table tbody tr', { hasText: updatedName }).first();
  await expect(updatedRow).toBeVisible();
  await expect(updatedRow.locator('[data-stock-label-for]')).toContainText('Stock: 15');
});

import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';
test.setTimeout(60000);

test('admin can create, update, toggle and delete category', async ({ page }) => {
  const suffix = Date.now();
  const initialName = `E2E Categoria ${suffix}`;
  const updatedName = `${initialName} Editada`;

  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/categorias/crear');
  await expect(page).toHaveURL(/\/admin\/categorias\/crear$/);

  await page.locator('input[name="name"]').fill(initialName);
  await page.locator('input[name="description"]').fill('Categoría creada por flujo E2E');
  await page.getByRole('button', { name: 'Crear categoría' }).click();

  await expect(page).toHaveURL(/\/admin\/categorias\/\d+\/editar$/);
  await expect(page.locator('.alert-success').first()).toContainText(/creada/i);

  await page.locator('input[name="name"]').fill(updatedName);
  await page.locator('input[name="description"]').fill('Categoría E2E actualizada');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.locator('.alert-success').first()).toContainText(/actualizada/i);

  await page.goto('/admin/categorias');
  const row = page.locator('table tbody tr', { hasText: updatedName }).first();
  await expect(row).toBeVisible();

  const activeBtn = row.locator('form[data-admin-category-toggle] [data-active-btn]').first();
  const before = (await activeBtn.innerText()).trim();
  await activeBtn.click();
  await expect.poll(async () => (await activeBtn.innerText()).trim()).not.toBe(before);

  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.locator('.alert-success').first()).toContainText(/eliminada/i);
  await expect(page.locator('table tbody tr', { hasText: updatedName })).toHaveCount(0);
});

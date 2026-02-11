import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('guest can register, update profile and sign in with a new password', async ({ page, browser }) => {
  const stamp = Date.now();
  const email = `e2e.new.${stamp}@nico.local`;
  const initialPassword = 'e2e12345';
  const nextPassword = 'e2e98765';

  await page.goto('/registro');
  await expect(page).toHaveURL(/\/registro$/);

  await page.locator('input[name="name"]').fill('E2E');
  await page.locator('input[name="last_name"]').fill('Nuevo');
  await page.locator('input[name="phone"]').fill('3415557777');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(initialPassword);
  await page.locator('input[name="password_confirmation"]').fill(initialPassword);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page).toHaveURL(/\/$/);

  await page.goto('/mi-cuenta');
  await expect(page).toHaveURL(/\/mi-cuenta$/);
  await expect(page.locator('.page-title', { hasText: 'Mi cuenta' })).toBeVisible();

  await page.locator('input[name="last_name"]').fill('Nuevo Editado');
  await page.locator('input[name="phone"]').fill('3415557788');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.locator('input[name="last_name"]')).toHaveValue('Nuevo Editado');
  await expect(page.locator('input[name="phone"]')).toHaveValue('3415557788');

  await page.locator('input[name="current_password"]').fill(initialPassword);
  await page.locator('input[name="password"]').fill(nextPassword);
  await page.locator('input[name="password_confirmation"]').fill(nextPassword);
  await page.getByRole('button', { name: 'Actualizar contrasena' }).click();

  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();

  await loginPage.goto('/login');
  await loginPage.locator('input[name="email"]').fill(email);
  await loginPage.locator('input[name="password"]').fill(nextPassword);
  await loginPage.getByRole('button', { name: 'Ingresar' }).click();

  await expect(loginPage).toHaveURL(/\/$/);
  await loginContext.close();
});


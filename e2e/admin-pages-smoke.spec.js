import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

const assertPageTitle = async (page, path, titlePattern) => {
  const response = await page.goto(path);
  expect(response?.status(), `HTTP status mismatch for ${path}`).toBe(200);
  await expect(page.locator('.page-title', { hasText: titlePattern })).toBeVisible();
};

test.setTimeout(90000);

test('admin can open all main management modules', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await assertPageTitle(page, '/admin/dashboard', /Panel Admin/i);
  await assertPageTitle(page, '/admin/pedidos', /Pedidos/i);
  await assertPageTitle(page, '/admin/reparaciones', /Reparaciones/i);
  await assertPageTitle(page, '/admin/reparaciones/crear', /Nueva reparaci/i);
  await assertPageTitle(page, '/admin/categorias', /Categor/i);
  await assertPageTitle(page, '/admin/productos', /Productos/i);

  const usersResponse = await page.goto('/admin/usuarios');
  expect(usersResponse?.status()).toBe(200);
  await expect(page.locator('.card .text-lg', { hasText: 'Usuarios' }).first()).toBeVisible();

  await page.locator('a', { hasText: 'Gestionar' }).first().click();
  await expect(page).toHaveURL(/\/admin\/usuarios\/\d+$/);
  await expect(page.getByText(/Usuario #\d+/).first()).toBeVisible();

  await assertPageTitle(page, '/admin/configuracion', /Configuraci/i);
  await assertPageTitle(page, '/admin/configuracion/identidad-visual', /Identidad visual/i);
  await assertPageTitle(page, '/admin/whatsapp', /Plantillas WhatsApp/i);
  await assertPageTitle(page, '/admin/whatsapp-pedidos', /Plantillas WhatsApp/i);
  await assertPageTitle(page, '/admin/precios', /Reglas de precios/i);
  await assertPageTitle(page, '/admin/tipos-reparacion', /Tipos de reparaci/i);
  await assertPageTitle(page, '/admin/grupos-modelos', /Grupos de modelos/i);
  await assertPageTitle(page, '/admin/tipos-dispositivo', /Tipos de dispositivo/i);
  await assertPageTitle(page, '/admin/catalogo-dispositivos', /Catalogo de dispositivos|Catálogo de dispositivos/i);
  await assertPageTitle(page, '/admin/seguridad/2fa', /Seguridad 2FA/i);
});

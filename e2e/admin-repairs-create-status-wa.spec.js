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
    throw new Error('No se encontró una opción válida en el select');
  }
  await locator.evaluate((el, nextValue) => {
    el.value = String(nextValue);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
};

test('admin can create repair, update status and register whatsapp log', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);

  await page.goto('/admin/reparaciones/crear');
  await expect(page).toHaveURL(/\/admin\/reparaciones\/crear$/);

  await page.locator('input[name="customer_name"]').fill('E2E Repair Flow');
  await page.locator('input[name="customer_phone"]').fill('3415550999');

  const deviceTypeSelect = page.locator('select[name="device_type_id"]');
  await selectFirstNonEmptyOption(deviceTypeSelect);

  const brandSelect = page.locator('select[name="device_brand_id"]');
  await expect(brandSelect).toBeEnabled();
  await expect.poll(async () => await brandSelect.locator('option').count(), { timeout: 15000 }).toBeGreaterThan(1);
  await selectFirstNonEmptyOption(brandSelect);

  const modelSelect = page.locator('select[name="device_model_id"]');
  await expect(modelSelect).toBeEnabled();
  await expect.poll(async () => await modelSelect.locator('option').count(), { timeout: 15000 }).toBeGreaterThan(1);
  await selectFirstNonEmptyOption(modelSelect);

  const issueSelect = page.locator('select[name="device_issue_type_id"]');
  await expect.poll(async () => await issueSelect.locator('option').count(), { timeout: 15000 }).toBeGreaterThan(1);
  await selectFirstNonEmptyOption(issueSelect);

  const repairTypeSelect = page.locator('select[name="repair_type_id"]');
  await selectFirstNonEmptyOption(repairTypeSelect);

  await page.locator('button[data-repair-submit]').click();
  await expect(page).toHaveURL(/\/admin\/reparaciones\/\d+$/);
  await expect(page.locator('form[action*="/estado"] select[name="status"]')).toBeVisible();

  const statusSelect = page.locator('form[action*="/estado"] select[name="status"]');
  const statusToSet = await statusSelect.evaluate((el) => {
    const current = el.value;
    const options = Array.from(el.options || []);
    const next = options.find((o) => o.value && o.value !== current && !o.disabled);
    return next ? next.value : '';
  });
  expect(statusToSet).not.toBe('');

  await statusSelect.selectOption(statusToSet);
  await page.getByRole('button', { name: /Guardar estado/i }).click();
  await expect(page.locator('form[action*="/estado"] select[name="status"]')).toHaveValue(statusToSet);

  const waLogsCard = page.locator('.card', { hasText: 'Logs WhatsApp' }).first();
  const initialWaLogs = Number((await waLogsCard.locator('.badge-zinc').first().innerText()).replace(/[^\d]/g, '') || '0');

  const waAction = page.locator('[data-wa-open]').first();
  await waAction.evaluate((el) => el.removeAttribute('target'));
  await waAction.click();

  await expect(page.locator('#waToast')).toContainText(/registrado|ya estaba registrado/i);

  await page.reload();
  const finalWaLogs = Number((await page.locator('.card', { hasText: 'Logs WhatsApp' }).first().locator('.badge-zinc').first().innerText()).replace(/[^\d]/g, '') || '0');
  expect(finalWaLogs).toBeGreaterThanOrEqual(initialWaLogs + 1);
});

import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@nico.local';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin1234';

const loginAdmin = async (page) => {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin(\/dashboard)?$/);
};

const getSignedApprovalUrl = async (page, repairCode) => {
  await page.goto(`/admin/reparaciones?q=${encodeURIComponent(repairCode)}`);
  const row = page.locator('table tbody tr', { hasText: repairCode }).first();
  await expect(row).toBeVisible();
  await row.getByRole('link', { name: 'Ver' }).click();
  await expect(page).toHaveURL(/\/admin\/reparaciones\/\d+$/);

  const approvalInput = page.locator('input[readonly][value*="/reparacion/"][value*="/presupuesto"]').first();
  await expect(approvalInput).toBeVisible();
  return approvalInput.inputValue();
};

test.setTimeout(70000);

test('public signed quote link can approve and reject pending repairs', async ({ page, browser }) => {
  await loginAdmin(page);

  const approveUrl = await getSignedApprovalUrl(page, 'R-E2E-QUOTE-APPROVE');
  const approveUnsignedUrl = approveUrl.split('?')[0];

  const guestContextApprove = await browser.newContext();
  const guestApprovePage = await guestContextApprove.newPage();

  const unsignedResponse = await guestApprovePage.goto(approveUnsignedUrl);
  expect([401, 403, 404]).toContain(unsignedResponse?.status() ?? 0);

  const approveResponse = await guestApprovePage.goto(approveUrl);
  expect(approveResponse?.status()).toBe(200);
  await expect(guestApprovePage.locator('.page-title', { hasText: 'Presupuesto de reparación' })).toBeVisible();
  await guestApprovePage.getByRole('button', { name: 'Aprobar presupuesto' }).click();
  await expect(guestApprovePage.locator('.alert-success').first()).toContainText(/Presupuesto aprobado/i);
  await guestContextApprove.close();

  const rejectUrl = await getSignedApprovalUrl(page, 'R-E2E-QUOTE-REJECT');
  const guestContextReject = await browser.newContext();
  const guestRejectPage = await guestContextReject.newPage();

  const rejectResponse = await guestRejectPage.goto(rejectUrl);
  expect(rejectResponse?.status()).toBe(200);
  await guestRejectPage.getByRole('button', { name: 'Rechazar presupuesto' }).click();
  await expect(guestRejectPage.locator('.alert-success').first()).toContainText(/Presupuesto rechazado/i);
  await guestContextReject.close();
});

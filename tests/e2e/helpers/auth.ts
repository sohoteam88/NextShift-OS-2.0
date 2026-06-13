// E2E Auth Helpers — use env vars for credentials, never hardcode
import { Page, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'test-user@example.test';
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'test-password-123';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@example.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin-password-123';

export async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', TEST_USER_EMAIL);
  await page.fill('input[name="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await expect(page.locator('h1')).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.goto('/dashboard');
  // Click logout/settings — adapt to actual UI
  const logoutBtn = page.locator('text=Logout, text=Sign out, text=退出');
  if (await logoutBtn.isVisible()) await logoutBtn.click();
}

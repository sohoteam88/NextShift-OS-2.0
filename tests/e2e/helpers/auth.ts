// E2E Auth Helpers — use env vars for credentials, never hardcode
import { Page, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'test-user@example.test';
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'test-password-123';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@example.test';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin-password-123';
const DANGLING_USER_EMAIL = process.env.E2E_DANGLING_USER_EMAIL || 'e2e-dangling@example.test';
const DANGLING_USER_PASSWORD = process.env.E2E_DANGLING_USER_PASSWORD || 'e2e-dangling-password-123';

export async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', TEST_USER_EMAIL);
  await page.fill('input[name="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
  await expect(page.locator('h1')).toBeVisible();
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === '/superadmin', { timeout: 15000 });
}

export async function loginAsDanglingUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', DANGLING_USER_EMAIL);
  await page.fill('input[name="password"]', DANGLING_USER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname === '/setup-workspace', { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'User menu' }).click();
  const logoutButton = page.getByRole('button', { name: /退出登录|Logout|Sign out/i });
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
  await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 });
}

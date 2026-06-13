import { test, expect } from '@playwright/test';
import { loginAsUser, logout } from './helpers/auth';

test.describe('Auth Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('protected dashboard redirects unauthenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10000 });
  });

  test('login as test user and see dashboard', async ({ page }) => {
    await loginAsUser(page);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await loginAsUser(page);
    await logout(page);
    await page.goto('/dashboard');
    await page.waitForURL('**/login**', { timeout: 10000 });
  });
});

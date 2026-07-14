import { test, expect } from '@playwright/test';
import { loginAsDanglingUser, loginAsUser, logout } from './helpers/auth';

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

  test('signup asks the user to verify email instead of showing a raw auth error', async ({ page }) => {
    await page.route('**/auth/v1/signup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'signup-verification-fixture',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'signup-verification@example.test',
          email_confirmed_at: null,
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/signup');
    await page.fill('input[name="owner_name"]', 'Signup Verification');
    await page.fill('input[name="email"]', 'signup-verification@example.test');
    await page.fill('input[name="password"]', 'password-123');
    await page.fill('input[name="team_name"]', 'Signup Verification Team');
    await page.fill('input[name="team_slug"]', 'signup-verification-team');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('status')).toContainText(/verify|验证|sahkan/i);
    await expect(page.getByText('Authentication required', { exact: true })).toHaveCount(0);
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

  test('a dangling authenticated account finishes workspace setup and reaches the dashboard', async ({ page }) => {
    await loginAsDanglingUser(page);
    await expect(page.getByRole('heading', { name: /workspace|工作区|ruang kerja/i })).toBeVisible();

    const suffix = Date.now().toString(36);
    await page.fill('input[name="owner_name"]', 'E2E Recovered User');
    await page.fill('input[name="team_name"]', `Recovered Team ${suffix}`);
    await page.fill('input[name="team_slug"]', `recovered-${suffix}`);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

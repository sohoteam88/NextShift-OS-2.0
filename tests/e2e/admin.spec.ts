import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin } from './helpers/auth';

test.describe('Admin Protection', () => {
  test('normal user cannot access admin-command', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin-command');
    await page.waitForLoadState('networkidle');
    // Should be redirected or see an error/unauthorized message
    const url = page.url();
    const isRedirected = url.includes('unauthorized') || url.includes('login') || !url.includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('normal user cannot access admin/feedback', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin/feedback');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isRedirected = url.includes('unauthorized') || url.includes('login') || !url.includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('normal user cannot access admin/launch-readiness', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin/launch-readiness');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isRedirected = url.includes('unauthorized') || url.includes('login') || !url.includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('normal user cannot access admin/approvals', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin/approvals');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isRedirected = url.includes('unauthorized') || url.includes('login') || !url.includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('normal user cannot access admin page', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const isRedirected = url.includes('unauthorized') || url.includes('login') || !url.includes('admin');
    expect(isRedirected).toBeTruthy();
  });

  test('admin dashboard loads for admin user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin-command');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(30);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('admin page loads without console errors', async ({ page }) => {
    await loginAsAdmin(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/admin-command');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('fetch'))).toHaveLength(0);
  });
});

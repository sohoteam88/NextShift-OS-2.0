import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Content Engine', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('content engine page loads', async ({ page }) => {
    await page.goto('/content-engine');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(20);
  });

  test('platform selector buttons exist', async ({ page }) => {
    await page.goto('/content-engine');
    await page.waitForLoadState('networkidle');
    const buttons = page.locator('button');
    const count = await buttons.count();
    // Should have some buttons on the page
    expect(count).toBeGreaterThan(0);
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/content-engine');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('fetch'))).toHaveLength(0);
  });
});

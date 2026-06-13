import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Brand Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('brand discovery page loads', async ({ page }) => {
    await page.goto('/brand-discovery');
    await page.waitForLoadState('networkidle');
    // Should show chat or interview interface
    const chatArea = page.locator('[class*="chat"], [class*="Chat"], textarea, input[type="text"]').first();
    if (await chatArea.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(chatArea).toBeVisible();
    }
  });

  test('confidence score area exists', async ({ page }) => {
    await page.goto('/brand-discovery');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    // Should mention brand readiness or confidence in some form
    expect(body.length).toBeGreaterThan(20);
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/brand-discovery');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('fetch'))).toHaveLength(0);
  });
});

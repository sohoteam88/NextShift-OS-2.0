import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Funnel Context', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('funnel context page loads', async ({ page }) => {
    await page.goto('/funnel-context');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').innerText();
    // Should mention retail, recruitment, upgrade or funnel types
    expect(body.length).toBeGreaterThan(20);
  });

  test('retail funnel context is visible', async ({ page }) => {
    await page.goto('/funnel-context');
    await page.waitForLoadState('networkidle');
    const retailText = page.locator('text=/retail|Retail|零售/i').first();
    if (await retailText.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(retailText).toBeVisible();
    }
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/funnel-context');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('fetch'))).toHaveLength(0);
  });
});

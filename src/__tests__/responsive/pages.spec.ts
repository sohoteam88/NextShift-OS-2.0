import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const mobileViewport = { width: 375, height: 812 };
const protectedRoutes = ['/crm/pipeline', '/analytics', '/team'] as const;

async function assertNoHorizontalScroll(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
}

test.describe('mobile responsive pages', () => {
  test.use({ viewport: mobileViewport });

  test('login remains usable on mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'NextShift OS' })).toBeVisible();
    await assertNoHorizontalScroll(page);
  });

  test('signup remains usable on mobile', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /创建你的团队/ })).toBeVisible();
    await assertNoHorizontalScroll(page);
  });

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated users to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
      await assertNoHorizontalScroll(page);
    });
  }

  const authStatePath = process.env.E2E_AUTH_STATE
    ? path.resolve(process.env.E2E_AUTH_STATE)
    : '';
  const leadId = process.env.E2E_LEAD_ID ?? '';
  const funnelId = process.env.E2E_FUNNEL_ID ?? '';

  test.describe('authenticated mobile pages', () => {
    test.skip(!authStatePath || !fs.existsSync(authStatePath), 'E2E auth state not configured');
    test.use({ storageState: authStatePath });

    test('crm pipeline keeps columns inside the viewport', async ({ page }) => {
      await page.goto('/crm/pipeline');
      await expect(page).not.toHaveURL(/\/login/);
      await assertNoHorizontalScroll(page);
    });

    test('analytics stays within the viewport', async ({ page }) => {
      await page.goto('/analytics');
      await expect(page).not.toHaveURL(/\/login/);
      await assertNoHorizontalScroll(page);
    });

    test('team overview stays within the viewport', async ({ page }) => {
      await page.goto('/team');
      await expect(page).not.toHaveURL(/\/login/);
      await assertNoHorizontalScroll(page);
    });

    test('crm lead detail stays within the viewport', async ({ page }) => {
      test.skip(!leadId, 'E2E_LEAD_ID not configured');
      await page.goto(`/crm/${leadId}`);
      await expect(page).not.toHaveURL(/\/login/);
      await assertNoHorizontalScroll(page);
    });

    test('funnel editor stays within the viewport', async ({ page }) => {
      test.skip(!funnelId, 'E2E_FUNNEL_ID not configured');
      await page.goto(`/funnel/${funnelId}/edit`);
      await expect(page).not.toHaveURL(/\/login/);
      await assertNoHorizontalScroll(page);
    });
  });
});

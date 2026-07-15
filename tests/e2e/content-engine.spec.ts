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

  test('generates, edits, saves, reloads, and copies the current draft', async ({ page }) => {
    let savedBody = 'Generated body';
    let savedTitle = 'Generated title';

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(page.url()).origin,
    });
    await page.route('**/api/v1/brand-builder/profile', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            identity: 'Test creator',
            target_audience: 'Test audience',
            offer: 'Test offer',
          },
        }),
      });
    });
    await page.route('**/api/v1/content-engine', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            trackCalendars: { retail: null, recruitment: null },
            lastPost: savedBody === 'Generated body' ? null : {
              id: 'content-e2e-1',
              pillar: '教育内容',
              pillarEmoji: '📚',
              title: savedTitle,
              hook: 'Hook',
              body: savedBody,
              cta: 'CTA',
              hashtags: [],
              platform: 'instagram',
              format: 'text_post',
              funnelStage: 'awareness',
              status: 'draft',
              qualityScore: 75,
              createdAt: '2026-07-15T00:00:00.000Z',
              updatedAt: '2026-07-15T00:00:00.000Z',
            },
          },
        }),
      });
    });
    await page.route('**/api/v1/content-engine/generate', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'content-e2e-1',
            pillar: '教育内容',
            pillarEmoji: '📚',
            title: savedTitle,
            hook: 'Hook',
            body: savedBody,
            cta: 'CTA',
            hashtags: [],
            platform: 'instagram',
            format: 'text_post',
            funnelStage: 'awareness',
            status: 'draft',
            qualityScore: 75,
            createdAt: '2026-07-15T00:00:00.000Z',
            updatedAt: '2026-07-15T00:00:00.000Z',
          },
        }),
      });
    });
    await page.route('**/api/v1/ai/content/content-e2e-1', async (route) => {
      expect(route.request().method()).toBe('PATCH');
      const patch = route.request().postDataJSON() as {
        content: string;
        title: string;
        platform: string;
      };
      savedBody = patch.content;
      savedTitle = patch.title;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'content-e2e-1',
            title: savedTitle,
            body: savedBody,
            platform: patch.platform,
            type: 'text_post',
            status: 'draft',
            createdAt: '2026-07-15T00:00:00.000Z',
          },
        }),
      });
    });

    await page.goto('/content-engine');
    await page.getByLabel('发布平台').selectOption('instagram');
    await page.getByRole('button', { name: '生成贴文' }).click();
    await expect(page.getByLabel('贴文标题')).toHaveValue('Generated title');

    await page.getByLabel('贴文正文').fill('Edited current body');
    await page.getByLabel('贴文标题').fill('Edited title');
    await expect(page.getByText('有未保存的编辑。')).toBeVisible();
    await page.getByRole('button', { name: '保存草稿' }).click();
    await expect(page.getByText(/草稿已保存/)).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('贴文标题')).toHaveValue('Edited title');
    await expect(page.getByLabel('贴文正文')).toHaveValue('Edited current body');
    await page.getByRole('button', { name: '复制当前正文' }).click();
    await expect(page.getByText('已复制当前编辑版本。')).toBeVisible();
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/content-engine');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('fetch'))).toHaveLength(0);
  });
});

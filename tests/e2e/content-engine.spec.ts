import { test, expect, type Page } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

function generatedPost(id: string, title: string, body: string) {
  return {
    id,
    pillar: '教育内容',
    pillarEmoji: '📚',
    title,
    hook: 'Hook',
    body,
    cta: 'CTA',
    hashtags: [],
    platform: 'instagram',
    format: 'text_post',
    funnelStage: 'awareness',
    status: 'draft',
    qualityScore: 75,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
  } as const;
}

async function mockEditableGeneratedPost(
  page: Page,
  post: ReturnType<typeof generatedPost>,
) {
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
          lastPost: null,
        },
      }),
    });
  });
  await page.route('**/api/v1/content-engine/generate', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: post }),
    });
  });
}

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
            updatedAt: '2026-07-15T00:01:00.000Z',
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

  test('keeps edits typed while an earlier save is in flight', async ({ page }) => {
    const post = generatedPost('content-e2e-race', 'Generated title', 'Generated body');
    await mockEditableGeneratedPost(page, post);

    let releaseSave!: () => void;
    const saveMayFinish = new Promise<void>((resolve) => {
      releaseSave = resolve;
    });
    let markSaveStarted!: () => void;
    const saveStarted = new Promise<void>((resolve) => {
      markSaveStarted = resolve;
    });

    await page.route('**/api/v1/ai/content/content-e2e-race', async (route) => {
      const patch = route.request().postDataJSON() as {
        content: string;
        title: string;
        platform: string;
      };
      markSaveStarted();
      await saveMayFinish;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: post.id,
            title: patch.title,
            body: patch.content,
            platform: patch.platform,
            type: 'text_post',
            status: 'draft',
            createdAt: post.createdAt,
            updatedAt: '2026-07-15T00:01:00.000Z',
          },
        }),
      });
    });

    await page.goto('/content-engine');
    await page.getByRole('button', { name: '生成贴文' }).click();
    await page.getByLabel('贴文正文').fill('Submitted body');
    await page.getByRole('button', { name: '保存草稿' }).click();
    await saveStarted;

    await page.getByLabel('贴文正文').fill('Typed while saving');
    releaseSave();

    await expect(page.getByLabel('贴文正文')).toHaveValue('Typed while saving');
    await expect(page.getByText('有未保存的编辑。')).toBeVisible();

    await page.getByLabel('贴文正文').fill('Submitted body');
    await expect(page.getByText(/草稿已保存/)).toBeVisible();
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeDisabled();
  });

  test('preserves failed edits and retries the same canonical content ID', async ({ page }) => {
    const post = generatedPost('content-e2e-retry', 'Generated title', 'Generated body');
    await mockEditableGeneratedPost(page, post);

    const requestUrls: string[] = [];
    const payloads: Array<{ content: string; title: string; platform: string }> = [];
    let attempt = 0;
    await page.route('**/api/v1/ai/content/content-e2e-retry', async (route) => {
      attempt += 1;
      requestUrls.push(route.request().url());
      const patch = route.request().postDataJSON() as {
        content: string;
        title: string;
        platform: string;
      };
      payloads.push(patch);

      if (attempt === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Temporary save failure' } }),
        });
        return;
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: post.id,
            title: patch.title,
            body: patch.content,
            platform: patch.platform,
            type: 'text_post',
            status: 'draft',
            createdAt: post.createdAt,
            updatedAt: '2026-07-15T00:01:00.000Z',
          },
        }),
      });
    });

    await page.goto('/content-engine');
    await page.getByRole('button', { name: '生成贴文' }).click();
    await page.getByLabel('贴文标题').fill('Retry title');
    await page.getByLabel('贴文正文').fill('Retry body');
    await page.getByRole('button', { name: '保存草稿' }).click();

    await expect(
      page.getByText('保存失败：Temporary save failure。你的编辑仍保留在这里。'),
    ).toBeVisible();
    await expect(page.getByLabel('贴文标题')).toHaveValue('Retry title');
    await expect(page.getByLabel('贴文正文')).toHaveValue('Retry body');

    await page.getByRole('button', { name: '重试保存' }).click();
    await expect(page.getByText(/草稿已保存/)).toBeVisible();

    expect(requestUrls).toHaveLength(2);
    expect(requestUrls.every((url) => url.endsWith(`/api/v1/ai/content/${post.id}`))).toBe(true);
    expect(payloads).toEqual([
      { content: 'Retry body', title: 'Retry title', platform: 'instagram' },
      { content: 'Retry body', title: 'Retry title', platform: 'instagram' },
    ]);
  });

  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/content-engine');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('fetch'))).toHaveLength(0);
  });
});

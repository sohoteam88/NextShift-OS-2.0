import { expect, test, type Page, type Route } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

type StoredContent = {
  id: string;
  title: string;
  body: string;
  platform: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const initialContent = (): StoredContent => ({
  id: 'content-library-e2e-1',
  title: 'E1 saved draft',
  body: 'E1 saved body',
  platform: 'instagram',
  type: 'text_post',
  status: 'draft',
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T01:00:00.000Z',
});

async function mockContentEngineShell(page: Page) {
  await page.route('**/api/v1/brand-builder/profile', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: { identity: 'Test creator', target_audience: 'Test audience', offer: 'Test offer' },
    }),
  }));
  await page.route('**/api/v1/content-engine', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      data: { trackCalendars: { retail: null, recruitment: null }, lastPost: null },
    }),
  }));
}

function listItem(item: StoredContent) {
  return {
    id: item.id,
    title: item.title,
    displayTitle: item.title,
    platform: item.platform,
    type: item.type,
    status: item.status,
    preview: item.body.slice(0, 180),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function fulfillError(route: Route, status: number, message: string) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ error: { message } }),
  });
}

test.describe('Content Library mocked browser evidence', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await mockContentEngineShell(page);
  });

  test('reopens, edits, saves, copies, cancels delete, then deletes the same canonical ID', async ({ page }) => {
    let content: StoredContent | null = initialContent();
    const patchedUrls: string[] = [];

    await page.route(/\/api\/v1\/ai\/content(?:\?.*)?$/, async (route) => {
      const items = content ? [listItem(content)] : [];
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: items,
          meta: { page: 1, limit: 10, total: items.length, totalPages: items.length ? 1 : 0 },
        }),
      });
    });
    await page.route('**/api/v1/ai/content/content-library-e2e-1', async (route) => {
      if (!content) return fulfillError(route, 404, 'Content not found');
      const method = route.request().method();
      if (method === 'PATCH') {
        patchedUrls.push(route.request().url());
        const input = route.request().postDataJSON() as { title: string; content: string };
        content = {
          ...content,
          title: input.title,
          body: input.content,
          updatedAt: '2026-07-15T02:00:00.000Z',
        };
      } else if (method === 'DELETE') {
        const id = content.id;
        content = null;
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { id, deleted: true } }),
        });
        return;
      }
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: content }),
      });
    });

    await page.goto('/content-engine');
    await expect(page.getByRole('heading', { name: '内容资料库' })).toBeVisible();
    await page.getByRole('button', { name: '打开 E1 saved draft' }).click();
    await expect(page.getByLabel('标题', { exact: true })).toHaveValue('E1 saved draft');
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('E1 saved body');

    await page.getByLabel('标题', { exact: true }).fill('Library edited title');
    await page.getByLabel('正文', { exact: true }).fill('Library edited current body');
    await expect(page.getByText('有未保存的修改')).toBeVisible();
    await page.getByRole('button', { name: '保存同一草稿' }).click();
    await expect(page.getByText('已保存', { exact: true })).toBeVisible();
    expect(patchedUrls).toHaveLength(1);
    expect(patchedUrls[0]).toContain(content?.id ?? 'content-library-e2e-1');

    await page.getByRole('button', { name: '关闭对话框' }).click();
    await page.getByRole('button', { name: '打开 Library edited title' }).click();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('Library edited current body');

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: '复制正文' }).click();
    await expect(page.getByText('已复制当前正文')).toBeVisible();

    await page.getByRole('button', { name: '删除', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '确认删除这项内容？' })).toBeVisible();
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('Library edited current body');

    await page.getByRole('button', { name: '删除', exact: true }).click();
    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByText('还没有保存的内容')).toBeVisible();
  });

  test('shows a true empty state and distinct list/item failures', async ({ page }) => {
    let listAttempt = 0;
    await page.route(/\/api\/v1\/ai\/content(?:\?.*)?$/, async (route) => {
      listAttempt += 1;
      if (listAttempt === 1) return fulfillError(route, 503, 'Temporary list failure');
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
      });
    });

    await page.goto('/content-engine');
    await expect(page.getByText('Temporary list failure')).toBeVisible();
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.getByText('还没有保存的内容')).toBeVisible();
  });

  test('preserves edits across failed save and failed delete retries', async ({ page }) => {
    let content: StoredContent | null = initialContent();
    let saveAttempts = 0;
    let deleteAttempts = 0;
    await page.route(/\/api\/v1\/ai\/content(?:\?.*)?$/, (route) => {
      const items = content ? [listItem(content)] : [];
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: items, meta: { page: 1, limit: 10, total: items.length, totalPages: items.length ? 1 : 0 } }),
      });
    });
    await page.route('**/api/v1/ai/content/content-library-e2e-1', async (route) => {
      if (!content) return fulfillError(route, 404, 'Content not found');
      if (route.request().method() === 'PATCH') {
        saveAttempts += 1;
        if (saveAttempts === 1) return fulfillError(route, 503, 'Temporary save failure');
        const input = route.request().postDataJSON() as { title: string; content: string };
        content = { ...content, title: input.title, body: input.content, updatedAt: '2026-07-15T02:00:00.000Z' };
      }
      if (route.request().method() === 'DELETE') {
        deleteAttempts += 1;
        if (deleteAttempts === 1) return fulfillError(route, 503, 'Temporary delete failure');
        const id = content.id;
        content = null;
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { id, deleted: true } }) });
        return;
      }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: content }) });
    });

    await page.goto('/content-engine');
    await page.getByRole('button', { name: '打开 E1 saved draft' }).click();
    await page.getByLabel('标题', { exact: true }).fill('Retry title');
    await page.getByLabel('正文', { exact: true }).fill('Retry body');
    await page.getByRole('button', { name: '保存同一草稿' }).click();
    await expect(page.getByText(/Temporary save failure.*编辑仍保留/)).toBeVisible();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('Retry body');
    await page.getByRole('button', { name: '保存同一草稿' }).click();
    await expect(page.getByText('已保存', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '删除', exact: true }).click();
    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByText(/Temporary delete failure.*内容仍保留/)).toBeVisible();
    await page.getByRole('button', { name: '确认删除' }).click();
    await expect(page.getByText('还没有保存的内容')).toBeVisible();
  });

  test('retries a failed item request and resets pagination when filters change', async ({ page }) => {
    const content = initialContent();
    const listUrls: string[] = [];
    let itemAttempts = 0;
    await page.route(/\/api\/v1\/ai\/content(?:\?.*)?$/, (route) => {
      listUrls.push(route.request().url());
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [listItem(content)],
          meta: { page: Number(new URL(route.request().url()).searchParams.get('page')), limit: 10, total: 11, totalPages: 2 },
        }),
      });
    });
    await page.route('**/api/v1/ai/content/content-library-e2e-1', async (route) => {
      itemAttempts += 1;
      if (itemAttempts === 1) return fulfillError(route, 503, 'Temporary item failure');
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: content }) });
    });

    await page.goto('/content-engine');
    await page.getByRole('button', { name: '打开 E1 saved draft' }).click();
    await expect(page.getByText('Temporary item failure')).toBeVisible();
    await page.getByRole('button', { name: '重试' }).click();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('E1 saved body');
    await page.getByRole('button', { name: '关闭对话框' }).click();

    await page.getByRole('button', { name: '下一页' }).click();
    await expect.poll(() => listUrls.some((url) => new URL(url).searchParams.get('page') === '2')).toBe(true);
    await page.getByLabel('按状态筛选内容').selectOption('published');
    await expect.poll(() => {
      const latest = new URL(listUrls[listUrls.length - 1]);
      return `${latest.searchParams.get('page')}:${latest.searchParams.get('status')}`;
    }).toBe('1:published');
  });

  test('guards dirty close and remains usable at a narrow viewport', async ({ page }) => {
    const content = initialContent();
    const secondContent = {
      ...initialContent(),
      id: 'content-library-e2e-2',
      title: 'Second saved draft',
      body: 'Second saved body',
      updatedAt: '2026-07-15T01:01:00.000Z',
    };
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(/\/api\/v1\/ai\/content(?:\?.*)?$/, (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [listItem(secondContent), listItem(content)], meta: { page: 1, limit: 10, total: 2, totalPages: 1 } }),
    }));
    await page.route('**/api/v1/ai/content/content-library-e2e-*', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: route.request().url().endsWith(secondContent.id) ? secondContent : content,
      }),
    }));

    await page.goto('/content-engine');
    await page.getByRole('button', { name: '打开 E1 saved draft' }).click();
    await page.getByLabel('正文', { exact: true }).fill('Unsaved mobile edit');
    await page.getByLabel('切换到其他内容').selectOption(secondContent.id);
    await expect(page.getByRole('dialog', { name: '舍弃未保存的修改？' })).toBeVisible();
    await page.getByRole('button', { name: '继续编辑' }).click();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('Unsaved mobile edit');

    await page.getByLabel('切换到其他内容').selectOption(secondContent.id);
    await page.getByRole('button', { name: '舍弃并继续' }).click();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('Second saved body');
    await page.getByLabel('正文', { exact: true }).fill('Unsaved second mobile edit');
    await page.getByRole('button', { name: '关闭对话框' }).click();
    await expect(page.getByRole('dialog', { name: '舍弃未保存的修改？' })).toBeVisible();
    await page.getByRole('button', { name: '继续编辑' }).click();
    await expect(page.getByLabel('正文', { exact: true })).toHaveValue('Unsaved second mobile edit');
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  });
});

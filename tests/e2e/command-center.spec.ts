import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const commandCenterEnabled = process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER === 'true';
const aiDiscussionEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_DISCUSSION === 'true';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sourceLabel(source: 'engine' | 'rule', confidence: number) {
  if (source === 'rule') return '新手引导';
  return confidence < 0.5 ? '探索性建议' : 'AI 分析';
}

function confidenceLabel(source: 'engine' | 'rule', confidence: number) {
  if (source === 'rule' || confidence < 0.7) return null;
  const normalized = Number.isFinite(confidence) ? confidence : 0;
  return `${Math.max(0, Math.min(100, Math.round(normalized * 100)))}%`;
}

test.describe('Command Center recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('flag on: dashboard recommendation card expands and CTA navigates', async ({ page }) => {
    test.skip(!commandCenterEnabled, 'Command Center flag must be enabled for this E2E path.');

    const response = await page.request.get('/api/v1/dashboard/recommendation');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data).toBeTruthy();

    const recommendation = body.data.recommendation;
    const route = recommendation.route ?? '/dashboard';
    const ctaLabel = recommendation.ctaLabel ?? 'Open recommendation';
    expect(['engine', 'rule']).toContain(body.data.source);

    await page.goto('/dashboard');
    const recommendationCard = page.getByTestId('today-recommendation-card');
    await expect(recommendationCard).toBeVisible({ timeout: 15000 });
    const recommendationIsFirstDashboardCard = await recommendationCard.evaluate(
      (element) => element.parentElement?.firstElementChild === element,
    );
    expect(recommendationIsFirstDashboardCard).toBeTruthy();
    await expect(page.getByText(recommendation.title)).toBeVisible();
    await expect(recommendationCard).toContainText(sourceLabel(body.data.source, body.data.confidence));
    const confidence = confidenceLabel(body.data.source, body.data.confidence);
    if (confidence) {
      await expect(recommendationCard).toContainText(confidence);
    }

    await page.getByRole('button', { name: /Why this recommendation/i }).click();
    await expect(page.locator('#today-recommendation-explain')).toBeVisible();
    await expect(page.locator('#today-recommendation-explain')).toContainText(body.data.explain);

    await page.getByRole('button', { name: ctaLabel }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(route)));
  });

  test('flag on: recommendation discussion API returns the response contract', async ({ page }) => {
    test.skip(
      !(commandCenterEnabled && aiDiscussionEnabled),
      'Command Center and AI Discussion flags must be enabled for this E2E path.',
    );

    const response = await page.request.post('/api/v1/dashboard/recommendation/discuss', {
      data: {
        message: 'What is the weather in Tokyo tomorrow?',
        history: [],
      },
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.reply).toContain('today\'s recommendation');
    expect(body.turnsUsed).toBe(1);
    expect(body.turnsLimit).toBe(5);
  });

  test('flag on: recommendation discussion panel sends and receives a reply', async ({ page }) => {
    test.skip(
      !(commandCenterEnabled && aiDiscussionEnabled),
      'Command Center and AI Discussion flags must be enabled for this E2E path.',
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('today-recommendation-card')).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('button', { name: /和 AI 讨论/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /和 AI 讨论/i }).click();
    await expect(page.getByTestId('today-recommendation-discussion')).toBeVisible();

    await page.getByPlaceholder('输入你的问题').fill('What is the weather in Tokyo tomorrow?');
    await page.getByRole('button', { name: '发送' }).click();

    await expect(page.getByText(/today's recommendation/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('第 1/5 轮')).toBeVisible();
  });

  test('flag off: dashboard does not render the recommendation card', async ({ page }) => {
    test.skip(commandCenterEnabled, 'Command Center flag must be disabled for this E2E path.');

    const response = await page.request.get('/api/v1/dashboard/recommendation');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ data: null });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);
  });
});

import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const commandCenterEnabled = process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER === 'true';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sourceLabel(source: 'engine' | 'rule') {
  return source === 'engine' ? 'AI 分析' : '新手引导';
}

function confidenceLabel(confidence: number) {
  const normalized = Number.isFinite(confidence) ? confidence : 0;
  return `${Math.max(0, Math.min(100, Math.round(normalized * 100)))}% confidence`;
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
    await expect(page.getByTestId('today-recommendation-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(recommendation.title)).toBeVisible();
    await expect(page.getByText(confidenceLabel(body.data.confidence))).toBeVisible();
    await expect(page.getByText(sourceLabel(body.data.source))).toBeVisible();

    await page.getByRole('button', { name: /Why this recommendation/i }).click();
    await expect(page.locator('#today-recommendation-explain')).toBeVisible();
    await expect(page.locator('#today-recommendation-explain')).toContainText(body.data.explain);

    await page.getByRole('button', { name: ctaLabel }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(route)));
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

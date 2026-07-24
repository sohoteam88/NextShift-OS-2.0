import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const commandCenterEnabled = process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER === 'true';
const aiDiscussionEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_DISCUSSION === 'true';

test.describe('Command Center recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('flag on: dashboard renders one unified mission card', async ({ page }) => {
    test.skip(!commandCenterEnabled, 'Command Center flag must be enabled for this E2E path.');

    const [recommendationResponse, projectionResponse] = await Promise.all([
      page.request.get('/api/v1/dashboard/recommendation'),
      page.request.get('/api/v1/dashboard/projection'),
    ]);
    expect(recommendationResponse.ok()).toBeTruthy();
    expect(projectionResponse.ok()).toBeTruthy();

    const recommendationBody = await recommendationResponse.json();
    const projectionBody = await projectionResponse.json();
    expect(recommendationBody.data).toBeTruthy();
    expect(projectionBody.data?.missionControl).toBeTruthy();

    const mission = projectionBody.data.missionControl;

    await page.goto('/dashboard');
    const missionCard = page.getByTestId('today-mission-card');
    await expect(missionCard).toBeVisible({ timeout: 15000 });
    await expect(missionCard).toContainText(mission.title);
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);
    await expect(page.getByTestId('mission-alternative-suggestion')).toHaveCount(0);
    await expect(missionCard).toContainText(mission.whyThis);
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

  // T2 note: Twin prompt-injection coverage lives in
  // src/__tests__/services/dashboard-discussion-service.test.ts (DI-mocked router asserts
  // system prompt content). E2E cannot observe prompt internals, and on-topic messages
  // would require live LLM provider keys that CI intentionally does not have.

  test('flag on: dashboard keeps discussion UI out of the first screen', async ({ page }) => {
    test.skip(
      !(commandCenterEnabled && aiDiscussionEnabled),
      'Command Center and AI Discussion flags must be enabled for this E2E path.',
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('today-mission-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);
    await expect(page.getByTestId('recommendation-discussion-toggle')).toHaveCount(0);
    await expect(page.getByTestId('today-recommendation-discussion')).toHaveCount(0);
    await expect(page.getByTestId('weekly-review-card')).toHaveCount(0);
  });

  test('flag off: mission remains available without a discussion entry', async ({ page }) => {
    test.skip(commandCenterEnabled, 'Command Center flag must be disabled for this E2E path.');

    const response = await page.request.get('/api/v1/dashboard/recommendation');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ data: null });

    await page.goto('/dashboard');
    await expect(page.getByTestId('today-mission-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);
    await expect(page.getByTestId('recommendation-discussion-toggle')).toHaveCount(0);
  });

  test('weekly review API preserves its nullable data contract without rendering a dashboard card', async ({ page }) => {
    const response = await page.request.get('/api/v1/dashboard/weekly-review');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('data');

    await page.goto('/dashboard');
    await expect(page.getByTestId('weekly-review-card')).toHaveCount(0);
  });
});

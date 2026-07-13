import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const commandCenterEnabled = process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER === 'true';
const aiDiscussionEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_DISCUSSION === 'true';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

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

    const recommendation = recommendationBody.data;
    const mission = projectionBody.data.missionControl;
    const divergent = recommendation.source === 'engine'
      && normalize(recommendation.recommendation.title) !== normalize(mission.title);

    await page.goto('/dashboard');
    const missionCard = page.getByTestId('today-mission-card');
    await expect(missionCard).toBeVisible({ timeout: 15000 });
    await expect(missionCard).toContainText(mission.title);
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);

    const alternativeSuggestion = page.getByTestId('mission-alternative-suggestion');
    if (divergent) {
      await expect(alternativeSuggestion).toBeVisible();
      await alternativeSuggestion.getByRole('button').click();
      await expect(alternativeSuggestion).toContainText(recommendation.recommendation.title);
      await expect(alternativeSuggestion).toContainText(
        recommendation.explain || recommendation.recommendation.rationale,
      );
    } else {
      await expect(alternativeSuggestion).toHaveCount(0);
      await expect(missionCard).toContainText(mission.whyThis);
    }
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

  test('flag on: unified mission discussion panel sends and receives a reply', async ({ page }) => {
    test.skip(
      !(commandCenterEnabled && aiDiscussionEnabled),
      'Command Center and AI Discussion flags must be enabled for this E2E path.',
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('today-mission-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);

    await expect(page.getByRole('button', { name: /和 AI 讨论/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /和 AI 讨论/i }).click();
    await expect(page.getByTestId('today-recommendation-discussion')).toBeVisible();

    await page.getByPlaceholder('输入你的问题').fill('What is the weather in Tokyo tomorrow?');
    await page.getByRole('button', { name: '发送' }).click();

    await expect(page.getByText(/today's recommendation/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('第 1/5 轮')).toBeVisible();
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
    await expect(page.getByRole('button', { name: /和 AI 讨论/i })).toHaveCount(0);
  });
});

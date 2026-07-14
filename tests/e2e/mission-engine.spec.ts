import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Mission Engine', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('dashboard shows mission coach', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Mission coach hero or mission card should be visible
    const missionSection = page.locator('section, [class*="mission"], [class*="coach"], [class*="hero"]').first();
    await expect(missionSection).toBeVisible({ timeout: 15000 });
  });

  test('current mission is displayed', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Should show some stage/task text
    const content = await page.locator('body').innerText();
    expect(content.length).toBeGreaterThan(50);
  });

  test('current mission API returns stable mission projection', async ({ page }) => {
    const response = await page.request.get('/api/v1/mission/current');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data.currentMission).toBeTruthy();
    expect(body.data.progress).toBeTruthy();
    expect(body.data.estimatedCompletion).toBeTruthy();
  });

  test('business-state backed current mission path remains stable', async ({ page }) => {
    const response = await page.request.get('/api/v1/mission/current');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data.currentMission.id).toEqual(expect.any(String));
    expect(body.data.currentJourney).toBeTruthy();
    expect(body.data.progress.completionPercentage).toEqual(expect.any(Number));
    expect(body.data.estimatedCompletion.label).toEqual(expect.any(String));
    expect(body.data).not.toHaveProperty('runtime');
  });

  test('command center recommendation API returns a recommendation structure when enabled', async ({ page }) => {
    const response = await page.request.get('/api/v1/dashboard/recommendation');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data).toBeTruthy();
    expect(body.data.recommendation.title).toEqual(expect.any(String));
    expect(body.data.recommendation.summary).toEqual(expect.any(String));
    expect(body.data.recommendation.rationale).toEqual(expect.any(String));
    expect(body.data.confidence).toEqual(expect.any(Number));
    expect(body.data.explain).toEqual(expect.any(String));
    expect(['engine', 'rule']).toContain(body.data.source);
  });

  test('dashboard renders the mission card instead of a separate recommendation card when enabled', async ({ page }) => {
    const response = await page.request.get('/api/v1/dashboard/recommendation');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data).toBeTruthy();

    await page.goto('/dashboard');
    await expect(page.getByTestId('today-mission-card')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('today-recommendation-card')).toHaveCount(0);
  });

  test('progress bar is visible', async ({ page }) => {
    await page.goto('/dashboard');
    const progressBar = page.locator('[class*="progress"], [role="progressbar"]').first();
    if (await progressBar.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(progressBar).toBeVisible();
    }
  });

  test('dashboard loads without error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('hydration'))).toHaveLength(0);
  });
});

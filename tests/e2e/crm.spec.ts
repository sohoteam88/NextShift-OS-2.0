import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('CRM Runtime', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('CRM command center API returns stable CRM summary without leaking runtime metadata', async ({ page }) => {
    const response = await page.request.get('/api/v1/crm-center');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.data.leads.total).toEqual(expect.any(Number));
    expect(body.data.leads.byStage).toEqual(expect.any(Object));
    expect(body.data.revenueForecast.expectedRevenue).toEqual(expect.any(Number));
    expect(body.data.followups.today).toEqual(expect.any(Number));
    expect(body.data.appointments.thisMonth).toEqual(expect.any(Number));
    expect(body.data).not.toHaveProperty('runtime');
  });
});

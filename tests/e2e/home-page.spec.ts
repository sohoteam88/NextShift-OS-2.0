import { expect, test } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Authenticated home page', () => {
  test('renders the deterministic day-one task at the root route', async ({ page }) => {
    await loginAsUser(page);

    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('今天先做这一件事')).toBeVisible();
    await expect(page.getByRole('heading', {
      name: '逐个介绍拿到的每一个产品；教冲泡方法；拍 before 照',
    })).toBeVisible();
  });
});

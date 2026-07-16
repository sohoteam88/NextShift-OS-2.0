import { expect, test } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const desktopHrefs = [
  '/dashboard',
  '/journey',
  '/brand-builder/profile',
  '/content-engine',
  '/revenue-drivers',
  '/crm',
  '/ai-workforce',
];

test.describe('OS 3.8 member navigation convergence', () => {
  test('desktop Retail and Recruitment share the approved seven hrefs', async ({ page }) => {
    await loginAsUser(page);
    const navigation = page.getByRole('navigation', { name: /Retail Business OS navigation/ });
    await expect(navigation).toBeVisible();
    await expect(navigation.locator('a')).toHaveCount(7);
    expect(await navigation.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))))
      .toEqual(desktopHrefs);

    await page.getByRole('button', { name: 'Recruitment' }).click();
    const recruitment = page.getByRole('navigation', { name: /Recruitment Business OS navigation/ });
    expect(await recruitment.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))))
      .toEqual(desktopHrefs);
    await expect(recruitment.getByRole('link', { name: /Prospects|招募关系/ })).toHaveAttribute('href', '/crm');
  });

  test('desktop active state follows exact and nested canonical routes', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/content-engine');
    const navigation = page.getByRole('navigation', { name: /Business OS navigation/ });
    await expect(navigation.locator('a[href="/content-engine"]')).toHaveAttribute('aria-current', 'page');
    await expect(navigation.locator('a[aria-current="page"]')).toHaveCount(1);
  });

  test('mobile has four canonical tabs and accessible More focus lifecycle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsUser(page);
    const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(navigation.locator('a')).toHaveCount(4);
    expect(await navigation.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual([
      '/dashboard',
      '/content-engine',
      '/revenue-drivers',
      '/crm',
    ]);

    const more = navigation.getByRole('button', { name: /More|更多|Lagi/ });
    await more.focus();
    await more.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'More navigation' });
    await expect(dialog).toBeVisible();
    expect(await dialog.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual([
      '/journey',
      '/brand-builder/profile',
      '/ai-workforce',
      '/settings',
      '/billing',
      '/help',
    ]);
    await expect(dialog.locator('a').first()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.locator('a').last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.locator('a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(more).toBeFocused();
  });

  test('Content and Journey remain discoverable while hidden routes remain direct-only', async ({ page }) => {
    await loginAsUser(page);
    const navigation = page.getByRole('navigation', { name: /Business OS navigation/ });
    await expect(navigation.locator('a[href="/content-engine"]')).toBeVisible();
    await expect(navigation.locator('a[href="/journey"]')).toBeVisible();
    await expect(navigation.locator('a[href="/automation"]')).toHaveCount(0);
    await page.goto('/automation');
    await expect(page).toHaveURL(/\/automation(?:\?|$)/);
  });

  test('bookmarks preserve query and browser history through terminal redirects', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.goto('/leads?source=bookmark&tag=a&tag=b');
    await expect(page).toHaveURL(/\/crm\?source=bookmark&tag=a&tag=b/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goForward();
    await expect(page).toHaveURL(/\/crm\?source=bookmark&tag=a&tag=b/);
  });

  test('member cannot cross privileged Team or Founder boundaries', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/team/growth');
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await page.goto('/admin-command');
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  });
});

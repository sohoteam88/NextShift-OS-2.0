import { expect, test } from '@playwright/test';
import { loginAsAdmin, loginAsUser } from './helpers/auth';

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

    await more.press('Enter');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Close more navigation' }).click({ position: { x: 4, y: 4 } });
    await expect(dialog).toBeHidden();
    await expect(more).toBeFocused();

    await more.press('Enter');
    await dialog.getByRole('link', { name: /Journey|旅程/ }).click();
    await expect(page).toHaveURL(/\/journey(?:\?|$)/);
    await expect(more).not.toBeFocused();
  });

  test('mobile and desktop navigation meet continuously at the 1280px boundary', async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 844 });
    await loginAsUser(page);
    const mobile = page.getByRole('navigation', { name: 'Mobile navigation' });
    const desktop = page.getByRole('navigation', { name: /Business OS navigation/ });

    for (const width of [1023, 1024, 1279]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(mobile).toBeVisible();
      await expect(desktop).toBeHidden();
    }
    for (const width of [1280, 1281]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(desktop).toBeVisible();
      await expect(mobile).toBeHidden();
    }
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

  test('retired CRM bookmarks redirect home while preserving query and browser history', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.goto('/leads?source=bookmark&tag=a&tag=b');
    await expect(page).toHaveURL(/\/\?source=bookmark&tag=a&tag=b/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goForward();
    await expect(page).toHaveURL(/\/\?source=bookmark&tag=a&tag=b/);

    for (const route of ['/crm', '/crm-center', '/leads', '/sales']) {
      await page.goto(`${route}?source=legacy`);
      await expect(page).toHaveURL(/\/\?source=legacy/);
    }
  });

  test('remaining product capabilities stay discoverable at their terminal destinations', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/analytics?period=7d');
    await expect(page).toHaveURL(/\/analytics-center\?view=role&period=7d/);
    await expect(page.getByRole('navigation', { name: 'Analytics views' }).getByRole('link')).toHaveCount(2);

    await page.goto('/brand-discovery');
    await expect(page).toHaveURL(/\/brand-builder\/profile\?view=discovery/);
    await expect(page.getByRole('navigation', { name: 'Brand views' }).getByRole('link')).toHaveCount(3);

    await page.goto('/brand-dna');
    await expect(page).toHaveURL(/\/brand-builder\/profile\?view=dna/);
    await expect(page.getByRole('navigation', { name: 'Brand views' }).getByRole('link', { name: 'Brand DNA' })).toHaveAttribute('aria-current', 'page');

    await page.goto('/funnel-context');
    await expect(page).toHaveURL(/\/funnel\?view=context/);
    await expect(page.getByRole('navigation', { name: 'Funnel views' }).getByRole('link', { name: '多漏斗管理' })).toHaveAttribute('aria-current', 'page');

    await page.goto('/video-production');
    await expect(page).toHaveURL(/\/video\?view=production/);
    await expect(page.getByRole('navigation', { name: 'Video views' }).getByRole('link', { name: '视频制作' })).toHaveAttribute('aria-current', 'page');
  });

  test('active terminal destinations retain their original default capabilities', async ({ page }) => {
    await loginAsUser(page);
    for (const [destination, navigationName, defaultLabel] of [
      ['/analytics-center', 'Analytics views', '洞察中心'],
      ['/brand-builder/profile', 'Brand views', '品牌档案'],
      ['/funnel', 'Funnel views', '漏斗建构'],
      ['/video', 'Video views', '视频项目'],
    ] as const) {
      await page.goto(destination);
      await expect(page.getByRole('navigation', { name: navigationName }).getByRole('link', { name: defaultLabel })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('member cannot cross privileged Team or Founder boundaries', async ({ page }) => {
    await loginAsUser(page);
    for (const route of ['/team/growth', '/admin-command', '/platform-admin/tenants']) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(403);
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}(?:\\?|$)`));
    }
  });
});

test.describe('OS 3.8 founder compatibility terminal views', () => {
  test('platform tenant bookmark resolves to a platform-admin-only tenant list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/platform-admin/tenants?source=bookmark');
    await expect(page).toHaveURL(/\/superadmin\/tenants\?source=bookmark/);
    await expect(page.locator('#superadmin-tenants')).toBeVisible();
    await expect(page.locator('#superadmin-tenants table')).toBeVisible();
    await page.reload();
    await expect(page.locator('#superadmin-tenants table')).toBeVisible();
  });

  test('Admin Command remains a separate platform-admin capability', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin-command');
    await expect(page).toHaveURL(/\/superadmin\/command(?:\?|$)/);
    await expect(page.locator('#superadmin-command')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Command Center' })).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('OS 3.8 E3A mounted capability surfaces', () => {
  test('Video, Lead Magnet, and Webinar remain authenticated, keyboard reachable, and narrow-screen usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsUser(page);

    await page.goto('/video');
    await expect(page.getByRole('heading', { name: '视频项目' })).toBeVisible();
    const createVideo = page.getByRole('link', { name: '新建视频' });
    await createVideo.focus();
    await expect(createVideo).toBeFocused();
    await expect(createVideo).toBeInViewport();

    await page.goto('/lead-magnet');
    await expect(page.getByRole('heading', {
      name: /生成你的引流资源|引流资源还不能生成/,
    })).toBeVisible();
    const leadMagnetAction = page.getByRole('button', { name: /生成引流资源/ })
      .or(page.getByRole('link', { name: /回到内容引擎/ }));
    await expect(leadMagnetAction).toBeVisible();
    await leadMagnetAction.focus();
    await expect(leadMagnetAction).toBeFocused();

    await page.goto('/webinar-center');
    await expect(page.getByRole('heading', { name: '线上讲座中心' })).toBeVisible();
    const generateWebinar = page.getByRole('button', { name: '生成完整Webinar' });
    const generatedStatus = page.getByText('已保存', { exact: true });
    await expect(generateWebinar.or(generatedStatus)).toBeVisible();
    if (await generateWebinar.isVisible()) {
      await generateWebinar.focus();
      await expect(generateWebinar).toBeFocused();
      await expect(generateWebinar).toBeInViewport();
    }
  });
});

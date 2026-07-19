import { expect, test, type Page } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

const now = '2026-07-19T00:00:00.000Z';
const cta = { headline: 'CTA', buttonText: 'Go', description: 'CTA', whatsappCta: 'WhatsApp current', funnelCta: 'Funnel' };
const lead = (track: 'retail' | 'recruitment') => ({ id: `lm-${track}`, type: 'guide', track, title: `${track} title`, promise: `${track} promise`, description: `${track} body`, audiencePain: 'pain', resultPage: { scoreLabel: 'A', categoryLabel: 'A', explanation: 'A', recommendations: [], nextAction: 'A', cta }, cta, segmentation: { leadScore: 'A', nextAction: 'A', followUpStrategy: 'A' }, qualityScore: 80, status: 'generated', createdAt: now, updatedAt: now });
const webinar = { id: 'webinar-e2e', createdAt: now, updatedAt: now, status: 'generated', qualityScore: 80, strategy: { targetAudience: 'founders', desiredOutcome: 'growth', trustBuildingAngle: 'proof', authorityPositioning: 'expert', conversionObjective: 'call' }, topic: { title: 'Webinar title', promise: 'Promise', subtitle: 'Subtitle' }, outline: { opening: 'o', story: 's', problem: 'p', opportunity: 'o', framework: 'f', caseStudy: 'c', offer: 'offer', qa: 'qa', cta: 'cta', recommendedDuration: '60m' }, loomScript: 'Current script', slideOutline: [{ slideNumber: 1, title: 'Slide', objective: 'O', keyMessage: 'K', suggestedVisual: 'V' }], registrationPage: { headline: 'Register', subheadline: 'Sub', bulletPoints: [], benefits: [], cta: 'Join', urgency: '', faq: [] }, replayPage: { headline: 'Replay', summary: 'Summary', cta: 'Watch', deadline: '' }, followupSequence: [{ day: 1, label: 'One', message: 'Follow up' }] };

async function shell(page: Page) {
  await page.route('**/api/v1/brand-builder/profile', (route) => route.fulfill({ json: { data: { identity: 'Brand', target_audience: 'Audience', offer: 'Offer' } } }));
  await page.route('**/api/v1/content-engine', (route) => route.fulfill({ json: { data: { trackCalendars: { retail: { items: [{ title: 'R', hook: 'R' }] }, recruitment: { items: [{ title: 'X', hook: 'X' }] } } } } }));
}

test.describe('E3B mounted working loops', () => {
  test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => sessionStorage.setItem('copied', text) } })); await loginAsUser(page); });

  test('Video delete confirmation traps focus, cancels, restores focus and keeps the exact project', async ({ page }) => {
    await page.route('**/api/v1/video/projects', (route) => route.fulfill({ json: { data: [{ id: 'video-e2e', topic: 'Video', platform: 'tiktok', duration: '60s', status: 'draft', strategy: {}, createdAt: now }] } }));
    await page.goto('/video'); const trigger = page.getByRole('button', { name: '删除' }); await trigger.click(); const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible(); await page.keyboard.press('Tab'); await expect(dialog).toContainText('只会删除当前项目'); await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused(); await expect(page.getByText('Video')).toBeVisible();
  });

  test('Lead Magnet keeps current edits, same ID copy, save feedback and isolated delete dialog', async ({ page }) => {
    await shell(page); const retail = lead('retail'); const recruitment = lead('recruitment');
    await page.route('**/api/v1/lead-magnet', async (route) => { const method = route.request().method(); if (method === 'PATCH') { const patch = route.request().postDataJSON(); await route.fulfill({ json: { data: { ...retail, ...patch, cta: { ...retail.cta, whatsappCta: patch.whatsappCta }, updatedAt: '2026-07-19T01:00:00.000Z' } } }); } else if (method === 'DELETE') await route.fulfill({ json: { data: { deleted: true } } }); else await route.fulfill({ json: { data: retail, trackLeadMagnets: { retail, recruitment } } }); });
    await page.goto('/lead-magnet');
    const card = page.locator('[data-canonical-id="lm-retail"]');
    await card.getByRole('button', { name: '编辑' }).click();
    const editor = page.getByRole('dialog');
    const title = editor.getByRole('textbox', { name: '标题', exact: true });
    await title.fill('Current edited title');
    await expect(title).toBeFocused();
    await editor.getByRole('button', { name: '保存' }).click();
    await expect(card).toContainText('Current edited title');
    await expect(page.getByText('保存成功。')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(editor).toBeHidden();
    await card.getByRole('button', { name: '复制当前内容' }).click();
    await expect(card).toContainText('复制成功');
    await card.getByRole('button', { name: '删除' }).click();
    await expect(page.getByRole('dialog')).toContainText('另一条 track');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-canonical-id="lm-recruitment"]')).toBeVisible();
  });

  for (const [successfulTrack, failedTrack] of [
    ['retail', 'recruitment'],
    ['recruitment', 'retail'],
  ] as const) {
    test(`E3B-LEAD-PARTIAL-RETRY: partial success preserves ${successfulTrack} and retries only ${failedTrack}`, async ({ page }) => {
      await shell(page);
      const tracks: Record<'retail' | 'recruitment', ReturnType<typeof lead> | null> = {
        retail: null,
        recruitment: null,
      };
      const attempts: Array<'retail' | 'recruitment'> = [];
      let failedOnce = false;

      await page.route('**/api/v1/lead-magnet**', async (route) => {
        const request = route.request();
        const pathname = new URL(request.url()).pathname;
        if (pathname.endsWith('/generate')) {
          const input = request.postDataJSON() as {
            track: 'retail' | 'recruitment';
          };
          attempts.push(input.track);
          if (input.track === failedTrack && !failedOnce) {
            failedOnce = true;
            await route.fulfill({
              status: 500,
              json: { message: `${failedTrack} deterministic failure` },
            });
            return;
          }
          const sequence = attempts.filter((track) => track === input.track).length;
          const generated = {
            ...lead(input.track),
            id: `lm-${input.track}-generated-${sequence}`,
            title: `${input.track} generated ${sequence}`,
          };
          tracks[input.track] = generated;
          await route.fulfill({ json: { data: generated } });
          return;
        }
        if (request.method() === 'PATCH') {
          const patch = request.postDataJSON() as {
            id: string;
            track: 'retail' | 'recruitment';
            title: string;
            promise: string;
            description: string;
            whatsappCta: string;
          };
          const current = tracks[patch.track];
          if (!current || current.id !== patch.id) {
            await route.fulfill({ status: 404, json: { message: 'not found' } });
            return;
          }
          const persisted = {
            ...current,
            title: patch.title,
            promise: patch.promise,
            description: patch.description,
            cta: { ...current.cta, whatsappCta: patch.whatsappCta },
          };
          tracks[patch.track] = persisted;
          await route.fulfill({ json: { data: persisted } });
          return;
        }
        await route.fulfill({
          json: {
            data: tracks.retail,
            trackLeadMagnets: tracks,
          },
        });
      });

      await page.goto('/lead-magnet');
      await page.getByRole('button', { name: '生成引流资源' }).click();
      const successful = tracks[successfulTrack];
      expect(successful).not.toBeNull();
      const successfulId = successful!.id;
      const successfulTitle = successful!.title;
      await expect(page.locator(`[data-canonical-id="${successfulId}"]`)).toBeVisible();
      await expect(page.getByText(`${failedTrack} deterministic failure`)).toBeVisible();

      await page
        .getByRole('button', {
          name: `只重试 ${failedTrack === 'retail' ? 'Retail' : 'Recruitment'}`,
        })
        .click();
      await expect(
        page.locator(`[data-canonical-id="${tracks[failedTrack]!.id}"]`),
      ).toBeVisible();
      expect(tracks[successfulTrack]?.id).toBe(successfulId);
      expect(tracks[successfulTrack]?.title).toBe(successfulTitle);
      expect(attempts).toEqual(['retail', 'recruitment', failedTrack]);

      await page.reload();
      await expect(page.locator(`[data-canonical-id="${successfulId}"]`)).toBeVisible();
      await expect(
        page.locator(`[data-canonical-id="${tracks[failedTrack]!.id}"]`),
      ).toBeVisible();

      if (successfulTrack === 'retail') {
        const card = page.locator(`[data-canonical-id="${successfulId}"]`);
        await card.getByRole('button', { name: '编辑' }).click();
        const editor = page.getByRole('dialog');
        await editor.getByRole('textbox', { name: '标题', exact: true }).fill('Edited Retail title');
        await editor.getByRole('button', { name: '保存' }).click();
        await page.keyboard.press('Escape');
        await expect(editor).toBeHidden();
        const callCount = attempts.length;
        const regenerateRetail = page.getByRole('button', {
          name: '重新生成 Retail',
          exact: true,
        });
        await regenerateRetail.click();
        await expect(page.getByRole('dialog')).toContainText('新的 canonical ID');
        await page.getByRole('button', { name: '保留现有版本' }).click();
        expect(attempts).toHaveLength(callCount);
        await regenerateRetail.click();
        await page.getByRole('button', { name: '确认并生成新版本' }).click();
        await expect(page.locator('[data-canonical-id="lm-retail-generated-2"]')).toBeVisible();
        expect(attempts).toEqual([
          'retail',
          'recruitment',
          'recruitment',
          'retail',
        ]);
      }
    });
  }

  test('Webinar reopens exact identity, edits same ID, copies current sections and preserves accessible delete cancel', async ({ page }) => {
    await page.route('**/api/v1/webinar-center', async (route) => { const method = route.request().method(); if (method === 'PATCH') { const patch = route.request().postDataJSON(); await route.fulfill({ json: { data: { ...webinar, topic: { ...webinar.topic, title: patch.title }, updatedAt: '2026-07-19T01:00:00.000Z', status: 'saved' } } }); } else await route.fulfill({ json: { data: webinar } }); });
    await page.goto('/webinar-center');
    await expect(page.locator('[data-canonical-id="webinar-e2e"]')).toBeVisible();
    await page.getByRole('button', { name: '编辑' }).click();
    const editor = page.getByRole('dialog');
    const title = editor.getByRole('textbox', { name: '标题', exact: true });
    await title.fill('Edited webinar');
    await editor.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('保存成功。')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(editor).toBeHidden();
    await page.getByRole('button', { name: '复制当前讲稿' }).click();
    await expect(page.getByText('复制成功。')).toBeVisible();
    const trigger = page.getByRole('button', { name: '删除' });
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-canonical-id="webinar-e2e"]')).toBeVisible();
  });

  test('E3B-WEBINAR-MOUNTED-REGENERATE: preserves the old package on failure and replaces it exactly once on retry', async ({ page }) => {
    let current = structuredClone(webinar);
    let generationAttempts = 0;
    await page.route('**/api/v1/webinar-center**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (pathname.endsWith('/generate')) {
        generationAttempts += 1;
        if (generationAttempts === 1) {
          await route.fulfill({
            status: 500,
            json: { error: { message: 'deterministic regeneration failure' } },
          });
          return;
        }
        current = {
          ...structuredClone(webinar),
          id: 'webinar-e2e-regenerated',
          topic: { ...webinar.topic, title: 'Regenerated webinar' },
          loomScript: 'Regenerated script',
          createdAt: '2026-07-19T02:00:00.000Z',
          updatedAt: '2026-07-19T02:00:00.000Z',
        };
        await route.fulfill({ json: { data: current } });
        return;
      }
      await route.fulfill({ json: { data: current } });
    });

    await page.goto('/webinar-center');
    const oldCard = page.locator('[data-canonical-id="webinar-e2e"]');
    await expect(oldCard).toContainText('Webinar title');

    await page.getByRole('button', { name: '编辑' }).click();
    const editor = page.getByRole('dialog');
    await editor.getByRole('textbox', { name: '标题', exact: true }).fill('Unsaved dirty title');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '重新生成 Webinar' }).click();
    await expect(page.getByRole('dialog')).toContainText('请先保存、取消或明确放弃');
    expect(generationAttempts).toBe(0);
    await page.getByRole('button', { name: '取消并放弃编辑' }).click();

    await page.getByRole('button', { name: '重新生成 Webinar' }).click();
    await expect(page.getByRole('dialog')).toContainText('新的 canonical ID');
    await page.getByRole('button', { name: '确认生成新 Webinar' }).click();
    await expect(page.getByRole('alert')).toContainText('deterministic regeneration failure');
    await expect(oldCard).toContainText('Webinar title');
    await expect(oldCard).toContainText('Current script');

    await page.getByRole('button', { name: '重试重新生成' }).click();
    const replacement = page.locator(
      '[data-canonical-id="webinar-e2e-regenerated"]',
    );
    await expect(replacement).toContainText('Regenerated webinar');
    await expect(replacement).toContainText('Regenerated script');
    expect(generationAttempts).toBe(2);

    await page.reload();
    await expect(replacement).toContainText('Regenerated webinar');
    await expect(page.locator('[data-canonical-id="webinar-e2e"]')).toHaveCount(0);
  });
});

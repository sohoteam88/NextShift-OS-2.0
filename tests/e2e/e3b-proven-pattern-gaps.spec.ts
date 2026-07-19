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
});

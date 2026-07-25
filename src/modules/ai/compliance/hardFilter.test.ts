import { describe, expect, it } from 'vitest';
import { enforceComplianceHardFilter } from './index';

const cleanFields = {
  title: '从日常开始建立健康习惯',
  hook: '一个小行动，比一次完美改变更容易坚持。',
  body: '今天先为自己准备一顿均衡早餐，并给明天留出十分钟散步时间。',
  cta: '留言告诉我你最想先开始的习惯。',
  hashtags: ['#健康习惯', '#日常行动'],
};

describe('enforceComplianceHardFilter', () => {
  it('rewrites public retail terms in every public field without rejecting AI content', () => {
    const verdict = enforceComplianceHardFilter({
      track: 'retail',
      fields: {
        ...cleanFields,
        title: 'Herbalife 奶昔的减肥日常',
        hook: 'Herbalife 产品（整体）怎样融入生活？',
        cta: '试试 Herbalife 奶昔。',
        hashtags: ['#Herbalife', '#减肥'],
      },
    });

    expect(verdict.status).toBe('rewritten');
    if (verdict.status !== 'rewritten') return;
    const output = JSON.stringify(verdict.fields);
    expect(output).not.toMatch(/Herbalife|贺宝芙|康宝莱/i);
    expect(output).not.toContain('减肥');
    expect(verdict.fields.title).toContain('营养早餐／营养代餐');
    expect(verdict.fields.title).toContain('体重管理');
    expect(verdict.rewrites.map((rewrite) => rewrite.field)).toEqual(
      expect.arrayContaining(['title', 'hook', 'cta', 'hashtags']),
    );
  });

  it('uses only recruitment-scoped public substitutions', () => {
    const verdict = enforceComplianceHardFilter({
      track: 'recruitment',
      fields: { ...cleanFields, body: '这份事业适合想建立新技能的人。' },
    });

    expect(verdict).toMatchObject({
      status: 'rewritten',
      fields: { body: '在家创业系统适合想建立新技能的人。' },
    });
  });

  it.each([
    ['income promise', { ...cleanFields, body: '加入后月入RM8,000，包赚。' }, 'income_promise'],
    ['medical claim', { ...cleanFields, body: '这个方法可以治愈问题并保证瘦。' }, 'medical_claim'],
    ['single-character treatment claim', { ...cleanFields, cta: '这个方案能治问题。' }, 'medical_claim'],
  ])('rejects a %s for regeneration', (_name, fields, expectedCode) => {
    const verdict = enforceComplianceHardFilter({ track: 'retail', fields });

    expect(verdict.status).toBe('rejected');
    if (verdict.status !== 'rejected') return;
    expect(verdict.violations.some((violation) => violation.code === expectedCode)).toBe(true);
    expect(verdict).not.toHaveProperty('fields');
  });

  it('replaces unlisted bare brands and product trademarks with a generic public term', () => {
    const verdict = enforceComplianceHardFilter({
      track: 'retail',
      fields: { ...cleanFields, body: 'Herbalife、康宝莱、贺宝芙和 Formula 1 都不应公开出现。' },
    });

    expect(verdict.status).toBe('rewritten');
    if (verdict.status !== 'rewritten') return;
    expect(JSON.stringify(verdict.fields)).not.toMatch(/Herbalife|康宝莱|贺宝芙|Formula\s*1/i);
    expect(verdict.rewrites.some((rewrite) => rewrite.code === 'brand_residual_rewritten')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import type { BusinessPackSlice } from '../generation/types';
import {
  businessPack,
  getBusinessPackSlice,
  getComplianceRewriteRules,
  loadBusinessPack,
} from './index';

describe('business pack loader', () => {
  it('loads the versioned JSON asset through the validating loader', () => {
    expect(loadBusinessPack()).toEqual(businessPack);
    expect(businessPack.version).toBe(1);
    expect(businessPack.priceListEffectiveDate).toBe('2026-05-19');
    expect(businessPack.priceList.length).toBeGreaterThanOrEqual(16);
    expect(businessPack.priceList.every((entry) => entry.visibility === 'private')).toBe(true);
    expect(businessPack.priceList.every((entry) => entry.track === 'retail')).toBe(true);
  });

  it('keeps all scripts, objections, and private frameworks destination-annotated', () => {
    const scripts = [...businessPack.tracks.retail, ...businessPack.tracks.recruitment];
    expect(scripts.every((entry) => entry.track && entry.visibility)).toBe(true);
    expect(businessPack.objections.every((entry) => entry.track && entry.visibility)).toBe(true);
    expect(businessPack.complianceRedLines.every((entry) => entry.track && entry.visibility)).toBe(true);
    expect(businessPack.complianceRedLines.find((entry) => entry.id === 'weight-framework'))
      .toMatchObject({ track: 'retail', visibility: 'private' });
  });
});

describe('getBusinessPackSlice', () => {
  it('returns the existing BusinessPackSlice type with track-scoped public context', () => {
    const retailSlice: BusinessPackSlice = getBusinessPackSlice({ track: 'retail', platform: 'facebook' });
    const recruitmentSlice: BusinessPackSlice = getBusinessPackSlice({ track: 'recruitment' });

    expect(retailSlice.metadata).toMatchObject({ version: 1, track: 'retail', visibility: 'public', platform: 'facebook' });
    expect(retailSlice.promptContext).toContain('产品信任说明');
    expect(retailSlice.promptContext).not.toContain('零压力邀请');
    expect(recruitmentSlice.promptContext).toContain('零压力邀请');
    expect(recruitmentSlice.promptContext).not.toContain('产品信任说明');
    expect(retailSlice.promptContext).toContain('公开内容（帖子、落地页、引流资源）');
    expect(recruitmentSlice.promptContext).toContain('公开内容（帖子、落地页、引流资源）');
  });

  it('excludes every private-only price and weight framework from public prompt context', () => {
    const prompt = getBusinessPackSlice({ track: 'retail' }).promptContext ?? '';

    expect(prompt).not.toMatch(/RM[\d,.]+/);
    expect(prompt).not.toContain('通常一个月可以瘦3-5公斤');
    expect(prompt).not.toMatch(/(?:\d+\s*(?:公斤|kg)|瘦\s*\d+)/i);
    expect(prompt).not.toContain('成交时刻');
    expect(prompt).not.toContain('WhatsApp 首次触达');
  });

  it('uses public substitutions and never exposes internal brand names', () => {
    const retailPrompt = getBusinessPackSlice({ track: 'retail' }).promptContext ?? '';
    const recruitmentPrompt = getBusinessPackSlice({ track: 'recruitment' }).promptContext ?? '';

    for (const prompt of [retailPrompt, recruitmentPrompt]) {
      expect(prompt).not.toMatch(/Herbalife|贺宝芙|康宝莱/i);
      expect(prompt).not.toMatch(/RM[\d,.]+/);
      expect(prompt).not.toMatch(/(?:\d+\s*(?:公斤|kg)|瘦\s*\d+)/i);
    }

    expect(retailPrompt).toContain('健康管理方案');
    expect(retailPrompt).toContain('体重管理');
    expect(retailPrompt).toContain('营养早餐／营养代餐');
    expect(recruitmentPrompt).toContain('在家创业系统');
    expect(recruitmentPrompt).toContain('健康教练');
  });
});

describe('getComplianceRewriteRules', () => {
  it('returns only public, track-scoped substitution and red-line data', () => {
    const retail = getComplianceRewriteRules({ track: 'retail' });
    const recruitment = getComplianceRewriteRules({ track: 'recruitment' });

    expect(retail.rewriteRules).toContainEqual({
      internalTerm: '减肥',
      publicTerm: '体重管理',
    });
    expect(retail.rewriteRules).toContainEqual({
      internalTerm: 'Herbalife 奶昔',
      publicTerm: '营养早餐／营养代餐',
    });
    expect(recruitment.rewriteRules).toContainEqual({
      internalTerm: '这份事业',
      publicTerm: '在家创业系统',
    });
    expect(recruitment.rewriteRules).not.toContainEqual({
      internalTerm: '减肥',
      publicTerm: '体重管理',
    });
    expect(retail.redLines.some((entry) => entry.id === 'allowed-verbs')).toBe(true);

    const exposed = JSON.stringify({ retail, recruitment });
    expect(exposed).not.toContain('weight-framework');
    expect(exposed).not.toContain('通常一个月可以瘦3-5公斤');
    expect(exposed).not.toMatch(/RM[\d,.]+/);
    expect(exposed).not.toContain('price');
  });
});

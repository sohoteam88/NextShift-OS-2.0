import { describe, expect, it } from 'vitest';
import {
  localizationEngine,
  resolveProductLocale,
} from '@/modules/localization/services/LocalizationEngine';

describe('PRODUCT-003 Localization Engine', () => {
  it('resolves locale by user, tenant, browser, then English system default', () => {
    expect(resolveProductLocale({
      userPreference: 'ms-MY',
      tenantLocale: 'zh',
      browserLocale: 'en-US',
    })).toMatchObject({
      locale: 'ms',
      source: 'userPreference',
      fallbackUsed: false,
    });

    expect(resolveProductLocale({
      tenantLocale: 'zh-CN',
      browserLocale: 'ms-MY',
    })).toMatchObject({
      locale: 'zh',
      source: 'tenantSetting',
      fallbackUsed: true,
    });

    expect(resolveProductLocale({})).toMatchObject({
      locale: 'en',
      source: 'systemDefault',
      fallbackUsed: true,
    });
  });

  it('returns localized registry values and never exposes raw missing keys', () => {
    expect(localizationEngine.t('dashboard.currentGoal', 'zh')).toMatchObject({
      value: '当前目标',
      translationSource: 'registry',
      fallbackUsed: false,
    });

    const missing = localizationEngine.t('unknown.raw.key', 'ms');

    expect(missing.value).toBe('Teks belum tersedia');
    expect(missing.value).not.toContain('unknown.raw.key');
    expect(missing).toMatchObject({
      translationSource: 'missing',
      fallbackUsed: true,
      missingKey: 'unknown.raw.key',
    });
  });

  it('localizes generated lead magnet assets into Chinese instead of only instructing Chinese', () => {
    const localized = localizationEngine.localizeGeneratedAsset({
      title: 'Lead Magnet Draft: Create Your First Lead Magnet',
      locale: 'zh',
      assetType: 'LEAD_MAGNET_ASSET',
      content: [
        'Lead Magnet Draft: 7 Hidden Habits Preventing Fat Loss',
        '',
        'Created for: busy mothers',
        'Offer: Weight Management Coaching Program',
        'Write in Chinese with clear, practical phrasing.',
        'Previous asset topics: none yet.',
        '',
        'Sections:',
        '1. Why busy mothers get stuck',
        '2. The hidden cost of inconsistent habits',
        '3. A simple checklist for Weight Management Coaching Program',
        '4. The first action to take today',
        '5. What to track next',
      ].join('\n'),
    });

    expect(localized.title).toContain('引流赠品草稿');
    expect(localized.title).toContain('创建你的第一个引流赠品');
    expect(localized.content).toContain('阻碍减脂的7个隐藏习惯');
    expect(localized.content).toContain('适合对象：');
    expect(localized.content).toContain('内容结构：');
    expect(localized.content).not.toContain('Write in Chinese');
  });

  it('localizes generated asset structure into Malay', () => {
    const localized = localizationEngine.localizeGeneratedAsset({
      title: 'Lead Magnet Draft: Create Your First Lead Magnet',
      locale: 'ms',
      assetType: 'LEAD_MAGNET_ASSET',
      content: [
        'Lead Magnet Draft: 7 Mistakes New Entrepreneurs Make Before Their First Lead',
        'Created for: new entrepreneurs',
        'Offer: Business Opportunity Program',
        'Write in Malay with clear, practical phrasing.',
        'CTA:',
        'Use this checklist, then take the next step toward Acquire First Lead.',
      ].join('\n'),
    });

    expect(localized.title).toContain('Draf Lead Magnet');
    expect(localized.content).toContain('7 Kesilapan Usahawan Baharu Sebelum Mendapat Prospek Pertama');
    expect(localized.content).toContain('Dicipta untuk:');
    expect(localized.content).toContain('Seruan tindakan:');
    expect(localized.content).not.toContain('Write in Malay');
  });
});

import type { SupportedLanguage } from './types';
import { LANGUAGE_PROFILES } from './languages/profiles';

interface AdaptationResult {
  adaptedMessage: string;
  culturalNotes: string[];
  ctaStyle: string;
}

const CULTURAL_GUIDELINES: Record<SupportedLanguage, {
  preferredStyle: string; avoidStyle: string; exampleShift: string; ctaPattern: string;
}> = {
  'zh-CN': { preferredStyle: '教育型 + 证据型', avoidStyle: '过于激进', exampleShift: '用数据和案例说话', ctaPattern: '先给价值，再引导行动' },
  'zh-TW': { preferredStyle: '温暖 + 故事型', avoidStyle: '过于商业', exampleShift: '先建立关系，再谈商业', ctaPattern: '自然引导，不施压' },
  'ms-MY': { preferredStyle: '信任 + 关系型', avoidStyle: '过于正式', exampleShift: '用真人和真实故事', ctaPattern: 'WhatsApp直接对话' },
  en: { preferredStyle: '效率 + 结果型', avoidStyle: '过于复杂', exampleShift: '直接说结果和方法', ctaPattern: '清晰明确的下一步' },
};

/**
 * Adapt a message for a specific cultural context while preserving meaning.
 */
export function adaptForCulture(
  message: string, language: SupportedLanguage, context?: string,
): AdaptationResult {
  const profile = LANGUAGE_PROFILES[language];
  const guide = CULTURAL_GUIDELINES[language];

  const notes: string[] = [
    `使用${profile.tone}语调`,
    `适配${profile.culturalStyle}风格`,
    `避免${guide.avoidStyle}`,
    `${guide.exampleShift}`,
    `CTA: ${guide.ctaPattern}`,
  ];

  return {
    adaptedMessage: message,
    culturalNotes: notes,
    ctaStyle: guide.ctaPattern,
  };
}

/**
 * Generate a culturally-appropriate CTA for the given language and funnel type.
 */
export function getCulturalCTA(language: SupportedLanguage, funnelType: string): string {
  const ctas: Record<string, Record<string, string>> = {
    retail: { en: 'Get Free Health Assessment', 'zh-CN': '获取免费健康评估', 'zh-TW': '獲取免費健康評估', 'ms-MY': 'Dapatkan Penilaian Kesihatan Percuma' },
    recruitment: { en: 'Get Side Income Assessment', 'zh-CN': '获取副业准备度评估', 'zh-TW': '獲取副業準備度評估', 'ms-MY': 'Dapatkan Penilaian Pendapatan Sampingan' },
    upgrade: { en: 'Join Now', 'zh-CN': '立即加入', 'zh-TW': '立即加入', 'ms-MY': 'Sertai Sekarang' },
  };
  return ctas[funnelType]?.[language] ?? ctas.retail?.[language] ?? 'Learn More';
}

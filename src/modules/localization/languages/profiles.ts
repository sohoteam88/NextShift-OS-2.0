import type { LanguageProfile, SupportedLanguage } from '../types';

export const LANGUAGE_PROFILES: Record<SupportedLanguage, LanguageProfile> = {
  en: { language: 'en', region: 'Global', tone: 'professional', culturalStyle: 'efficiency-outcome', preferredCTA: 'Learn More / Get Started', platformBehavior: 'LinkedIn + Instagram', formalityLevel: 'neutral' },
  'zh-CN': { language: 'zh-CN', region: 'China / Simplified Chinese', tone: 'educational', culturalStyle: 'education-proof', preferredCTA: '获取免费评估 / 立即咨询', platformBehavior: 'WeChat + XHS', formalityLevel: 'neutral' },
  'zh-TW': { language: 'zh-TW', region: 'Taiwan / Traditional Chinese', tone: 'warm', culturalStyle: 'education-proof', preferredCTA: '了解更多 / 預約諮詢', platformBehavior: 'Facebook + LINE', formalityLevel: 'neutral' },
  'ms-MY': { language: 'ms-MY', region: 'Malaysia / Bahasa Melayu', tone: 'friendly', culturalStyle: 'trust-relationship', preferredCTA: 'WhatsApp Sekarang / Dapatkan Percuma', platformBehavior: 'Facebook + TikTok', formalityLevel: 'casual' },
};

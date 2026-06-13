export type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ms-MY';
export type LocalizedField = 'positioning' | 'slogan' | 'audience' | 'offer' | 'cta' | 'hook' | 'script' | 'whatsapp' | 'webinarTitle' | 'leadMagnetTitle' | 'contentPillarName';

export interface LanguageProfile {
  language: SupportedLanguage; region: string; tone: string; culturalStyle: string;
  preferredCTA: string; platformBehavior: string; formalityLevel: 'casual' | 'neutral' | 'formal';
}

export interface LocalizedAsset {
  id: string; sourceAssetId: string; language: SupportedLanguage; assetType: LocalizedField;
  content: string; context?: Record<string, string>; version: number; createdAt: string;
}

export interface TranslationMemoryEntry {
  term: string; translations: Partial<Record<SupportedLanguage, string>>; category: string;
}

export interface LocalizationHealth { score: number; coverage: Record<SupportedLanguage, number>; missingLanguages: SupportedLanguage[]; recommendations: string[]; }

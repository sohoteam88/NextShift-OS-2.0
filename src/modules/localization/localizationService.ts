// Localization Service — language-aware asset generation
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { SupportedLanguage, LocalizedAsset, LocalizationHealth } from './types';
import { LANGUAGE_PROFILES } from './languages/profiles';
import { translateTerm } from './translationMemory';
import { adaptForCulture, getCulturalCTA } from './culturalAdaptationEngine';

export const localizationService = {
  getLanguageProfiles() { return LANGUAGE_PROFILES; },

  async getLocalizedAssets(userId: string): Promise<LocalizedAsset[]> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    return Array.isArray(meta.localized_assets) ? (meta.localized_assets as LocalizedAsset[]) : [];
  },

  async generateLocalizedCopy(userId: string, sourceText: string, language: SupportedLanguage, field: string): Promise<LocalizedAsset> {
    // Cultural adaptation
    const adapted = adaptForCulture(sourceText, language, field);
    const asset: LocalizedAsset = {
      id: `loc-${Date.now()}`, sourceAssetId: field, language,
      assetType: field as any, content: adapted.adaptedMessage,
      context: { culturalNotes: adapted.culturalNotes.join('; '), ctaStyle: adapted.ctaStyle },
      version: 1, createdAt: new Date().toISOString(),
    };

    // Store in metadata
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const assets: LocalizedAsset[] = Array.isArray(meta.localized_assets) ? (meta.localized_assets as LocalizedAsset[]) : [];
    assets.push(asset);
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, localized_assets: assets.slice(-50) as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });

    return asset;
  },

  async getLocalizationHealth(userId: string): Promise<LocalizationHealth> {
    const assets = await this.getLocalizedAssets(userId);
    const languages: SupportedLanguage[] = ['en', 'zh-CN', 'zh-TW', 'ms-MY'];
    const coverage: Record<SupportedLanguage, number> = { en: 0, 'zh-CN': 0, 'zh-TW': 0, 'ms-MY': 0 };
    for (const a of assets) { coverage[a.language] = (coverage[a.language] ?? 0) + 1; }

    const missingLanguages = languages.filter(l => coverage[l] === 0);
    const score = languages.filter(l => coverage[l] > 0).length * 25;

    return {
      score, coverage,
      missingLanguages,
      recommendations: missingLanguages.length > 0 ? [`添加${missingLanguages.map(l=>LANGUAGE_PROFILES[l].region).join('、')}的本地化资产`] : ['所有语言已覆盖'],
    };
  },

  translateTerm,
  getCulturalCTA,
  adaptForCulture,
};

// ============================================================
// Brand Context Provider
// Single source of truth for all AI modules.
// Reads from BrandProfile table — the canonical source.
// ============================================================

import prisma from '@/lib/prisma';
import type { BrandContext, ContentPillar } from '../types';
import { validateBrandDNA } from './brandDnaValidator';
import { mapLegacyProfileToDNA } from '../types';

// ============================================================
// getBrandContext — the ONE function all AI modules call
// ============================================================

/**
 * Returns the Brand Context that all AI modules must use.
 *
 * Reads from BrandProfile table (canonical source).
 * Falls back to user.metadata.brand_profile for legacy data.
 *
 * Modules that must consume this:
 * - Content Engine, Video Engine, Social Setup
 * - Webinar Center, Lead Magnet, Funnel Builder
 * - WhatsApp AI, Traffic Engine
 */
export async function getBrandContext(userId: string): Promise<BrandContext | null> {
  // PRIMARY: Read from BrandProfile table
  const bp = await prisma.brandProfile.findUnique({
    where: { userId },
  });

  if (bp) {
    return {
      positioning: bp.brandPositioning,
      audience: bp.targetAudience,
      audiencePainPoints: bp.audiencePainPoints as string[],
      messaging: {
        coreMessage: bp.coreMessage,
        uniqueAngle: bp.uniqueAngle,
        elevatorPitch: bp.elevatorPitch,
      },
      contentPillars: (bp.contentPillars as unknown as ContentPillar[]),
      offer: {
        primary: bp.primaryOffer,
        transformation: bp.transformationPromise,
      },
      tone: bp.contentTone,
      visualIdentity: {
        colors: bp.brandColors as string[],
        imagePrompt: bp.profileImagePrompt,
        bannerPrompt: bp.coverBannerPrompt,
      },
      personalName: bp.personalName,
      brandName: bp.brandName,
    };
  }

  // FALLBACK: Legacy metadata for unmigrated users
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  });
  const metadata = (user?.metadata as Record<string, unknown>) ?? {};
  const profile = metadata.brand_profile as Record<string, unknown> | null;
  if (!profile) return null;

  const dna = mapLegacyProfileToDNA(profile);
  return {
    positioning: dna.identity.brandPositioning,
    audience: dna.audience.targetAudience,
    audiencePainPoints: dna.audience.audiencePainPoints,
    messaging: {
      coreMessage: dna.messaging.coreMessage,
      uniqueAngle: dna.messaging.uniqueAngle,
      elevatorPitch: dna.messaging.elevatorPitch,
    },
    contentPillars: dna.content.contentPillars,
    offer: { primary: dna.offer.primaryOffer, transformation: dna.offer.transformationPromise },
    tone: dna.content.contentTone,
    visualIdentity: {
      colors: dna.visual.brandColors,
      imagePrompt: dna.visual.profileImagePrompt,
      bannerPrompt: dna.visual.coverBannerPrompt,
    },
    personalName: dna.identity.personalName,
    brandName: dna.identity.brandName,
  };
}

/** The canonical version attached to generated artifacts for stale-output detection. */
export async function getBrandDnaVersion(userId: string): Promise<number> {
  const bp = await prisma.brandProfile.findUnique({ where: { userId }, select: { version: true } });
  if (bp) return bp.version;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const version = ((user?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown> | undefined)?.version;
  return typeof version === 'number' && version > 0 ? version : 1;
}

export function buildBrandContextPrompt(context: BrandContext): string {
  const parts: string[] = [];
  if (context.brandName) parts.push(`品牌: ${context.brandName}`);
  if (context.positioning) parts.push(`定位: ${context.positioning}`);
  if (context.audience) parts.push(`目标受众: ${context.audience}`);
  if (context.audiencePainPoints.length > 0) parts.push(`受众痛点: ${context.audiencePainPoints.join('、')}`);
  if (context.messaging.coreMessage) parts.push(`核心信息: ${context.messaging.coreMessage}`);
  if (context.tone) parts.push(`内容调性: ${context.tone}`);
  if (context.contentPillars.length > 0) {
    parts.push(`内容支柱: ${context.contentPillars.map((p) => `${p.emoji} ${p.name}`).join('、')}`);
  }
  if (context.offer.primary) parts.push(`主要服务: ${context.offer.primary}`);
  if (context.offer.transformation) parts.push(`转变承诺: ${context.offer.transformation}`);
  return parts.length === 0 ? '' : `【品牌上下文 — 所有内容必须一致】\n${parts.join('\n')}`;
}

export async function getBrandDNAHealth(userId: string): Promise<{
  overallScore: number; isComplete: boolean; nextRecommendation: string | null;
}> {
  const bp = await prisma.brandProfile.findUnique({ where: { userId } });
  if (bp) {
    // Map BrandProfile row to BrandDNA for validation
    const dna = mapLegacyProfileToDNA({
      brandName: bp.brandName, personalName: bp.personalName,
      brandPositioning: bp.brandPositioning, slogan: bp.slogan,
      targetAudience: bp.targetAudience, target_audience: bp.targetAudience,
      audience_pain_points: bp.audiencePainPoints,
      audienceGoals: bp.audienceGoals,
      audienceObjections: bp.audienceObjections,
      coreMessage: bp.coreMessage, uniqueAngle: bp.uniqueAngle, elevatorPitch: bp.elevatorPitch,
      contentTone: bp.contentTone, content_pillars: bp.contentPillars,
      storytellingStyle: bp.storytellingStyle,
      primaryOffer: bp.primaryOffer, secondaryOffer: bp.secondaryOffer,
      transformationPromise: bp.transformationPromise,
      brandColors: bp.brandColors, profileImagePrompt: bp.profileImagePrompt,
      coverBannerPrompt: bp.coverBannerPrompt,
      confidenceScore: bp.confidenceScore, version: bp.version,
    });
    const health = validateBrandDNA(dna);
    return { overallScore: health.overallScore, isComplete: health.overallScore >= 80, nextRecommendation: health.recommendations[0] ?? null };
  }

  // Fallback
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  const profile = (user?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown> | null;
  const dna = mapLegacyProfileToDNA(profile);
  const health = validateBrandDNA(dna);
  return { overallScore: health.overallScore, isComplete: health.overallScore >= 80, nextRecommendation: health.recommendations[0] ?? null };
}

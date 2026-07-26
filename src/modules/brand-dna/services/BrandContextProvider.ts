// ============================================================
// Brand Context Provider
// Single source of truth for all AI modules.
// Reads from BrandProfile table — the canonical source.
// ============================================================

import prisma from '@/lib/prisma';
import type { BrandContext, ContentPillar } from '../types';
import { validateBrandDNA } from './brandDnaValidator';
import { mapLegacyProfileToDNA } from '../types';

type ContentTrack = 'retail' | 'recruitment';
type TrackAudience = NonNullable<BrandContext['trackAudience']>;

const TRACK_AUDIENCE_METADATA_KEY = 'brand_dna_track_audience';

function readTrackAudience(metadata: Record<string, unknown>): TrackAudience | undefined {
  const value = metadata[TRACK_AUDIENCE_METADATA_KEY];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const parsed: TrackAudience = {};
  for (const track of ['retail', 'recruitment'] as const) {
    const candidate = (value as Record<string, unknown>)[track];
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const record = candidate as Record<string, unknown>;
    const targetAudience = typeof record.targetAudience === 'string'
      ? record.targetAudience
      : undefined;
    const audience = typeof record.audience === 'string' ? record.audience : undefined;
    const audiencePainPoints = Array.isArray(record.audiencePainPoints)
      && record.audiencePainPoints.every((item) => typeof item === 'string')
      ? record.audiencePainPoints as string[]
      : undefined;
    if (targetAudience || audience || audiencePainPoints) parsed[track] = { targetAudience, audience, audiencePainPoints };
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

/**
 * Selects the current workspace's audience data without changing the shared
 * BrandProfile schema. Existing single-value DNA remains visible to both
 * tracks. Older values that contain labelled dual-track prose are split at
 * read time, so neither direction is injected into the other prompt.
 */
export function projectBrandContextForTrack(context: BrandContext, track: ContentTrack): BrandContext {
  const override = context.trackAudience?.[track];
  return {
    ...context,
    audience: override?.targetAudience ?? override?.audience ?? projectTrackText(context.audience, track),
    audiencePainPoints: override?.audiencePainPoints ?? projectTrackTexts(context.audiencePainPoints, track),
  };
}

function projectTrackTexts(values: string[], track: ContentTrack): string[] {
  return values
    .map((value) => projectTrackText(value, track))
    .filter((value): value is string => Boolean(value));
}

function projectTrackText(value: string, track: ContentTrack): string {
  const labels = [...value.matchAll(/(零售(?:侧|模式)?|retail|招募(?:侧|模式)?|recruitment)\s*[：:—-]\s*/gi)];
  if (labels.length === 0) return value;

  if (labels.length === 1) {
    const label = labels[0];
    const labelTrack: ContentTrack = /零售|retail/.test(label[1].toLowerCase()) ? 'retail' : 'recruitment';
    return labelTrack === track
      ? value.slice((label.index ?? 0) + label[0].length).replace(/^[；;|\s]+|[；;|\s]+$/g, '')
      : '';
  }

  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    const labelText = label[1].toLowerCase();
    const labelTrack: ContentTrack = /零售|retail/.test(labelText) ? 'retail' : 'recruitment';
    if (labelTrack !== track) continue;
    const start = (label.index ?? 0) + label[0].length;
    const end = labels[index + 1]?.index ?? value.length;
    return value.slice(start, end).replace(/^[；;|\s]+|[；;|\s]+$/g, '');
  }

  return '';
}

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
  const [bp, user] = await Promise.all([
    prisma.brandProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }),
  ]);
  const metadata = (user?.metadata as Record<string, unknown>) ?? {};
  const trackAudience = readTrackAudience(metadata);

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
      ...(trackAudience ? { trackAudience } : {}),
    };
  }

  // FALLBACK: Legacy metadata for unmigrated users
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
    ...(trackAudience ? { trackAudience } : {}),
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

export function buildBrandContextPrompt(context: BrandContext, track?: ContentTrack): string {
  const projected = track ? projectBrandContextForTrack(context, track) : context;
  const parts: string[] = [];
  if (projected.brandName) parts.push(`品牌: ${projected.brandName}`);
  if (projected.positioning) parts.push(`定位: ${projected.positioning}`);
  if (projected.audience) parts.push(`目标受众: ${projected.audience}`);
  if (projected.audiencePainPoints.length > 0) parts.push(`受众痛点: ${projected.audiencePainPoints.join('、')}`);
  if (projected.messaging.coreMessage) parts.push(`核心信息: ${projected.messaging.coreMessage}`);
  if (projected.tone) parts.push(`内容调性: ${projected.tone}`);
  if (projected.contentPillars.length > 0) {
    parts.push(`内容支柱: ${projected.contentPillars.map((p) => `${p.emoji} ${p.name}`).join('、')}`);
  }
  if (projected.offer.primary) parts.push(`主要服务: ${projected.offer.primary}`);
  if (projected.offer.transformation) parts.push(`转变承诺: ${projected.offer.transformation}`);
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

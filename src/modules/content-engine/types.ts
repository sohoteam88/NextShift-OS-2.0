import type { ContentPillar } from '@/modules/brand-dna/types';

/** Platforms supported by Content Engine generation. */
export const CONTENT_ENGINE_PLATFORMS = [
  'facebook',
  'instagram',
  'tiktok',
  'xhs',
  'threads',
  'email',
  'blog',
] as const;

export type Platform = (typeof CONTENT_ENGINE_PLATFORMS)[number];

/**
 * The E1 Command Center editor deliberately exposes only its four contracted
 * post platforms. Shared Content records support additional identifiers, but
 * those records must not be hydrated into this editor implicitly.
 */
export const CONTENT_COMMAND_CENTER_PLATFORMS = [
  'facebook',
  'instagram',
  'tiktok',
  'xhs',
] as const satisfies readonly Platform[];

export type ContentCommandCenterPlatform =
  (typeof CONTENT_COMMAND_CENTER_PLATFORMS)[number];

export function isContentCommandCenterPlatform(
  value: string | null,
): value is ContentCommandCenterPlatform {
  return CONTENT_COMMAND_CENTER_PLATFORMS.some(
    (platform) => platform === value,
  );
}

/**
 * Shared editor/API limits. A 200-character title matches the repository's
 * existing title boundary; 20,000 characters supports long-form drafts while
 * keeping PATCH request bodies bounded.
 */
export const CONTENT_UPDATE_LIMITS = {
  title: 200,
  body: 20_000,
} as const;

export type ContentFormat = 'text_post' | 'carousel' | 'reel' | 'short_video' | 'story' | 'email' | 'blog';
export type FunnelStage = 'awareness' | 'consideration' | 'conversion' | 'retention';
export type ContentStatus = 'draft' | 'generated' | 'copied' | 'published';
export type ContentTrack = 'retail' | 'recruitment';

export interface GeneratedPost {
  id: string;
  pillar: string;
  pillarEmoji: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  platform: Platform;
  format: ContentFormat;
  funnelStage: FunnelStage;
  status: ContentStatus;
  qualityScore: number;
  /** True only when the persisted draft was produced by the AI generation gateway. */
  generatedByAi?: boolean;
  /** Present when the generation gateway returned the labelled template fallback. */
  degradedLabel?: string;
  createdAt: string;
  /**
   * The Content model does not yet persist a separate updatedAt column. For
   * generated drafts this is the persisted creation time; the editor records
   * a successful save locally after a PATCH response.
   */
  updatedAt: string;
}

export interface ContentCalendar {
  days: number; // 30, 90, or 180
  track?: ContentTrack;
  items: ContentCalendarItem[];
  generatedAt: string;
  brandDnaVersion?: number;
}

export interface ContentCalendarItem {
  date: string;
  track?: ContentTrack;
  pillar: string;
  pillarEmoji: string;
  title: string;
  hook: string;
  format: ContentFormat;
  platform: Platform;
  cta: string;
  funnelStage: FunnelStage;
}

export interface ContentQualityResult {
  score: number;
  brandAlignment: number;
  audienceRelevance: number;
  hookStrength: number;
  ctaClarity: number;
  platformFit: number;
  beginnerFriendliness: number;
  missingItems: string[];
  recommendations: string[];
}

export interface ContentEngineState {
  pillars: ContentPillar[];
  lastGeneratedPost: GeneratedPost | null;
  calendar: ContentCalendar | null;
  trackCalendars?: Record<ContentTrack, ContentCalendar | null>;
  publishedCount: number;
}

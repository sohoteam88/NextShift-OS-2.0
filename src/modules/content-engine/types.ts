import type { ContentPillar } from '@/modules/brand-dna/types';

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'xhs' | 'threads' | 'email' | 'blog';
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
  createdAt: string;
}

export interface ContentCalendar {
  days: number; // 30, 90, or 180
  track?: ContentTrack;
  items: ContentCalendarItem[];
  generatedAt: string;
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

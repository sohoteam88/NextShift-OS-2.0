// Content Engine V2 types

export interface ContentStrategy {
  objective: string;
  contentPillars: ContentPillar[];
  weeklyFrequency: number;
  recommendedPlatforms: string[];
  contentMix: { education: number; story: number; proof: number; offer: number };
}

export interface ContentPillar {
  id: string;
  title: string;
  topics: string[];
  percentage: number;
  emoji: string;
}

export interface ContentScore {
  trust: number;
  authority: number;
  engagement: number;
  leadGeneration: number;
  overall: number;
}

export interface ContentCalendarEntry {
  day: number;
  pillar: string;
  theme: string;
  hook: string;
  platforms: Record<string, string>;
  cta: string;
}

export type ContentPlatform = 'facebook' | 'instagram' | 'tiktok' | 'xiaohongshu' | 'whatsapp';

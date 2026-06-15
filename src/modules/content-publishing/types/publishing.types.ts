export type ContentStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived';
export type PublishingPlatform = 'facebook' | 'instagram' | 'tiktok' | 'xiaohongshu';

export interface PublishingItem {
  id: string;
  contentId: string;
  title: string;
  platform: PublishingPlatform;
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  error?: string;
  createdAt: string;
}

export interface PublishingStats {
  drafts: number;
  approved: number;
  scheduled: number;
  published: number;
  failed: number;
  successRate: number;
}

export interface ScheduleRecommendation {
  day: string;
  time: string;
  platform: PublishingPlatform;
  score: number;
}

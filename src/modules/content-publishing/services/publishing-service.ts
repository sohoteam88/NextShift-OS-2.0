// Publishing Service — central publishing orchestrator

import type { PublishingItem, ContentStatus, PublishingStats, PublishingPlatform, ScheduleRecommendation } from '../types/publishing.types';

// In-memory store (V1 — replace with DB)
const items: Map<string, PublishingItem> = new Map();

export function createPublishingItem(contentId: string, title: string, platform: PublishingPlatform): PublishingItem {
  const item: PublishingItem = {
    id: `pub-${Date.now()}`,
    contentId, title, platform,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  items.set(item.id, item);
  return item;
}

export function updateStatus(id: string, status: ContentStatus, error?: string): PublishingItem | null {
  const item = items.get(id);
  if (!item) return null;
  item.status = status;
  if (status === 'published') item.publishedAt = new Date().toISOString();
  if (error) item.error = error;
  return item;
}

export function scheduleItem(id: string, scheduledAt: string): PublishingItem | null {
  const item = items.get(id);
  if (!item) return null;
  item.status = 'scheduled';
  item.scheduledAt = scheduledAt;
  return item;
}

export function getStats(): PublishingStats {
  const all = Array.from(items.values());
  const drafts = all.filter(i => i.status === 'draft' || i.status === 'review').length;
  const approved = all.filter(i => i.status === 'approved').length;
  const scheduled = all.filter(i => i.status === 'scheduled').length;
  const published = all.filter(i => i.status === 'published').length;
  const failed = all.filter(i => i.status === 'failed').length;
  const total = all.length || 1;
  const successRate = Math.round(((published + scheduled) / total) * 100);
  return { drafts, approved, scheduled, published, failed, successRate };
}

export function getOptimalPublishTime(platform: PublishingPlatform): ScheduleRecommendation {
  const defaults: Record<PublishingPlatform, { day: string; time: string }> = {
    facebook: { day: 'Tuesday', time: '9:00 PM' },
    instagram: { day: 'Thursday', time: '8:00 PM' },
    tiktok: { day: 'Wednesday', time: '7:00 PM' },
    xiaohongshu: { day: 'Saturday', time: '10:00 AM' },
  };
  const d = defaults[platform];
  return { ...d, platform, score: 85 };
}

export function getAllItems(): PublishingItem[] {
  return Array.from(items.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

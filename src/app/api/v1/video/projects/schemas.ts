import { z } from 'zod';

export const VideoProductionInputSchema = z.object({
  topic: z.string().min(1).max(200),
  content_pillar: z.string().min(1).max(120),
  audience_pain: z.string().min(1).max(300),
  funnel_stage: z.enum(['cold_audience', 'warm_lead', 'lead_magnet_delivered', 'webinar_invite', 'post_webinar', 'closing']),
  platform: z.enum(['facebook_reel', 'instagram_reel', 'tiktok', 'instagram_story', 'xiaohongshu', 'youtube_shorts']),
  duration: z.enum(['15s', '30s', '60s', '90s']),
  style: z.enum(['talking_head', 'faceless', 'broll_voiceover', 'tutorial', 'storytelling']),
  calendar_id: z.string().optional(),
  personal_story_excerpt: z.string().max(1000).optional(),
});

export const VideoHookSchema = z.object({
  text: z.string().min(1),
  visual_concept: z.string().min(1),
  hook_type: z.enum(['痛点', '好奇', '故事', '数字', '反直觉', '误区', '冲突']),
  alternates: z.array(z.object({ text: z.string().min(1), hook_type: z.string().min(1) })).default([]),
});

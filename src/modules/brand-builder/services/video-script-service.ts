import prisma from '@/lib/prisma';
import { getRouterForTenant } from '@/modules/ai/router';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { logAIUsage } from '@/modules/ai/usage/tracker';

type AuthUser = { id: string; tenantId: string; languagePreference?: string };

export interface VideoScriptInput {
  topic: string;
  platform: 'facebook_reel' | 'instagram_reel' | 'tiktok' | 'story';
  duration: '15s' | '30s' | '60s';
  style: 'talking_head' | 'faceless' | 'broll_voiceover' | 'tutorial';
  calendarId?: string;
}

export interface SceneBlock {
  time: string;
  visual: string;
  text_overlay: string;
  voiceover: string;
}

export interface VideoScript {
  title: string;
  duration: string;
  hook: SceneBlock;
  scenes: SceneBlock[];
  cta: SceneBlock & { time?: never };
  music_mood: string;
  hashtags: string[];
  caption: string;
  equipment_needed: string;
}

type BrandProfileData = {
  identity?: string;
  name?: string;
  target_audience?: string;
  targetAudience?: string;
  personality?: string;
};

async function getBrandProfile(userId: string): Promise<BrandProfileData | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  return (meta.brand_profile as BrandProfileData) ?? null;
}

const DURATION_GUIDE: Record<VideoScriptInput['duration'], string> = {
  '15s': '3 scenes max, ultra concise',
  '30s': '4-5 scenes, one key message',
  '60s': '6-8 scenes, can include teaching + CTA',
};

const STYLE_GUIDE: Record<VideoScriptInput['style'], string> = {
  talking_head: 'Person speaking directly to camera. Show face, gestures, energy.',
  faceless: 'No face needed. Use text overlays, B-roll footage, screen recordings, stock clips.',
  broll_voiceover: 'B-roll footage with voiceover narration. Cinematic feel.',
  tutorial: 'Step-by-step demonstration. Show hands, process, results.',
};

export const videoScriptService = {
  async generate(user: AuthUser, input: VideoScriptInput): Promise<VideoScript> {
    await enforceQuota(user.tenantId);

    const brandProfile = await getBrandProfile(user.id);

    const systemPrompt = `You are a short-form video script expert for social media in the Malaysian Chinese market.
Create a video script for ${input.platform} (${input.duration}).

Style: ${STYLE_GUIDE[input.style]}
Duration guide: ${DURATION_GUIDE[input.duration]}

Brand context:
- Identity: ${brandProfile?.identity ?? brandProfile?.name ?? 'health consultant'}
- Audience: ${brandProfile?.target_audience ?? brandProfile?.targetAudience ?? 'working adults'}
- Personality: ${brandProfile?.personality ?? 'friendly'}

Rules:
- Hook MUST grab attention in first 1-3 seconds
- Each scene: visual description + text overlay + voiceover
- End with clear CTA
- Music mood suggestion
- 5-8 relevant hashtags
- Write a caption for the post
- Keep equipment simple (手机 is fine)
- No income claims or exaggerated health promises
- Write in Chinese (Malaysian style)

Return JSON exactly:
{
  "title": "视频标题",
  "duration": "${input.duration}",
  "hook": { "time": "0-3s", "visual": "...", "text_overlay": "...", "voiceover": "..." },
  "scenes": [{ "time": "3-8s", "visual": "...", "text_overlay": "...", "voiceover": "..." }],
  "cta": { "visual": "...", "text_overlay": "...", "voiceover": "..." },
  "music_mood": "轻快/温暖/积极/严肃",
  "hashtags": ["#tag1", "#tag2"],
  "caption": "发帖时的文字描述",
  "equipment_needed": "手机 + 自然光"
}`;

    const router = await getRouterForTenant(user.tenantId);
    const result = await router.generate(
      {
        systemPrompt,
        userMessage: `Topic: ${input.topic}`,
        temperature: 0.8,
        maxTokens: 1500,
      },
      'video_script',
    );

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'video_script_generation',
      result,
      routing: result.routing,
    });

    try {
      const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr) as VideoScript;
    } catch {
      throw new Error('Failed to parse video script');
    }
  },
};

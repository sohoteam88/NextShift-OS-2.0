import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MasterScript, PlatformAdaptation, PlatformType, VideoStrategy } from '../types';
import { generateVideoJson } from './json';

const PLATFORM_NOTES: Record<string, string> = {
  facebook_reel: 'Facebook Reels 适合较长描述，可以包含故事性 caption。',
  instagram_reel: 'Instagram Reels 原生音频和热门音效有助推荐，hashtag 3-5 个。',
  tiktok: 'TikTok 标题应简短有梗，善用热门 hashtag 和音效。',
  instagram_story: 'Story 适合互动元素，caption 要短。',
  xiaohongshu: '小红书标题需要关键词，正文可更详细，多用 emoji 分段。',
  youtube_shorts: 'YouTube Shorts 标题要包含关键词以便搜索。',
};

function fallbackAdaptations(script: MasterScript, platforms: PlatformType[]): PlatformAdaptation[] {
  return platforms.map((platform) => ({
    platform,
    title_or_caption: `${script.title}\n\n${script.hook.text}\n\n想了解下一步，留言告诉我。`,
    hashtags: ['#马来西亚', '#副业', '#成长', '#短视频'],
    cover_thumbnail_text: script.hook.text.slice(0, 12),
    posting_time_suggestion: '晚上 8-10 点',
    platform_specific_notes: PLATFORM_NOTES[platform] ?? '保持标题清楚，CTA 简单。',
  }));
}

export const platformAdaptationService = {
  async generate(
    user: AuthUser,
    script: MasterScript,
    strategy: VideoStrategy,
    primaryPlatform: PlatformType,
    additionalPlatforms: PlatformType[] = [],
  ) {
    const platforms = [primaryPlatform, ...additionalPlatforms.filter((p) => p !== primaryPlatform)];
    const systemPrompt = `Generate platform-specific posting adaptations for: ${platforms.join(', ')}.

For each platform provide title_or_caption, hashtags, cover_thumbnail_text, posting_time_suggestion, platform_specific_notes.

Platform context:
${platforms.map((platform) => `${platform}: ${PLATFORM_NOTES[platform] ?? ''}`).join('\n')}

Video:
Title: ${script.title}
Hook: ${script.hook.text}
CTA: ${script.cta.voiceover}
Strategy angle: ${strategy.recommended_angle}

Return ONLY JSON array of PlatformAdaptation in Chinese Malaysian style.`;

    return generateVideoJson<PlatformAdaptation[]>(user, {
      systemPrompt,
      userMessage: JSON.stringify({ script, strategy }),
      feature: 'platform_adaptation',
      fallback: fallbackAdaptations(script, platforms),
      platform: primaryPlatform,
      temperature: 0.7,
      maxTokens: 1200,
    });
  },
};

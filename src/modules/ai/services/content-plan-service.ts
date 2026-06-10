import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getRouterForTenant } from '../router';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';
import { AppError } from '@/lib/errors';

export type ContentType = 'education' | 'story' | 'authority' | 'offer' | 'community';

export interface ContentPlanInput {
  niche: string;
  targetAudience: string;
  offer: string;
  platforms: string[];
  language: 'zh' | 'en' | 'ms';
  postingFrequency?: number;
  brandTone?: string;
  personalStory?: string;
}

export interface ContentDay {
  day: number;
  type: ContentType;
  pillar: string;
  theme: string;
  hook: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  xiaohongshu: string;
  cta: string;
}

export interface ContentPlanOutput {
  strategy: {
    niche: string;
    positioning: string;
    audiencePain: string;
    corePromise: string;
  };
  pillars: {
    name: string;
    description: string;
    topics: string[];
  }[];
  days: ContentDay[];
  hookBank: {
    type: ContentType;
    hooks: string[];
  }[];
  ctaLibrary: {
    engagement: string[];
    dm: string[];
    leadMagnet: string[];
    sales: string[];
  };
  repurposingWorkflow: string;
}

const LANGUAGE_MAP = { zh: 'Chinese', en: 'English', ms: 'Bahasa Malaysia' };

const SYSTEM_PROMPT = `You are a world-class social media content strategist specializing in the Malaysian market.
You build 30-day content plans that build trust, authority, community, and sales momentum.

Content ratio rule (MUST follow exactly for 30 days):
- 12 Education posts (40%)
- 6 Story posts (20%)
- 6 Authority posts (20%)
- 3 Offer posts (10%)
- 3 Community posts (10%)

Rules:
- No income guarantees or specific earnings claims
- No medical claims or cure promises
- Use specific, relatable, local market language
- Every content idea must connect to the user's audience, offer, or story
- Return ONLY valid JSON, no other text`;

function buildPrompt(input: ContentPlanInput): string {
  const lang = LANGUAGE_MAP[input.language];
  const platforms = input.platforms.join(', ');
  return `Generate a complete 30-day content plan. Respond entirely in ${lang}.

Business Information:
- Niche: ${input.niche}
- Target Audience: ${input.targetAudience}
- Offer: ${input.offer}
- Platforms: ${platforms}
- Posting Frequency: ${input.postingFrequency ?? 1} post/day
- Brand Tone: ${input.brandTone ?? 'Warm and relatable'}
- Personal Story: ${input.personalStory ?? 'Not provided'}

IMPORTANT: Generate exactly 30 days following this ratio:
- Days with type "education": 12 days (days: 1,2,4,6,8,10,12,14,16,18,22,26)
- Days with type "story": 6 days (days: 3,9,13,20,24,28)
- Days with type "authority": 6 days (days: 5,11,15,19,23,27)
- Days with type "offer": 3 days (days: 7,17,25)
- Days with type "community": 3 days (days: 21,29,30)

Return this exact JSON structure (all text in ${lang}):
{
  "strategy": {
    "niche": "",
    "positioning": "",
    "audiencePain": "",
    "corePromise": ""
  },
  "pillars": [
    { "name": "", "description": "", "topics": ["", "", ""] },
    { "name": "", "description": "", "topics": ["", "", ""] },
    { "name": "", "description": "", "topics": ["", "", ""] },
    { "name": "", "description": "", "topics": ["", "", ""] },
    { "name": "", "description": "", "topics": ["", "", ""] }
  ],
  "days": [
    { "day": 1, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 2, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 3, "type": "story", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 4, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 5, "type": "authority", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 6, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 7, "type": "offer", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 8, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 9, "type": "story", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 10, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 11, "type": "authority", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 12, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 13, "type": "story", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 14, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 15, "type": "authority", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 16, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 17, "type": "offer", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 18, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 19, "type": "authority", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 20, "type": "story", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 21, "type": "community", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 22, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 23, "type": "authority", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 24, "type": "story", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 25, "type": "offer", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 26, "type": "education", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 27, "type": "authority", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 28, "type": "story", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 29, "type": "community", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" },
    { "day": 30, "type": "community", "pillar": "", "theme": "", "hook": "", "facebook": "", "instagram": "", "tiktok": "", "xiaohongshu": "", "cta": "" }
  ],
  "hookBank": [
    { "type": "education", "hooks": ["","","","",""] },
    { "type": "story", "hooks": ["","","","",""] },
    { "type": "authority", "hooks": ["","","","",""] },
    { "type": "offer", "hooks": ["","","","",""] },
    { "type": "community", "hooks": ["","","","",""] }
  ],
  "ctaLibrary": {
    "engagement": ["","",""],
    "dm": ["","",""],
    "leadMagnet": ["","",""],
    "sales": ["","",""]
  },
  "repurposingWorkflow": ""
}`;
}

function parseOutput(text: string): ContentPlanOutput {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as ContentPlanOutput;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ContentPlanOutput;
    throw new AppError('INTERNAL_ERROR', 500, 'AI returned invalid JSON for content plan');
  }
}

export const contentPlanService = {
  async generate(
    user: AuthUser,
    input: ContentPlanInput,
  ): Promise<{ plan: ContentPlanOutput; tokensUsed: number; provider: string; model: string }> {
    await enforceQuota(user.tenantId);

    const router = await getRouterForTenant(user.tenantId);
    const result = await router.generate(
      {
        systemPrompt: SYSTEM_PROMPT,
        userMessage: buildPrompt(input),
        temperature: 0.8,
        maxTokens: 6000,
      },
      'content_calendar',
    );

    const validation = validateAIOutput(result.text);
    let finalResult = result;

    if (!validation.valid) {
      const retry = await router.generate(
        {
          systemPrompt: SYSTEM_PROMPT + '\n\nIMPORTANT: Do NOT mention specific income amounts or medical cures. Return only valid JSON.',
          userMessage: buildPrompt(input),
          temperature: 0.6,
          maxTokens: 6000,
        },
        'content_calendar',
      );
      finalResult = {
        ...retry,
        tokensIn: result.tokensIn + retry.tokensIn,
        tokensOut: result.tokensOut + retry.tokensOut,
        durationMs: result.durationMs + retry.durationMs,
      };
    }

    const plan = parseOutput(finalResult.text);

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'content_plan_30day',
      result: finalResult,
      routing: finalResult.routing,
    });

    return {
      plan,
      tokensUsed: finalResult.tokensIn + finalResult.tokensOut,
      provider: finalResult.provider,
      model: finalResult.model,
    };
  },
};

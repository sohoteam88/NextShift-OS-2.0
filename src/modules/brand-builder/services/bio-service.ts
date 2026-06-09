import { generateWithFallback } from '@/modules/ai/providers/factory';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import { enforceQuota } from '@/modules/ai/usage/quota';
import type { AuthUser } from '@/modules/auth/services/auth-service';

export type BioSet = {
  facebook: string;
  instagram: string;
  tiktok: string;
};

type BrandProfile = Record<string, unknown>;

const PLATFORM_LIMITS: Record<string, number> = {
  facebook: 200,
  instagram: 150,
  tiktok: 80,
};

const ALL_BIOS_SYSTEM_PROMPT = `You are a social media bio copywriter for the Malaysian Chinese market.
Generate platform-specific bios based on the brand profile.

Rules:
- Facebook Bio: ≤ 200 characters, use emojis to separate sections, include credentials + CTA
- Instagram Bio: ≤ 150 characters, very concise, emoji line separators, last line = CTA
- TikTok Bio: ≤ 80 characters, ultra short, core positioning only
- Write in Chinese (Malaysian Chinese style)
- Include social proof if available (e.g., "帮助 50+ 位妈妈")
- Last line should be a CTA (e.g., "👇 免费健康测试", "📱 私信咨询")
- No income claims, no exaggerated health promises
- Make it feel personal and authentic, not corporate

Return ONLY valid JSON: { "facebook": "...", "instagram": "...", "tiktok": "..." }`;

function buildProfileMessage(profile: BrandProfile) {
  return [
    `Identity: ${profile.identity ?? ''}`,
    `Story: ${profile.story ?? ''}`,
    `Expertise: ${(profile.expertise as string[] | undefined ?? []).join(', ')}`,
    `Target audience: ${profile.target_audience ?? ''}`,
    `Value proposition: ${profile.value_proposition ?? ''}`,
    `Personality: ${profile.personality ?? ''}`,
    `Differentiator: ${profile.differentiator ?? ''}`,
  ].join('\n');
}

export const bioService = {
  async generate(user: AuthUser, brandProfile: BrandProfile): Promise<BioSet> {
    await enforceQuota(user.tenantId);

    const result = await generateWithFallback({
      systemPrompt: ALL_BIOS_SYSTEM_PROMPT,
      userMessage: `Brand profile:\n${buildProfileMessage(brandProfile)}`,
      temperature: 0.8,
      maxTokens: 600,
    });

    await logAIUsage({ tenantId: user.tenantId, userId: user.id, feature: 'bio_generation', result });

    try {
      const jsonStr = result.text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr) as BioSet;
    } catch {
      return { facebook: '', instagram: '', tiktok: '' };
    }
  },

  async regenerateSingle(
    user: AuthUser,
    brandProfile: BrandProfile,
    platform: string,
    instruction?: string,
  ): Promise<string> {
    await enforceQuota(user.tenantId);

    const limit = PLATFORM_LIMITS[platform] ?? 150;
    const systemPrompt = `You are a social media bio copywriter for the Malaysian Chinese market.
Rewrite the ${platform} bio for this brand. Maximum ${limit} characters.
Write in Chinese (Malaysian Chinese style). No income claims, no exaggerated health promises.
${instruction ? `User instruction: ${instruction}` : ''}
Return ONLY the bio text — no JSON, no extra explanation.`;

    const result = await generateWithFallback({
      systemPrompt,
      userMessage: `Brand profile:\n${buildProfileMessage(brandProfile)}`,
      temperature: 0.85,
      maxTokens: 300,
    });

    await logAIUsage({ tenantId: user.tenantId, userId: user.id, feature: 'bio_generation', result });

    return result.text.trim().slice(0, limit * 3);
  },
};

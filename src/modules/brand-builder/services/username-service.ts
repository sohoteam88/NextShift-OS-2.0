import { generateWithFallback } from '@/modules/ai/providers/factory';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import { enforceQuota } from '@/modules/ai/usage/quota';
import type { AuthUser } from '@/modules/auth/services/auth-service';

export type UsernameOption = {
  username: string;
  style: string;
  rationale: string;
  available_note: string;
};

type BrandProfile = Record<string, unknown>;

const SYSTEM_PROMPT = `You are a social media username expert for the Malaysian market.
Generate 5 unique username options for Facebook/Instagram based on the brand profile.

Rules:
- 3-20 characters
- Only lowercase letters, numbers, underscores, periods
- Include name or brand keyword
- Include niche/field keyword
- Easy to remember and spell
- Consider Malaysian Chinese market (pinyin names OK)
- Mix different styles: name+field, brand+location, field+identity, creative
- Do NOT check real availability — just generate good options

Return ONLY a JSON array:
[{ "username": "...", "style": "名字+领域", "rationale": "为什么好" }]`;

function buildUserMessage(userName: string, profile: BrandProfile, excluded: string[] = []) {
  const lines = [
    `Name: ${userName}`,
    `Identity: ${profile.identity ?? ''}`,
    `Expertise: ${(profile.expertise as string[] | undefined ?? []).join(', ')}`,
    `Target audience: ${profile.target_audience ?? ''}`,
    `Personality: ${profile.personality ?? ''}`,
    `Platforms: ${(profile.recommended_platforms as string[] | undefined ?? []).join(', ')}`,
  ];
  if (excluded.length > 0) {
    lines.push(`\nDo NOT suggest any of these already-shown usernames: ${excluded.join(', ')}`);
  }
  return `Brand profile:\n${lines.join('\n')}`;
}

function parseOptions(text: string, fallbackName: string): UsernameOption[] {
  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const raw = JSON.parse(jsonStr) as Array<Record<string, string>>;
    return raw.map((o) => ({
      username: o.username ?? '',
      style: o.style ?? '',
      rationale: o.rationale ?? '',
      available_note: '请自行到 Facebook / Instagram 确认此用户名是否可用',
    }));
  } catch {
    return [
      {
        username: fallbackName.toLowerCase().replace(/\s+/g, '.'),
        style: '名字',
        rationale: '基础选项',
        available_note: '请自行到 Facebook / Instagram 确认此用户名是否可用',
      },
    ];
  }
}

export const usernameService = {
  async generate(user: AuthUser, brandProfile: BrandProfile): Promise<UsernameOption[]> {
    await enforceQuota(user.tenantId);

    const result = await generateWithFallback({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserMessage(user.name, brandProfile),
      temperature: 0.9,
      maxTokens: 800,
    });

    await logAIUsage({ tenantId: user.tenantId, userId: user.id, feature: 'username_generation', result });

    return parseOptions(result.text, user.name);
  },

  async regenerate(user: AuthUser, brandProfile: BrandProfile, excluded: string[]): Promise<UsernameOption[]> {
    await enforceQuota(user.tenantId);

    const result = await generateWithFallback({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserMessage(user.name, brandProfile, excluded),
      temperature: 0.9,
      maxTokens: 800,
    });

    await logAIUsage({ tenantId: user.tenantId, userId: user.id, feature: 'username_generation', result });

    return parseOptions(result.text, user.name);
  },
};

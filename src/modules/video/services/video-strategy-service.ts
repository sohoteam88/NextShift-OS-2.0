import prisma from '@/lib/prisma';
import { getRouterForTenant } from '@/modules/ai/router';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import { enforceQuota } from '@/modules/ai/usage/quota';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { VideoProductionInput, VideoStrategy } from '../types';
import { parseJsonFromAI } from './json';

const FUNNEL_STAGE_GUIDANCE: Record<string, string> = {
  cold_audience: '受众完全不认识你。目标是制造记忆点和好奇心，不要直接推销。',
  warm_lead: '受众见过你的内容但还没行动。目标是加深信任，展示专业度。',
  lead_magnet_delivered: '受众已经拿到了你的资源。目标是延续价值，引导下一步互动。',
  webinar_invite: '目标是邀请受众参加 Webinar。强调为什么现在和你会获得什么。',
  post_webinar: '受众看过 Webinar 但还没决定。目标是处理犹豫，提供社会证明。',
  closing: '受众接近决策点。目标是创造适度紧迫感，给出明确下一步。',
};

const DEFAULT_STRATEGY: VideoStrategy = {
  recommended_angle: '误区纠正',
  angle_reason: '这个角度能快速制造反差，让观众愿意听完后面的解释。',
  emotional_arc: '好奇 → 惊讶 → 共鸣 → 希望 → 行动',
  funnel_stage_alignment: '先建立信任和记忆点，再引导观众做一个低压力互动。',
  success_metric: '评论区出现具体提问或私信询问下一步。',
  estimated_completion_rate: 'medium',
  estimated_completion_reason: '主题有明确痛点，但完播率取决于前 3 秒 hook 的执行。',
};

async function getBrandProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  return ((user?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown> | undefined) ?? null;
}

export const videoStrategyService = {
  async buildStrategy(user: AuthUser, input: VideoProductionInput): Promise<VideoStrategy> {
    await enforceQuota(user.tenantId);

    const router = await getRouterForTenant(user.tenantId);
    const brandProfile = await getBrandProfile(user.id);

    const systemPrompt = `You are a short-form video strategist for the Malaysian Chinese social media market.

Given the inputs below, make strategic decisions BEFORE any script is written:
1. recommended_angle: pick ONE specific angle (误区纠正/对比转变/幕后过程/教学/故事/挑战/问答/清单)
2. angle_reason: why this angle fits this topic + audience + funnel stage
3. emotional_arc: the emotional journey as a chain, e.g. 好奇 → 惊讶 → 共鸣 → 希望
4. funnel_stage_alignment: how this specific video moves someone at this funnel stage forward
5. success_metric: what specific outcome indicates this video worked
6. estimated_completion_rate: high/medium/low
7. estimated_completion_reason: why

Funnel stage guidance: ${FUNNEL_STAGE_GUIDANCE[input.funnel_stage]}

Return ONLY JSON matching VideoStrategy.`;

    const result = await router.generate(
      {
        systemPrompt,
        userMessage: JSON.stringify({
          ...input,
          brand: {
            identity: brandProfile?.identity,
            personality: brandProfile?.personality,
            story: brandProfile?.story,
          },
        }),
        temperature: 0.6,
        maxTokens: 800,
      },
      'video_script',
    );

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'video_strategy',
      result,
      routing: result.routing,
    });

    return parseJsonFromAI<VideoStrategy>(result.text, DEFAULT_STRATEGY);
  },
};

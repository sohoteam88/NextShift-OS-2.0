import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getRouterForTenant } from '@/modules/ai/router';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import type { StrategyContext } from '../types/strategy-context';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';

const DEFAULT_STRATEGY: StrategyContext['strategy'] = {
  funnel_type: 'lead_magnet',
  funnel_type_reason: '先用低风险资料收集名单，再引导到 WhatsApp 或咨询会更适合冷流量。',
  primary_angle: 'pain',
  primary_angle_reason: '受众痛点明确，先让他们感觉被理解，再提出下一步。',
  core_narrative: '目标客户不是不想改变，而是卡在不知道第一步怎么走。这个漏斗先用真实案例和简单清单让他们看见现状，再用低压力的下一步引导他们进入对话。',
  biggest_risk: '内容太像普通广告，缺少真实素材和信任感。',
  risk_mitigation: '在 hero、案例、异议处理和 WhatsApp 跟进里重复使用真实案例与客户原话。',
  sequence_length_days: 5,
  sequence_length_reason: '多数低到中客单价产品需要 3-5 天建立信任，高压跟进反而降低回复。',
};

function normalizeBrandProfile(profile: Record<string, unknown> | null): StrategyContext['brand'] {
  return {
    identity: String(profile?.identity ?? profile?.name ?? ''),
    story: String(profile?.story ?? profile?.personal_story ?? profile?.founder_story ?? ''),
    personality: String(profile?.personality ?? profile?.tone ?? ''),
    differentiator: String(profile?.differentiator ?? profile?.unique_value ?? profile?.whyDifferent ?? ''),
    value_proposition: String(profile?.value_proposition ?? profile?.valueProposition ?? profile?.offer ?? ''),
  };
}

function parseStrategy(text: string): StrategyContext['strategy'] {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return DEFAULT_STRATEGY;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<StrategyContext['strategy']>;
    return {
      ...DEFAULT_STRATEGY,
      ...parsed,
      sequence_length_days: Math.max(3, Math.min(7, Number(parsed.sequence_length_days ?? DEFAULT_STRATEGY.sequence_length_days))),
    };
  } catch {
    return DEFAULT_STRATEGY;
  }
}

/** @deprecated Use getBrandContext() directly. Maps to legacy shape. */
async function getBrandProfile(userId: string): Promise<Record<string, unknown> | null> {
  const ctx = await getBrandContext(userId);
  if (!ctx) return null;
  return { identity: ctx.brandName, name: ctx.personalName, story: ctx.messaging.coreMessage, personality: ctx.tone, differentiator: ctx.messaging.uniqueAngle, value_proposition: ctx.offer.primary };
}

export const funnelStrategyService = {
  async buildStrategy(user: AuthUser, input: {
    business: StrategyContext['business'];
    real_material: StrategyContext['real_material'];
  }): Promise<StrategyContext> {
    const brand = normalizeBrandProfile(await getBrandProfile(user.id));
    const router = await getRouterForTenant(user.tenantId);

    const systemPrompt = `You are a funnel strategist for the Malaysian Chinese market.
Make strategic decisions that ALL funnel copy must reuse. Return ONLY valid JSON:
{
  "funnel_type": "landing|quiz|lead_magnet|webinar",
  "funnel_type_reason": "...",
  "primary_angle": "pain|result|mistake|myth|story|checklist|test|transformation|local|beginner",
  "primary_angle_reason": "...",
  "core_narrative": "80-150 Chinese words. Reference real case/founder story if available.",
  "biggest_risk": "...",
  "risk_mitigation": "...",
  "sequence_length_days": 3,
  "sequence_length_reason": "..."
}`;

    const result = await router.generate(
      {
        systemPrompt,
        userMessage: JSON.stringify({ brand, business: input.business, real_material: input.real_material }),
        temperature: 0.5,
        maxTokens: 1200,
      },
      'lead_analysis',
    );

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'funnel_strategy',
      result,
      routing: result.routing,
    });

    return {
      brand,
      business: input.business,
      real_material: input.real_material,
      strategy: parseStrategy(result.text),
    };
  },
};

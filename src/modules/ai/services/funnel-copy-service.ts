import type { AuthUser } from '@/modules/auth/services/auth-service';
import { generateWithFallback } from '../providers/factory';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';
import { AppError } from '@/lib/errors';

export interface FunnelCopyInput {
  funnelType: 'landing' | 'quiz' | 'lead_magnet';
  audience: string;
  offer: string;
  product?: string;
  language?: 'zh' | 'en' | 'ms';
}

export interface FunnelCopyOutput {
  hero: { headline: string; subheadline: string; cta_text: string };
  pain: { title: string; items: { text: string }[] };
  mechanism: { title: string; description: string };
  benefits: { title: string; items: { icon: string; title: string; description: string }[] };
  faq: { title: string; items: { question: string; answer: string }[] };
  cta: { headline: string; subheadline: string; button_text: string };
  quiz?: {
    questions: { text: string; options: { text: string; score: number }[] }[];
    results: { min_score: number; max_score: number; title: string; description: string; cta_text: string }[];
  };
}

const SYSTEM_PROMPT = `你是一位专业的营销文案专家，擅长为健康和保健行业创建高转化的漏斗页面文案。
规则：不提及具体收入金额，不使用夸大的医疗声明，用教育和价值导向的语气。
只返回有效的 JSON，不要包含任何其他文字。`;

function buildUserPrompt(input: FunnelCopyInput): string {
  const typeLabel: Record<string, string> = { landing: '落地页', quiz: '测试问卷', lead_magnet: '免费资源下载页' };
  const extra = input.funnelType === 'quiz'
    ? '\n同时生成 quiz 字段：包含 4-5 个问题（每题 4 个选项），以及 3 个结果区间。'
    : '';

  return `请为以下漏斗页面生成完整文案：

类型：${typeLabel[input.funnelType]}
目标受众：${input.audience}
产品/服务：${input.product ?? input.offer}
优惠：${input.offer}

要求：
1. headline 最多 2 行，吸引注意力
2. 突出受众的痛点，引发共鸣
3. 解释为什么你的方案不同（mechanism）
4. 列出 3-4 个核心好处
5. FAQ 回答 3-5 个常见问题
6. CTA 文案清晰、有紧迫感（但不虚假）
7. 不要提及具体收入金额或金钱承诺
8. 不要使用夸大的医疗声明${extra}

返回 JSON（严格格式）：
{"hero":{"headline":"","subheadline":"","cta_text":""},"pain":{"title":"","items":[{"text":""}]},"mechanism":{"title":"","description":""},"benefits":{"title":"","items":[{"icon":"heart","title":"","description":""}]},"faq":{"title":"","items":[{"question":"","answer":""}]},"cta":{"headline":"","subheadline":"","button_text":""}}`;
}

function parseJSON(text: string): FunnelCopyOutput {
  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as FunnelCopyOutput;
  } catch {
    // Try to find JSON object in text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as FunnelCopyOutput;
    throw new AppError('INTERNAL_ERROR', 500, 'AI returned invalid JSON');
  }
}

export const funnelCopyService = {
  async generate(user: AuthUser, input: FunnelCopyInput): Promise<{ copy: FunnelCopyOutput; tokensUsed: number }> {
    await enforceQuota(user.tenantId);

    const result = await generateWithFallback({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: buildUserPrompt(input),
      temperature: 0.8,
      maxTokens: 2000,
    });

    const validation = validateAIOutput(result.text);
    if (!validation.valid) {
      throw new AppError('VALIDATION_ERROR', 400, `生成内容包含违规内容: ${validation.violations.join(', ')}`);
    }

    const copy = parseJSON(result.text);

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'funnel_copy',
      result,
    });

    return { copy, tokensUsed: result.tokensIn + result.tokensOut };
  },

  async applyToFunnel(
    user: AuthUser,
    funnelId: string,
    generatedCopy: Partial<FunnelCopyOutput>,
  ) {
    const { default: prisma } = await import('@/lib/prisma');
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, tenantId: user.tenantId },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');

    const config = funnel.config as { sections?: { type: string }[]; quiz?: unknown; [k: string]: unknown };
    const sections = [...(config.sections ?? [])];

    const sectionTypeMap: Record<string, string> = {
      hero: 'hero', pain: 'pain', mechanism: 'mechanism',
      benefits: 'benefits', faq: 'faq', cta: 'cta',
    };

    for (const [key, data] of Object.entries(generatedCopy)) {
      if (key === 'quiz') continue;
      const sectionType = sectionTypeMap[key];
      if (!sectionType || !data) continue;

      const idx = sections.findIndex(s => s.type === sectionType);
      if (idx !== -1) {
        sections[idx] = { ...sections[idx], ...data };
      } else {
        sections.push({ type: sectionType, ...data } as { type: string });
      }
    }

    const updatedConfig = {
      ...config,
      sections,
      ...(generatedCopy.quiz && { quiz: { ...((config.quiz as object) ?? {}), ...generatedCopy.quiz } }),
    };

    const updated = await prisma.funnel.update({
      where: { id: funnelId },
      data: { config: updatedConfig as never, updatedAt: new Date() },
    });

    return updated;
  },
};

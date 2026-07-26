import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { ContentTrack } from '@/modules/content-engine/types';
import {
  buildGenerationContext,
  GENERATION_DEGRADE_LABEL,
  runGeneration,
  type GenerationPlatform,
  type RunGenerationOptions,
} from '@/modules/ai/generation';
import { getBusinessPackSlice } from '@/modules/ai/business-pack';
import { enforceComplianceHardFilter } from '@/modules/ai/compliance';
import { AppError } from '@/lib/errors';

export interface FunnelCopyInput {
  funnelType: 'landing' | 'quiz' | 'lead_magnet';
  track: ContentTrack;
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

const MAX_COMPLIANCE_RETRIES = 2;

const FUNNEL_PLATFORM: Record<FunnelCopyInput['funnelType'], GenerationPlatform> = {
  landing: 'blog',
  quiz: 'email',
  lead_magnet: 'blog',
};

const FUNNEL_COPY_JSON_SYSTEM_INSTRUCTION = [
  '【漏斗文案输出契约】',
  '只返回合法 JSON，不要 Markdown、代码围栏、解释或额外文字。',
  '必须返回 hero、pain、mechanism、benefits、faq、cta；quiz 类型还必须返回 quiz。',
  '保留输入 JSON 骨架的字段与列表结构，只改写所有面向公众的文本。',
  '避免收入承诺、医疗或体重效果承诺、公开价格、品牌残留和夸大保证。',
].join('\n');

function buildUserPrompt(input: FunnelCopyInput): string {
  const typeLabel: Record<FunnelCopyInput['funnelType'], string> = { landing: '落地页', quiz: '测试问卷', lead_magnet: '免费资源下载页' };
  const extra = input.funnelType === 'quiz'
    ? '\n同时生成 quiz 字段：包含 4-5 个问题（每题 4 个选项），以及 3 个结果区间。'
    : '';

  return `请为${input.track === 'retail' ? '零售客户教育' : '合作伙伴招募'}模式生成完整漏斗页面文案：

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
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned) as FunnelCopyOutput;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as FunnelCopyOutput;
    throw new AppError('INTERNAL_ERROR', 500, 'AI returned invalid JSON');
  }
}

function filterPublicText(text: string, track: ContentTrack): string | null {
  const verdict = enforceComplianceHardFilter({
    fields: { title: '', hook: '', body: text, cta: '', hashtags: [] },
    track,
  });
  return verdict.status === 'rejected' ? null : verdict.fields.body;
}

/** Applies G4 to every public-facing string in a funnel package. */
function filterFunnelForPublicOutput(copy: FunnelCopyOutput, track: ContentTrack): FunnelCopyOutput | null {
  const rewrite = (text: string) => filterPublicText(text, track);
  const heroHeadline = rewrite(copy.hero.headline);
  const heroSubheadline = rewrite(copy.hero.subheadline);
  const heroCta = rewrite(copy.hero.cta_text);
  const painTitle = rewrite(copy.pain.title);
  const painItems = copy.pain.items.map((item) => rewrite(item.text));
  const mechanismTitle = rewrite(copy.mechanism.title);
  const mechanismDescription = rewrite(copy.mechanism.description);
  const benefitsTitle = rewrite(copy.benefits.title);
  const benefits = copy.benefits.items.map((item) => ({ title: rewrite(item.title), description: rewrite(item.description) }));
  const faqTitle = rewrite(copy.faq.title);
  const faq = copy.faq.items.map((item) => ({ question: rewrite(item.question), answer: rewrite(item.answer) }));
  const ctaHeadline = rewrite(copy.cta.headline);
  const ctaSubheadline = rewrite(copy.cta.subheadline);
  const ctaButton = rewrite(copy.cta.button_text);

  if ([heroHeadline, heroSubheadline, heroCta, painTitle, mechanismTitle, mechanismDescription, benefitsTitle, faqTitle, ctaHeadline, ctaSubheadline, ctaButton, ...painItems].some((value) => value === null)
    || benefits.some((item) => item.title === null || item.description === null)
    || faq.some((item) => item.question === null || item.answer === null)) return null;

  const quiz = copy.quiz && filterQuizForPublicOutput(copy.quiz, track);
  if (copy.quiz && !quiz) return null;

  return {
    ...copy,
    hero: { headline: heroHeadline!, subheadline: heroSubheadline!, cta_text: heroCta! },
    pain: { title: painTitle!, items: painItems.map((text) => ({ text: text! })) },
    mechanism: { title: mechanismTitle!, description: mechanismDescription! },
    benefits: { title: benefitsTitle!, items: copy.benefits.items.map((item, index) => ({ icon: item.icon, title: benefits[index].title!, description: benefits[index].description! })) },
    faq: { title: faqTitle!, items: faq.map((item) => ({ question: item.question!, answer: item.answer! })) },
    cta: { headline: ctaHeadline!, subheadline: ctaSubheadline!, button_text: ctaButton! },
    ...(quiz ? { quiz } : {}),
  };
}

function filterQuizForPublicOutput(quiz: NonNullable<FunnelCopyOutput['quiz']>, track: ContentTrack): NonNullable<FunnelCopyOutput['quiz']> | null {
  const questions = quiz.questions.map((question) => ({
    text: filterPublicText(question.text, track),
    options: question.options.map((option) => ({ text: filterPublicText(option.text, track), score: option.score })),
  }));
  const results = quiz.results.map((result) => ({
    ...result,
    title: filterPublicText(result.title, track),
    description: filterPublicText(result.description, track),
    cta_text: filterPublicText(result.cta_text, track),
  }));
  if (questions.some((question) => question.text === null || question.options.some((option) => option.text === null))
    || results.some((result) => result.title === null || result.description === null || result.cta_text === null)) return null;

  return {
    questions: questions.map((question) => ({ text: question.text!, options: question.options.map((option) => ({ text: option.text!, score: option.score })) })),
    results: results.map((result) => ({ ...result, title: result.title!, description: result.description!, cta_text: result.cta_text! })),
  };
}

function buildSafeBaseFunnelCopy(input: FunnelCopyInput): FunnelCopyOutput {
  const base: FunnelCopyOutput = {
    hero: { headline: '从清晰的下一步开始', subheadline: '用实用信息了解适合自己的选择。', cta_text: '了解下一步' },
    pain: { title: '你可能正在遇到这些情况', items: [{ text: '不知道该先从哪里开始。' }, { text: '需要更清晰、可靠的信息。' }] },
    mechanism: { title: '从简单行动开始', description: '通过清晰步骤整理重点，再按自己的情况决定下一步。' },
    benefits: { title: '你会获得', items: [{ icon: 'heart', title: '清晰方向', description: '先了解当前最值得关注的重点。' }, { icon: 'check', title: '实用步骤', description: '用容易执行的小行动开始。' }] },
    faq: { title: '常见问题', items: [{ question: '适合谁？', answer: '适合希望先获得清晰信息，再决定下一步的人。' }] },
    cta: { headline: '准备好了解下一步了吗？', subheadline: '从一份简单说明开始。', button_text: '了解更多' },
  };
  return input.funnelType === 'quiz'
    ? { ...base, quiz: { questions: [{ text: '你目前最想了解什么？', options: [{ text: '从基础开始', score: 1 }, { text: '整理下一步', score: 2 }] }], results: [{ min_score: 0, max_score: 2, title: '你的下一步', description: '从清晰的信息和一个小行动开始。', cta_text: '查看说明' }] } }
    : base;
}

export const funnelCopyService = {
  async generate(user: AuthUser, input: FunnelCopyInput): Promise<{ copy: FunnelCopyOutput; tokensUsed: number; generatedByAi: boolean; degradedLabel?: string }> {
    const fallback = buildSafeBaseFunnelCopy(input);
    const platform = FUNNEL_PLATFORM[input.funnelType];
    const businessPack = getBusinessPackSlice({ track: input.track, platform });
    const context = await buildGenerationContext(user, {
      mode: input.track,
      platform,
      businessPack: {
        ...businessPack,
        promptContext: [businessPack.promptContext, FUNNEL_COPY_JSON_SYSTEM_INSTRUCTION].filter(Boolean).join('\n\n'),
      },
    });
    const options: RunGenerationOptions<FunnelCopyOutput> = {
      context,
      userMessage: buildUserPrompt(input),
      taskCategory: 'funnel_copy',
      feature: 'funnel_copy',
      fallback,
      parse: parseJSON,
      temperature: 0.8,
      maxTokens: 2_000,
    };
    let outcome = await runGeneration(user, options);
    let copy = filterFunnelForPublicOutput(outcome.value, input.track);
    let retries = 0;
    while (!copy && outcome.source === 'ai' && retries < MAX_COMPLIANCE_RETRIES) {
      retries += 1;
      outcome = await runGeneration(user, options);
      copy = filterFunnelForPublicOutput(outcome.value, input.track);
    }

    let generatedByAi = outcome.source === 'ai';
    let degradedLabel = outcome.status === 'degraded' ? outcome.userVisibleLabel : undefined;
    if (!copy) {
      copy = filterFunnelForPublicOutput(fallback, input.track) ?? buildSafeBaseFunnelCopy(input);
      generatedByAi = false;
      degradedLabel = GENERATION_DEGRADE_LABEL;
    }

    return {
      copy,
      tokensUsed: outcome.status === 'success' ? outcome.result.tokensIn + outcome.result.tokensOut : 0,
      generatedByAi,
      ...(degradedLabel ? { degradedLabel } : {}),
    };
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
    const sectionTypeMap: Record<string, string> = { hero: 'hero', pain: 'pain', mechanism: 'mechanism', benefits: 'benefits', faq: 'faq', cta: 'cta' };

    for (const [key, data] of Object.entries(generatedCopy)) {
      if (key === 'quiz') continue;
      const sectionType = sectionTypeMap[key];
      if (!sectionType || !data) continue;
      const idx = sections.findIndex((section) => section.type === sectionType);
      if (idx !== -1) sections[idx] = { ...sections[idx], ...data };
      else sections.push({ type: sectionType, ...data } as { type: string });
    }

    const updatedConfig = {
      ...config,
      sections,
      ...(generatedCopy.quiz && { quiz: { ...((config.quiz as object) ?? {}), ...generatedCopy.quiz } }),
    };
    return prisma.funnel.update({
      where: { id: funnelId },
      data: { config: updatedConfig as never, updatedAt: new Date() },
    });
  },
};

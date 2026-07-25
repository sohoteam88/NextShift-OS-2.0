import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { WebinarPackage } from './types';
import { generateFullWebinar } from './webinarGenerators';
import { validateWebinar } from './webinarValidator';
import { createHash } from 'node:crypto';
import { AppError } from '@/lib/errors';
import type { WorkspaceContext } from '@/modules/workspace/types';
import {
  buildGenerationContext,
  GENERATION_DEGRADE_LABEL,
  runGeneration,
} from '@/modules/ai/generation';
import { getBusinessPackSlice } from '@/modules/ai/business-pack';
import { enforceComplianceHardFilter } from '@/modules/ai/compliance';
import {
  buildWebinarUserMessage,
  parseGeneratedWebinar,
  WEBINAR_JSON_SYSTEM_INSTRUCTION,
} from './webinarPostGeneration';

function withIdentity(pkg: Omit<WebinarPackage, 'id' | 'createdAt' | 'updatedAt'> | WebinarPackage, now = new Date().toISOString()): WebinarPackage {
  if ('id' in pkg && typeof pkg.id === 'string' && pkg.id && pkg.createdAt && pkg.updatedAt) return pkg;
  const id = `webinar-${createHash('sha256').update(JSON.stringify(pkg)).digest('hex').slice(0, 20)}`;
  return { ...pkg, id, createdAt: now, updatedAt: now } as WebinarPackage;
}

async function withLockedUser<T>(userId: string, mutate: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`);
    if (locked.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    return mutate(tx);
  });
}

const MAX_COMPLIANCE_RETRIES = 2;

function resolveWorkspaceTrack(workspaceContext?: WorkspaceContext): 'retail' | 'recruitment' {
  return workspaceContext?.workspaceConfig.contentTrack === 'recruitment' ? 'recruitment' : 'retail';
}

/** Applies G4 to every public webinar copy destination before persistence. */
function filterWebinarForPublicOutput(pkg: WebinarPackage, track: 'retail' | 'recruitment'): WebinarPackage | null {
  let rejected = false;
  const text = (value: string) => {
    const verdict = enforceComplianceHardFilter({ fields: { title: '', hook: '', body: value, cta: '', hashtags: [] }, track });
    if (verdict.status === 'rejected') { rejected = true; return value; }
    return verdict.fields.body;
  };
  const texts = (values: string[]) => values.map(text);
  const next: WebinarPackage = {
    ...pkg,
    strategy: { ...pkg.strategy, targetAudience: text(pkg.strategy.targetAudience), desiredOutcome: text(pkg.strategy.desiredOutcome), trustBuildingAngle: text(pkg.strategy.trustBuildingAngle), authorityPositioning: text(pkg.strategy.authorityPositioning), conversionObjective: text(pkg.strategy.conversionObjective) },
    topic: { title: text(pkg.topic.title), promise: text(pkg.topic.promise), subtitle: text(pkg.topic.subtitle) },
    outline: { ...pkg.outline, opening: text(pkg.outline.opening), story: text(pkg.outline.story), problem: text(pkg.outline.problem), opportunity: text(pkg.outline.opportunity), framework: text(pkg.outline.framework), caseStudy: text(pkg.outline.caseStudy), offer: text(pkg.outline.offer), qa: text(pkg.outline.qa), cta: text(pkg.outline.cta), recommendedDuration: text(pkg.outline.recommendedDuration) },
    loomScript: text(pkg.loomScript),
    slideOutline: pkg.slideOutline.map((slide) => ({ ...slide, title: text(slide.title), objective: text(slide.objective), keyMessage: text(slide.keyMessage), suggestedVisual: text(slide.suggestedVisual) })),
    registrationPage: { ...pkg.registrationPage, headline: text(pkg.registrationPage.headline), subheadline: text(pkg.registrationPage.subheadline), bulletPoints: texts(pkg.registrationPage.bulletPoints), benefits: texts(pkg.registrationPage.benefits), cta: text(pkg.registrationPage.cta), urgency: text(pkg.registrationPage.urgency), faq: pkg.registrationPage.faq.map((faq) => ({ q: text(faq.q), a: text(faq.a) })) },
    replayPage: { ...pkg.replayPage, headline: text(pkg.replayPage.headline), summary: text(pkg.replayPage.summary), cta: text(pkg.replayPage.cta), deadline: text(pkg.replayPage.deadline) },
    followupSequence: pkg.followupSequence.map((followup) => ({ ...followup, label: text(followup.label), message: text(followup.message) })),
  };
  return rejected ? null : next;
}

function buildSafeBaseWebinar(pkg: WebinarPackage): WebinarPackage {
  return {
    ...pkg,
    strategy: { targetAudience: '希望建立清晰行动节奏的人', desiredOutcome: '整理适合自己的下一步行动', trustBuildingAngle: '真实经验与可执行步骤', authorityPositioning: '行动与个人品牌引导者', conversionObjective: '了解下一步支持方式' },
    topic: { title: '用 AI 整理个人品牌行动路径', promise: '用清晰步骤整理适合自己的下一步。', subtitle: '从理解现状开始，建立可持续的行动节奏。' },
    outline: { opening: '欢迎参加这场行动路径分享。', story: '今天会分享一套清晰、可调整的行动方法。', problem: '很多人知道想行动，却不确定从哪里开始。', opportunity: '合适的工具可以帮助我们整理信息和保持节奏。', framework: '三步方法：明确重点、完成小行动、定期回顾。', caseStudy: '用真实观察说明小行动如何帮助人们建立节奏。', offer: '如需支持，可以进一步了解适合自己的下一步。', qa: '现在可以提出你关心的问题。', cta: '点击下方链接领取行动资料。', recommendedDuration: '45 分钟' },
    loomScript: '【开场】欢迎参加这场分享。\n\n【重点】我们会用三个步骤整理行动路径：明确重点、完成小行动、定期回顾。\n\n【下一步】领取资料后，选择一个适合自己的小行动。',
    slideOutline: pkg.slideOutline.map((slide, index) => ({ ...slide, title: `行动步骤 ${index + 1}`, objective: '帮助观众理解并完成一个小行动', keyMessage: '从清晰的小行动开始，慢慢建立自己的节奏。', suggestedVisual: '简单步骤图' })),
    registrationPage: { ...pkg.registrationPage, headline: '用 AI 整理个人品牌行动路径', subheadline: '领取一套清晰、可执行的行动步骤。', bulletPoints: ['明确当前重点', '完成一个小行动', '建立回顾节奏'], benefits: ['获得清晰方向', '更容易开始行动'], cta: '立即注册', urgency: '注册后将收到讲座链接。', faq: [{ q: '什么时候开始？', a: '注册后会收到具体时间和链接。' }, { q: '适合谁？', a: '适合希望整理下一步行动的人。' }, { q: '需要准备什么？', a: '准备纸笔记录你的想法即可。' }] },
    replayPage: { headline: '讲座回放', summary: '回顾清晰行动路径的三个步骤。', cta: '领取行动资料', deadline: '请在方便时完成观看。' },
    followupSequence: pkg.followupSequence.map((followup, index) => ({ ...followup, label: `行动提醒 ${index + 1}`, message: '谢谢你的关注。选择一个小行动，并在方便时记录你的发现。' })),
  };
}

export const webinarService = {
  async generate(userId: string, tenantId: string, workspaceContext?: WorkspaceContext): Promise<WebinarPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const fallback = generateFullWebinar(ctx);
    const mode = resolveWorkspaceTrack(workspaceContext);
    const user = { id: userId, tenantId };
    const platform = 'blog' as const;
    const businessPack = getBusinessPackSlice({ track: mode, platform });
    const context = await buildGenerationContext(user, {
      mode,
      platform,
      businessPack: { ...businessPack, promptContext: [businessPack.promptContext, WEBINAR_JSON_SYSTEM_INSTRUCTION].filter(Boolean).join('\n\n') },
    });
    const options = {
      context,
      userMessage: buildWebinarUserMessage({ fallback, mode }),
      taskCategory: 'content_generation' as const,
      feature: 'webinar_center_generation',
      fallback,
      parse: (text: string) => parseGeneratedWebinar(text, fallback),
      temperature: 0.7,
      maxTokens: 3_000,
    };
    let outcome = await runGeneration(user, options);
    let pkg = filterWebinarForPublicOutput(outcome.value, mode);
    let retries = 0;
    while (!pkg && outcome.source === 'ai' && retries < MAX_COMPLIANCE_RETRIES) {
      retries += 1;
      outcome = await runGeneration(user, options);
      pkg = filterWebinarForPublicOutput(outcome.value, mode);
    }
    let generatedByAi = outcome.source === 'ai';
    let degradedLabel = outcome.status === 'degraded' ? outcome.userVisibleLabel : undefined;
    if (!pkg) {
      pkg = filterWebinarForPublicOutput(fallback, mode)
        ?? filterWebinarForPublicOutput(buildSafeBaseWebinar(fallback), mode)!;
      generatedByAi = false;
      degradedLabel = GENERATION_DEGRADE_LABEL;
    }
    pkg = { ...pkg, generatedByAi, ...(degradedLabel ? { degradedLabel } : {}) };
    pkg.qualityScore = validateWebinar(pkg).score;
    await this.save(userId, pkg);
    return pkg;
  },
  async save(userId: string, pkg: WebinarPackage) {
    const json = JSON.stringify(pkg);
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE "users" SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{webinar}', ${json}::jsonb, true), "updated_at" = NOW() WHERE "id" = ${userId}::uuid RETURNING "id"`);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    });
    return pkg;
  },
  async get(userId: string): Promise<WebinarPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true, updatedAt: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const w = meta.webinar;
    if (!w || typeof w !== 'object') return null;
    const normalized = withIdentity(w as WebinarPackage, user?.updatedAt?.toISOString() ?? new Date(0).toISOString());
    if (!('id' in w) || !('createdAt' in w) || !('updatedAt' in w)) await this.save(userId, normalized);
    return normalized;
  },
  async update(userId: string, id: string, patch: { title?: string; promise?: string; subtitle?: string; loomScript?: string; registrationHeadline?: string; registrationCta?: string }) {
    return withLockedUser(userId, async (tx) => {
      // Compute the patch only after acquiring the user-row lock. Disjoint
      // patches merge against the latest committed package; same-field writes
      // follow explicit serialized last-committer-wins semantics.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });
      const metadata = (user?.metadata as Record<string, unknown>) ?? {};
      const current =
        metadata.webinar && typeof metadata.webinar === 'object'
          ? (metadata.webinar as WebinarPackage)
          : null;
      if (!current || current.id !== id) {
        throw new AppError('NOT_FOUND', 404, 'Webinar not found');
      }

      const next: WebinarPackage = {
        ...current,
        topic: {
          ...current.topic,
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.promise !== undefined ? { promise: patch.promise } : {}),
          ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle } : {}),
        },
        ...(patch.loomScript !== undefined
          ? { loomScript: patch.loomScript }
          : {}),
        registrationPage: {
          ...current.registrationPage,
          ...(patch.registrationHeadline !== undefined
            ? { headline: patch.registrationHeadline }
            : {}),
          ...(patch.registrationCta !== undefined
            ? { cta: patch.registrationCta }
            : {}),
        },
        updatedAt: new Date().toISOString(),
        status: 'saved',
      };
      const json = JSON.stringify(next);
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "users" SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{webinar}', ${json}::jsonb, true), "updated_at" = NOW()
        WHERE "id" = ${userId}::uuid AND "metadata" #>> '{webinar,id}' = ${id}
        RETURNING "id"
      `);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'Webinar not found');
      return next;
    });
  },
  async delete(userId: string, id: string) {
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE "users" SET "metadata" = COALESCE("metadata", '{}'::jsonb) - 'webinar', "updated_at" = NOW() WHERE "id" = ${userId}::uuid AND "metadata" #>> '{webinar,id}' = ${id} RETURNING "id"`);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'Webinar not found');
    });
    return { deleted: true };
  },
  async getContext(userId: string) { const pkg = await this.get(userId); if (!pkg) return null; return { title: pkg.topic.title, promise: pkg.topic.promise, audience: pkg.strategy.targetAudience, CTA: pkg.outline.cta, outline: pkg.outline, offer: pkg.outline.offer }; },
};

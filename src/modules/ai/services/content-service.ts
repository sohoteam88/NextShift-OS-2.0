import { Prisma } from '@prisma/client';
import type { ContentRecordPatchPlatform } from '@/lib/content-platforms';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getRouterForTenant } from '../router';
import { templateService } from './template-service';
import { resolveVariables, buildPrompt } from '../prompt/resolver';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';

export interface ContentGenerateInput {
  templateId?: string;
  topic: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'xiaohongshu' | 'whatsapp';
  tone?: 'educational' | 'inspirational' | 'personal' | 'professional';
  language?: 'zh' | 'en' | 'ms';
  additionalContext?: string;
}

const LANGUAGE_LABEL: Record<'zh' | 'en' | 'ms', string> = {
  zh: 'Chinese',
  en: 'English',
  ms: 'Bahasa Malaysia',
};

function normalizeTemplateVariables(variables: unknown): string[] {
  return Array.isArray(variables) ? variables.map((value) => String(value)) : [];
}

function readJsonString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function pickTemplate(
  templates: Awaited<ReturnType<typeof templateService.list>>,
  language: 'zh' | 'en' | 'ms',
) {
  return (
    templates.find((template) => template.language === language && template.isDefault) ??
    templates.find((template) => template.language === language) ??
    templates.find((template) => template.isDefault) ??
    templates[0] ??
    null
  );
}

export const contentService = {
  async generate(user: AuthUser, input: ContentGenerateInput) {
    await enforceQuota(user.tenantId);

    const language = input.language ?? (user.preferredLanguage as 'zh' | 'en' | 'ms') ?? 'zh';

    const template = input.templateId
      ? await templateService.getById(user.tenantId, input.templateId)
      : pickTemplate(await templateService.list(user.tenantId, 'content'), language);

    if (!template) {
      throw new AppError(
        'NOT_FOUND',
        404,
        'No content template found. Ask your operator to create one.',
      );
    }

    const userInput: Record<string, string> = {
      topic: input.topic,
      platform: input.platform,
      tone: input.tone ?? 'educational',
      language,
      ...(input.additionalContext ? { additional_context: input.additionalContext } : {}),
    };

    const variables = await resolveVariables(normalizeTemplateVariables(template.variables), {
      userId: user.id,
      tenantId: user.tenantId,
      userInput,
    });

    const systemPrompt = buildPrompt(template.systemPrompt, variables);
    const userMessage = buildPrompt(template.userPromptTemplate, variables);
    const langInstruction = `\n\nRespond entirely in ${LANGUAGE_LABEL[language]}.`;

    const router = await getRouterForTenant(user.tenantId);
    const result = await router.generate(
      {
        systemPrompt: systemPrompt + langInstruction,
        userMessage,
        temperature: 0.8,
        maxTokens: 1024,
      },
      'content_generation',
    );

    let finalResult = result;
    const validation = validateAIOutput(result.text);
    if (!validation.valid) {
      const retryResult = await router.generate(
        {
          systemPrompt:
            systemPrompt +
            langInstruction +
            '\n\nIMPORTANT: Do NOT mention any income amounts, money guarantees, or health cure claims.',
          userMessage,
          temperature: 0.5,
          maxTokens: 1024,
        },
        'content_generation',
      );
      finalResult = {
        ...retryResult,
        tokensIn: result.tokensIn + retryResult.tokensIn,
        tokensOut: result.tokensOut + retryResult.tokensOut,
        durationMs: result.durationMs + retryResult.durationMs,
      };
    }

    try { const { trackAIContentGenerated } = await import('@/lib/telemetry/tracker'); trackAIContentGenerated(user.id, { feature: 'content', provider: result.provider, model: result.model, tokens: result.tokensIn + result.tokensOut, cost: 0 }); } catch {}

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      templateId: template.id,
      feature: 'content_generator',
      result: finalResult,
      routing: finalResult.routing,
    });

    return {
      content: finalResult.text,
      platform: input.platform,
      language,
      tokensUsed: finalResult.tokensIn + finalResult.tokensOut,
      provider: finalResult.provider,
      model: finalResult.model,
      templateId: template.id,
      templateName: template.name,
    };
  },

  async saveContent(
    user: AuthUser,
    data: {
      content: string;
      platform: string;
      title?: string;
      status?: 'draft' | 'published';
      language?: 'zh' | 'en' | 'ms';
      promptUsed?: string;
    },
  ) {
    const dataPayload = {
        tenantId: user.tenantId,
        ownerId: user.id,
        type: 'post',
        platform: data.platform,
        title: data.title ?? null,
        body: data.content,
        status: data.status ?? 'draft',
        language: data.language ?? user.preferredLanguage,
        generatedByAi: true,
        promptUsed: data.promptUsed ?? null,
      } satisfies Prisma.ContentUncheckedCreateInput;

    return prisma.content.create({
      data: dataPayload,
    });
  },

  async listSavedContent(
    user: AuthUser,
    opts: { page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
    const skip = (page - 1) * limit;

    const where = user.role === 'operator' || user.role === 'platform_admin'
      ? { tenantId: user.tenantId }
      : { tenantId: user.tenantId, ownerId: user.id };

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.content.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getById(user: AuthUser, id: string) {
    const content = await prisma.content.findFirst({
      where:
        user.role === 'operator' || user.role === 'platform_admin'
          ? { id, tenantId: user.tenantId }
          : { id, tenantId: user.tenantId, ownerId: user.id },
    });

    if (!content) {
      throw new AppError('NOT_FOUND', 404, 'Content not found');
    }

    return content;
  },

  async update(
    user: AuthUser,
    id: string,
    data: {
      content?: string;
      title?: string;
      status?: 'draft' | 'published';
      platform?: ContentRecordPatchPlatform;
    },
  ) {
    const existing = await this.getById(user, id);

    return prisma.content.update({
      where: { id: existing.id },
      data: {
        ...(data.content !== undefined ? { body: data.content } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.platform !== undefined ? { platform: data.platform } : {}),
      },
    });
  },

  async delete(user: AuthUser, id: string) {
    const existing = await this.getById(user, id);
    await prisma.content.delete({ where: { id: existing.id } });
    return { deleted: true };
  },
};

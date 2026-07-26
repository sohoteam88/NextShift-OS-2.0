import { Prisma } from '@prisma/client';
import type { ContentRecordPatchPlatform } from '@/lib/content-platforms';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import {
  contentBodyPreview,
  contentDisplayTitle,
  contentHash,
  type ContentLibraryItem,
  type ContentLibraryListItem,
  type ContentLibraryListQuery,
} from '@/lib/content-library-contracts';
import { getRouterForTenant } from '../router';
import { templateService } from './template-service';
import { resolveVariables, buildPrompt } from '../prompt/resolver';
import { validateAIOutput } from '../prompt/validator';
import { logAIUsage } from '../usage/tracker';
import { enforceQuota } from '../usage/quota';

const CONTENT_SAFE_SELECT = {
  id: true,
  title: true,
  body: true,
  platform: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContentSelect;

type ContentSafeRow = Prisma.ContentGetPayload<{ select: typeof CONTENT_SAFE_SELECT }>;

function isTenantContentManager(user: AuthUser) {
  return user.role === 'operator' || user.role === 'platform_admin';
}

function ownershipWhere(user: AuthUser): Prisma.ContentWhereInput {
  return isTenantContentManager(user)
    ? { tenantId: user.tenantId }
    : { tenantId: user.tenantId, ownerId: user.id };
}

function toContentItem(row: ContentSafeRow): ContentLibraryItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    platform: row.platform,
    type: row.type,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toContentListItem(row: ContentSafeRow, isDuplicate: boolean): ContentLibraryListItem {
  return {
    id: row.id,
    title: row.title,
    displayTitle: contentDisplayTitle(row.title, row.type, row.id),
    platform: row.platform,
    type: row.type,
    status: row.status,
    preview: contentBodyPreview(row.body),
    contentHash: contentHash(row.title, row.body),
    isDuplicate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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

    const content = await prisma.content.create({
      data: dataPayload,
      select: CONTENT_SAFE_SELECT,
    });
    return toContentItem(content);
  },

  async listSavedContent(
    user: AuthUser,
    opts: ContentLibraryListQuery,
  ) {
    const { page, limit } = opts;
    const skip = (page - 1) * limit;
    const where: Prisma.ContentWhereInput = {
      ...ownershipWhere(user),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.platform ? { platform: opts.platform } : {}),
    };

    const [items, total, draftRows] = await Promise.all([
      prisma.content.findMany({
        where,
        select: CONTENT_SAFE_SELECT,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.content.count({ where }),
      prisma.content.findMany({
        where: { ...ownershipWhere(user), status: 'draft' },
        select: {
          id: true,
          ownerId: true,
          title: true,
          body: true,
        },
      }),
    ]);

    const draftHashCounts = new Map<string, number>();
    for (const row of draftRows) {
      const key = `${row.ownerId}\u001f${contentHash(row.title, row.body)}`;
      draftHashCounts.set(key, (draftHashCounts.get(key) ?? 0) + 1);
    }

    const duplicateDraftIds = new Set(
      draftRows
        .filter((row) => draftHashCounts.get(`${row.ownerId}\u001f${contentHash(row.title, row.body)}`)! > 1)
        .map((row) => row.id),
    );

    return {
      items: items.map((item) => toContentListItem(
        item,
        item.status === 'draft' && duplicateDraftIds.has(item.id),
      )),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(user: AuthUser, id: string) {
    const content = await prisma.content.findFirst({
      where: { id, ...ownershipWhere(user) },
      select: CONTENT_SAFE_SELECT,
    });

    if (!content) {
      throw new AppError('NOT_FOUND', 404, 'Content not found');
    }

    return toContentItem(content);
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

    const content = await prisma.content.update({
      where: { id: existing.id },
      data: {
        ...(data.content !== undefined ? { body: data.content } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.platform !== undefined ? { platform: data.platform } : {}),
      },
      select: CONTENT_SAFE_SELECT,
    });
    return toContentItem(content);
  },

  async delete(user: AuthUser, id: string) {
    const existing = await this.getById(user, id);
    await prisma.content.delete({ where: { id: existing.id } });
    return { id: existing.id, deleted: true };
  },
};

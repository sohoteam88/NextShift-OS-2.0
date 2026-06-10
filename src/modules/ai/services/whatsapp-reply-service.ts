import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import prisma from '@/lib/prisma';
import { getRouterForTenant } from '../router';
import { templateService } from './template-service';
import { resolveVariables, buildPrompt } from '../prompt/resolver';
import { validateAIOutput } from '../prompt/validator';
import { enforceQuota } from '../usage/quota';
import { logAIUsage } from '../usage/tracker';
import { logActivity } from '@/modules/crm/services/activity-service';

export interface WhatsAppReplyInput {
  leadId: string;
  messageContext: string;
  language?: 'zh' | 'en' | 'ms';
}

type ReplyItem = { label: string; text: string };

function normalizeVariables(variables: unknown): string[] {
  return Array.isArray(variables) ? variables.map((value) => String(value)) : [];
}

function extractJsonArray(text: string): ReplyItem[] {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        label: typeof (item as Record<string, unknown>).label === 'string'
          ? String((item as Record<string, unknown>).label)
          : '',
        text: typeof (item as Record<string, unknown>).text === 'string'
          ? String((item as Record<string, unknown>).text)
          : '',
      }))
      .filter((item) => item.label && item.text);
  } catch {
    return [];
  }
}

function ensureThreeReplies(replies: ReplyItem[]): ReplyItem[] {
  const fallback: ReplyItem[] = [
    { label: '简短回复', text: '收到，我先了解一下，再给你更合适的建议。' },
    { label: '标准回复', text: '收到你的信息了，我先帮你整理一下重点，再给你一个更合适的建议。' },
    { label: '详细回复', text: '谢谢你分享这些信息。我先整理一下你的情况，再给你一个更适合当前阶段的建议。' },
  ];
  const merged = [...replies];
  for (const option of fallback) {
    if (merged.length >= 3) break;
    merged.push(option);
  }
  return merged.slice(0, 3);
}

export const whatsappReplyService = {
  async suggest(user: AuthUser, input: WhatsAppReplyInput) {
    await enforceQuota(user.tenantId);

    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, tenantId: user.tenantId },
      include: {
        notes: { orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!lead) {
      throw new AppError('NOT_FOUND', 404, 'Lead not found');
    }

    const template = (
      await templateService.list(user.tenantId, 'whatsapp_reply')
    ).find((item) => item.language === (input.language ?? user.preferredLanguage) && item.isDefault)
      ?? (await templateService.list(user.tenantId, 'whatsapp_reply')).find((item) => item.isDefault)
      ?? (await templateService.list(user.tenantId, 'whatsapp_reply'))[0]
      ?? null;

    if (!template) {
      throw new AppError('NOT_FOUND', 404, 'No WhatsApp reply template found. Ask your operator to create one.');
    }

    const variables = await resolveVariables(normalizeVariables(template.variables), {
      userId: user.id,
      tenantId: user.tenantId,
      leadId: lead.id,
      userInput: {
        message_context: input.messageContext,
      },
    });

    const leadContext = [
      `Lead name: ${lead.name}`,
      `Stage: ${lead.pipelineStage}`,
      `Score: ${lead.score}`,
      `Source: ${lead.source ?? ''}`,
      `Notes: ${[lead.notesText ?? '', ...lead.notes.map((note) => note.content)].filter(Boolean).join('\n')}`,
      `Conversation context: ${input.messageContext}`,
    ].join('\n');

    const systemPrompt = buildPrompt(template.systemPrompt, variables);
    const userMessage = `${buildPrompt(template.userPromptTemplate, variables)}\n\nAdditional lead context:\n${leadContext}`;
    const language = input.language ?? (user.preferredLanguage as 'zh' | 'en' | 'ms') ?? 'zh';
    const languageLabel: Record<'zh' | 'en' | 'ms', string> = {
      zh: 'Chinese',
      en: 'English',
      ms: 'Bahasa Malaysia',
    };

    const router = await getRouterForTenant(user.tenantId);
    const result = await router.generate(
      {
        systemPrompt: `${systemPrompt}\n\nRespond entirely in ${languageLabel[language]}.`,
        userMessage,
        temperature: 0.6,
        maxTokens: 1024,
      },
      'whatsapp_reply',
    );

    let replies = extractJsonArray(result.text);
    const validation = validateAIOutput(result.text);
    if (!validation.valid || replies.length === 0) {
      const retry = await router.generate(
        {
          systemPrompt:
            `${systemPrompt}\n\nRespond entirely in ${languageLabel[language]}.` +
            '\n\nIMPORTANT: Return exactly a JSON array with 3 objects using labels: 简短回复, 标准回复, 详细回复. Do not include markdown fences.',
          userMessage,
          temperature: 0.4,
          maxTokens: 1024,
        },
        'whatsapp_reply',
      );
      replies = extractJsonArray(retry.text);
      result.text = retry.text;
      result.tokensIn += retry.tokensIn;
      result.tokensOut += retry.tokensOut;
      result.durationMs += retry.durationMs;
    }

    replies = ensureThreeReplies(replies);

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      templateId: template.id,
      feature: 'whatsapp_reply',
      result,
      routing: result.routing,
    });

    return {
      replies,
      leadContext: {
        name: lead.name,
        stage: lead.pipelineStage,
        score: lead.score,
      },
      tokensUsed: result.tokensIn + result.tokensOut,
      provider: result.provider,
      model: result.model,
      templateId: template.id,
      templateName: template.name,
    };
  },
};

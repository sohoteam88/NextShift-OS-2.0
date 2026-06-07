import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { apiHandler } from '@/lib/api-handler';
import { templateService } from '@/modules/ai/services/template-service';
import { resolveVariables, buildPrompt } from '@/modules/ai/prompt/resolver';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { getProvider } from '@/modules/ai/providers/factory';
import { logAIUsage } from '@/modules/ai/usage/tracker';

const StreamSchema = z.object({
  topic: z.string().min(1),
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'xiaohongshu', 'whatsapp']),
  tone: z.enum(['educational', 'inspirational', 'personal', 'professional']).optional(),
  language: z.enum(['zh', 'en', 'ms']).optional(),
  templateId: z.string().uuid().optional(),
  additionalContext: z.string().optional(),
});

const LANGUAGE_LABEL: Record<'zh' | 'en' | 'ms', string> = {
  zh: 'Chinese',
  en: 'English',
  ms: 'Bahasa Malaysia',
};

function normalizeTemplateVariables(variables: unknown): string[] {
  return Array.isArray(variables) ? variables.map((value) => String(value)) : [];
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

function resolveModelName(modelPreference: string | null | undefined, providerName: string) {
  if (providerName === 'openai') return 'gpt-4o';
  if (providerName === 'anthropic') return 'claude-sonnet-4-20250514';
  if (modelPreference === 'openai') return 'gpt-4o';
  return 'claude-sonnet-4-20250514';
}

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = StreamSchema.parse(body);

  await enforceQuota(user.tenantId);

  const language = input.language ?? (user.preferredLanguage as 'zh' | 'en' | 'ms') ?? 'zh';
  const template = input.templateId
    ? await templateService.getById(user.tenantId, input.templateId)
    : pickTemplate(await templateService.list(user.tenantId, 'content'), language);

  if (!template) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'No content template found.' } },
      { status: 404 },
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
  const provider = getProvider(template.modelPreference as 'anthropic' | 'openai' | undefined);
  const startedAt = Date.now();
  const chunks: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const generator = provider.generateStream({
          systemPrompt: systemPrompt + langInstruction,
          userMessage,
          temperature: 0.8,
          maxTokens: 1024,
        });

        for await (const chunk of generator) {
          chunks.push(chunk.text);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }

        const text = chunks.join('');
        const tokensIn = Math.ceil((systemPrompt.length + userMessage.length) / 4);
        const tokensOut = Math.ceil(text.length / 4);
        await logAIUsage({
          tenantId: user.tenantId,
          userId: user.id,
          templateId: template.id,
          feature: 'content_generator',
          result: {
            text,
            tokensIn,
            tokensOut,
            model: resolveModelName(template.modelPreference, provider.name),
            provider: provider.name,
            durationMs: Date.now() - startedAt,
          },
        });

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
});

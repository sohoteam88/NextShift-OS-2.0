import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import prisma from '@/lib/prisma';
import { generateWithFallback } from '../providers/factory';
import { templateService } from './template-service';
import { resolveVariables, buildPrompt } from '../prompt/resolver';
import { validateAIOutput } from '../prompt/validator';
import { enforceQuota } from '../usage/quota';
import { logAIUsage } from '../usage/tracker';

export interface LeadAnalysisInput {
  leadId: string;
  language?: 'zh' | 'en' | 'ms';
}

type AnalysisResult = {
  summary: string;
  engagement_level: 'high' | 'medium' | 'low';
  next_best_action: string;
  talking_points: string[];
  risk_factors: string[];
  estimated_conversion_likelihood: 'high' | 'medium' | 'low';
  recommended_followup_days: number;
};

function normalizeVariables(variables: unknown): string[] {
  return Array.isArray(variables) ? variables.map((value) => String(value)) : [];
}

function extractJsonObject(text: string): AnalysisResult | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<AnalysisResult>;
    if (
      typeof parsed.summary !== 'string' ||
      !['high', 'medium', 'low'].includes(String(parsed.engagement_level)) ||
      typeof parsed.next_best_action !== 'string' ||
      !Array.isArray(parsed.talking_points) ||
      !Array.isArray(parsed.risk_factors) ||
      !['high', 'medium', 'low'].includes(String(parsed.estimated_conversion_likelihood)) ||
      typeof parsed.recommended_followup_days !== 'number'
    ) {
      return null;
    }
    return {
      summary: parsed.summary,
      engagement_level: parsed.engagement_level as AnalysisResult['engagement_level'],
      next_best_action: parsed.next_best_action,
      talking_points: parsed.talking_points.map(String),
      risk_factors: parsed.risk_factors.map(String),
      estimated_conversion_likelihood:
        parsed.estimated_conversion_likelihood as AnalysisResult['estimated_conversion_likelihood'],
      recommended_followup_days: parsed.recommended_followup_days,
    };
  } catch {
    return null;
  }
}

function buildLeadContext(lead: {
  name: string;
  source: string | null;
  pipelineStage: string;
  score: number;
  notesText: string | null;
  tags: Array<{ tag: { name: string } }>;
  notes: Array<{ content: string; createdAt: Date }>;
  activities: Array<{ type: string; description: string; createdAt: Date }>;
}) {
  return JSON.stringify(
    {
      name: lead.name,
      source: lead.source,
      stage: lead.pipelineStage,
      score: lead.score,
      tags: lead.tags.map((item) => item.tag.name),
      notes: [
        lead.notesText ?? '',
        ...lead.notes.map((note) => note.content),
      ].filter(Boolean),
      recent_activities: lead.activities.map((activity) => ({
        type: activity.type,
        description: activity.description,
        created_at: activity.createdAt.toISOString(),
      })),
    },
    null,
    2,
  );
}

export const leadAnalysisService = {
  async analyze(user: AuthUser, input: LeadAnalysisInput) {
    await enforceQuota(user.tenantId);

    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, tenantId: user.tenantId },
      include: {
        tags: { include: { tag: true } },
        notes: { orderBy: { createdAt: 'desc' }, take: 10 },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!lead) {
      throw new AppError('NOT_FOUND', 404, 'Lead not found');
    }

    const template = (
      await templateService.list(user.tenantId, 'lead_analysis')
    ).find((item) => item.language === (input.language ?? user.preferredLanguage) && item.isDefault)
      ?? (await templateService.list(user.tenantId, 'lead_analysis')).find((item) => item.isDefault)
      ?? (await templateService.list(user.tenantId, 'lead_analysis'))[0]
      ?? null;

    if (!template) {
      throw new AppError('NOT_FOUND', 404, 'No lead analysis template found. Ask your operator to create one.');
    }

    const variables = await resolveVariables(normalizeVariables(template.variables), {
      userId: user.id,
      tenantId: user.tenantId,
      leadId: lead.id,
      userInput: {
        lead_context: buildLeadContext(lead),
      },
    });

    const language = input.language ?? (user.preferredLanguage as 'zh' | 'en' | 'ms') ?? 'zh';
    const languageLabel: Record<'zh' | 'en' | 'ms', string> = {
      zh: 'Chinese',
      en: 'English',
      ms: 'Bahasa Malaysia',
    };
    const systemPrompt = buildPrompt(template.systemPrompt, variables);
    const userMessage = `${buildPrompt(template.userPromptTemplate, variables)}\n\nAdditional lead context:\n${buildLeadContext(lead)}\n\nReturn valid JSON only.`;

    const result = await generateWithFallback(
      {
        systemPrompt: `${systemPrompt}\n\nRespond entirely in ${languageLabel[language]}.`,
        userMessage,
        temperature: 0.3,
        maxTokens: 1024,
      },
      template.modelPreference as 'anthropic' | 'openai' | undefined,
    );

    let analysis = extractJsonObject(result.text);
    const validation = validateAIOutput(result.text);
    if (!validation.valid || !analysis) {
      const retry = await generateWithFallback(
        {
          systemPrompt:
            `${systemPrompt}\n\nRespond entirely in ${languageLabel[language]}.` +
            '\n\nIMPORTANT: Return only raw JSON with keys summary, engagement_level, next_best_action, talking_points, risk_factors, estimated_conversion_likelihood, recommended_followup_days.',
          userMessage,
          temperature: 0.2,
          maxTokens: 1024,
        },
        template.modelPreference as 'anthropic' | 'openai' | undefined,
      );
      analysis = extractJsonObject(retry.text);
      result.text = retry.text;
      result.tokensIn += retry.tokensIn;
      result.tokensOut += retry.tokensOut;
      result.durationMs += retry.durationMs;
    }

    if (!analysis) {
      throw new AppError('INTERNAL_ERROR', 500, 'Failed to parse lead analysis');
    }

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      templateId: template.id,
      feature: 'lead_analysis',
      result,
    });

    return {
      ...analysis,
      tokensUsed: result.tokensIn + result.tokensOut,
      provider: result.provider,
      model: result.model,
      templateId: template.id,
      templateName: template.name,
      leadContext: {
        name: lead.name,
        stage: lead.pipelineStage,
        score: lead.score,
      },
    };
  },
};

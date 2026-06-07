import prisma from '@/lib/prisma';
import { sanitizePromptVariable } from './validator';

type ResolvedVariables = Record<string, string>;

function readSetting(settings: unknown, key: string): string {
  if (!settings || typeof settings !== 'object') return '';
  const value = (settings as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value == null) return '';
  return String(value);
}

export async function resolveVariables(
  variableNames: string[],
  context: {
    userId: string;
    tenantId: string;
    leadId?: string;
    userInput?: Record<string, string>;
  },
): Promise<ResolvedVariables> {
  const resolved: ResolvedVariables = {};
  const requested = new Set(variableNames);

  let userData:
    | {
        name: string;
        bio: string | null;
        metadata: unknown;
      }
    | null = null;

  if ([...requested].some((name) => ['user_name', 'specialty', 'bio'].includes(name))) {
    userData = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { name: true, bio: true, metadata: true },
    });
  }

  let leadData:
    | {
        name: string;
        phone: string | null;
        source: string | null;
        pipelineStage: string;
        score: number;
        notesText: string | null;
        notes: Array<{ content: string }>;
      }
    | null = null;

  if (
    context.leadId &&
    [...requested].some((name) =>
      ['lead_name', 'lead_phone', 'lead_source', 'lead_stage', 'lead_score', 'lead_notes'].includes(name),
    )
  ) {
    leadData = await prisma.lead.findUnique({
      where: { id: context.leadId },
      select: {
        name: true,
        phone: true,
        source: true,
        pipelineStage: true,
        score: true,
        notesText: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { content: true },
        },
      },
    });
  }

  let tenantData:
    | {
        name: string;
        settings: unknown;
      }
    | null = null;

  if ([...requested].some((name) => ['target_audience', 'tenant_name'].includes(name))) {
    tenantData = await prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: { name: true, settings: true },
    });
  }

  for (const name of variableNames) {
    let value = '';

    if (context.userInput && Object.prototype.hasOwnProperty.call(context.userInput, name)) {
      value = toStringValue(context.userInput[name]);
    } else if (name === 'user_name' && userData) {
      value = userData.name;
    } else if (name === 'specialty' && userData) {
      const metadata = userData.metadata as Record<string, unknown> | null;
      value = toStringValue(metadata?.specialty ?? userData.bio ?? '');
    } else if (name === 'bio' && userData) {
      value = userData.bio ?? '';
    } else if (name === 'tenant_name' && tenantData) {
      value = tenantData.name;
    } else if (name === 'target_audience' && tenantData) {
      value =
        readSetting(tenantData.settings, 'target_audience') ||
        readSetting(
          tenantData.settings && typeof tenantData.settings === 'object'
            ? (tenantData.settings as Record<string, unknown>).ai
            : null,
          'target_audience',
        );
    } else if (name === 'lead_name' && leadData) {
      value = leadData.name;
    } else if (name === 'lead_phone' && leadData) {
      value = leadData.phone ?? '';
    } else if (name === 'lead_source' && leadData) {
      value = leadData.source ?? '';
    } else if (name === 'lead_stage' && leadData) {
      value = leadData.pipelineStage;
    } else if (name === 'lead_score' && leadData) {
      value = String(leadData.score);
    } else if (name === 'lead_notes' && leadData) {
      const notes = [
        leadData.notesText ?? '',
        ...leadData.notes.map((note) => note.content),
      ].filter(Boolean);
      value = notes.join('\n');
    }

    resolved[name] = sanitizePromptVariable(value);
  }

  return resolved;
}

export function buildPrompt(template: string, variables: ResolvedVariables): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{${key}}`, value);
  }

  return result;
}

import { AppError, Errors } from '@/lib/errors';
import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import {
  AI_DISCUSSION_FLAG,
  isRuntimeFlagEnabled,
} from '@/lib/runtime-flags';
import { getRouterForTenant } from '@/modules/ai/router';
import type { TaskCategory } from '@/modules/ai/router/task-classifier';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { logAIUsage } from '@/modules/ai/usage/tracker';
import type { BusinessContextProjection } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import { businessMemoryEventStore } from '@/modules/business-context-memory/services/business-memory-event-store';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import { getBusinessTwin } from '@/modules/business-twin/services/interview-brand-business-twin-repository';
import {
  DecisionContext,
  DecisionConversation,
  createDecisionEvidence,
  type ConversationEngine,
  type DecisionContextId,
  type DecisionConversationId,
  type DecisionEvidenceId,
} from '@nextshift/decision-brain';
import type { BusinessTwinSnapshot } from '@nextshift/contracts';
import type { BusinessId, TenantId, Timestamp } from '@nextshift/shared';
import {
  getCommandCenterRecommendation,
  type CommandCenterRecommendationResult,
  type CommandCenterRecommendationUser,
} from './recommendation-service';

export const DISCUSSION_TURNS_LIMIT = 5;
export const DISCUSSION_TASK_CATEGORY: TaskCategory = 'analytics_insight';

export const AI_DISCUSSION_SYSTEM_PROMPT = [
  'You are NextShift OS Business Discussion, a focused advisor for the current Command Center recommendation.',
  'Hard rules:',
  '1. Only discuss the current recommendation and the provided business context.',
  '2. If the user asks for unrelated topics, politely refuse and bring the conversation back to the current recommendation.',
  '3. Do not invent data, metrics, customer facts, revenue, costs, timelines, or system state.',
  '4. Use only the real numbers and facts present in the context.',
  '5. Keep the reply concise, practical, and action-oriented.',
  '6. Do not expose or request secrets, service role keys, API keys, tokens, cookies, headers, or credentials.',
].join('\n');

export type DiscussionTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type DiscussRecommendationInput = {
  message: string;
  history?: DiscussionTurn[];
};

export type DiscussRecommendationResult = {
  reply: string;
  turnsUsed: number;
  turnsLimit: number;
};

export type DiscussionServiceDependencies = {
  isEnabled?: () => boolean;
  getRecommendation?: typeof getCommandCenterRecommendation;
  conversationEngine?: ConversationEngine;
  getRouter?: typeof getRouterForTenant;
  enforceQuota?: typeof enforceQuota;
  logUsage?: typeof logAIUsage;
  getBusinessContext?: typeof businessContextMemoryService.getBusinessContext;
  getBusinessTwin?: typeof getBusinessTwin;
  appendMemoryEvent?: typeof businessMemoryEventStore.append;
  logFallback?: typeof runtimeFallbackLogger.warn;
  now?: () => Date;
  isOffTopic?: (message: string) => boolean;
};

export function isAiDiscussionEnabled(env: NodeJS.ProcessEnv = process.env) {
  return isRuntimeFlagEnabled(AI_DISCUSSION_FLAG, env);
}

export async function discussCommandCenterRecommendation(
  user: CommandCenterRecommendationUser,
  input: DiscussRecommendationInput,
  dependencies: DiscussionServiceDependencies = {},
): Promise<DiscussRecommendationResult | null> {
  const enabled = dependencies.isEnabled?.() ?? isAiDiscussionEnabled();
  if (!enabled) return null;

  const tenantId = requireDiscussionTenantId(user);
  const message = normalizeMessage(input.message);
  const history = normalizeHistory(input.history ?? []);
  const turnsUsed = countUserTurns(history) + 1;
  if (turnsUsed > DISCUSSION_TURNS_LIMIT) {
    throw new AppError(
      'TURNS_EXHAUSTED',
      429,
      'AI discussion turn limit exhausted.',
      {
        turnsUsed: turnsUsed - 1,
        turnsLimit: DISCUSSION_TURNS_LIMIT,
      },
    );
  }

  const recommendation = await (dependencies.getRecommendation ?? getCommandCenterRecommendation)(user);
  if (!recommendation) return null;

  const now = dependencies.now?.() ?? new Date();
  const observedAt = now.toISOString() as Timestamp;
  const businessTwin = await loadDiscussionBusinessTwin(user.id, tenantId, dependencies);
  const decisionContext = buildDiscussionDecisionContext(user, recommendation, observedAt, businessTwin);
  const conversationEngine = dependencies.conversationEngine ?? new RecommendationDiscussionEngine({
    message,
    history,
    recommendation,
    observedAt,
  });
  const conversation = conversationEngine.continueConversation(decisionContext)[0];
  const conversationSnapshot = conversation?.toSnapshot();

  if ((dependencies.isOffTopic ?? isClearlyOffTopic)(message)) {
    return {
      reply: buildOffTopicReply(recommendation),
      turnsUsed,
      turnsLimit: DISCUSSION_TURNS_LIMIT,
    };
  }

  const memory = await loadDiscussionMemory(user.id, tenantId, dependencies);
  await (dependencies.enforceQuota ?? enforceQuota)(tenantId);
  const router = await (dependencies.getRouter ?? getRouterForTenant)(tenantId);
  const routerResult = await router.generate(
    {
      systemPrompt: buildSystemPrompt(recommendation, conversationSnapshot, memory, businessTwin),
      userMessage: buildUserPrompt({
        message,
        history,
        recommendation,
        conversationSummary: conversationSnapshot?.summary,
      }),
      temperature: 0.4,
      maxTokens: 700,
    },
    DISCUSSION_TASK_CATEGORY,
  );

  await (dependencies.logUsage ?? logAIUsage)({
    tenantId,
    userId: user.id,
    feature: 'ai_discussion',
    result: routerResult,
    routing: routerResult.routing,
  });

  await recordDiscussionMemoryEvents({
    userId: user.id,
    tenantId,
    recommendation,
    turnsUsed,
    append: dependencies.appendMemoryEvent ?? businessMemoryEventStore.append,
    logFallback: dependencies.logFallback ?? runtimeFallbackLogger.warn,
  });

  return {
    reply: routerResult.text,
    turnsUsed,
    turnsLimit: DISCUSSION_TURNS_LIMIT,
  };
}

function requireDiscussionTenantId(user: CommandCenterRecommendationUser) {
  if (!user.tenantId) {
    throw Errors.FORBIDDEN;
  }

  return user.tenantId;
}

class RecommendationDiscussionEngine implements ConversationEngine {
  constructor(private readonly input: {
    message: string;
    history: DiscussionTurn[];
    recommendation: CommandCenterRecommendationResult;
    observedAt: Timestamp;
  }) {}

  continueConversation(context: DecisionContext) {
    const recommendation = this.input.recommendation.recommendation;
    return Object.freeze([
      DecisionConversation.create({
        decisionConversationId: `discussion-${recommendation.id}` as DecisionConversationId,
        decisionContextId: context.decisionContextId,
        conversationType: 'Advisory',
        title: `Discuss: ${recommendation.title}`,
        summary: [
          `Recommendation: ${recommendation.title}`,
          `Source: ${this.input.recommendation.source}`,
          `Confidence: ${formatPercent(this.input.recommendation.confidence)}`,
        ].join(' | '),
        latestMessage: this.input.message,
        messageCount: this.input.history.length + 1,
        createdAt: this.input.observedAt,
        updatedAt: this.input.observedAt,
      }),
    ]);
  }
}

function buildDiscussionDecisionContext(
  user: CommandCenterRecommendationUser,
  recommendation: CommandCenterRecommendationResult,
  observedAt: Timestamp,
  businessTwin?: BusinessTwinSnapshot | null,
) {
  const tenantId = (user.tenantId ?? user.id) as TenantId;
  const businessId = `business-${user.tenantId ?? user.id}` as BusinessId;
  const decisionContextId = `discussion-${user.id}-${recommendation.recommendation.id}` as DecisionContextId;
  const businessContext: BusinessTwinSnapshot = {
    businessId,
    tenant: { tenantId },
    version: 1,
    capturedAt: observedAt,
    ...(businessTwin?.identity ? { identity: businessTwin.identity } : {}),
    ...(businessTwin?.brand ? { brand: businessTwin.brand } : {}),
    understanding: {
      executiveSummary: [
        `Current recommendation: ${recommendation.recommendation.title}`,
        `Summary: ${recommendation.recommendation.summary}`,
        `Source: ${recommendation.source}`,
        `Confidence: ${formatPercent(recommendation.confidence)}`,
      ].join(' | '),
      strengths: [],
      weaknesses: [],
      opportunities: [recommendation.recommendation.summary],
      missingInformation: [],
      contradictions: [],
      confidence: clampUnit(recommendation.confidence),
    },
  };

  return DecisionContext.create({
    decisionContextId,
    businessId,
    tenant: { tenantId },
    businessContext,
    objective: `Discuss the current recommendation: ${recommendation.recommendation.title}`,
    evidence: [
      createDecisionEvidence({
        evidenceId: 'current-command-center-recommendation' as DecisionEvidenceId,
        source: `command-center-${recommendation.source}`,
        summary: recommendation.explain,
        confidence: clampUnit(recommendation.confidence),
        observedAt,
        metadata: {
          recommendationId: recommendation.recommendation.id,
          title: recommendation.recommendation.title,
          type: recommendation.recommendation.type,
          source: recommendation.source,
          confidence: recommendation.confidence,
          route: recommendation.recommendation.route,
          ctaLabel: recommendation.recommendation.ctaLabel,
        },
      }),
    ],
    constraints: [],
    createdAt: observedAt,
  });
}

async function loadDiscussionBusinessTwin(
  userId: string,
  tenantId: string,
  dependencies: DiscussionServiceDependencies,
) {
  try {
    return await (dependencies.getBusinessTwin ?? getBusinessTwin)(userId, tenantId);
  } catch (error) {
    (dependencies.logFallback ?? runtimeFallbackLogger.warn)(
      '[business-twin] continuing without twin data',
      { userId, tenantId, error: errorMessage(error) },
    );
    return undefined;
  }
}

function buildSystemPrompt(
  recommendation: CommandCenterRecommendationResult,
  conversation?: ReturnType<DecisionConversation['toSnapshot']>,
  memory?: BusinessContextProjection,
  twin?: BusinessTwinSnapshot | null,
) {
  const twinSummary = buildTwinSummary(twin);

  return [
    AI_DISCUSSION_SYSTEM_PROMPT,
    '',
    'Current recommendation context:',
    `- Title: ${recommendation.recommendation.title}`,
    `- Summary: ${recommendation.recommendation.summary}`,
    `- Rationale: ${recommendation.recommendation.rationale}`,
    `- Type: ${recommendation.recommendation.type}`,
    `- Source: ${recommendation.source}`,
    `- Confidence: ${formatPercent(recommendation.confidence)}`,
    `- Suggested route: ${recommendation.recommendation.route ?? 'none'}`,
    '',
    'Conversation framework:',
    `- Type: ${conversation?.conversationType ?? 'Advisory'}`,
    `- Title: ${conversation?.title ?? `Discuss: ${recommendation.recommendation.title}`}`,
    `- Summary: ${conversation?.summary ?? recommendation.explain}`,
    ...(memory ? ['', ...buildMemorySummary(memory)] : []),
    ...(twinSummary.length > 0 ? ['', ...twinSummary] : []),
  ].join('\n');
}

async function loadDiscussionMemory(
  userId: string,
  tenantId: string,
  dependencies: DiscussionServiceDependencies,
) {
  try {
    return await (dependencies.getBusinessContext ?? businessContextMemoryService.getBusinessContext)(userId, tenantId);
  } catch (error) {
    (dependencies.logFallback ?? runtimeFallbackLogger.warn)(
      '[discussion-memory] continuing without business memory',
      { userId, tenantId, error: errorMessage(error) },
    );
    return undefined;
  }
}

async function recordDiscussionMemoryEvents(input: {
  userId: string;
  tenantId: string;
  recommendation: CommandCenterRecommendationResult;
  turnsUsed: number;
  append: typeof businessMemoryEventStore.append;
  logFallback: typeof runtimeFallbackLogger.warn;
}) {
  const metadata = {
    recommendationId: input.recommendation.recommendation.id,
    turnNumber: input.turnsUsed,
    source: input.recommendation.source,
  };
  const events = [
    ...(input.turnsUsed === 1 ? [{
      type: 'DISCUSSION_STARTED' as const,
      title: `Discussion started: ${input.recommendation.recommendation.title}`,
      summary: 'Started a Command Center recommendation discussion.',
    }] : []),
    {
      type: 'DISCUSSION_TURN_COMPLETED' as const,
      title: `Discussion turn completed: ${input.recommendation.recommendation.title}`,
      summary: 'Completed a Command Center recommendation discussion turn.',
    },
  ];

  for (const event of events) {
    try {
      await input.append({
        ...event,
        tenantId: input.tenantId,
        userId: input.userId,
        referenceId: input.recommendation.recommendation.id,
        metadata,
      });
    } catch (error) {
      input.logFallback('[discussion-memory] failed to record discussion event', {
        userId: input.userId,
        tenantId: input.tenantId,
        eventType: event.type,
        error: errorMessage(error),
      });
    }
  }
}

function buildMemorySummary(memory: BusinessContextProjection) {
  const recentActivities = memory.recentActivities.slice(0, 5);
  const recentTitles = recentActivities.slice(0, 3).map((activity) => activity.title).join('; ') || 'none recorded';
  const accepted = memory.recommendationMemory.acceptedIds.slice(0, 3).join(', ') || 'none';
  const ignored = memory.recommendationMemory.ignoredIds.slice(0, 3).join(', ') || 'none';

  return [
    'Relevant business memory (use as supporting context, not as new facts):',
    `- Activity level: ${memory.executionPattern.activityLevel}; completion velocity: ${memory.executionPattern.completionVelocity}; consistency: ${memory.executionPattern.consistency}.`,
    `- Recent activity: ${recentTitles}.`,
    `- Recommendation response pattern: ${memory.executionPattern.recommendationResponse}; accepted IDs: ${accepted}; ignored IDs: ${ignored}.`,
  ];
}

function buildTwinSummary(twin?: BusinessTwinSnapshot | null) {
  if (!twin) return [];

  const lines = [
    formatTwinField('Business name', twin.identity?.businessName),
    formatTwinField('Industry', twin.identity?.industry),
    formatTwinField('Business stage', twin.identity?.businessStage),
    formatTwinField('Mission', twin.identity?.mission, 200),
    formatTwinField('Business positioning', twin.identity?.positioning, 200),
    formatTwinField('Brand name', twin.brand?.brandName),
    formatTwinField('Brand story', twin.brand?.brandStory, 200),
    formatTwinField('Brand voice', twin.brand?.voice),
    formatTwinField('Brand positioning', twin.brand?.positioning, 200),
  ].filter((line): line is string => line !== undefined);

  if (lines.length === 0) return [];

  return [
    'Business Twin profile (verified user-provided business facts; do not infer beyond them):',
    ...lines,
  ];
}

function formatTwinField(label: string, value: string | undefined, maxLength?: number) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  if (!normalized) return undefined;

  const bounded = maxLength && normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;

  return `- ${label}: ${bounded}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown error';
}

function buildUserPrompt(input: {
  message: string;
  history: DiscussionTurn[];
  recommendation: CommandCenterRecommendationResult;
  conversationSummary?: string;
}) {
  const historyText = input.history.length === 0
    ? 'No previous turns in this session.'
    : input.history
      .map((turn, index) => `${index + 1}. ${turn.role}: ${turn.content}`)
      .join('\n');

  return [
    `User message: ${input.message}`,
    '',
    `Current recommendation: ${input.recommendation.recommendation.title}`,
    `Recommendation explanation: ${input.recommendation.explain}`,
    `Conversation plan: ${input.conversationSummary ?? 'Focused advisory discussion.'}`,
    '',
    'Session history:',
    historyText,
    '',
    'Reply with a focused answer that helps the user understand or act on the current recommendation.',
  ].join('\n');
}

function normalizeMessage(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw Errors.VALIDATION('Discussion message is required.');
  }
  return normalized.slice(0, 1_500);
}

function normalizeHistory(history: DiscussionTurn[]) {
  return history
    .filter((turn) => turn && (turn.role === 'user' || turn.role === 'assistant'))
    .map((turn) => ({
      role: turn.role,
      content: String(turn.content ?? '').trim().slice(0, 2_000),
    }))
    .filter((turn) => turn.content.length > 0)
    .slice(-10);
}

function countUserTurns(history: DiscussionTurn[]) {
  return history.filter((turn) => turn.role === 'user').length;
}

function isClearlyOffTopic(message: string) {
  const normalized = message.toLowerCase();
  return [
    'weather',
    'football',
    'movie',
    'recipe',
    'lottery',
    'crypto price',
    'stock price',
    'celebrity',
  ].some((phrase) => normalized.includes(phrase));
}

function buildOffTopicReply(recommendation: CommandCenterRecommendationResult) {
  return [
    `I can only discuss today's recommendation: "${recommendation.recommendation.title}".`,
    'I cannot help with unrelated requests here, but we can use this discussion to clarify why the recommendation matters, what to do first, or what tradeoff to watch.',
  ].join(' ');
}

function formatPercent(value: number) {
  return `${Math.round(clampUnit(value) * 100)}%`;
}

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

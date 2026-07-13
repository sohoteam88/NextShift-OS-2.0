import {
  COMMAND_CENTER_FLAG,
  isRuntimeFlagEnabledByDefault,
} from '@/lib/runtime-flags';
import {
  DecisionContext,
  Recommendation,
  createDecisionEvidence,
  type DecisionContextId,
  type RecommendationEngine,
  type RecommendationSnapshot,
} from '@nextshift/decision-brain';
import type {
  BusinessId,
  TenantId,
  Timestamp,
} from '@nextshift/shared';
import {
  loadCommandCenterRecommendationContext,
  type CommandCenterRecommendationContext,
  type CommandCenterRecommendationContextLoaders,
  type CommandCenterRecommendationContextUser,
} from '@/lib/command-center-recommendation-context';

export type CommandCenterRecommendationSource = 'engine' | 'rule';

export type CommandCenterRecommendation = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  type: RecommendationSnapshot['recommendationType'];
  route?: string;
  ctaLabel?: string;
};

export type CommandCenterRecommendationResult = {
  recommendation: CommandCenterRecommendation;
  confidence: number;
  explain: string;
  source: CommandCenterRecommendationSource;
};

export type CommandCenterRecommendationUser = CommandCenterRecommendationContextUser;

export type CommandCenterRecommendationDependencies = {
  isEnabled?: () => boolean;
  loadContext?: typeof loadCommandCenterRecommendationContext;
  loaders?: CommandCenterRecommendationContextLoaders;
  recommendationEngine?: RecommendationEngine;
  now?: () => Date;
};

export function isCommandCenterEnabled(env: NodeJS.ProcessEnv = process.env) {
  return isRuntimeFlagEnabledByDefault(COMMAND_CENTER_FLAG, env);
}

export async function getCommandCenterRecommendation(
  user: CommandCenterRecommendationUser,
  dependencies: CommandCenterRecommendationDependencies = {},
): Promise<CommandCenterRecommendationResult | null> {
  const enabled = dependencies.isEnabled?.() ?? isCommandCenterEnabled();
  if (!enabled) return null;

  const now = dependencies.now?.() ?? new Date();
  const observedAt = now.toISOString();
  const context = await (dependencies.loadContext ?? loadCommandCenterRecommendationContext)(
    user,
    observedAt,
    dependencies.loaders,
  );
  const { mission } = context;
  const ruleRecommendation = resolveColdStartRule(context);
  if (ruleRecommendation) return ruleRecommendation;

  const decisionContext = buildDecisionContext(context);
  const engine = dependencies.recommendationEngine ?? new CommandCenterRecommendationEngine();
  const recommendation = engine.generate(decisionContext)[0];
  if (!recommendation) {
    return fallbackRule(context, {
      id: 'command-center-rule-current-mission',
      title: mission.priorityAction?.title ?? mission.currentMission.title,
      summary: mission.explainability.whyNow,
      rationale: 'The recommendation engine returned no recommendation, so Command Center uses the active mission.',
      route: mission.priorityAction?.route ?? mission.currentMission.route,
      ctaLabel: mission.priorityResult.ctaLabel,
      confidence: 0.62,
    });
  }

  return fromEngineRecommendation(recommendation.toSnapshot(), context);
}

class CommandCenterRecommendationEngine implements RecommendationEngine {
  generate(context: DecisionContext): readonly Recommendation[] {
    const snapshot = context.toSnapshot();
    const evidence = snapshot.evidence[0];
    const memoryEvidence = snapshot.evidence.find((item) => item.source === 'command-center-business-memory');
    const metadata = metadataRecord(evidence?.metadata);
    const missionTitle = metadataString(metadata, 'missionTitle') || 'Continue today\'s mission';
    const readiness = metadataNumber(metadata, 'readiness');
    const progress = metadataNumber(metadata, 'progress');
    const growth = metadataNumber(metadata, 'growth');
    const confidence = clampUnit(((readiness + progress + growth) / 300) * 0.5 + 0.35);

    return [Recommendation.create({
      recommendationId: 'command-center-engine-next-action' as never,
      decisionContextId: snapshot.decisionContextId,
      recommendationType: recommendationTypeFor(metadataString(metadata, 'missionType')),
      title: missionTitle,
      summary: `Focus on ${missionTitle} from the Command Center context.`,
        rationale: [
          evidence?.summary ?? snapshot.objective ?? 'Runtime context indicates this is the next best action.',
          memoryEvidence?.summary,
        ].filter(Boolean).join(' '),
      confidence,
      impact: confidence >= 0.7 ? 0.8 : 0.65,
      urgency: metadataString(metadata, 'priority') === 'Critical' ? 0.9 : 0.7,
      effort: 0.45,
      createdAt: snapshot.createdAt,
    })];
  }
}

function buildDecisionContext(context: CommandCenterRecommendationContext) {
  const tenantId = (context.user.tenantId ?? context.user.id) as TenantId;
  const businessId = `business-${context.user.tenantId ?? context.user.id}` as BusinessId;
  const decisionContextId = `command-center-${context.user.id}` as DecisionContextId;
  const analyticsProjection = context.analytics.projection;

  return DecisionContext.create({
    decisionContextId,
    businessId,
    tenant: { tenantId },
    businessContext: {
      businessId,
      tenant: { tenantId },
      version: 1,
      capturedAt: context.observedAt as Timestamp,
      identity: {
        businessName: 'NextShift Command Center',
        values: ['clarity', 'momentum'],
      },
      understanding: {
        executiveSummary: [
          `Mission: ${context.mission.currentMission.title}`,
          `Business state: ${context.businessState.stateResult.currentState}`,
          `Readiness: ${analyticsProjection.readiness.value}%`,
        ].join(' | '),
        strengths: context.businessState.opportunities.map((opportunity) => opportunity.title).slice(0, 3),
        weaknesses: context.businessState.bottlenecks.map((bottleneck) => bottleneck.title).slice(0, 3),
        opportunities: [
          context.mission.priorityResult.expectedImpact,
          analyticsProjection.progress.nextAction.title,
        ],
        missingInformation: context.businessState.stateResult.missingRequirements,
        contradictions: [],
        confidence: clampUnit(context.mission.bottleneckResult.confidence),
      },
    },
    objective: 'Recommend the next Command Center action for today.',
    evidence: [
      createDecisionEvidence({
        evidenceId: 'command-center-runtime-context' as never,
        source: 'command-center-runtime-context',
        summary: context.mission.explainability.whyThis,
        confidence: clampUnit(context.mission.bottleneckResult.confidence),
        observedAt: context.observedAt as Timestamp,
        metadata: {
          missionTitle: context.mission.priorityAction?.title ?? context.mission.currentMission.title,
          missionRoute: context.mission.priorityAction?.route ?? context.mission.currentMission.route,
          missionType: context.mission.priorityAction?.missionType ?? context.mission.missionPlan.missionType,
          priority: context.mission.priorityAction?.priority ?? context.mission.priorityResult.urgency,
          ctaLabel: context.mission.priorityResult.ctaLabel,
          readiness: context.analytics.projection.readiness.value,
          progress: context.analytics.projection.progress.value,
          growth: context.analytics.projection.growth.value,
          businessState: context.businessState.stateResult.currentState,
          revenueStatus: context.revenue.resolution.status,
        },
      }),
      createDecisionEvidence({
        evidenceId: 'command-center-business-memory' as never,
        source: 'command-center-business-memory',
        summary: memorySummary(context.memory),
        confidence: 0.65,
        observedAt: context.observedAt as Timestamp,
        metadata: {
          recommendedFocus: context.memory.recommendedFocus,
          ignoredRecommendationIds: context.memory.recommendationMemory.ignoredIds.slice(0, 3),
        },
      }),
    ],
    constraints: [],
    createdAt: context.observedAt as Timestamp,
  });
}

function resolveColdStartRule(
  context: CommandCenterRecommendationContext,
): CommandCenterRecommendationResult | null {
  const missing = context.businessState.stateResult.missingRequirements;

  if (
    context.mission.currentMission.id === 'MISSION_AI_INTERVIEW'
    || missing.includes('AI Interview Completed')
  ) {
    return fallbackRule(context, {
      id: 'command-center-rule-ai-interview',
      title: 'Complete the AI Interview',
      summary: 'Finish the AI Interview so NextShift can understand the business before recommending deeper actions.',
      rationale: 'Business State still lacks the core interview signal.',
      route: '/brand-builder/step/interview',
      ctaLabel: 'Start AI Interview',
      confidence: 0.9,
    });
  }

  if (
    context.mission.bottleneck === 'NO_CONTENT'
    || context.businessState.stateResult.currentState === 'CONTENT_SYSTEM'
  ) {
    return fallbackRule(context, {
      id: 'command-center-rule-content-program',
      title: 'Schedule today\'s content program',
      summary: 'Create or schedule one content asset before moving to traffic or funnel work.',
      rationale: 'The current runtime context shows content is the active bottleneck.',
      route: '/content-engine',
      ctaLabel: 'Open Content Engine',
      confidence: 0.82,
    });
  }

  if (context.analytics.projection.readiness.value < 20 && context.analytics.projection.progress.value < 20) {
    return fallbackRule(context, {
      id: 'command-center-rule-current-mission',
      title: context.mission.currentMission.title,
      summary: context.mission.currentMission.description,
      rationale: 'Command Center has too little performance signal, so it uses the active mission as the safest next action.',
      route: context.mission.currentMission.route,
      ctaLabel: context.mission.priorityResult.ctaLabel,
      confidence: 0.68,
    });
  }

  return null;
}

function fallbackRule(
  context: CommandCenterRecommendationContext,
  input: {
    id: string;
    title: string;
    summary: string;
    rationale: string;
    route?: string;
    ctaLabel?: string;
    confidence: number;
  },
): CommandCenterRecommendationResult {
  return {
    recommendation: {
      id: input.id,
      title: input.title,
      summary: input.summary,
      rationale: input.rationale,
      type: 'Operations',
      route: input.route,
      ctaLabel: input.ctaLabel,
    },
    confidence: input.confidence,
    explain: `${input.rationale} ${memorySummary(context.memory)}`.trim(),
    source: 'rule',
  };
}

function memorySummary(memory: CommandCenterRecommendationContext['memory']) {
  const ignoredIds = memory.recommendationMemory.ignoredIds.slice(0, 3);
  return [
    `Business memory focus: ${memory.recommendedFocus}.`,
    ignoredIds.length > 0 ? `Recently ignored recommendation IDs: ${ignoredIds.join(', ')}.` : '',
  ].filter(Boolean).join(' ');
}

function fromEngineRecommendation(
  recommendation: RecommendationSnapshot,
  context: CommandCenterRecommendationContext,
): CommandCenterRecommendationResult {
  return {
    recommendation: {
      id: recommendation.recommendationId,
      title: recommendation.title,
      summary: recommendation.summary,
      rationale: recommendation.rationale,
      type: recommendation.recommendationType,
      route: context.mission.priorityAction?.route ?? context.mission.currentMission.route,
      ctaLabel: context.mission.priorityResult.ctaLabel,
    },
    confidence: recommendation.confidence,
    explain: recommendation.rationale,
    source: 'engine',
  };
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function metadataString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function metadataNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function recommendationTypeFor(missionType: string): RecommendationSnapshot['recommendationType'] {
  if (['TRAFFIC', 'CONTENT', 'LEAD_MAGNET', 'FUNNEL', 'WEBINAR'].includes(missionType)) return 'Marketing';
  if (['CUSTOMERS', 'OPTIMIZATION'].includes(missionType)) return 'Revenue';
  if (['RETENTION'].includes(missionType)) return 'Retention';
  if (['TEAM', 'SYSTEM'].includes(missionType)) return 'Operations';
  return 'Growth';
}

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

import prisma from '@/lib/prisma';
import { journeyEngineService } from '@/modules/journey-engine/journey-engine-service';
import type { AdaptiveJourneyProjection } from '@/modules/journey-engine/journey-projection';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import type { BusinessStateResult } from '@/modules/business-state/contracts/BusinessStateResult';
import type {
  BottleneckResult,
  MissionBusinessStage,
  MissionAuthorityDefinition,
  MissionAuthoritySnapshot,
  MissionLifecycleStatus,
  PriorityResult,
} from '../contracts/MissionAuthority';
import { BottleneckAuthority } from './BottleneckAuthority';
import { readBottleneckSignals, resolveBottleneck, signalFailureResult, type BottleneckSignals } from './BottleneckEngine';
import { explainabilityEngine, resolveExplainabilityLocale } from './ExplainabilityEngine';
import { missionCompletionVerifier } from './MissionCompletionVerifier';
import { missionGeneratorV2 } from './MissionGeneratorV2';
import { priorityEngine, type PriorityHistoryEntry } from './PriorityEngine';
import {
  resolveMissionRuntimeAuthority,
  type MissionRuntimeMetadata,
  type MissionRuntimeSource,
} from '../runtime';

const PRIORITY_HISTORY_WINDOW_DAYS = 7;

function formatMinutes(minutes: number) {
  if (minutes <= 0) return '即将完成';
  return `${minutes} 分钟`;
}

function toMissionDefinition(mission: AdaptiveJourneyProjection['missions'][number]): MissionAuthorityDefinition {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    expectedOutcome: mission.expectedOutcome,
    estimatedMinutes: mission.estimatedMinutes,
    status: mission.status === 'active' ? 'active' : mission.status,
    priority: mission.priority,
    unlockConditions: mission.unlockConditions,
    completionConditions: mission.completionConditions,
    nextMissionId: mission.nextMissionId,
    route: mission.route,
  };
}

const AI_INTERVIEW_MISSION: MissionAuthorityDefinition = {
  id: 'MISSION_AI_INTERVIEW',
  title: 'Start AI Interview',
  description: 'Business profile unavailable. Complete the AI Interview so the AI COO can determine your next mission.',
  expectedOutcome: 'Business profile available for mission analysis.',
  estimatedMinutes: 8,
  status: 'active',
  priority: 100,
  unlockConditions: [],
  completionConditions: ['brand_discovery_completed'],
  route: '/brand-builder/step/interview',
};

function completedLabels(journey: AdaptiveJourneyProjection) {
  return journey.progressPath
    .filter((item) => item.status === 'completed')
    .map((item) => item.label);
}

function hasCompleted(journey: AdaptiveJourneyProjection, check: string) {
  return journey.missions.some((mission) => (
    mission.completionConditions.includes(check) && mission.status === 'completed'
  ));
}

function lifecycleFor(
  status: MissionAuthorityDefinition['status'],
  missionCompletion?: MissionAuthoritySnapshot['missionCompletion'],
): MissionLifecycleStatus {
  if (missionCompletion?.completed) return 'COMPLETED';
  if (missionCompletion?.verificationStatus === 'VERIFYING') return 'VERIFYING';
  if (status === 'completed' && !missionCompletion?.completed) return 'BLOCKED';
  if (status === 'blocked') return 'BLOCKED';
  if (status === 'active') return 'ACTIVE';
  return 'PENDING';
}

function teamWorkforceMission(baseMission: MissionAuthorityDefinition): MissionAuthorityDefinition {
  return {
    ...baseMission,
    title: 'Activate Team / Workforce',
    description: 'Your core business system has reached the team-building stage. Turn the proven workflow into repeatable team and AI workforce actions.',
    expectedOutcome: 'Business operates beyond founder',
    estimatedMinutes: 20,
    route: '/team/growth',
  };
}

function healthyBusinessMission(baseMission: MissionAuthorityDefinition): MissionAuthorityDefinition {
  return {
    ...baseMission,
    title: 'Continue Optimizing Your Business System',
    description: 'Your current signals show no active bottleneck. Review growth opportunities, scale what is working, and keep the system healthy.',
    expectedOutcome: 'Business systems remain healthy while growth opportunities are prioritized.',
    estimatedMinutes: 15,
    priority: 30,
    route: '/dashboard',
  };
}

function priorityMission(baseMission: MissionAuthorityDefinition, priorityResult: PriorityResult): MissionAuthorityDefinition {
  return {
    ...baseMission,
    title: priorityResult.priorityAction,
    description: priorityResult.priorityReason,
    expectedOutcome: priorityResult.expectedImpact,
    priority: priorityResult.urgency === 'Critical' ? 100 : priorityResult.urgency === 'High' ? 70 : 30,
    route: priorityResult.route,
  };
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function metadataString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function isMissionBottleneck(value: string): value is BottleneckResult['bottleneck'] {
  return [
    'NO_BRAND',
    'NO_POSITIONING',
    'NO_CONTENT',
    'NO_AUDIENCE',
    'NO_LEAD_MAGNET',
    'NO_FUNNEL',
    'NO_TRAFFIC',
    'NO_LEADS',
    'NO_CONVERSION',
    'NO_CUSTOMERS',
    'NO_RETENTION',
    'BUSINESS_HEALTHY',
    'NO_SYSTEM',
    'NO_TEAM',
  ].includes(value);
}

export async function readRecentPriorityHistory(input: {
  userId: string;
  currentBottleneck: BottleneckResult['bottleneck'];
  now?: Date;
}): Promise<PriorityHistoryEntry[]> {
  const since = new Date(input.now ?? new Date());
  since.setDate(since.getDate() - PRIORITY_HISTORY_WINDOW_DAYS);

  const rows = await prisma.auditLog.findMany({
    where: {
      actorId: input.userId,
      action: 'mission.decision.projected',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { metadata: true },
  });

  return rows.flatMap((row) => {
    const metadata = metadataRecord(row.metadata);
    const priorityAction = metadataString(metadata, 'priorityAction') || metadataString(metadata, 'missionTitle');
    const bottleneck = metadataString(metadata, 'bottleneck');
    if (!priorityAction || !isMissionBottleneck(bottleneck)) return [];

    const completionStatus = metadataString(metadata, 'completionStatus') || 'unknown';
    return [{
      priorityAction,
      bottleneck,
      completionStatus,
      resolved: completionStatus === 'completed' && bottleneck !== input.currentBottleneck,
    }];
  });
}

async function recordPriorityDedupAudit(input: {
  userId: string;
  tenantId?: string | null;
  priorityResult: PriorityResult;
}) {
  if (!input.tenantId || !input.priorityResult.dedup || process.env.NODE_ENV === 'test') return;

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: 'priority.dedup.applied',
        targetType: 'priority',
        metadata: {
          action: input.priorityResult.dedup.action,
          baseScore: input.priorityResult.dedup.baseScore,
          penalty: input.priorityResult.dedup.penalty,
          finalScore: input.priorityResult.dedup.finalScore,
          reason: input.priorityResult.dedup.reason,
        },
      },
    });
  } catch {
    // Priority recommendations should not fail because audit telemetry is unavailable.
  }
}

export function resolveMissionAuthorityFromJourney(
  journey: AdaptiveJourneyProjection,
  businessState?: BusinessStateResult,
  bottleneckResult?: BottleneckResult,
  options: {
    recentPriorityHistory?: PriorityHistoryEntry[];
    locale?: string | null;
    bottleneckSignals?: Partial<BottleneckSignals> | null;
    completionSourceAvailable?: boolean;
  } = {},
): MissionAuthoritySnapshot {
  const interviewCompleted = hasCompleted(journey, 'brand_discovery_completed');
  const requiresInterview = businessState?.currentState === 'BRAND_FOUNDATION'
    && businessState.missingRequirements.includes('AI Interview Completed');
  const currentMission = interviewCompleted && !requiresInterview
    ? toMissionDefinition(journey.currentMission)
    : AI_INTERVIEW_MISSION;
  const nextMission = interviewCompleted && !requiresInterview && journey.nextMission ? toMissionDefinition(journey.nextMission) : null;
  const businessStage = BottleneckAuthority.businessStageFor({ businessState, mission: currentMission });
  const resolvedBottleneckResult = bottleneckResult ?? signalFailureResult();
  const bottleneck = resolvedBottleneckResult.bottleneck;
  const priorityResult = priorityEngine.resolve({
    bottleneckResult: resolvedBottleneckResult,
    recentPriorityHistory: options.recentPriorityHistory,
  });
  const fallbackActionMission = bottleneck === 'NO_TEAM'
    ? teamWorkforceMission(currentMission)
    : bottleneck === 'BUSINESS_HEALTHY'
      ? healthyBusinessMission(currentMission)
      : currentMission;
  const actionMission = priorityMission(fallbackActionMission, priorityResult);
  const completed = businessState
    ? businessState.completedStates
    : interviewCompleted
      ? completedLabels(journey)
      : [];
  const explanation = explainabilityEngine.resolve({
    bottleneckResult: resolvedBottleneckResult,
    priorityResult,
    locale: options.locale,
  });
  const explainability = {
    ...explanation,
    completed,
    currentGap: bottleneck,
    reasoning: explanation.whyThis,
    decisionReason: explanation.whyNotOthers,
    evidence: resolvedBottleneckResult.evidence,
    severity: resolvedBottleneckResult.severity,
    confidence: resolvedBottleneckResult.confidence,
  };
  const missionPlan = missionGeneratorV2.generate({
    bottleneckResult: resolvedBottleneckResult,
    priorityResult,
    explainability: explanation,
  });
  const missionCompletion = missionCompletionVerifier.verify({
    missionPlan,
    businessState,
    bottleneckResult: resolvedBottleneckResult,
    signals: options.bottleneckSignals,
    sourceAvailable: options.completionSourceAvailable,
  });
  const estimatedCompletion = {
    minutes: missionPlan.estimatedTime,
    label: formatMinutes(missionPlan.estimatedTime),
  };

  return {
    source: 'MissionEngineAuthorityService',
    scope: 'user',
    confidence: journey.confidence,
    fallback: journey.fallback,
    currentJourney: journey.currentJourney,
    businessStage,
    bottleneck,
    bottleneckResult: resolvedBottleneckResult,
    bottleneckSignals: options.bottleneckSignals ?? null,
    priorityResult,
    currentMission,
    nextMission,
    priorityAction: {
      missionType: priorityResult.missionType,
      title: priorityResult.priorityAction,
      route: priorityResult.route,
      ctaLabel: priorityResult.ctaLabel,
      priority: priorityResult.urgency,
    },
    explainability,
    missionPlan,
    missionCompletion,
    dashboardCommandCenter: {
      currentStage: businessStage,
      missionTitle: missionPlan.objective,
      missionDescription: missionPlan.description,
      reasoning: explainability.whyThis,
      expectedOutcome: missionPlan.successCriteria[0] ?? explainability.expectedOutcome,
      estimatedTime: estimatedCompletion.label,
      route: missionPlan.route,
      ctaLabel: priorityResult.ctaLabel,
      decisionReason: explainability.whyNotOthers,
      priority: priorityResult.urgency,
    },
    lifecycle: lifecycleFor(currentMission.status, missionCompletion),
    progress: {
      completionPercentage: journey.completionPercentage,
      completedMissions: journey.missions.filter((mission) => mission.status === 'completed').length,
      totalMissions: journey.missions.length,
      nextMilestone: journey.nextMilestone,
      progressPath: journey.progressPath,
    },
    estimatedCompletion,
  };
}

export type MissionEngineRuntimeOptions = {
  onRuntimeResolved?: (runtime: MissionRuntimeMetadata) => void;
  resolveRuntimeAuthority?: typeof resolveMissionRuntimeAuthority;
  source?: MissionRuntimeSource;
};

async function resolveCurrentMissionAuthorityLegacy(
  userId: string,
  options: { businessState?: BusinessStateResult | null; locale?: string | null; browserLocale?: string | null } = {},
): Promise<MissionAuthoritySnapshot> {
  const businessState = Object.hasOwn(options, 'businessState')
    ? { stateResult: options.businessState }
    : await businessStateService.getBusinessState(userId);
  const stateResult = businessState.stateResult ?? undefined;
  const [journey, bottleneckSignalResult, user] = await Promise.all([
    journeyEngineService.getJourneyProjection(userId),
    stateResult ? readBottleneckSignals(userId).then(({ signals }) => signals).catch(() => null) : Promise.resolve(null),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        tenantId: true,
        languagePreference: true,
        tenant: { select: { settings: true } },
      },
    }),
  ]);
  const resolvedBottleneckResult = stateResult && bottleneckSignalResult
    ? resolveBottleneck({ businessState: stateResult, signals: bottleneckSignalResult })
    : signalFailureResult();
  const recentPriorityHistory = await readRecentPriorityHistory({
    userId,
    currentBottleneck: resolvedBottleneckResult.bottleneck,
  }).catch(() => []);
  const locale = resolveExplainabilityLocale({
    locale: options.locale,
    userPreference: user?.languagePreference,
    workspaceSetting: metadataString(metadataRecord(user?.tenant?.settings), 'default_language'),
    browserLocale: options.browserLocale,
  });
  const missionAuthority = resolveMissionAuthorityFromJourney(journey, stateResult, resolvedBottleneckResult, {
    recentPriorityHistory,
    locale,
    bottleneckSignals: bottleneckSignalResult,
    completionSourceAvailable: Boolean(bottleneckSignalResult),
  });
  await recordPriorityDedupAudit({
    userId,
    tenantId: user?.tenantId,
    priorityResult: missionAuthority.priorityResult,
  });
  return missionAuthority;
}

export const missionEngineAuthorityService = {
  async getCurrentMission(
    userId: string,
    options: { businessState?: BusinessStateResult | null; locale?: string | null; browserLocale?: string | null } = {},
    runtimeOptions: MissionEngineRuntimeOptions = {},
  ): Promise<MissionAuthoritySnapshot> {
    const { authority, runtime } = await (runtimeOptions.resolveRuntimeAuthority ?? resolveMissionRuntimeAuthority)({
      userId,
      source: runtimeOptions.source ?? 'authority-service',
    }, {
      resolveAuthority: () => resolveCurrentMissionAuthorityLegacy(userId, options),
    });
    runtimeOptions.onRuntimeResolved?.(runtime);
    return authority;
  },
};

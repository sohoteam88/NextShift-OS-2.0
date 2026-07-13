import type { BusinessScorePayload } from '@nextshift/contracts';
import {
  loadCommandCenterRecommendationContext,
  type CommandCenterRecommendationContext,
  type CommandCenterRecommendationContextLoaders,
  type CommandCenterRecommendationContextUser,
} from '@/lib/command-center-recommendation-context';
import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import { isCommandCenterEnabled } from './recommendation-service';

export type CommandCenterBusinessScoreUser = CommandCenterRecommendationContextUser;

export type CommandCenterBusinessScoreDependencies = {
  isEnabled?: () => boolean;
  loadContext?: typeof loadCommandCenterRecommendationContext;
  loaders?: CommandCenterRecommendationContextLoaders;
  now?: () => Date;
};

export async function getCommandCenterBusinessScore(
  user: CommandCenterBusinessScoreUser,
  dependencies: CommandCenterBusinessScoreDependencies = {},
): Promise<BusinessScorePayload | null> {
  try {
    const enabled = dependencies.isEnabled?.() ?? isCommandCenterEnabled();
    if (!enabled) return null;

    const observedAt = (dependencies.now?.() ?? new Date()).toISOString();
    const context = await (dependencies.loadContext ?? loadCommandCenterRecommendationContext)(
      user,
      observedAt,
      dependencies.loaders,
    );

    return createBusinessScore(context);
  } catch (error) {
    runtimeFallbackLogger.warn('[command-center] unable to load business score', {
      userId: user.id,
      tenantId: user.tenantId ?? undefined,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return null;
  }
}

function createBusinessScore(context: CommandCenterRecommendationContext): BusinessScorePayload {
  const { analytics, businessState, memory, mission, user } = context;
  const readiness = normalizeReadinessScore(analytics.projection.readiness.value);
  const growthSignal = analytics.projection.growth.value;
  const forecastConfidence = clampUnit(growthSignal / 100);

  // Mirrors packages/domain/src/business-command-center-v1/business-command-center-v1.ts:448, the source of truth for the score formula and bands.
  const scoreValue = Math.round((readiness + forecastConfidence * 100) / 2);
  const scoreBand = scoreValue >= 80 ? 'strong' : scoreValue >= 60 ? 'ready' : 'needs_attention';
  const businessStateName = businessState.stateResult.currentState;
  const currentMission = mission.priorityAction?.title ?? mission.currentMission.title;

  return {
    scoreId: `command-center-${user.tenantId ?? user.id}:score:business`,
    scoreValue,
    scoreBand,
    factors: [
      `业务状态 / Business state: ${businessStateName}`,
      `当前任务 / Current mission: ${currentMission}`,
      `当前瓶颈 / Current bottleneck: ${mission.bottleneck}`,
      `行动准备度 / Readiness: ${readiness}%`,
      `增长信号 / Growth signal: ${growthSignal}%`,
      `业务记忆焦点 / Business memory focus: ${memory.recommendedFocus}`,
    ],
    confidence: forecastConfidence,
    explanation: `业务状态 / Business state is ${businessStateName}; 当前瓶颈 / current bottleneck is ${mission.bottleneck}. The score combines ${readiness}% readiness with a ${growthSignal}% growth signal.`,
    healthReference: `${businessStateName}:${mission.bottleneck}`,
    growthReference: `analytics-growth:${analytics.projection.growth.health}`,
  };
}

function normalizeReadinessScore(score: number) {
  return score > 1 ? score : score * 100;
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

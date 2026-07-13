import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import { resolveRevenueRuntimeIntent } from '@/modules/revenue-drivers/runtime';
import type { ResolveRevenueRuntimeOutput } from '@/modules/revenue-drivers/runtime';
import { resolveAnalyticsRuntimeProjection } from '@/modules/analytics/runtime';
import type { ResolveAnalyticsRuntimeOutput } from '@/modules/analytics/runtime';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import type { BusinessContextProjection } from '@/modules/business-context-memory/contracts/BusinessContextMemory';

export type CommandCenterRecommendationContextUser = {
  id: string;
  tenantId?: string | null;
};

export type CommandCenterRecommendationContext = {
  user: CommandCenterRecommendationContextUser;
  mission: MissionAuthoritySnapshot;
  businessState: BusinessState;
  analytics: ResolveAnalyticsRuntimeOutput;
  revenue: ResolveRevenueRuntimeOutput;
  memory: BusinessContextProjection;
  observedAt: string;
};

export type CommandCenterRecommendationContextLoaders = {
  getCurrentMission?: typeof missionEngineAuthorityService.getCurrentMission;
  getBusinessState?: typeof businessStateService.getBusinessState;
  resolveAnalytics?: typeof resolveAnalyticsRuntimeProjection;
  resolveRevenue?: typeof resolveRevenueRuntimeIntent;
  getBusinessContext?: typeof businessContextMemoryService.getBusinessContext;
};

export async function loadCommandCenterRecommendationContext(
  user: CommandCenterRecommendationContextUser,
  observedAt: string,
  loaders: CommandCenterRecommendationContextLoaders = {},
): Promise<CommandCenterRecommendationContext> {
  const tenantId = user.tenantId ?? undefined;
  const [mission, businessState] = await Promise.all([
    (loaders.getCurrentMission ?? missionEngineAuthorityService.getCurrentMission)(user.id, {}, {
      source: 'dashboard',
    }),
    (loaders.getBusinessState ?? businessStateService.getBusinessState)(user.id, {
      source: 'command-center',
    }),
  ]);
  const [analytics, revenue, memory] = await Promise.all([
    (loaders.resolveAnalytics ?? resolveAnalyticsRuntimeProjection)({
      userId: user.id,
      tenantId,
      source: 'api',
      projectionType: 'analytics-center',
      workspaceFocus: 'command-center',
    }, {
      logger: runtimeFallbackLogger,
    }),
    (loaders.resolveRevenue ?? resolveRevenueRuntimeIntent)({
      route: mission.priorityAction?.route ?? mission.currentMission.route,
      intent: mission.priorityAction?.missionType.toLowerCase() ?? null,
      tenantId,
      userId: user.id,
      source: 'dashboard',
    }, {
      logger: runtimeFallbackLogger,
    }),
    loadBusinessContext(user.id, tenantId, loaders),
  ]);

  return {
    user,
    mission,
    businessState,
    analytics,
    revenue,
    memory,
    observedAt,
  };
}

async function loadBusinessContext(
  userId: string,
  tenantId: string | undefined,
  loaders: CommandCenterRecommendationContextLoaders,
): Promise<BusinessContextProjection> {
  try {
    return await (loaders.getBusinessContext ?? businessContextMemoryService.getBusinessContext)(userId, tenantId);
  } catch (error) {
    runtimeFallbackLogger.warn('[command-center] continuing without business memory', {
      userId,
      tenantId,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return {
      recentActivities: [],
      currentFocus: '继续推进当前最高优先级任务',
      blockedAreas: [],
      completedMilestones: [],
      executionPattern: {
        activityLevel: 'quiet',
        completionVelocity: 'none',
        recommendationResponse: 'unknown',
        consistency: 'low',
      },
      recommendedFocus: '继续推进当前最高优先级任务',
      recommendationMemory: {
        recentlyIssuedIds: [],
        acceptedIds: [],
        ignoredIds: [],
      },
    };
  }
}

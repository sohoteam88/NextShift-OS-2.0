import {
  calculateBusinessScore,
  type CalculatedBusinessScore,
} from '@nextshift/business-command-center-v1';
import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import {
  loadCommandCenterRecommendationContext,
  type CommandCenterRecommendationContextLoaders,
  type CommandCenterRecommendationContextUser,
} from '@/lib/command-center-recommendation-context';
import { crmCenterService } from '@/modules/crm/crmCenterService';

export type BusinessScoreUser = CommandCenterRecommendationContextUser;

export type BusinessScoreFactor = {
  readonly source:
    | 'analytics.projection.readiness.value'
    | 'crm.revenueForecast.confidenceScore';
  readonly value: number;
};

export type BusinessScoreResult = CalculatedBusinessScore & {
  readonly factors: readonly BusinessScoreFactor[];
};

export type BusinessScoreDependencies = {
  loadContext?: typeof loadCommandCenterRecommendationContext;
  loaders?: CommandCenterRecommendationContextLoaders;
  loadCrmCommandCenter?: typeof crmCenterService.getCommandCenter;
  calculateScore?: typeof calculateBusinessScore;
  now?: () => Date;
};

export async function getBusinessScore(
  user: BusinessScoreUser,
  dependencies: BusinessScoreDependencies = {},
): Promise<BusinessScoreResult | null> {
  const tenantId = user.tenantId;
  if (!tenantId) {
    runtimeFallbackLogger.warn('[business-score] unavailable without tenant context', {
      userId: user.id,
    });
    return null;
  }

  try {
    const observedAt = (dependencies.now?.() ?? new Date()).toISOString();
    const [context, crmCommandCenter] = await Promise.all([
      (dependencies.loadContext ?? loadCommandCenterRecommendationContext)(
        user,
        observedAt,
        dependencies.loaders,
      ),
      (dependencies.loadCrmCommandCenter ?? crmCenterService.getCommandCenter)(
        user.id,
        tenantId,
      ),
    ]);
    const readinessScore = context.analytics.projection.readiness.value;
    const confidenceScore = crmCommandCenter.revenueForecast.confidenceScore;

    if (
      !Number.isFinite(confidenceScore)
      || confidenceScore < 0
      || confidenceScore > 100
    ) {
      runtimeFallbackLogger.warn('[business-score] CRM forecast confidence is invalid', {
        userId: user.id,
        tenantId,
        confidenceScore,
      });
      return null;
    }

    // CRM confidence is a 0..100 percentage; the domain policy accepts a 0..1 unit value.
    const forecastConfidence = confidenceScore / 100;
    const score = (dependencies.calculateScore ?? calculateBusinessScore)({
      readinessScore,
      forecastConfidence,
    });

    return {
      ...score,
      factors: [
        {
          source: 'analytics.projection.readiness.value',
          value: readinessScore,
        },
        {
          source: 'crm.revenueForecast.confidenceScore',
          value: confidenceScore,
        },
      ],
    };
  } catch (error) {
    runtimeFallbackLogger.warn('[business-score] unable to load score inputs', {
      userId: user.id,
      tenantId,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return null;
  }
}

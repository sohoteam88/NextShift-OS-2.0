import { createLogEvent } from '@/lib/observability/event-envelope';
import { COO_EVENTS, OBSERVABILITY_MODULES } from '@/lib/observability/event-catalog';
import { emitServerEvent, type TelemetryEmitResult } from '@/lib/observability/server-telemetry';
import type { COORecommendationSource } from '../contracts/COORecommendation';

export function emitCOORecommendationGenerated(input: {
  userId: string;
  tenantId?: string;
  recommendationSource: COORecommendationSource;
  businessStage?: string;
  readiness?: number;
  bottleneckCount?: number;
}): TelemetryEmitResult {
  return emitServerEvent(
    createLogEvent({
      eventName: COO_EVENTS.recommendationGenerated,
      severity: 'INFO',
      module: OBSERVABILITY_MODULES.aiCoo,
      userId: input.userId,
      tenantId: input.tenantId,
      properties: {
        recommendationSource: input.recommendationSource,
        businessStage: input.businessStage ?? null,
        readiness: input.readiness ?? null,
        bottleneckCount: input.bottleneckCount ?? null,
      },
    }),
  );
}

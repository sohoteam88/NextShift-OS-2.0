import { createLogEvent } from '@/lib/observability/event-envelope';
import { ANALYTICS_EVENTS, OBSERVABILITY_MODULES } from '@/lib/observability/event-catalog';
import { emitServerEvent, type TelemetryEmitResult } from '@/lib/observability/server-telemetry';

export function emitAnalyticsProjectionConsumed(input: {
  userId: string;
  tenantId?: string;
  businessStateVersion: string;
  journeyVersion: string;
  growthLoopVersion: string;
}): TelemetryEmitResult {
  return emitServerEvent(
    createLogEvent({
      eventName: ANALYTICS_EVENTS.projectionConsumed,
      severity: 'INFO',
      module: OBSERVABILITY_MODULES.analytics,
      userId: input.userId,
      tenantId: input.tenantId,
      properties: {
        businessStateVersion: input.businessStateVersion,
        journeyVersion: input.journeyVersion,
        growthLoopVersion: input.growthLoopVersion,
      },
    }),
  );
}

import { createLogEvent } from '@/lib/observability/event-envelope';
import { DASHBOARD_EVENTS, OBSERVABILITY_MODULES } from '@/lib/observability/event-catalog';
import { emitServerEvent, type TelemetryEmitResult } from '@/lib/observability/server-telemetry';

export function emitDashboardProjectionConsumed(input: {
  userId: string;
  tenantId?: string;
  businessStateVersion: string;
  journeyVersion: string;
  cooPlanVersion: string;
  growthLoopVersion: string;
}): TelemetryEmitResult {
  return emitServerEvent(
    createLogEvent({
      eventName: DASHBOARD_EVENTS.projectionConsumed,
      severity: 'INFO',
      module: OBSERVABILITY_MODULES.dashboard,
      userId: input.userId,
      tenantId: input.tenantId,
      properties: {
        businessStateVersion: input.businessStateVersion,
        journeyVersion: input.journeyVersion,
        cooPlanVersion: input.cooPlanVersion,
        growthLoopVersion: input.growthLoopVersion,
      },
    }),
  );
}

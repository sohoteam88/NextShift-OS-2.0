import { createLogEvent, createLogEventId } from '@/lib/observability/event-envelope';
import { ERROR_EVENTS, OBSERVABILITY_MODULES, RUNTIME_EVENTS } from '@/lib/observability/event-catalog';
import { emitServerEvent, type TelemetryEmitResult } from '@/lib/observability/server-telemetry';

type RuntimeExecutionMode = 'multi_agent' | 'direct_agent' | 'recommended_agents';
type RuntimeExecutionSource = 'assignment' | 'manual_override';

interface RuntimeTelemetryBase {
  userId: string;
  tenantId?: string;
  assignmentId: string;
  agentId: string;
  executionMode: RuntimeExecutionMode;
  executionSource: RuntimeExecutionSource;
  executionId?: string;
  correlationId?: string;
  extra?: Record<string, unknown>;
}

interface RuntimeExecutionCompletedInput extends RuntimeTelemetryBase {
  durationMs: number;
  resultStatus?: string;
}

interface RuntimeExecutionFailedInput extends RuntimeTelemetryBase {
  durationMs?: number;
  failureCode: string;
}

interface ExternalServiceFailedInput {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  module?: string;
  provider: string;
  operation: string;
  statusCode?: number | null;
  failureCode: string;
  extra?: Record<string, unknown>;
}

export function createRuntimeTelemetryContext(input: {
  userId: string;
  tenantId?: string;
  agentId: string;
  executionMode: RuntimeExecutionMode;
  executionSource: RuntimeExecutionSource;
  assignmentId?: string;
}) {
  const correlationId = createLogEventId('corr');

  return {
    userId: input.userId,
    tenantId: input.tenantId,
    agentId: input.agentId,
    executionMode: input.executionMode,
    executionSource: input.executionSource,
    assignmentId: input.assignmentId ?? createLogEventId('runtime_assignment'),
    executionId: createLogEventId('runtime_execution'),
    correlationId,
  };
}

function emitRuntimeEvent(input: RuntimeTelemetryBase & {
  eventName: string;
  severity: 'INFO' | 'ERROR';
  durationMs?: number;
  failureCode?: string;
  resultStatus?: string;
}): TelemetryEmitResult {
  return emitServerEvent(
    createLogEvent({
      eventName: input.eventName,
      severity: input.severity,
      module: OBSERVABILITY_MODULES.agentRuntime,
      userId: input.userId,
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      properties: {
        userId: input.userId,
        tenantId: input.tenantId ?? null,
        assignmentId: input.assignmentId,
        agentId: input.agentId,
        executionMode: input.executionMode,
        executionSource: input.executionSource,
        executionId: input.executionId ?? null,
        durationMs: input.durationMs ?? null,
        failureCode: input.failureCode ?? null,
        resultStatus: input.resultStatus ?? null,
        correlationId: input.correlationId ?? null,
        ...(input.extra ?? {}),
      },
    }),
  );
}

export function emitRuntimeAssignmentReceived(input: RuntimeTelemetryBase) {
  return emitRuntimeEvent({
    ...input,
    eventName: RUNTIME_EVENTS.assignmentReceived,
    severity: 'INFO',
  });
}

export function emitRuntimeExecutionStarted(input: RuntimeTelemetryBase) {
  return emitRuntimeEvent({
    ...input,
    eventName: RUNTIME_EVENTS.executionStarted,
    severity: 'INFO',
  });
}

export function emitRuntimeExecutionCompleted(input: RuntimeExecutionCompletedInput) {
  return emitRuntimeEvent({
    ...input,
    eventName: RUNTIME_EVENTS.executionCompleted,
    severity: 'INFO',
    resultStatus: input.resultStatus ?? 'completed',
  });
}

export function emitRuntimeExecutionFailed(input: RuntimeExecutionFailedInput) {
  return emitRuntimeEvent({
    ...input,
    eventName: RUNTIME_EVENTS.executionFailed,
    severity: 'ERROR',
  });
}

export function emitExternalServiceFailed(input: ExternalServiceFailedInput) {
  return emitServerEvent(
    createLogEvent({
      eventName: ERROR_EVENTS.externalServiceFailed,
      severity: 'ERROR',
      module: input.module ?? OBSERVABILITY_MODULES.agentRuntime,
      userId: input.userId,
      tenantId: input.tenantId,
      correlationId: input.correlationId,
      properties: {
        module: input.module ?? OBSERVABILITY_MODULES.agentRuntime,
        provider: input.provider,
        operation: input.operation,
        statusCode: input.statusCode ?? null,
        failureCode: input.failureCode,
        correlationId: input.correlationId ?? null,
        ...(input.extra ?? {}),
      },
    }),
  );
}

import {
  activateRuntimeCapability,
  createRuntimeCapability,
  createRuntimeContext,
  createRuntimeDiagnostics,
  createRuntimeEvent,
  deriveRuntimeContext,
  type RuntimeCapability,
  type RuntimeContext,
  type RuntimeDiagnostics,
  type RuntimeEvent,
} from '@nextshift/runtime';
import {
  getAnalyticsProjection,
  type AnalyticsProjection,
} from '../adapters/AnalyticsProjectionAdapter';
import { isRuntimeAnalyticsEnabled } from './runtime-analytics-flag';

export type AnalyticsRuntimeSource =
  | 'analytics-center'
  | 'member-dashboard'
  | 'leader-dashboard'
  | 'operator-dashboard'
  | 'api';

export type AnalyticsRuntimeDiagnosticsStatus = 'healthy' | 'degraded' | 'failed';
export type AnalyticsRuntimeConfidence = 'derived' | 'fallback';

export type AnalyticsRuntimeMetadata = {
  enabled: boolean;
  mode: 'legacy' | 'runtime';
  source: AnalyticsRuntimeSource;
  fallback: boolean;
  confidence: AnalyticsRuntimeConfidence;
  contextId?: string;
  correlationId?: string;
  capabilityId?: string;
  capabilityRuntimeId?: string;
  eventId?: string;
  eventType?: string;
  diagnosticsId?: string;
  diagnosticsStatus?: AnalyticsRuntimeDiagnosticsStatus;
  warning?: 'runtime-analytics-adapter-fallback' | 'runtime-analytics-adapter-invalid-output';
  errorKind?: string;
};

export type AnalyticsRuntimeProjectionType = 'analytics-center';

export type ResolveAnalyticsRuntimeInput = {
  userId: string;
  tenantId?: string;
  source: AnalyticsRuntimeSource;
  projectionType: AnalyticsRuntimeProjectionType;
  workspaceFocus?: string;
};

export type ResolveAnalyticsRuntimeOutput = {
  projection: AnalyticsProjection;
  runtime: AnalyticsRuntimeMetadata;
};

type RuntimeArtifacts = {
  context: RuntimeContext;
  capability: RuntimeCapability;
  event: RuntimeEvent;
  diagnostics: RuntimeDiagnostics;
};

type AnalyticsRuntimeLogger = Pick<Console, 'warn'>;
type AnalyticsRuntimeWarning = NonNullable<AnalyticsRuntimeMetadata['warning']>;

type AnalyticsRuntimeAdapterDependencies = {
  isEnabled?: () => boolean;
  getProjection?: typeof getAnalyticsProjection;
  createRuntimeArtifacts?: (input: {
    projection: AnalyticsProjection;
    source: AnalyticsRuntimeSource;
    projectionType: AnalyticsRuntimeProjectionType;
    tenantId?: string;
    userId?: string;
    workspaceFocus?: string;
  }) => RuntimeArtifacts;
  logger?: AnalyticsRuntimeLogger;
};

const CAPABILITY_ID = 'analytics.projection.resolve';
const CAPABILITY_VERSION = '1.0.0';
const EVENT_SOURCE = 'nextshift.analytics';
const DIAGNOSTICS_ID = 'analytics-runtime-adapter';

export async function resolveAnalyticsRuntimeProjection(
  input: ResolveAnalyticsRuntimeInput,
  dependencies: AnalyticsRuntimeAdapterDependencies = {},
): Promise<ResolveAnalyticsRuntimeOutput> {
  const loadProjection = dependencies.getProjection ?? getAnalyticsProjection;
  const projection = await loadProjection(input.userId, input.tenantId);
  const enabled = dependencies.isEnabled?.() ?? isRuntimeAnalyticsEnabled();

  if (!enabled) {
    return {
      projection,
      runtime: {
        enabled: false,
        mode: 'legacy',
        source: input.source,
        fallback: false,
        confidence: 'derived',
      },
    };
  }

  try {
    const artifacts = (dependencies.createRuntimeArtifacts ?? createDefaultRuntimeArtifacts)({
      projection,
      source: input.source,
      projectionType: input.projectionType,
      tenantId: input.tenantId,
      userId: input.userId,
      workspaceFocus: input.workspaceFocus,
    });
    const eventType = eventTypeForProjection();
    const runtime = {
      enabled: true,
      mode: 'runtime',
      source: input.source,
      fallback: false,
      confidence: 'derived',
      contextId: artifacts.context.id,
      correlationId: artifacts.context.correlationId,
      capabilityId: artifacts.capability.identity.capabilityId,
      capabilityRuntimeId: artifacts.capability.id,
      eventId: artifacts.event.id,
      eventType,
      diagnosticsId: artifacts.diagnostics.id,
      diagnosticsStatus: 'healthy',
    } satisfies AnalyticsRuntimeMetadata;

    if (!isRuntimeMetadataComplete(runtime)) {
      warnRuntimeFallback(dependencies.logger, input, 'runtime-analytics-adapter-invalid-output');
      return legacyRuntimeFallback(
        projection,
        input.source,
        'runtime-analytics-adapter-invalid-output',
      );
    }

    return { projection, runtime };
  } catch (error) {
    const errorKind = classifyRuntimeAdapterError(error);
    warnRuntimeFallback(
      dependencies.logger,
      input,
      'runtime-analytics-adapter-fallback',
      errorKind,
    );
    return legacyRuntimeFallback(
      projection,
      input.source,
      'runtime-analytics-adapter-fallback',
      errorKind,
    );
  }
}

function createDefaultRuntimeArtifacts(input: {
  projection: AnalyticsProjection;
  source: AnalyticsRuntimeSource;
  projectionType: AnalyticsRuntimeProjectionType;
  tenantId?: string;
  userId?: string;
  workspaceFocus?: string;
}): RuntimeArtifacts {
  const metadata = safeRuntimeMetadata(input);
  const context = createRuntimeContext({
    scope: 'capability',
    metadata,
  });
  const capability = activateRuntimeCapability(createRuntimeCapability({
    identity: {
      capabilityId: CAPABILITY_ID,
      kind: 'workflow',
      workspaceId: input.tenantId,
      version: CAPABILITY_VERSION,
    },
    context,
    metadata,
  }));
  const eventContext = deriveRuntimeContext(context, {
    scope: 'event',
    metadata,
  });
  const event = createRuntimeEvent({
    identity: {
      eventId: eventTypeForProjection(),
      type: eventTypeForProjection(),
      source: EVENT_SOURCE,
      workspaceId: input.tenantId,
      capabilityId: CAPABILITY_ID,
      version: CAPABILITY_VERSION,
    },
    context: eventContext,
    capability,
    payload: eventPayload(input),
    metadata,
  });
  const diagnostics = createRuntimeDiagnostics({
    identity: {
      diagnosticsId: DIAGNOSTICS_ID,
      component: 'analytics',
      scope: 'capability',
      version: CAPABILITY_VERSION,
    },
    health: 'healthy',
    status: 'ok',
    event,
    metadata,
  });

  return { context, capability, event, diagnostics };
}

function safeRuntimeMetadata(input: {
  projection: AnalyticsProjection;
  source: AnalyticsRuntimeSource;
  projectionType: AnalyticsRuntimeProjectionType;
  tenantId?: string;
  userId?: string;
  workspaceFocus?: string;
}) {
  const metadata: Record<string, string> = {
    module: 'analytics',
    source: input.source,
    projectionType: input.projectionType,
    status: 'resolved',
    readinessStage: input.projection.readiness.stage,
    progressStage: input.projection.progress.stage,
    growthHealth: input.projection.growth.health,
  };

  if (input.workspaceFocus) metadata.workspaceFocus = input.workspaceFocus;
  if (input.tenantId) metadata.tenantId = input.tenantId;
  if (input.userId) metadata.userId = input.userId;

  return metadata;
}

function eventPayload(input: {
  projection: AnalyticsProjection;
  source: AnalyticsRuntimeSource;
  projectionType: AnalyticsRuntimeProjectionType;
  workspaceFocus?: string;
}) {
  const payload: Record<string, string | number> = {
    module: 'analytics',
    source: input.source,
    projectionType: input.projectionType,
    status: 'resolved',
    readinessValue: input.projection.readiness.value,
    progressValue: input.projection.progress.value,
    growthValue: input.projection.growth.value,
  };

  if (input.workspaceFocus) payload.workspaceFocus = input.workspaceFocus;

  return payload;
}

function eventTypeForProjection() {
  return 'runtime.analytics.projection.resolved';
}

function classifyRuntimeAdapterError(error: unknown) {
  if (error instanceof Error && error.constructor.name.trim()) {
    return error.constructor.name;
  }

  return 'unknown';
}

function isRuntimeMetadataComplete(runtime: AnalyticsRuntimeMetadata) {
  return Boolean(
    runtime.contextId &&
      runtime.correlationId &&
      runtime.capabilityId &&
      runtime.capabilityRuntimeId &&
      runtime.eventId &&
      runtime.eventType &&
      runtime.diagnosticsId &&
      runtime.diagnosticsStatus,
  );
}

function legacyRuntimeFallback(
  projection: AnalyticsProjection,
  source: AnalyticsRuntimeSource,
  warning: AnalyticsRuntimeWarning,
  errorKind?: string,
): ResolveAnalyticsRuntimeOutput {
  const runtime: AnalyticsRuntimeMetadata = {
    enabled: true,
    mode: 'legacy',
    source,
    fallback: true,
    confidence: 'fallback',
    diagnosticsStatus: 'degraded',
    warning,
  };

  if (errorKind) runtime.errorKind = errorKind;

  return {
    projection,
    runtime,
  };
}

function warnRuntimeFallback(
  logger: AnalyticsRuntimeLogger | undefined,
  input: ResolveAnalyticsRuntimeInput,
  warning: AnalyticsRuntimeWarning,
  errorKind?: string,
) {
  const payload: Record<string, string | undefined> = {
    warning,
    source: input.source,
    projectionType: input.projectionType,
    workspaceFocus: input.workspaceFocus,
    status: 'resolved',
  };

  if (errorKind) payload.errorKind = errorKind;

  (logger ?? console).warn('[analytics-runtime-adapter] falling back to legacy projection', payload);
}

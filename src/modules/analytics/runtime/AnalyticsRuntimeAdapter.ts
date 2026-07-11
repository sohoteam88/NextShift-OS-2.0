import {
  activateRuntimeCapability,
  createRuntimeAdapter,
  createRuntimeCapability,
  createRuntimeContext,
  createRuntimeDiagnostics,
  createRuntimeEvent,
  deriveRuntimeContext,
  type RuntimeAdapterBaseMetadata,
  type RuntimeCapability,
  type RuntimeContext,
  type RuntimeDiagnostics,
  type RuntimeEvent,
} from '@nextshift/runtime';
import {
  getAnalyticsProjection,
  type AnalyticsProjection,
} from '../adapters/AnalyticsProjectionAdapter';

export type AnalyticsRuntimeSource =
  | 'analytics-center'
  | 'member-dashboard'
  | 'leader-dashboard'
  | 'operator-dashboard'
  | 'api';

export type AnalyticsRuntimeDiagnosticsStatus = 'healthy' | 'degraded' | 'failed';
export type AnalyticsRuntimeConfidence = 'derived' | 'fallback';

type AnalyticsRuntimeWarning =
  | 'runtime-analytics-adapter-fallback'
  | 'runtime-analytics-adapter-invalid-output';

export type AnalyticsRuntimeMetadata = RuntimeAdapterBaseMetadata<
  AnalyticsRuntimeSource,
  AnalyticsRuntimeConfidence,
  AnalyticsRuntimeWarning
> & {
  diagnosticsStatus?: AnalyticsRuntimeDiagnosticsStatus;
  warning?: AnalyticsRuntimeWarning;
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

type AnalyticsRuntimeAdapterDependencies = {
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

const analyticsRuntimeAdapter = createRuntimeAdapter<
  ResolveAnalyticsRuntimeInput,
  AnalyticsProjection,
  AnalyticsRuntimeSource,
  AnalyticsRuntimeConfidence,
  AnalyticsRuntimeWarning,
  AnalyticsRuntimeMetadata,
  ResolveAnalyticsRuntimeOutput,
  AnalyticsRuntimeAdapterDependencies
>({
  resolveLegacy: (input, dependencies) =>
    (dependencies.getProjection ?? getAnalyticsProjection)(input.userId, input.tenantId),
  isEnabled: () => true,
  getSource: (input) => input.source,
  getConfidence: () => 'derived',
  getFallbackConfidence: () => 'fallback',
  createRuntimeMetadata: (input, projection, dependencies) => {
    const artifacts = (dependencies.createRuntimeArtifacts ?? createDefaultRuntimeArtifacts)({
      projection,
      source: input.source,
      projectionType: input.projectionType,
      tenantId: input.tenantId,
      userId: input.userId,
      workspaceFocus: input.workspaceFocus,
    });
    const eventType = eventTypeForProjection();

    return {
      contextId: artifacts.context.id,
      correlationId: artifacts.context.correlationId,
      capabilityId: artifacts.capability.identity.capabilityId,
      capabilityRuntimeId: artifacts.capability.id,
      eventId: artifacts.event.id,
      eventType,
      diagnosticsId: artifacts.diagnostics.id,
      diagnosticsStatus: 'healthy',
    };
  },
  composeOutput: (projection, runtime) => ({ projection, runtime }),
  fallbackWarning: 'runtime-analytics-adapter-fallback',
  invalidOutputWarning: 'runtime-analytics-adapter-invalid-output',
  warningLogMessage: '[analytics-runtime-adapter] falling back to legacy projection',
  getLogger: (dependencies) => dependencies.logger,
  createWarningPayload: ({ input, warning, errorKind }) => {
    const payload: Record<string, string | undefined> = {
      warning,
      source: input.source,
      projectionType: input.projectionType,
      workspaceFocus: input.workspaceFocus,
      status: 'resolved',
    };

    if (errorKind) payload.errorKind = errorKind;

    return payload;
  },
});

export async function resolveAnalyticsRuntimeProjection(
  input: ResolveAnalyticsRuntimeInput,
  dependencies: AnalyticsRuntimeAdapterDependencies = {},
): Promise<ResolveAnalyticsRuntimeOutput> {
  return analyticsRuntimeAdapter.resolveAsync(input, dependencies);
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

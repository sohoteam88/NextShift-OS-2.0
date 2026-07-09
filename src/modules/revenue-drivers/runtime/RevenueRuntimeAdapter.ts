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
  resolveRevenueDriverIntent,
  type RevenueDriverIntentResolution,
} from '../constants/revenue-driver-intents';
import { isRuntimeRevenueEnabled } from './runtime-revenue-flag';

export type RevenueRuntimeSource = 'hub' | 'dashboard' | 'deep-link' | 'api';

export type RevenueRuntimeDiagnosticsStatus = 'healthy' | 'degraded' | 'failed';

export type RevenueRuntimeMetadata = {
  enabled: boolean;
  mode: 'legacy' | 'runtime';
  source: RevenueRuntimeSource;
  fallback: boolean;
  confidence: number;
  contextId?: string;
  correlationId?: string;
  capabilityId?: string;
  capabilityRuntimeId?: string;
  eventId?: string;
  eventType?: string;
  diagnosticsId?: string;
  diagnosticsStatus?: RevenueRuntimeDiagnosticsStatus;
  warning?: 'runtime-adapter-fallback' | 'runtime-adapter-invalid-output';
  errorKind?: string;
};

export type ResolveRevenueRuntimeInput = {
  route: string;
  intent?: string | null;
  tenantId?: string;
  userId?: string;
  source: RevenueRuntimeSource;
};

export type ResolveRevenueRuntimeOutput = {
  resolution: RevenueDriverIntentResolution;
  runtime: RevenueRuntimeMetadata;
};

type RuntimeArtifacts = {
  context: RuntimeContext;
  capability: RuntimeCapability;
  event: RuntimeEvent;
  diagnostics: RuntimeDiagnostics;
};

type RevenueRuntimeLogger = Pick<Console, 'warn'>;
type RevenueRuntimeWarning = NonNullable<RevenueRuntimeMetadata['warning']>;

type RevenueRuntimeAdapterDependencies = {
  isEnabled?: () => boolean;
  resolveIntent?: typeof resolveRevenueDriverIntent;
  createRuntimeArtifacts?: (input: {
    resolution: RevenueDriverIntentResolution;
    source: RevenueRuntimeSource;
    tenantId?: string;
    userId?: string;
  }) => RuntimeArtifacts;
  logger?: RevenueRuntimeLogger;
};

const CAPABILITY_ID = 'revenue.driver.intent.resolve';
const CAPABILITY_VERSION = '1.0.0';
const EVENT_SOURCE = 'nextshift.revenue-drivers';
const DIAGNOSTICS_ID = 'revenue-runtime-adapter';

export function resolveRevenueRuntimeIntent(
  input: ResolveRevenueRuntimeInput,
  dependencies: RevenueRuntimeAdapterDependencies = {},
): ResolveRevenueRuntimeOutput {
  const resolveIntent = dependencies.resolveIntent ?? resolveRevenueDriverIntent;
  const resolution = resolveIntent({ route: input.route, intent: input.intent });
  const confidence = confidenceForResolution(resolution);
  const enabled = dependencies.isEnabled?.() ?? isRuntimeRevenueEnabled();

  if (!enabled) {
    return {
      resolution,
      runtime: {
        enabled: false,
        mode: 'legacy',
        source: input.source,
        fallback: false,
        confidence,
      },
    };
  }

  try {
    const artifacts = (dependencies.createRuntimeArtifacts ?? createDefaultRuntimeArtifacts)({
      resolution,
      source: input.source,
      tenantId: input.tenantId,
      userId: input.userId,
    });
    const eventType = eventTypeForResolution(resolution);
    const runtime = {
      enabled: true,
      mode: 'runtime',
      source: input.source,
      fallback: false,
      confidence,
      contextId: artifacts.context.id,
      correlationId: artifacts.context.correlationId,
      capabilityId: artifacts.capability.identity.capabilityId,
      capabilityRuntimeId: artifacts.capability.id,
      eventId: artifacts.event.id,
      eventType,
      diagnosticsId: artifacts.diagnostics.id,
      diagnosticsStatus: 'healthy',
    } satisfies RevenueRuntimeMetadata;

    if (!isRuntimeMetadataComplete(runtime)) {
      warnRuntimeFallback(dependencies.logger, input, resolution, 'runtime-adapter-invalid-output');
      return legacyRuntimeFallback(resolution, input.source, confidence, 'runtime-adapter-invalid-output');
    }

    return { resolution, runtime };
  } catch (error) {
    const errorKind = classifyRuntimeAdapterError(error);
    warnRuntimeFallback(dependencies.logger, input, resolution, 'runtime-adapter-fallback', errorKind);
    return legacyRuntimeFallback(
      resolution,
      input.source,
      confidence,
      'runtime-adapter-fallback',
      errorKind,
    );
  }
}

function createDefaultRuntimeArtifacts(input: {
  resolution: RevenueDriverIntentResolution;
  source: RevenueRuntimeSource;
  tenantId?: string;
  userId?: string;
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
      eventId: eventTypeForResolution(input.resolution),
      type: eventTypeForResolution(input.resolution),
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
      component: 'revenue-drivers',
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
  resolution: RevenueDriverIntentResolution;
  source: RevenueRuntimeSource;
  tenantId?: string;
  userId?: string;
}) {
  const metadata: Record<string, string> = {
    module: 'revenue-drivers',
    source: input.source,
    route: input.resolution.route,
    status: input.resolution.status,
  };

  if (input.resolution.intent) metadata.intent = input.resolution.intent;
  if (input.resolution.status === 'resolved') {
    metadata.driverId = input.resolution.driverId;
    metadata.toolId = input.resolution.toolId;
  }
  if (input.tenantId) metadata.tenantId = input.tenantId;
  if (input.userId) metadata.userId = input.userId;

  return metadata;
}

function eventPayload(input: {
  resolution: RevenueDriverIntentResolution;
  source: RevenueRuntimeSource;
}) {
  const payload: Record<string, string> = {
    route: input.resolution.route,
    status: input.resolution.status,
    source: input.source,
  };

  if (input.resolution.intent) payload.intent = input.resolution.intent;
  if (input.resolution.status === 'resolved') {
    payload.driverId = input.resolution.driverId;
    payload.toolId = input.resolution.toolId;
  }

  return payload;
}

function eventTypeForResolution(resolution: RevenueDriverIntentResolution) {
  return `runtime.revenue.intent.${resolution.status}`;
}

function confidenceForResolution(resolution: RevenueDriverIntentResolution) {
  if (resolution.status === 'resolved') return 1;
  if (resolution.status === 'fallback') return 0.35;
  return 0;
}

function classifyRuntimeAdapterError(error: unknown) {
  if (error instanceof Error && error.constructor.name.trim()) {
    return error.constructor.name;
  }

  return 'unknown';
}

function isRuntimeMetadataComplete(runtime: RevenueRuntimeMetadata) {
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
  resolution: RevenueDriverIntentResolution,
  source: RevenueRuntimeSource,
  confidence: number,
  warning: RevenueRuntimeWarning,
  errorKind?: string,
): ResolveRevenueRuntimeOutput {
  const runtime: RevenueRuntimeMetadata = {
    enabled: true,
    mode: 'legacy',
    source,
    fallback: true,
    confidence,
    diagnosticsStatus: 'degraded',
    warning,
  };

  if (errorKind) runtime.errorKind = errorKind;

  return {
    resolution,
    runtime,
  };
}

function warnRuntimeFallback(
  logger: RevenueRuntimeLogger | undefined,
  input: ResolveRevenueRuntimeInput,
  resolution: RevenueDriverIntentResolution,
  warning: RevenueRuntimeWarning,
  errorKind?: string,
) {
  const payload: Record<string, string | null> = {
    warning,
    route: input.route,
    intent: input.intent ?? null,
    status: resolution.status,
    source: input.source,
  };

  if (errorKind) payload.errorKind = errorKind;

  (logger ?? console).warn('[revenue-runtime-adapter] falling back to legacy resolver', payload);
}

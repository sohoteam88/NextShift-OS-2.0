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
import type { BusinessState } from '../contracts/BusinessState';
import { isRuntimeBusinessStateEnabled } from './runtime-business-state-flag';

export type BusinessStateRuntimeSource =
  | 'business-state-service'
  | 'command-center'
  | 'mission-engine'
  | 'dashboard'
  | 'api';

export type BusinessStateRuntimeDiagnosticsStatus = 'healthy' | 'degraded' | 'failed';
export type BusinessStateRuntimeConfidence = BusinessState['readiness']['confidence'] | 'fallback';

type BusinessStateRuntimeWarning =
  | 'runtime-business-state-adapter-fallback'
  | 'runtime-business-state-adapter-invalid-output';

export type BusinessStateRuntimeMetadata = RuntimeAdapterBaseMetadata<
  BusinessStateRuntimeSource,
  BusinessStateRuntimeConfidence,
  BusinessStateRuntimeWarning
> & {
  diagnosticsStatus?: BusinessStateRuntimeDiagnosticsStatus;
  warning?: BusinessStateRuntimeWarning;
};

export type ResolveBusinessStateRuntimeInput = {
  userId: string;
  tenantId?: string;
  source: BusinessStateRuntimeSource;
};

export type ResolveBusinessStateRuntimeOutput = {
  state: BusinessState;
  runtime: BusinessStateRuntimeMetadata;
};

type RuntimeArtifacts = {
  context: RuntimeContext;
  capability: RuntimeCapability;
  event: RuntimeEvent;
  diagnostics: RuntimeDiagnostics;
};

type BusinessStateRuntimeLogger = Pick<Console, 'warn'>;

export type BusinessStateRuntimeAdapterDependencies = {
  isEnabled?: () => boolean;
  resolveBusinessState?: (input: ResolveBusinessStateRuntimeInput) => Promise<BusinessState>;
  createRuntimeArtifacts?: (input: {
    state: BusinessState;
    source: BusinessStateRuntimeSource;
    tenantId?: string;
    userId?: string;
  }) => RuntimeArtifacts;
  logger?: BusinessStateRuntimeLogger;
};

const CAPABILITY_ID = 'business-state.resolve';
const CAPABILITY_VERSION = '1.0.0';
const EVENT_SOURCE = 'nextshift.business-state';
const DIAGNOSTICS_ID = 'business-state-runtime-adapter';

const businessStateRuntimeAdapter = createRuntimeAdapter<
  ResolveBusinessStateRuntimeInput,
  BusinessState,
  BusinessStateRuntimeSource,
  BusinessStateRuntimeConfidence,
  BusinessStateRuntimeWarning,
  BusinessStateRuntimeMetadata,
  ResolveBusinessStateRuntimeOutput,
  BusinessStateRuntimeAdapterDependencies
>({
  resolveLegacy: (input, dependencies) => {
    if (!dependencies.resolveBusinessState) {
      throw new TypeError('Business State Runtime Adapter requires a legacy business-state resolver.');
    }

    return dependencies.resolveBusinessState(input);
  },
  isEnabled: (_input, _state, dependencies) =>
    dependencies.isEnabled?.() ?? isRuntimeBusinessStateEnabled(),
  getSource: (input) => input.source,
  getConfidence: (_input, state) => state.readiness.confidence,
  getFallbackConfidence: () => 'fallback',
  createRuntimeMetadata: (input, state, dependencies) => {
    const artifacts = (dependencies.createRuntimeArtifacts ?? createDefaultRuntimeArtifacts)({
      state,
      source: input.source,
      tenantId: input.tenantId,
      userId: input.userId,
    });
    const eventType = eventTypeForState(state);

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
  composeOutput: (state, runtime) => ({ state, runtime }),
  fallbackWarning: 'runtime-business-state-adapter-fallback',
  invalidOutputWarning: 'runtime-business-state-adapter-invalid-output',
  warningLogMessage: '[business-state-runtime-adapter] falling back to legacy business-state resolver',
  getLogger: (dependencies) => dependencies.logger,
  createWarningPayload: ({ input, legacyOutput: state, warning, errorKind }) => {
    const payload: Record<string, string | number | undefined> = {
      warning,
      source: input.source,
      stage: state.stage,
      currentState: state.stateResult.currentState,
      nextState: state.stateResult.nextState,
      readinessScore: state.stateResult.readinessScore,
      readinessConfidence: state.readiness.confidence,
      bottleneckCount: state.bottlenecks.length,
      opportunityCount: state.opportunities.length,
    };

    if (errorKind) payload.errorKind = errorKind;

    return payload;
  },
});

export async function resolveBusinessStateRuntime(
  input: ResolveBusinessStateRuntimeInput,
  dependencies: BusinessStateRuntimeAdapterDependencies = {},
): Promise<ResolveBusinessStateRuntimeOutput> {
  return businessStateRuntimeAdapter.resolveAsync(input, dependencies);
}

function createDefaultRuntimeArtifacts(input: {
  state: BusinessState;
  source: BusinessStateRuntimeSource;
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
      eventId: eventTypeForState(input.state),
      type: eventTypeForState(input.state),
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
      component: 'business-state',
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
  state: BusinessState;
  source: BusinessStateRuntimeSource;
  tenantId?: string;
  userId?: string;
}) {
  const metadata: Record<string, string> = {
    module: 'business-state',
    source: input.source,
    stage: input.state.stage,
    currentState: input.state.stateResult.currentState,
    nextState: input.state.stateResult.nextState,
    readinessScore: String(input.state.stateResult.readinessScore),
    readinessConfidence: input.state.readiness.confidence,
  };

  if (input.tenantId) metadata.tenantId = input.tenantId;
  if (input.userId) metadata.userId = input.userId;

  return metadata;
}

function eventPayload(input: {
  state: BusinessState;
  source: BusinessStateRuntimeSource;
}) {
  return {
    module: 'business-state',
    source: input.source,
    stage: input.state.stage,
    currentState: input.state.stateResult.currentState,
    nextState: input.state.stateResult.nextState,
    readinessScore: input.state.stateResult.readinessScore,
    bottleneckCount: input.state.bottlenecks.length,
    opportunityCount: input.state.opportunities.length,
  };
}

function eventTypeForState(state: BusinessState) {
  return `runtime.business-state.${state.stateResult.currentState.toLowerCase().replaceAll('_', '-')}`;
}

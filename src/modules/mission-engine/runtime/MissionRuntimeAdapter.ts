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
import type {
  MissionAuthoritySnapshot,
  MissionLifecycleStatus,
} from '../contracts/MissionAuthority';
import { isRuntimeMissionEnabled } from './runtime-mission-flag';

export type MissionRuntimeSource =
  | 'authority-service'
  | 'dashboard'
  | 'api'
  | 'onboarding'
  | 'journey';

export type MissionRuntimeDiagnosticsStatus = 'healthy' | 'degraded' | 'failed';
export type MissionRuntimeConfidence = MissionAuthoritySnapshot['confidence'] | 'fallback';

type MissionRuntimeWarning =
  | 'runtime-mission-adapter-fallback'
  | 'runtime-mission-adapter-invalid-output';

export type MissionRuntimeMetadata = RuntimeAdapterBaseMetadata<
  MissionRuntimeSource,
  MissionRuntimeConfidence,
  MissionRuntimeWarning
> & {
  diagnosticsStatus?: MissionRuntimeDiagnosticsStatus;
  warning?: MissionRuntimeWarning;
};

export type ResolveMissionRuntimeInput = {
  userId: string;
  tenantId?: string;
  source: MissionRuntimeSource;
};

export type ResolveMissionRuntimeOutput = {
  authority: MissionAuthoritySnapshot;
  runtime: MissionRuntimeMetadata;
};

type RuntimeArtifacts = {
  context: RuntimeContext;
  capability: RuntimeCapability;
  event: RuntimeEvent;
  diagnostics: RuntimeDiagnostics;
};

type MissionRuntimeLogger = Pick<Console, 'warn'>;

export type MissionRuntimeAdapterDependencies = {
  isEnabled?: () => boolean;
  resolveAuthority?: (input: ResolveMissionRuntimeInput) => Promise<MissionAuthoritySnapshot>;
  createRuntimeArtifacts?: (input: {
    authority: MissionAuthoritySnapshot;
    source: MissionRuntimeSource;
    tenantId?: string;
    userId?: string;
  }) => RuntimeArtifacts;
  logger?: MissionRuntimeLogger;
};

const CAPABILITY_ID = 'mission.authority.resolve';
const CAPABILITY_VERSION = '1.0.0';
const EVENT_SOURCE = 'nextshift.mission-engine';
const DIAGNOSTICS_ID = 'mission-runtime-adapter';

const missionRuntimeAdapter = createRuntimeAdapter<
  ResolveMissionRuntimeInput,
  MissionAuthoritySnapshot,
  MissionRuntimeSource,
  MissionRuntimeConfidence,
  MissionRuntimeWarning,
  MissionRuntimeMetadata,
  ResolveMissionRuntimeOutput,
  MissionRuntimeAdapterDependencies
>({
  resolveLegacy: (input, dependencies) => {
    if (!dependencies.resolveAuthority) {
      throw new TypeError('Mission Runtime Adapter requires a legacy authority resolver.');
    }

    return dependencies.resolveAuthority(input);
  },
  isEnabled: (_input, _authority, dependencies) =>
    dependencies.isEnabled?.() ?? isRuntimeMissionEnabled(),
  getSource: (input) => input.source,
  getConfidence: (_input, authority) => authority.confidence,
  getFallbackConfidence: () => 'fallback',
  createRuntimeMetadata: (input, authority, dependencies) => {
    const artifacts = (dependencies.createRuntimeArtifacts ?? createDefaultRuntimeArtifacts)({
      authority,
      source: input.source,
      tenantId: input.tenantId,
      userId: input.userId,
    });
    const eventType = eventTypeForAuthority(authority);

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
  composeOutput: (authority, runtime) => ({ authority, runtime }),
  fallbackWarning: 'runtime-mission-adapter-fallback',
  invalidOutputWarning: 'runtime-mission-adapter-invalid-output',
  warningLogMessage: '[mission-runtime-adapter] falling back to legacy authority resolver',
  getLogger: (dependencies) => dependencies.logger,
  createWarningPayload: ({ input, legacyOutput: authority, warning, errorKind }) => {
    const payload: Record<string, string | number | undefined> = {
      warning,
      source: input.source,
      missionId: authority.currentMission.id,
      missionLifecycle: authority.lifecycle,
      businessStage: authority.businessStage,
      bottleneck: authority.bottleneck,
      confidence: authority.confidence,
    };

    if (errorKind) payload.errorKind = errorKind;

    return payload;
  },
});

export async function resolveMissionRuntimeAuthority(
  input: ResolveMissionRuntimeInput,
  dependencies: MissionRuntimeAdapterDependencies = {},
): Promise<ResolveMissionRuntimeOutput> {
  return missionRuntimeAdapter.resolveAsync(input, dependencies);
}

function createDefaultRuntimeArtifacts(input: {
  authority: MissionAuthoritySnapshot;
  source: MissionRuntimeSource;
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
      eventId: eventTypeForAuthority(input.authority),
      type: eventTypeForAuthority(input.authority),
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
      component: 'mission-engine',
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
  authority: MissionAuthoritySnapshot;
  source: MissionRuntimeSource;
  tenantId?: string;
  userId?: string;
}) {
  const metadata: Record<string, string> = {
    module: 'mission-engine',
    source: input.source,
    missionId: input.authority.currentMission.id,
    missionLifecycle: input.authority.lifecycle,
    businessStage: input.authority.businessStage,
    bottleneck: input.authority.bottleneck,
    missionType: input.authority.missionPlan.missionType,
    priority: input.authority.priorityAction.priority,
  };

  if (input.tenantId) metadata.tenantId = input.tenantId;
  if (input.userId) metadata.userId = input.userId;

  return metadata;
}

function eventPayload(input: {
  authority: MissionAuthoritySnapshot;
  source: MissionRuntimeSource;
}) {
  return {
    module: 'mission-engine',
    source: input.source,
    missionId: input.authority.currentMission.id,
    missionLifecycle: input.authority.lifecycle,
    businessStage: input.authority.businessStage,
    bottleneck: input.authority.bottleneck,
    missionType: input.authority.missionPlan.missionType,
    priority: input.authority.priorityAction.priority,
    completionPercentage: input.authority.progress.completionPercentage,
  };
}

function eventTypeForAuthority(authority: {
  lifecycle: MissionLifecycleStatus;
}) {
  return `runtime.mission.authority.${authority.lifecycle.toLowerCase()}`;
}

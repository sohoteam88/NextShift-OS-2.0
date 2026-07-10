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
import type { CRMCommandCenter } from '../types';
import { isRuntimeCrmEnabled } from './runtime-crm-flag';

export type CrmRuntimeSource =
  | 'crm-center-service'
  | 'crm-center'
  | 'dashboard'
  | 'command-center'
  | 'api';

export type CrmRuntimeDiagnosticsStatus = 'healthy' | 'degraded' | 'failed';
export type CrmRuntimeConfidence = number | 'fallback';

type CrmRuntimeWarning =
  | 'runtime-crm-adapter-fallback'
  | 'runtime-crm-adapter-invalid-output';

export type CrmRuntimeMetadata = RuntimeAdapterBaseMetadata<
  CrmRuntimeSource,
  CrmRuntimeConfidence,
  CrmRuntimeWarning
> & {
  diagnosticsStatus?: CrmRuntimeDiagnosticsStatus;
  warning?: CrmRuntimeWarning;
};

export type ResolveCrmRuntimeInput = {
  userId: string;
  tenantId?: string;
  source: CrmRuntimeSource;
};

export type ResolveCrmRuntimeOutput = {
  commandCenter: CRMCommandCenter;
  runtime: CrmRuntimeMetadata;
};

type RuntimeArtifacts = {
  context: RuntimeContext;
  capability: RuntimeCapability;
  event: RuntimeEvent;
  diagnostics: RuntimeDiagnostics;
};

type CrmRuntimeLogger = Pick<Console, 'warn'>;

export type CrmRuntimeAdapterDependencies = {
  isEnabled?: () => boolean;
  resolveCommandCenter?: (input: ResolveCrmRuntimeInput) => Promise<CRMCommandCenter>;
  createRuntimeArtifacts?: (input: {
    commandCenter: CRMCommandCenter;
    source: CrmRuntimeSource;
    tenantId?: string;
    userId?: string;
  }) => RuntimeArtifacts;
  logger?: CrmRuntimeLogger;
};

const CAPABILITY_ID = 'crm.command-center.resolve';
const CAPABILITY_VERSION = '1.0.0';
const EVENT_SOURCE = 'nextshift.crm';
const DIAGNOSTICS_ID = 'crm-runtime-adapter';

const crmRuntimeAdapter = createRuntimeAdapter<
  ResolveCrmRuntimeInput,
  CRMCommandCenter,
  CrmRuntimeSource,
  CrmRuntimeConfidence,
  CrmRuntimeWarning,
  CrmRuntimeMetadata,
  ResolveCrmRuntimeOutput,
  CrmRuntimeAdapterDependencies
>({
  resolveLegacy: (input, dependencies) => {
    if (!dependencies.resolveCommandCenter) {
      throw new TypeError('CRM Runtime Adapter requires a legacy command-center resolver.');
    }

    return dependencies.resolveCommandCenter(input);
  },
  isEnabled: (_input, _commandCenter, dependencies) =>
    dependencies.isEnabled?.() ?? isRuntimeCrmEnabled(),
  getSource: (input) => input.source,
  getConfidence: (_input, commandCenter) => commandCenter.revenueForecast.confidenceScore,
  getFallbackConfidence: () => 'fallback',
  createRuntimeMetadata: (input, commandCenter, dependencies) => {
    const artifacts = (dependencies.createRuntimeArtifacts ?? createDefaultRuntimeArtifacts)({
      commandCenter,
      source: input.source,
      tenantId: input.tenantId,
      userId: input.userId,
    });

    return {
      contextId: artifacts.context.id,
      correlationId: artifacts.context.correlationId,
      capabilityId: artifacts.capability.identity.capabilityId,
      capabilityRuntimeId: artifacts.capability.id,
      eventId: artifacts.event.id,
      eventType: eventTypeForCommandCenter(commandCenter),
      diagnosticsId: artifacts.diagnostics.id,
      diagnosticsStatus: 'healthy',
    };
  },
  composeOutput: (commandCenter, runtime) => ({ commandCenter, runtime }),
  fallbackWarning: 'runtime-crm-adapter-fallback',
  invalidOutputWarning: 'runtime-crm-adapter-invalid-output',
  warningLogMessage: '[crm-runtime-adapter] falling back to legacy CRM command-center resolver',
  getLogger: (dependencies) => dependencies.logger,
  createWarningPayload: ({ input, legacyOutput: commandCenter, warning, errorKind }) => {
    const payload: Record<string, string | number | undefined> = {
      warning,
      source: input.source,
      totalLeadCount: commandCenter.leads.total,
      hotLeadCount: commandCenter.hotLeads.length,
      opportunityCount: commandCenter.opportunities.length,
      overdueFollowupCount: commandCenter.followups.overdue,
      todayFollowupCount: commandCenter.followups.today,
      revenueConfidenceScore: commandCenter.revenueForecast.confidenceScore,
    };

    if (errorKind) payload.errorKind = errorKind;

    return payload;
  },
});

export async function resolveCrmRuntimeCommandCenter(
  input: ResolveCrmRuntimeInput,
  dependencies: CrmRuntimeAdapterDependencies = {},
): Promise<ResolveCrmRuntimeOutput> {
  return crmRuntimeAdapter.resolveAsync(input, dependencies);
}

function createDefaultRuntimeArtifacts(input: {
  commandCenter: CRMCommandCenter;
  source: CrmRuntimeSource;
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
      eventId: eventTypeForCommandCenter(input.commandCenter),
      type: eventTypeForCommandCenter(input.commandCenter),
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
      component: 'crm',
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
  commandCenter: CRMCommandCenter;
  source: CrmRuntimeSource;
  tenantId?: string;
  userId?: string;
}) {
  const metadata: Record<string, string> = {
    module: 'crm',
    source: input.source,
    totalLeadCount: String(input.commandCenter.leads.total),
    hotLeadCount: String(input.commandCenter.hotLeads.length),
    opportunityCount: String(input.commandCenter.opportunities.length),
    overdueFollowupCount: String(input.commandCenter.followups.overdue),
    revenueConfidenceScore: String(input.commandCenter.revenueForecast.confidenceScore),
  };

  if (input.tenantId) metadata.tenantId = input.tenantId;
  if (input.userId) metadata.userId = input.userId;

  return metadata;
}

function eventPayload(input: {
  commandCenter: CRMCommandCenter;
  source: CrmRuntimeSource;
}) {
  return {
    module: 'crm',
    source: input.source,
    totalLeadCount: input.commandCenter.leads.total,
    qualifiedLeadCount: input.commandCenter.leads.qualified,
    hotLeadCount: input.commandCenter.hotLeads.length,
    opportunityCount: input.commandCenter.opportunities.length,
    overdueFollowupCount: input.commandCenter.followups.overdue,
    todayFollowupCount: input.commandCenter.followups.today,
    appointmentTodayCount: input.commandCenter.appointments.today,
    revenueConfidenceScore: input.commandCenter.revenueForecast.confidenceScore,
  };
}

function eventTypeForCommandCenter(commandCenter: CRMCommandCenter) {
  if (commandCenter.followups.overdue > 0) return 'runtime.crm.followup-overdue';
  if (commandCenter.hotLeads.length > 0) return 'runtime.crm.hot-leads';
  return 'runtime.crm.command-center';
}

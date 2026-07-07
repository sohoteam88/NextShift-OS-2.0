import {
  isRuntimeContext,
  type RuntimeContext,
  type RuntimeContextMetadata,
} from "../context";
import { isRuntimeSession, type RuntimeSession } from "../session";
import { isRuntimeWorkspace, type RuntimeWorkspace } from "../workspace";
import { RuntimeCapabilityError } from "./runtime-capability-error";
import {
  isRuntimeCapabilityLifecycleState,
  isTerminalRuntimeCapabilityLifecycleState,
  type RuntimeCapabilityLifecycleState,
} from "./runtime-capability-lifecycle";

export type RuntimeCapabilityMetadata = RuntimeContextMetadata;
export type RuntimeCapabilityKind = "workflow" | "integration" | "automation" | "system";

export interface RuntimeCapabilityIdentity {
  readonly capabilityId: string;
  readonly kind: RuntimeCapabilityKind;
  readonly workspaceId?: string;
  readonly version?: string;
}

export interface RuntimeCapability {
  readonly id: string;
  readonly identity: RuntimeCapabilityIdentity;
  readonly state: RuntimeCapabilityLifecycleState;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly workspaceRuntimeId?: string;
  readonly sessionId?: string;
  readonly principalId?: string;
  readonly registeredAt: Date;
  readonly activatedAt?: Date;
  readonly suspendedAt?: Date;
  readonly retiredAt?: Date;
  readonly metadata?: RuntimeCapabilityMetadata;
}

export interface RuntimeCapabilitySnapshot {
  readonly id: string;
  readonly identity: RuntimeCapabilityIdentity;
  readonly state: RuntimeCapabilityLifecycleState;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly workspaceRuntimeId?: string;
  readonly sessionId?: string;
  readonly principalId?: string;
  readonly registeredAt: string;
  readonly activatedAt?: string;
  readonly suspendedAt?: string;
  readonly retiredAt?: string;
  readonly metadata?: RuntimeCapabilityMetadata;
}

export interface CreateRuntimeCapabilityInput {
  readonly id?: string;
  readonly identity: RuntimeCapabilityIdentity;
  readonly context?: RuntimeContext;
  readonly workspace?: RuntimeWorkspace;
  readonly session?: RuntimeSession;
  readonly registeredAt?: Date;
  readonly metadata?: RuntimeCapabilityMetadata;
}

export interface RuntimeCapabilityTransitionInput {
  readonly now?: Date;
  readonly metadata?: RuntimeCapabilityMetadata;
}

const forbiddenMetadataKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimeCapability(
  input: CreateRuntimeCapabilityInput
): RuntimeCapability {
  const registeredAt = input.registeredAt ?? new Date();

  assertRuntimeCapabilityIdentity(input.identity);
  assertValidDate(registeredAt, "registeredAt");
  assertMetadataSafe(input.metadata);

  const contextFields = resolveContextFields(input.context);
  const workspaceFields = resolveWorkspaceFields(input.identity, input.workspace);
  const sessionFields = resolveSessionFields(input.identity, input.session);

  return freezeRuntimeCapability({
    id: normalizeRequiredString(input.id ?? crypto.randomUUID(), "id"),
    identity: freezeIdentity(input.identity),
    state: "registered",
    ...contextFields,
    ...workspaceFields,
    ...sessionFields,
    registeredAt,
    metadata: freezeMetadata(input.metadata),
  });
}

export function activateRuntimeCapability(
  capability: RuntimeCapability,
  input: RuntimeCapabilityTransitionInput = {}
): RuntimeCapability {
  assertRuntimeCapability(capability);

  if (capability.state !== "registered" && capability.state !== "suspended") {
    throwInvalidTransition(capability, "active", "activate");
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");
  assertMetadataSafe(input.metadata);

  return freezeRuntimeCapability({
    ...capability,
    identity: freezeIdentity(capability.identity),
    state: "active",
    activatedAt: now,
    metadata: freezeMetadata(input.metadata ?? capability.metadata),
  });
}

export function suspendRuntimeCapability(
  capability: RuntimeCapability,
  input: RuntimeCapabilityTransitionInput = {}
): RuntimeCapability {
  assertRuntimeCapability(capability);

  if (capability.state !== "active") {
    throwInvalidTransition(capability, "suspended", "suspend");
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");
  assertMetadataSafe(input.metadata);

  return freezeRuntimeCapability({
    ...capability,
    identity: freezeIdentity(capability.identity),
    state: "suspended",
    suspendedAt: now,
    metadata: freezeMetadata(input.metadata ?? capability.metadata),
  });
}

export function retireRuntimeCapability(
  capability: RuntimeCapability,
  input: RuntimeCapabilityTransitionInput = {}
): RuntimeCapability {
  assertRuntimeCapability(capability);

  if (isTerminalRuntimeCapabilityLifecycleState(capability.state)) {
    throwInvalidTransition(capability, "retired", "retire");
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");
  assertMetadataSafe(input.metadata);

  return freezeRuntimeCapability({
    ...capability,
    identity: freezeIdentity(capability.identity),
    state: "retired",
    retiredAt: now,
    metadata: freezeMetadata(input.metadata ?? capability.metadata),
  });
}

export function snapshotRuntimeCapability(
  capability: RuntimeCapability
): RuntimeCapabilitySnapshot {
  assertRuntimeCapability(capability);

  return Object.freeze({
    id: capability.id,
    identity: freezeIdentity(capability.identity),
    state: capability.state,
    contextId: capability.contextId,
    correlationId: capability.correlationId,
    rootContextId: capability.rootContextId,
    workspaceRuntimeId: capability.workspaceRuntimeId,
    sessionId: capability.sessionId,
    principalId: capability.principalId,
    registeredAt: capability.registeredAt.toISOString(),
    activatedAt: capability.activatedAt?.toISOString(),
    suspendedAt: capability.suspendedAt?.toISOString(),
    retiredAt: capability.retiredAt?.toISOString(),
    metadata: freezeMetadata(capability.metadata),
  });
}

export function isRuntimeCapability(value: unknown): value is RuntimeCapability {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeCapability>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimeCapabilityIdentity(candidate.identity) &&
    isRuntimeCapabilityLifecycleState(candidate.state) &&
    (candidate.contextId === undefined || isNonEmptyString(candidate.contextId)) &&
    (candidate.correlationId === undefined || isNonEmptyString(candidate.correlationId)) &&
    (candidate.rootContextId === undefined || isNonEmptyString(candidate.rootContextId)) &&
    (candidate.workspaceRuntimeId === undefined ||
      isNonEmptyString(candidate.workspaceRuntimeId)) &&
    (candidate.sessionId === undefined || isNonEmptyString(candidate.sessionId)) &&
    (candidate.principalId === undefined || isNonEmptyString(candidate.principalId)) &&
    candidate.registeredAt instanceof Date &&
    !Number.isNaN(candidate.registeredAt.getTime()) &&
    (candidate.activatedAt === undefined ||
      (candidate.activatedAt instanceof Date &&
        !Number.isNaN(candidate.activatedAt.getTime()))) &&
    (candidate.suspendedAt === undefined ||
      (candidate.suspendedAt instanceof Date &&
        !Number.isNaN(candidate.suspendedAt.getTime()))) &&
    (candidate.retiredAt === undefined ||
      (candidate.retiredAt instanceof Date &&
        !Number.isNaN(candidate.retiredAt.getTime()))) &&
    isMetadataSafe(candidate.metadata)
  );
}

export function isRuntimeCapabilityIdentity(
  value: unknown
): value is RuntimeCapabilityIdentity {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeCapabilityIdentity>;

  return (
    isNonEmptyString(candidate.capabilityId) &&
    isRuntimeCapabilityKind(candidate.kind) &&
    (candidate.workspaceId === undefined || isNonEmptyString(candidate.workspaceId)) &&
    (candidate.version === undefined || isNonEmptyString(candidate.version))
  );
}

function assertRuntimeCapability(capability: RuntimeCapability): void {
  if (!isRuntimeCapability(capability)) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      "Runtime capability is invalid.",
      { field: "capability" }
    );
  }
}

function assertRuntimeCapabilityIdentity(
  identity: RuntimeCapabilityIdentity
): asserts identity is RuntimeCapabilityIdentity {
  if (!isRuntimeCapabilityIdentity(identity)) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      "Runtime capability identity is invalid.",
      { field: "identity" }
    );
  }
}

function resolveContextFields(
  context: RuntimeContext | undefined
): Pick<RuntimeCapability, "contextId" | "correlationId" | "rootContextId"> {
  if (context === undefined) {
    return {};
  }

  if (!isRuntimeContext(context)) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      "Runtime capability context is invalid.",
      { field: "context" }
    );
  }

  if (context.scope !== "capability") {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_ISOLATION_VIOLATION",
      "Runtime capabilities require a capability-scoped runtime context.",
      { contextScope: context.scope }
    );
  }

  return {
    contextId: context.id,
    correlationId: context.correlationId,
    rootContextId: context.rootId,
  };
}

function resolveWorkspaceFields(
  identity: RuntimeCapabilityIdentity,
  workspace: RuntimeWorkspace | undefined
): Pick<RuntimeCapability, "workspaceRuntimeId"> {
  if (workspace === undefined) {
    return {};
  }

  if (!isRuntimeWorkspace(workspace)) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      "Runtime capability workspace is invalid.",
      { field: "workspace" }
    );
  }

  if (
    identity.workspaceId !== undefined &&
    workspace.identity.workspaceId !== identity.workspaceId
  ) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_ISOLATION_VIOLATION",
      "Runtime capability identity does not match workspace identity.",
      {
        workspaceId: workspace.identity.workspaceId,
        capabilityWorkspaceId: identity.workspaceId,
      }
    );
  }

  return {
    workspaceRuntimeId: workspace.id,
  };
}

function resolveSessionFields(
  identity: RuntimeCapabilityIdentity,
  session: RuntimeSession | undefined
): Pick<RuntimeCapability, "sessionId" | "principalId"> {
  if (session === undefined) {
    return {};
  }

  if (!isRuntimeSession(session)) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      "Runtime capability session is invalid.",
      { field: "session" }
    );
  }

  if (
    identity.workspaceId !== undefined &&
    session.identity.workspaceId !== undefined &&
    session.identity.workspaceId !== identity.workspaceId
  ) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_ISOLATION_VIOLATION",
      "Runtime capability session identity does not match capability identity.",
      {
        capabilityWorkspaceId: identity.workspaceId,
        sessionWorkspaceId: session.identity.workspaceId,
      }
    );
  }

  return {
    sessionId: session.id,
    principalId: session.identity.principalId,
  };
}

function throwInvalidTransition(
  capability: RuntimeCapability,
  to: RuntimeCapabilityLifecycleState,
  operation: string
): never {
  throw new RuntimeCapabilityError(
    "RUNTIME_CAPABILITY_INVALID_TRANSITION",
    `Runtime capability cannot transition from ${capability.state} to ${to}.`,
    { capabilityId: capability.id, from: capability.state, to, operation }
  );
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      `Runtime capability ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_INVALID",
      `Runtime capability ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isRuntimeCapabilityKind(value: unknown): value is RuntimeCapabilityKind {
  return (
    value === "workflow" ||
    value === "integration" ||
    value === "automation" ||
    value === "system"
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertMetadataSafe(metadata: RuntimeCapabilityMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimeCapabilityError(
      "RUNTIME_CAPABILITY_FORBIDDEN_VALUE",
      "Runtime capability metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isMetadataSafe(metadata: RuntimeCapabilityMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenMetadataKeyPattern.test(key));
}

function freezeIdentity(identity: RuntimeCapabilityIdentity): RuntimeCapabilityIdentity {
  return Object.freeze({ ...identity });
}

function freezeMetadata(
  metadata: RuntimeCapabilityMetadata | undefined
): RuntimeCapabilityMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

function freezeRuntimeCapability(capability: RuntimeCapability): RuntimeCapability {
  return Object.freeze(capability);
}

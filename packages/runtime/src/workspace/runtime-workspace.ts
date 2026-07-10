import {
  isRuntimeContext,
  type RuntimeContext,
  type RuntimeContextMetadata,
} from "../context";
import { isRuntimeSession, type RuntimeSession } from "../session";
import { RuntimeWorkspaceError } from "./runtime-workspace-error";
import {
  isRuntimeWorkspaceLifecycleState,
  isTerminalRuntimeWorkspaceLifecycleState,
  type RuntimeWorkspaceLifecycleState,
} from "./runtime-workspace-lifecycle";

export type RuntimeWorkspaceMetadata = RuntimeContextMetadata;
export type RuntimeWorkspaceKind = "organization" | "team" | "personal" | "system";

export interface RuntimeWorkspaceIdentity {
  readonly workspaceId: string;
  readonly kind: RuntimeWorkspaceKind;
  readonly ownerId?: string;
}

export interface RuntimeWorkspace {
  readonly id: string;
  readonly identity: RuntimeWorkspaceIdentity;
  readonly state: RuntimeWorkspaceLifecycleState;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly sessionId?: string;
  readonly principalId?: string;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
  readonly suspendedAt?: Date;
  readonly closedAt?: Date;
  readonly metadata?: RuntimeWorkspaceMetadata;
}

export interface RuntimeWorkspaceSnapshot {
  readonly id: string;
  readonly identity: RuntimeWorkspaceIdentity;
  readonly state: RuntimeWorkspaceLifecycleState;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly sessionId?: string;
  readonly principalId?: string;
  readonly createdAt: string;
  readonly activatedAt?: string;
  readonly suspendedAt?: string;
  readonly closedAt?: string;
  readonly metadata?: RuntimeWorkspaceMetadata;
}

export interface CreateRuntimeWorkspaceInput {
  readonly id?: string;
  readonly identity: RuntimeWorkspaceIdentity;
  readonly context?: RuntimeContext;
  readonly session?: RuntimeSession;
  readonly createdAt?: Date;
  readonly metadata?: RuntimeWorkspaceMetadata;
}

export interface RuntimeWorkspaceTransitionInput {
  readonly now?: Date;
  readonly metadata?: RuntimeWorkspaceMetadata;
}

const forbiddenMetadataKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimeWorkspace(
  input: CreateRuntimeWorkspaceInput
): RuntimeWorkspace {
  const createdAt = input.createdAt ?? new Date();
  const contextFields = resolveContextFields(input.context);
  const sessionFields = resolveSessionFields(input.identity, input.session);

  assertValidDate(createdAt, "createdAt");
  assertRuntimeWorkspaceIdentity(input.identity);
  assertMetadataSafe(input.metadata);

  return freezeRuntimeWorkspace({
    id: normalizeRequiredString(input.id ?? crypto.randomUUID(), "id"),
    identity: freezeIdentity(input.identity),
    state: "created",
    ...contextFields,
    ...sessionFields,
    createdAt,
    metadata: freezeMetadata(input.metadata),
  });
}

export function activateRuntimeWorkspace(
  workspace: RuntimeWorkspace,
  input: RuntimeWorkspaceTransitionInput = {}
): RuntimeWorkspace {
  assertRuntimeWorkspace(workspace);

  if (workspace.state !== "created" && workspace.state !== "suspended") {
    throwInvalidTransition(workspace, "active", "activate");
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");
  assertMetadataSafe(input.metadata);

  return freezeRuntimeWorkspace({
    ...workspace,
    identity: freezeIdentity(workspace.identity),
    state: "active",
    activatedAt: now,
    metadata: freezeMetadata(input.metadata ?? workspace.metadata),
  });
}

export function suspendRuntimeWorkspace(
  workspace: RuntimeWorkspace,
  input: RuntimeWorkspaceTransitionInput = {}
): RuntimeWorkspace {
  assertRuntimeWorkspace(workspace);

  if (workspace.state !== "active") {
    throwInvalidTransition(workspace, "suspended", "suspend");
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");
  assertMetadataSafe(input.metadata);

  return freezeRuntimeWorkspace({
    ...workspace,
    identity: freezeIdentity(workspace.identity),
    state: "suspended",
    suspendedAt: now,
    metadata: freezeMetadata(input.metadata ?? workspace.metadata),
  });
}

export function closeRuntimeWorkspace(
  workspace: RuntimeWorkspace,
  input: RuntimeWorkspaceTransitionInput = {}
): RuntimeWorkspace {
  assertRuntimeWorkspace(workspace);

  if (isTerminalRuntimeWorkspaceLifecycleState(workspace.state)) {
    throwInvalidTransition(workspace, "closed", "close");
  }

  const now = input.now ?? new Date();
  assertValidDate(now, "now");
  assertMetadataSafe(input.metadata);

  return freezeRuntimeWorkspace({
    ...workspace,
    identity: freezeIdentity(workspace.identity),
    state: "closed",
    closedAt: now,
    metadata: freezeMetadata(input.metadata ?? workspace.metadata),
  });
}

export function snapshotRuntimeWorkspace(
  workspace: RuntimeWorkspace
): RuntimeWorkspaceSnapshot {
  assertRuntimeWorkspace(workspace);

  return Object.freeze({
    id: workspace.id,
    identity: freezeIdentity(workspace.identity),
    state: workspace.state,
    contextId: workspace.contextId,
    correlationId: workspace.correlationId,
    rootContextId: workspace.rootContextId,
    sessionId: workspace.sessionId,
    principalId: workspace.principalId,
    createdAt: workspace.createdAt.toISOString(),
    activatedAt: workspace.activatedAt?.toISOString(),
    suspendedAt: workspace.suspendedAt?.toISOString(),
    closedAt: workspace.closedAt?.toISOString(),
    metadata: freezeMetadata(workspace.metadata),
  });
}

export function isRuntimeWorkspace(value: unknown): value is RuntimeWorkspace {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeWorkspace>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimeWorkspaceIdentity(candidate.identity) &&
    isRuntimeWorkspaceLifecycleState(candidate.state) &&
    (candidate.contextId === undefined || isNonEmptyString(candidate.contextId)) &&
    (candidate.correlationId === undefined || isNonEmptyString(candidate.correlationId)) &&
    (candidate.rootContextId === undefined || isNonEmptyString(candidate.rootContextId)) &&
    (candidate.sessionId === undefined || isNonEmptyString(candidate.sessionId)) &&
    (candidate.principalId === undefined || isNonEmptyString(candidate.principalId)) &&
    candidate.createdAt instanceof Date &&
    !Number.isNaN(candidate.createdAt.getTime()) &&
    (candidate.activatedAt === undefined ||
      (candidate.activatedAt instanceof Date &&
        !Number.isNaN(candidate.activatedAt.getTime()))) &&
    (candidate.suspendedAt === undefined ||
      (candidate.suspendedAt instanceof Date &&
        !Number.isNaN(candidate.suspendedAt.getTime()))) &&
    (candidate.closedAt === undefined ||
      (candidate.closedAt instanceof Date &&
        !Number.isNaN(candidate.closedAt.getTime()))) &&
    isMetadataSafe(candidate.metadata)
  );
}

export function isRuntimeWorkspaceIdentity(
  value: unknown
): value is RuntimeWorkspaceIdentity {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeWorkspaceIdentity>;

  return (
    isNonEmptyString(candidate.workspaceId) &&
    isRuntimeWorkspaceKind(candidate.kind) &&
    (candidate.ownerId === undefined || isNonEmptyString(candidate.ownerId))
  );
}

function assertRuntimeWorkspace(workspace: RuntimeWorkspace): void {
  if (!isRuntimeWorkspace(workspace)) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_INVALID",
      "Runtime workspace is invalid.",
      { field: "workspace" }
    );
  }
}

function assertRuntimeWorkspaceIdentity(
  identity: RuntimeWorkspaceIdentity
): asserts identity is RuntimeWorkspaceIdentity {
  if (!isRuntimeWorkspaceIdentity(identity)) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_INVALID",
      "Runtime workspace identity is invalid.",
      { field: "identity" }
    );
  }
}

function resolveContextFields(
  context: RuntimeContext | undefined
): Pick<RuntimeWorkspace, "contextId" | "correlationId" | "rootContextId"> {
  if (context === undefined) {
    return {};
  }

  if (!isRuntimeContext(context)) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_INVALID",
      "Runtime workspace context is invalid.",
      { field: "context" }
    );
  }

  if (context.scope !== "workspace") {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_ISOLATION_VIOLATION",
      "Runtime workspaces require a workspace-scoped runtime context.",
      { contextScope: context.scope }
    );
  }

  return {
    contextId: context.id,
    correlationId: context.correlationId,
    rootContextId: context.rootId,
  };
}

function resolveSessionFields(
  identity: RuntimeWorkspaceIdentity,
  session: RuntimeSession | undefined
): Pick<RuntimeWorkspace, "sessionId" | "principalId"> {
  if (session === undefined) {
    return {};
  }

  if (!isRuntimeSession(session)) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_INVALID",
      "Runtime workspace session is invalid.",
      { field: "session" }
    );
  }

  if (
    session.identity.workspaceId !== undefined &&
    session.identity.workspaceId !== identity.workspaceId
  ) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_ISOLATION_VIOLATION",
      "Runtime workspace session identity does not match workspace identity.",
      {
        workspaceId: identity.workspaceId,
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
  workspace: RuntimeWorkspace,
  to: RuntimeWorkspaceLifecycleState,
  operation: string
): never {
  throw new RuntimeWorkspaceError(
    "RUNTIME_WORKSPACE_INVALID_TRANSITION",
    `Runtime workspace cannot transition from ${workspace.state} to ${to}.`,
    { workspaceId: workspace.id, from: workspace.state, to, operation }
  );
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_INVALID",
      `Runtime workspace ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_INVALID",
      `Runtime workspace ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isRuntimeWorkspaceKind(value: unknown): value is RuntimeWorkspaceKind {
  return (
    value === "organization" ||
    value === "team" ||
    value === "personal" ||
    value === "system"
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertMetadataSafe(metadata: RuntimeWorkspaceMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimeWorkspaceError(
      "RUNTIME_WORKSPACE_FORBIDDEN_VALUE",
      "Runtime workspace metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isMetadataSafe(metadata: RuntimeWorkspaceMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenMetadataKeyPattern.test(key));
}

function freezeIdentity(identity: RuntimeWorkspaceIdentity): RuntimeWorkspaceIdentity {
  return Object.freeze({ ...identity });
}

function freezeMetadata(
  metadata: RuntimeWorkspaceMetadata | undefined
): RuntimeWorkspaceMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

function freezeRuntimeWorkspace(workspace: RuntimeWorkspace): RuntimeWorkspace {
  return Object.freeze(workspace);
}

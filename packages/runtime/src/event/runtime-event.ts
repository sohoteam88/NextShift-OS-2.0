import { isRuntimeCapability, type RuntimeCapability } from "../capability";
import {
  isRuntimeContext,
  type RuntimeContext,
  type RuntimeContextMetadata,
} from "../context";
import { isRuntimeSession, type RuntimeSession } from "../session";
import { isRuntimeWorkspace, type RuntimeWorkspace } from "../workspace";
import { RuntimeEventError } from "./runtime-event-error";
import { isRuntimeEventType, type RuntimeEventType } from "./runtime-event-type";

export type RuntimeEventPayload = Readonly<Record<string, unknown>>;
export type RuntimeEventMetadata = RuntimeContextMetadata;

export interface RuntimeEventIdentity {
  readonly eventId: string;
  readonly type: RuntimeEventType;
  readonly source: string;
  readonly workspaceId?: string;
  readonly capabilityId?: string;
  readonly version?: string;
}

export interface RuntimeEvent {
  readonly id: string;
  readonly identity: RuntimeEventIdentity;
  readonly payload?: RuntimeEventPayload;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly workspaceRuntimeId?: string;
  readonly sessionId?: string;
  readonly principalId?: string;
  readonly capabilityRuntimeId?: string;
  readonly occurredAt: Date;
  readonly metadata?: RuntimeEventMetadata;
}

export interface RuntimeEventSnapshot {
  readonly id: string;
  readonly identity: RuntimeEventIdentity;
  readonly payload?: RuntimeEventPayload;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly workspaceRuntimeId?: string;
  readonly sessionId?: string;
  readonly principalId?: string;
  readonly capabilityRuntimeId?: string;
  readonly occurredAt: string;
  readonly metadata?: RuntimeEventMetadata;
}

export interface CreateRuntimeEventInput {
  readonly id?: string;
  readonly identity: RuntimeEventIdentity;
  readonly payload?: RuntimeEventPayload;
  readonly context?: RuntimeContext;
  readonly workspace?: RuntimeWorkspace;
  readonly session?: RuntimeSession;
  readonly capability?: RuntimeCapability;
  readonly occurredAt?: Date;
  readonly metadata?: RuntimeEventMetadata;
}

const forbiddenKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimeEvent(input: CreateRuntimeEventInput): RuntimeEvent {
  const occurredAt = input.occurredAt ?? new Date();

  assertRuntimeEventIdentity(input.identity);
  assertValidDate(occurredAt, "occurredAt");
  assertPayloadSafe(input.payload);
  assertMetadataSafe(input.metadata);

  const contextFields = resolveContextFields(input.context);
  const workspaceFields = resolveWorkspaceFields(input.identity, input.workspace);
  const sessionFields = resolveSessionFields(input.identity, input.session);
  const capabilityFields = resolveCapabilityFields(input.identity, input.capability);

  return freezeRuntimeEvent({
    id: normalizeRequiredString(input.id ?? crypto.randomUUID(), "id"),
    identity: freezeIdentity(input.identity),
    payload: freezePayload(input.payload),
    ...contextFields,
    ...workspaceFields,
    ...sessionFields,
    ...capabilityFields,
    occurredAt,
    metadata: freezeMetadata(input.metadata),
  });
}

export function snapshotRuntimeEvent(event: RuntimeEvent): RuntimeEventSnapshot {
  assertRuntimeEvent(event);

  return Object.freeze({
    id: event.id,
    identity: freezeIdentity(event.identity),
    payload: freezePayload(event.payload),
    contextId: event.contextId,
    correlationId: event.correlationId,
    rootContextId: event.rootContextId,
    workspaceRuntimeId: event.workspaceRuntimeId,
    sessionId: event.sessionId,
    principalId: event.principalId,
    capabilityRuntimeId: event.capabilityRuntimeId,
    occurredAt: event.occurredAt.toISOString(),
    metadata: freezeMetadata(event.metadata),
  });
}

export function isRuntimeEvent(value: unknown): value is RuntimeEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeEvent>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimeEventIdentity(candidate.identity) &&
    (candidate.payload === undefined || isPayloadSafe(candidate.payload)) &&
    (candidate.contextId === undefined || isNonEmptyString(candidate.contextId)) &&
    (candidate.correlationId === undefined || isNonEmptyString(candidate.correlationId)) &&
    (candidate.rootContextId === undefined || isNonEmptyString(candidate.rootContextId)) &&
    (candidate.workspaceRuntimeId === undefined ||
      isNonEmptyString(candidate.workspaceRuntimeId)) &&
    (candidate.sessionId === undefined || isNonEmptyString(candidate.sessionId)) &&
    (candidate.principalId === undefined || isNonEmptyString(candidate.principalId)) &&
    (candidate.capabilityRuntimeId === undefined ||
      isNonEmptyString(candidate.capabilityRuntimeId)) &&
    candidate.occurredAt instanceof Date &&
    !Number.isNaN(candidate.occurredAt.getTime()) &&
    isMetadataSafe(candidate.metadata)
  );
}

export function isRuntimeEventIdentity(
  value: unknown
): value is RuntimeEventIdentity {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeEventIdentity>;

  return (
    isNonEmptyString(candidate.eventId) &&
    isRuntimeEventType(candidate.type) &&
    isNonEmptyString(candidate.source) &&
    (candidate.workspaceId === undefined || isNonEmptyString(candidate.workspaceId)) &&
    (candidate.capabilityId === undefined || isNonEmptyString(candidate.capabilityId)) &&
    (candidate.version === undefined || isNonEmptyString(candidate.version))
  );
}

function assertRuntimeEvent(event: RuntimeEvent): void {
  if (!isRuntimeEvent(event)) {
    throw new RuntimeEventError("RUNTIME_EVENT_INVALID", "Runtime event is invalid.", {
      field: "event",
    });
  }
}

function assertRuntimeEventIdentity(
  identity: RuntimeEventIdentity
): asserts identity is RuntimeEventIdentity {
  if (!isRuntimeEventIdentity(identity)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      "Runtime event identity is invalid.",
      { field: "identity" }
    );
  }
}

function resolveContextFields(
  context: RuntimeContext | undefined
): Pick<RuntimeEvent, "contextId" | "correlationId" | "rootContextId"> {
  if (context === undefined) {
    return {};
  }

  if (!isRuntimeContext(context)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      "Runtime event context is invalid.",
      { field: "context" }
    );
  }

  if (context.scope !== "event") {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_ISOLATION_VIOLATION",
      "Runtime events require an event-scoped runtime context.",
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
  identity: RuntimeEventIdentity,
  workspace: RuntimeWorkspace | undefined
): Pick<RuntimeEvent, "workspaceRuntimeId"> {
  if (workspace === undefined) {
    return {};
  }

  if (!isRuntimeWorkspace(workspace)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      "Runtime event workspace is invalid.",
      { field: "workspace" }
    );
  }

  if (
    identity.workspaceId !== undefined &&
    workspace.identity.workspaceId !== identity.workspaceId
  ) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_ISOLATION_VIOLATION",
      "Runtime event identity does not match workspace identity.",
      {
        workspaceId: workspace.identity.workspaceId,
        eventWorkspaceId: identity.workspaceId,
      }
    );
  }

  return {
    workspaceRuntimeId: workspace.id,
  };
}

function resolveSessionFields(
  identity: RuntimeEventIdentity,
  session: RuntimeSession | undefined
): Pick<RuntimeEvent, "sessionId" | "principalId"> {
  if (session === undefined) {
    return {};
  }

  if (!isRuntimeSession(session)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      "Runtime event session is invalid.",
      { field: "session" }
    );
  }

  if (
    identity.workspaceId !== undefined &&
    session.identity.workspaceId !== undefined &&
    session.identity.workspaceId !== identity.workspaceId
  ) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_ISOLATION_VIOLATION",
      "Runtime event session identity does not match event identity.",
      {
        eventWorkspaceId: identity.workspaceId,
        sessionWorkspaceId: session.identity.workspaceId,
      }
    );
  }

  return {
    sessionId: session.id,
    principalId: session.identity.principalId,
  };
}

function resolveCapabilityFields(
  identity: RuntimeEventIdentity,
  capability: RuntimeCapability | undefined
): Pick<RuntimeEvent, "capabilityRuntimeId"> {
  if (capability === undefined) {
    return {};
  }

  if (!isRuntimeCapability(capability)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      "Runtime event capability is invalid.",
      { field: "capability" }
    );
  }

  if (
    identity.capabilityId !== undefined &&
    capability.identity.capabilityId !== identity.capabilityId
  ) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_ISOLATION_VIOLATION",
      "Runtime event identity does not match capability identity.",
      {
        capabilityId: capability.identity.capabilityId,
        eventCapabilityId: identity.capabilityId,
      }
    );
  }

  if (
    identity.workspaceId !== undefined &&
    capability.identity.workspaceId !== undefined &&
    capability.identity.workspaceId !== identity.workspaceId
  ) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_ISOLATION_VIOLATION",
      "Runtime event capability workspace does not match event identity.",
      {
        eventWorkspaceId: identity.workspaceId,
        capabilityWorkspaceId: capability.identity.workspaceId,
      }
    );
  }

  return {
    capabilityRuntimeId: capability.id,
  };
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      `Runtime event ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_INVALID",
      `Runtime event ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertPayloadSafe(payload: RuntimeEventPayload | undefined): void {
  if (!isPayloadSafe(payload)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_FORBIDDEN_VALUE",
      "Runtime event payload contains a forbidden key.",
      { field: "payload" }
    );
  }
}

function assertMetadataSafe(metadata: RuntimeEventMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimeEventError(
      "RUNTIME_EVENT_FORBIDDEN_VALUE",
      "Runtime event metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isPayloadSafe(payload: RuntimeEventPayload | undefined): boolean {
  if (payload === undefined) {
    return true;
  }

  return (
    typeof payload === "object" &&
    payload !== null &&
    Object.keys(payload).every((key) => !forbiddenKeyPattern.test(key))
  );
}

function isMetadataSafe(metadata: RuntimeEventMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenKeyPattern.test(key));
}

function freezeIdentity(identity: RuntimeEventIdentity): RuntimeEventIdentity {
  return Object.freeze({ ...identity });
}

function freezePayload(
  payload: RuntimeEventPayload | undefined
): RuntimeEventPayload | undefined {
  if (payload === undefined) {
    return undefined;
  }

  return Object.freeze({ ...payload });
}

function freezeMetadata(
  metadata: RuntimeEventMetadata | undefined
): RuntimeEventMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

function freezeRuntimeEvent(event: RuntimeEvent): RuntimeEvent {
  return Object.freeze(event);
}

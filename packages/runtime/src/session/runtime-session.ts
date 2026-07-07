import {
  isRuntimeContext,
  type RuntimeContext,
  type RuntimeContextMetadata,
} from "../context";
import { RuntimeSessionError } from "./runtime-session-error";
import {
  isRuntimeSessionLifecycleState,
  isTerminalRuntimeSessionLifecycleState,
  type RuntimeSessionLifecycleState,
} from "./runtime-session-lifecycle";

export type RuntimeSessionMetadata = RuntimeContextMetadata;
export type RuntimeSessionPrincipalType = "human" | "system" | "agent";

export interface RuntimeSessionIdentity {
  readonly principalId: string;
  readonly principalType: RuntimeSessionPrincipalType;
  readonly workspaceId?: string;
}

export interface RuntimeSession {
  readonly id: string;
  readonly identity: RuntimeSessionIdentity;
  readonly state: RuntimeSessionLifecycleState;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly renewedAt?: Date;
  readonly expiredAt?: Date;
  readonly metadata?: RuntimeSessionMetadata;
}

export interface RuntimeSessionSnapshot {
  readonly id: string;
  readonly identity: RuntimeSessionIdentity;
  readonly state: RuntimeSessionLifecycleState;
  readonly contextId?: string;
  readonly correlationId?: string;
  readonly rootContextId?: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly renewedAt?: string;
  readonly expiredAt?: string;
  readonly metadata?: RuntimeSessionMetadata;
}

export interface CreateRuntimeSessionInput {
  readonly id?: string;
  readonly identity: RuntimeSessionIdentity;
  readonly context?: RuntimeContext;
  readonly createdAt?: Date;
  readonly expiresAt?: Date;
  readonly ttlMs?: number;
  readonly metadata?: RuntimeSessionMetadata;
}

export interface RenewRuntimeSessionInput {
  readonly now?: Date;
  readonly expiresAt?: Date;
  readonly ttlMs?: number;
  readonly metadata?: RuntimeSessionMetadata;
}

export interface ExpireRuntimeSessionInput {
  readonly now?: Date;
  readonly metadata?: RuntimeSessionMetadata;
}

const defaultRuntimeSessionTtlMs = 30 * 60 * 1000;
const forbiddenMetadataKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimeSession(input: CreateRuntimeSessionInput): RuntimeSession {
  const createdAt = input.createdAt ?? new Date();
  const expiresAt = resolveExpiresAt(createdAt, input.expiresAt, input.ttlMs);
  const contextFields = resolveContextFields(input.context);

  assertValidDate(createdAt, "createdAt");
  assertValidDate(expiresAt, "expiresAt");
  assertExpiresAfterCreated(createdAt, expiresAt);
  assertRuntimeSessionIdentity(input.identity);
  assertMetadataSafe(input.metadata);

  return freezeRuntimeSession({
    id: normalizeRequiredString(input.id ?? crypto.randomUUID(), "id"),
    identity: freezeIdentity(input.identity),
    state: "active",
    ...contextFields,
    createdAt,
    expiresAt,
    metadata: freezeMetadata(input.metadata),
  });
}

export function renewRuntimeSession(
  session: RuntimeSession,
  input: RenewRuntimeSessionInput = {}
): RuntimeSession {
  assertRuntimeSession(session);

  const now = input.now ?? new Date();
  assertValidDate(now, "now");

  if (isRuntimeSessionExpired(session, now)) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_EXPIRED",
      "Expired runtime sessions cannot be renewed.",
      { sessionId: session.id, from: session.state, to: "renewed", operation: "renew" }
    );
  }

  const expiresAt = resolveRenewedExpiresAt(session, now, input.expiresAt, input.ttlMs);
  assertMetadataSafe(input.metadata);

  return freezeRuntimeSession({
    ...session,
    identity: freezeIdentity(session.identity),
    state: "renewed",
    expiresAt,
    renewedAt: now,
    metadata: freezeMetadata(input.metadata ?? session.metadata),
  });
}

export function expireRuntimeSession(
  session: RuntimeSession,
  input: ExpireRuntimeSessionInput = {}
): RuntimeSession {
  assertRuntimeSession(session);

  const now = input.now ?? new Date();
  assertValidDate(now, "now");

  if (isTerminalRuntimeSessionLifecycleState(session.state)) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID_TRANSITION",
      `Runtime session cannot transition from ${session.state} to expired.`,
      { sessionId: session.id, from: session.state, to: "expired", operation: "expire" }
    );
  }

  assertMetadataSafe(input.metadata);

  return freezeRuntimeSession({
    ...session,
    identity: freezeIdentity(session.identity),
    state: "expired",
    expiredAt: now,
    metadata: freezeMetadata(input.metadata ?? session.metadata),
  });
}

export function snapshotRuntimeSession(session: RuntimeSession): RuntimeSessionSnapshot {
  assertRuntimeSession(session);

  return Object.freeze({
    id: session.id,
    identity: freezeIdentity(session.identity),
    state: session.state,
    contextId: session.contextId,
    correlationId: session.correlationId,
    rootContextId: session.rootContextId,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    renewedAt: session.renewedAt?.toISOString(),
    expiredAt: session.expiredAt?.toISOString(),
    metadata: freezeMetadata(session.metadata),
  });
}

export function isRuntimeSession(value: unknown): value is RuntimeSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeSession>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimeSessionIdentity(candidate.identity) &&
    isRuntimeSessionLifecycleState(candidate.state) &&
    (candidate.contextId === undefined || isNonEmptyString(candidate.contextId)) &&
    (candidate.correlationId === undefined || isNonEmptyString(candidate.correlationId)) &&
    (candidate.rootContextId === undefined || isNonEmptyString(candidate.rootContextId)) &&
    candidate.createdAt instanceof Date &&
    !Number.isNaN(candidate.createdAt.getTime()) &&
    candidate.expiresAt instanceof Date &&
    !Number.isNaN(candidate.expiresAt.getTime()) &&
    candidate.expiresAt.getTime() > candidate.createdAt.getTime() &&
    (candidate.renewedAt === undefined ||
      (candidate.renewedAt instanceof Date &&
        !Number.isNaN(candidate.renewedAt.getTime()))) &&
    (candidate.expiredAt === undefined ||
      (candidate.expiredAt instanceof Date &&
        !Number.isNaN(candidate.expiredAt.getTime()))) &&
    isMetadataSafe(candidate.metadata)
  );
}

export function isRuntimeSessionExpired(
  session: RuntimeSession,
  now: Date = new Date()
): boolean {
  assertRuntimeSession(session);
  assertValidDate(now, "now");

  return session.state === "expired" || now.getTime() >= session.expiresAt.getTime();
}

export function isRuntimeSessionIdentity(
  value: unknown
): value is RuntimeSessionIdentity {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeSessionIdentity>;

  return (
    isNonEmptyString(candidate.principalId) &&
    isRuntimeSessionPrincipalType(candidate.principalType) &&
    (candidate.workspaceId === undefined || isNonEmptyString(candidate.workspaceId))
  );
}

function assertRuntimeSession(session: RuntimeSession): void {
  if (!isRuntimeSession(session)) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      "Runtime session is invalid.",
      { field: "session" }
    );
  }
}

function assertRuntimeSessionIdentity(
  identity: RuntimeSessionIdentity
): asserts identity is RuntimeSessionIdentity {
  if (!isRuntimeSessionIdentity(identity)) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      "Runtime session identity is invalid.",
      { field: "identity" }
    );
  }
}

function resolveContextFields(
  context: RuntimeContext | undefined
): Pick<RuntimeSession, "contextId" | "correlationId" | "rootContextId"> {
  if (context === undefined) {
    return {};
  }

  if (!isRuntimeContext(context)) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      "Runtime session context is invalid.",
      { field: "context" }
    );
  }

  if (context.scope !== "session") {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_ISOLATION_VIOLATION",
      "Runtime sessions require a session-scoped runtime context.",
      { contextScope: context.scope }
    );
  }

  return {
    contextId: context.id,
    correlationId: context.correlationId,
    rootContextId: context.rootId,
  };
}

function resolveExpiresAt(
  createdAt: Date,
  expiresAt: Date | undefined,
  ttlMs: number | undefined
): Date {
  if (expiresAt !== undefined) {
    return expiresAt;
  }

  const durationMs = ttlMs ?? defaultRuntimeSessionTtlMs;
  assertPositiveDuration(durationMs, "ttlMs");

  return new Date(createdAt.getTime() + durationMs);
}

function resolveRenewedExpiresAt(
  session: RuntimeSession,
  now: Date,
  expiresAt: Date | undefined,
  ttlMs: number | undefined
): Date {
  const nextExpiresAt =
    expiresAt ??
    new Date(now.getTime() + (ttlMs ?? session.expiresAt.getTime() - session.createdAt.getTime()));

  if (ttlMs !== undefined) {
    assertPositiveDuration(ttlMs, "ttlMs");
  }

  assertValidDate(nextExpiresAt, "expiresAt");

  if (nextExpiresAt.getTime() <= now.getTime()) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      "Runtime session expiresAt must be after renewal time.",
      { field: "expiresAt" }
    );
  }

  return nextExpiresAt;
}

function assertExpiresAfterCreated(createdAt: Date, expiresAt: Date): void {
  if (expiresAt.getTime() <= createdAt.getTime()) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      "Runtime session expiresAt must be after createdAt.",
      { field: "expiresAt" }
    );
  }
}

function assertPositiveDuration(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      `Runtime session ${field} must be a positive duration.`,
      { field }
    );
  }
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      `Runtime session ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_INVALID",
      `Runtime session ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isRuntimeSessionPrincipalType(
  value: unknown
): value is RuntimeSessionPrincipalType {
  return value === "human" || value === "system" || value === "agent";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertMetadataSafe(metadata: RuntimeSessionMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimeSessionError(
      "RUNTIME_SESSION_FORBIDDEN_VALUE",
      "Runtime session metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isMetadataSafe(metadata: RuntimeSessionMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenMetadataKeyPattern.test(key));
}

function freezeIdentity(identity: RuntimeSessionIdentity): RuntimeSessionIdentity {
  return Object.freeze({ ...identity });
}

function freezeMetadata(
  metadata: RuntimeSessionMetadata | undefined
): RuntimeSessionMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

function freezeRuntimeSession(session: RuntimeSession): RuntimeSession {
  return Object.freeze(session);
}

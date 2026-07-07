import { type RuntimeContextMetadata } from "../context";
import { RuntimePermissionError } from "./runtime-permission-error";
import {
  isRuntimePermissionDecision,
  type RuntimePermissionDecision,
} from "./runtime-permission-decision";

export type RuntimePermissionMetadata = RuntimeContextMetadata;
export type RuntimePermissionScope =
  | "kernel"
  | "workspace"
  | "session"
  | "capability"
  | "event"
  | "system";

export interface RuntimePermissionIdentity {
  readonly permissionId: string;
  readonly subjectId: string;
  readonly action: string;
  readonly resource: string;
  readonly scope: RuntimePermissionScope;
  readonly workspaceId?: string;
  readonly capabilityId?: string;
  readonly eventId?: string;
  readonly version?: string;
}

export interface RuntimePermission {
  readonly id: string;
  readonly identity: RuntimePermissionIdentity;
  readonly decision: RuntimePermissionDecision;
  readonly reason?: string;
  readonly decidedAt: Date;
  readonly metadata?: RuntimePermissionMetadata;
}

export interface RuntimePermissionSnapshot {
  readonly id: string;
  readonly identity: RuntimePermissionIdentity;
  readonly decision: RuntimePermissionDecision;
  readonly reason?: string;
  readonly decidedAt: string;
  readonly metadata?: RuntimePermissionMetadata;
}

export interface CreateRuntimePermissionInput {
  readonly id?: string;
  readonly identity: RuntimePermissionIdentity;
  readonly decision: RuntimePermissionDecision;
  readonly reason?: string;
  readonly decidedAt?: Date;
  readonly metadata?: RuntimePermissionMetadata;
}

const forbiddenMetadataKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimePermission(
  input: CreateRuntimePermissionInput
): RuntimePermission {
  const decidedAt = input.decidedAt ?? new Date();

  assertRuntimePermissionIdentity(input.identity);
  assertRuntimePermissionDecision(input.decision);
  assertValidDate(decidedAt, "decidedAt");
  assertMetadataSafe(input.metadata);

  return freezeRuntimePermission({
    id: normalizeRequiredString(input.id ?? crypto.randomUUID(), "id"),
    identity: freezeIdentity(input.identity),
    decision: input.decision,
    reason:
      input.reason === undefined
        ? undefined
        : normalizeRequiredString(input.reason, "reason"),
    decidedAt,
    metadata: freezeMetadata(input.metadata),
  });
}

export function snapshotRuntimePermission(
  permission: RuntimePermission
): RuntimePermissionSnapshot {
  assertRuntimePermission(permission);

  return Object.freeze({
    id: permission.id,
    identity: freezeIdentity(permission.identity),
    decision: permission.decision,
    reason: permission.reason,
    decidedAt: permission.decidedAt.toISOString(),
    metadata: freezeMetadata(permission.metadata),
  });
}

export function isRuntimePermission(value: unknown): value is RuntimePermission {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimePermission>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimePermissionIdentity(candidate.identity) &&
    isRuntimePermissionDecision(candidate.decision) &&
    (candidate.reason === undefined || isNonEmptyString(candidate.reason)) &&
    candidate.decidedAt instanceof Date &&
    !Number.isNaN(candidate.decidedAt.getTime()) &&
    isMetadataSafe(candidate.metadata)
  );
}

export function isRuntimePermissionIdentity(
  value: unknown
): value is RuntimePermissionIdentity {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimePermissionIdentity>;

  return (
    isNonEmptyString(candidate.permissionId) &&
    isNonEmptyString(candidate.subjectId) &&
    isNonEmptyString(candidate.action) &&
    isNonEmptyString(candidate.resource) &&
    isRuntimePermissionScope(candidate.scope) &&
    (candidate.workspaceId === undefined || isNonEmptyString(candidate.workspaceId)) &&
    (candidate.capabilityId === undefined || isNonEmptyString(candidate.capabilityId)) &&
    (candidate.eventId === undefined || isNonEmptyString(candidate.eventId)) &&
    (candidate.version === undefined || isNonEmptyString(candidate.version))
  );
}

export function isRuntimePermissionScope(
  value: unknown
): value is RuntimePermissionScope {
  return (
    value === "kernel" ||
    value === "workspace" ||
    value === "session" ||
    value === "capability" ||
    value === "event" ||
    value === "system"
  );
}

function assertRuntimePermission(permission: RuntimePermission): void {
  if (!isRuntimePermission(permission)) {
    throw new RuntimePermissionError(
      "RUNTIME_PERMISSION_INVALID",
      "Runtime permission is invalid.",
      { field: "permission" }
    );
  }
}

function assertRuntimePermissionIdentity(
  identity: RuntimePermissionIdentity
): asserts identity is RuntimePermissionIdentity {
  if (!isRuntimePermissionIdentity(identity)) {
    throw new RuntimePermissionError(
      "RUNTIME_PERMISSION_INVALID",
      "Runtime permission identity is invalid.",
      { field: "identity" }
    );
  }
}

function assertRuntimePermissionDecision(
  decision: RuntimePermissionDecision
): asserts decision is RuntimePermissionDecision {
  if (!isRuntimePermissionDecision(decision)) {
    throw new RuntimePermissionError(
      "RUNTIME_PERMISSION_INVALID",
      "Runtime permission decision is invalid.",
      { field: "decision" }
    );
  }
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimePermissionError(
      "RUNTIME_PERMISSION_INVALID",
      `Runtime permission ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimePermissionError(
      "RUNTIME_PERMISSION_INVALID",
      `Runtime permission ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertMetadataSafe(metadata: RuntimePermissionMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimePermissionError(
      "RUNTIME_PERMISSION_FORBIDDEN_VALUE",
      "Runtime permission metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isMetadataSafe(metadata: RuntimePermissionMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenMetadataKeyPattern.test(key));
}

function freezeIdentity(
  identity: RuntimePermissionIdentity
): RuntimePermissionIdentity {
  return Object.freeze({ ...identity });
}

function freezeMetadata(
  metadata: RuntimePermissionMetadata | undefined
): RuntimePermissionMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

function freezeRuntimePermission(permission: RuntimePermission): RuntimePermission {
  return Object.freeze(permission);
}

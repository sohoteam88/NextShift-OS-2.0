import { isRuntimeEvent, type RuntimeEvent } from "../event";
import { type RuntimeContextMetadata } from "../context";
import { RuntimeDiagnosticsError } from "./runtime-diagnostics-error";
import {
  isRuntimeDiagnosticsHealth,
  isRuntimeDiagnosticsStatus,
  type RuntimeDiagnosticsHealth,
  type RuntimeDiagnosticsStatus,
} from "./runtime-diagnostics-status";

export type RuntimeDiagnosticsMetadata = RuntimeContextMetadata;

export interface RuntimeDiagnosticsIdentity {
  readonly diagnosticsId: string;
  readonly component: string;
  readonly scope: string;
  readonly version?: string;
}

export interface RuntimeDiagnostics {
  readonly id: string;
  readonly identity: RuntimeDiagnosticsIdentity;
  readonly health: RuntimeDiagnosticsHealth;
  readonly status: RuntimeDiagnosticsStatus;
  readonly message?: string;
  readonly observedAt: Date;
  readonly eventRuntimeId?: string;
  readonly eventType?: string;
  readonly metadata?: RuntimeDiagnosticsMetadata;
}

export interface RuntimeDiagnosticsSnapshot {
  readonly id: string;
  readonly identity: RuntimeDiagnosticsIdentity;
  readonly health: RuntimeDiagnosticsHealth;
  readonly status: RuntimeDiagnosticsStatus;
  readonly message?: string;
  readonly observedAt: string;
  readonly eventRuntimeId?: string;
  readonly eventType?: string;
  readonly metadata?: RuntimeDiagnosticsMetadata;
}

export interface CreateRuntimeDiagnosticsInput {
  readonly id?: string;
  readonly identity: RuntimeDiagnosticsIdentity;
  readonly health: RuntimeDiagnosticsHealth;
  readonly status: RuntimeDiagnosticsStatus;
  readonly message?: string;
  readonly observedAt?: Date;
  readonly event?: RuntimeEvent;
  readonly metadata?: RuntimeDiagnosticsMetadata;
}

const forbiddenMetadataKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimeDiagnostics(
  input: CreateRuntimeDiagnosticsInput
): RuntimeDiagnostics {
  const observedAt = input.observedAt ?? new Date();

  assertRuntimeDiagnosticsIdentity(input.identity);
  assertRuntimeDiagnosticsHealth(input.health);
  assertRuntimeDiagnosticsStatus(input.status);
  assertValidDate(observedAt, "observedAt");
  assertMetadataSafe(input.metadata);

  const eventFields = resolveEventFields(input.event);

  return freezeRuntimeDiagnostics({
    id: normalizeRequiredString(input.id ?? crypto.randomUUID(), "id"),
    identity: freezeIdentity(input.identity),
    health: input.health,
    status: input.status,
    message:
      input.message === undefined
        ? undefined
        : normalizeRequiredString(input.message, "message"),
    observedAt,
    ...eventFields,
    metadata: freezeMetadata(input.metadata),
  });
}

export function snapshotRuntimeDiagnostics(
  diagnostics: RuntimeDiagnostics
): RuntimeDiagnosticsSnapshot {
  assertRuntimeDiagnostics(diagnostics);

  return Object.freeze({
    id: diagnostics.id,
    identity: freezeIdentity(diagnostics.identity),
    health: diagnostics.health,
    status: diagnostics.status,
    message: diagnostics.message,
    observedAt: diagnostics.observedAt.toISOString(),
    eventRuntimeId: diagnostics.eventRuntimeId,
    eventType: diagnostics.eventType,
    metadata: freezeMetadata(diagnostics.metadata),
  });
}

export function isRuntimeDiagnostics(value: unknown): value is RuntimeDiagnostics {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeDiagnostics>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimeDiagnosticsIdentity(candidate.identity) &&
    isRuntimeDiagnosticsHealth(candidate.health) &&
    isRuntimeDiagnosticsStatus(candidate.status) &&
    (candidate.message === undefined || isNonEmptyString(candidate.message)) &&
    candidate.observedAt instanceof Date &&
    !Number.isNaN(candidate.observedAt.getTime()) &&
    (candidate.eventRuntimeId === undefined || isNonEmptyString(candidate.eventRuntimeId)) &&
    (candidate.eventType === undefined || isNonEmptyString(candidate.eventType)) &&
    isMetadataSafe(candidate.metadata)
  );
}

export function isRuntimeDiagnosticsIdentity(
  value: unknown
): value is RuntimeDiagnosticsIdentity {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeDiagnosticsIdentity>;

  return (
    isNonEmptyString(candidate.diagnosticsId) &&
    isNonEmptyString(candidate.component) &&
    isNonEmptyString(candidate.scope) &&
    (candidate.version === undefined || isNonEmptyString(candidate.version))
  );
}

function assertRuntimeDiagnostics(diagnostics: RuntimeDiagnostics): void {
  if (!isRuntimeDiagnostics(diagnostics)) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      "Runtime diagnostics is invalid.",
      { field: "diagnostics" }
    );
  }
}

function assertRuntimeDiagnosticsIdentity(
  identity: RuntimeDiagnosticsIdentity
): asserts identity is RuntimeDiagnosticsIdentity {
  if (!isRuntimeDiagnosticsIdentity(identity)) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      "Runtime diagnostics identity is invalid.",
      { field: "identity" }
    );
  }
}

function assertRuntimeDiagnosticsHealth(
  health: RuntimeDiagnosticsHealth
): asserts health is RuntimeDiagnosticsHealth {
  if (!isRuntimeDiagnosticsHealth(health)) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      "Runtime diagnostics health is invalid.",
      { field: "health" }
    );
  }
}

function assertRuntimeDiagnosticsStatus(
  status: RuntimeDiagnosticsStatus
): asserts status is RuntimeDiagnosticsStatus {
  if (!isRuntimeDiagnosticsStatus(status)) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      "Runtime diagnostics status is invalid.",
      { field: "status" }
    );
  }
}

function resolveEventFields(
  event: RuntimeEvent | undefined
): Pick<RuntimeDiagnostics, "eventRuntimeId" | "eventType"> {
  if (event === undefined) {
    return {};
  }

  if (!isRuntimeEvent(event)) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      "Runtime diagnostics event is invalid.",
      { field: "event" }
    );
  }

  return {
    eventRuntimeId: event.id,
    eventType: event.identity.type,
  };
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      `Runtime diagnostics ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_INVALID",
      `Runtime diagnostics ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertMetadataSafe(metadata: RuntimeDiagnosticsMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimeDiagnosticsError(
      "RUNTIME_DIAGNOSTICS_FORBIDDEN_VALUE",
      "Runtime diagnostics metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isMetadataSafe(metadata: RuntimeDiagnosticsMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenMetadataKeyPattern.test(key));
}

function freezeIdentity(
  identity: RuntimeDiagnosticsIdentity
): RuntimeDiagnosticsIdentity {
  return Object.freeze({ ...identity });
}

function freezeMetadata(
  metadata: RuntimeDiagnosticsMetadata | undefined
): RuntimeDiagnosticsMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

function freezeRuntimeDiagnostics(diagnostics: RuntimeDiagnostics): RuntimeDiagnostics {
  return Object.freeze(diagnostics);
}

import { RuntimeContextError } from "./runtime-context-error";
import {
  canDeriveRuntimeContextScope,
  isRuntimeContextScope,
  type RuntimeContextScope,
} from "./runtime-context-scope";

export type RuntimeContextMetadata = Readonly<Record<string, unknown>>;

export interface RuntimeContext {
  readonly id: string;
  readonly scope: RuntimeContextScope;
  readonly correlationId: string;
  readonly rootId: string;
  readonly parentId?: string;
  readonly createdAt: Date;
  readonly metadata?: RuntimeContextMetadata;
}

export interface RuntimeContextSnapshot {
  readonly id: string;
  readonly scope: RuntimeContextScope;
  readonly correlationId: string;
  readonly rootId: string;
  readonly parentId?: string;
  readonly createdAt: string;
  readonly metadata?: RuntimeContextMetadata;
}

export interface CreateRuntimeContextInput {
  readonly id?: string;
  readonly scope: RuntimeContextScope;
  readonly correlationId?: string;
  readonly rootId?: string;
  readonly parentId?: string;
  readonly createdAt?: Date;
  readonly metadata?: RuntimeContextMetadata;
}

export interface DeriveRuntimeContextInput {
  readonly id?: string;
  readonly scope: RuntimeContextScope;
  readonly createdAt?: Date;
  readonly metadata?: RuntimeContextMetadata;
}

const forbiddenMetadataKeyPattern = /(secret|password|token|api[-_]?key|credential)/i;

export function createRuntimeContext(input: CreateRuntimeContextInput): RuntimeContext {
  const id = normalizeRequiredString(input.id ?? crypto.randomUUID(), "id");
  const correlationId = normalizeRequiredString(
    input.correlationId ?? crypto.randomUUID(),
    "correlationId"
  );
  const rootId = normalizeRequiredString(input.rootId ?? id, "rootId");
  const parentId =
    input.parentId === undefined
      ? undefined
      : normalizeRequiredString(input.parentId, "parentId");
  const createdAt = input.createdAt ?? new Date();

  assertRuntimeContextScope(input.scope);
  assertValidDate(createdAt, "createdAt");
  assertMetadataSafe(input.metadata);

  return Object.freeze({
    id,
    scope: input.scope,
    correlationId,
    rootId,
    parentId,
    createdAt,
    metadata: freezeMetadata(input.metadata),
  });
}

export function deriveRuntimeContext(
  parent: RuntimeContext,
  input: DeriveRuntimeContextInput
): RuntimeContext {
  if (!isRuntimeContext(parent)) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_INVALID",
      "Parent runtime context is invalid.",
      { field: "parent" }
    );
  }

  assertRuntimeContextScope(input.scope);

  if (!canDeriveRuntimeContextScope(parent.scope, input.scope)) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_SCOPE_VIOLATION",
      `Runtime context cannot derive ${input.scope} from ${parent.scope}.`,
      { parentScope: parent.scope, childScope: input.scope }
    );
  }

  return createRuntimeContext({
    id: input.id,
    scope: input.scope,
    correlationId: parent.correlationId,
    rootId: parent.rootId,
    parentId: parent.id,
    createdAt: input.createdAt,
    metadata: input.metadata,
  });
}

export function snapshotRuntimeContext(context: RuntimeContext): RuntimeContextSnapshot {
  if (!isRuntimeContext(context)) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_INVALID",
      "Runtime context cannot be snapshotted because it is invalid.",
      { field: "context" }
    );
  }

  return Object.freeze({
    id: context.id,
    scope: context.scope,
    correlationId: context.correlationId,
    rootId: context.rootId,
    parentId: context.parentId,
    createdAt: context.createdAt.toISOString(),
    metadata: freezeMetadata(context.metadata),
  });
}

export function isRuntimeContext(value: unknown): value is RuntimeContext {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeContext>;

  return (
    isNonEmptyString(candidate.id) &&
    isRuntimeContextScope(candidate.scope) &&
    isNonEmptyString(candidate.correlationId) &&
    isNonEmptyString(candidate.rootId) &&
    (candidate.parentId === undefined || isNonEmptyString(candidate.parentId)) &&
    candidate.createdAt instanceof Date &&
    !Number.isNaN(candidate.createdAt.getTime()) &&
    isMetadataSafe(candidate.metadata)
  );
}

function assertRuntimeContextScope(scope: unknown): asserts scope is RuntimeContextScope {
  if (!isRuntimeContextScope(scope)) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_INVALID",
      "Runtime context scope is invalid.",
      { field: "scope" }
    );
  }
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_INVALID",
      `Runtime context ${field} must be a valid Date.`,
      { field }
    );
  }
}

function normalizeRequiredString(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_INVALID",
      `Runtime context ${field} is required.`,
      { field }
    );
  }

  return normalized;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertMetadataSafe(metadata: RuntimeContextMetadata | undefined): void {
  if (!isMetadataSafe(metadata)) {
    throw new RuntimeContextError(
      "RUNTIME_CONTEXT_FORBIDDEN_VALUE",
      "Runtime context metadata contains a forbidden key.",
      { field: "metadata" }
    );
  }
}

function isMetadataSafe(metadata: RuntimeContextMetadata | undefined): boolean {
  if (metadata === undefined) {
    return true;
  }

  return Object.keys(metadata).every((key) => !forbiddenMetadataKeyPattern.test(key));
}

function freezeMetadata(
  metadata: RuntimeContextMetadata | undefined
): RuntimeContextMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }

  return Object.freeze({ ...metadata });
}

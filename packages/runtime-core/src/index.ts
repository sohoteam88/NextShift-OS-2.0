export type RuntimeEventType =
  | "runtime.workflow.started"
  | "runtime.workflow.step.completed"
  | "runtime.workflow.approval_required"
  | "runtime.workflow.completed"
  | "runtime.workflow.failed"
  | "repository.health"
  | "repository.cleanup_candidate"
  | "repository.validation_completed"
  | "business.decision.requested"
  | "business.decision.completed"
  | (string & {});

export type RuntimeEventSource =
  | "runtime-core"
  | "runtime-orchestrator"
  | "repository-runtime"
  | "workspace-runtime"
  | "business-runtime"
  | (string & {});

export type RuntimeStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "approval_required";

export interface RuntimeExecutionContext {
  readonly executionId: string;
  readonly workspaceId: string;
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RuntimeEvent<TPayload = unknown> {
  readonly id: string;
  readonly type: RuntimeEventType;
  readonly eventType: RuntimeEventType;
  readonly source: RuntimeEventSource;
  readonly occurredAt: Date;
  readonly payload: TPayload;
  readonly context?: RuntimeExecutionContext;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RuntimeResult<TOutput = unknown> {
  readonly status: RuntimeStatus;
  readonly output?: TOutput;
  readonly events?: readonly RuntimeEvent[];
  readonly errors?: readonly string[];
}

export interface CreateRuntimeEventInput<TPayload = unknown> {
  readonly id?: string;
  readonly type: RuntimeEventType;
  readonly source: RuntimeEventSource;
  readonly occurredAt?: Date;
  readonly payload: TPayload;
  readonly context?: RuntimeExecutionContext;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export function createRuntimeEvent<TPayload>(
  input: CreateRuntimeEventInput<TPayload>
): RuntimeEvent<TPayload> {
  return {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    eventType: input.type,
    source: input.source,
    occurredAt: input.occurredAt ?? new Date(),
    payload: input.payload,
    context: input.context,
    metadata: input.metadata,
  };
}

export function isRuntimeEvent(value: unknown): value is RuntimeEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RuntimeEvent>;

  return (
    typeof candidate.id === "string" &&
    candidate.id.trim().length > 0 &&
    typeof candidate.type === "string" &&
    candidate.type.trim().length > 0 &&
    candidate.eventType === candidate.type &&
    typeof candidate.source === "string" &&
    candidate.source.trim().length > 0 &&
    candidate.occurredAt instanceof Date &&
    !Number.isNaN(candidate.occurredAt.getTime()) &&
    "payload" in candidate
  );
}

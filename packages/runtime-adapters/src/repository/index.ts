import {
  createRuntimeEvent,
  type RuntimeEvent,
  type RuntimeExecutionContext,
} from "@nextshift/runtime-core";

export type RepositoryHealthStatus = "healthy" | "degraded" | "blocked";

export interface RepositoryHealthEventPayload {
  readonly status: RepositoryHealthStatus;
  readonly checkedAt: Date;
  readonly summary?: string;
}

export type RepositoryHealthEvent =
  RuntimeEvent<RepositoryHealthEventPayload> & {
    readonly type: "repository.health";
    readonly eventType: "repository.health";
    readonly source: "repository-runtime";
  };

export interface CleanupCandidate {
  readonly id: string;
  readonly path: string;
  readonly reason: string;
  readonly risk: "low" | "medium" | "high";
}

export interface ValidationResult {
  readonly candidateId: string;
  readonly valid: boolean;
  readonly messages: readonly string[];
}

export interface RepositoryRuntimeAdapter {
  emitHealthEvent(
    context: RuntimeExecutionContext
  ): Promise<RepositoryHealthEvent>;

  listCleanupCandidates?(
    context: RuntimeExecutionContext
  ): Promise<readonly CleanupCandidate[]>;

  validateCleanupCandidate?(
    candidate: CleanupCandidate,
    context: RuntimeExecutionContext
  ): Promise<ValidationResult>;
}

export function createRepositoryHealthEvent(input: {
  readonly context: RuntimeExecutionContext;
  readonly status: RepositoryHealthStatus;
  readonly checkedAt?: Date;
  readonly summary?: string;
}): RepositoryHealthEvent {
  return createRuntimeEvent({
    type: "repository.health",
    source: "repository-runtime",
    payload: {
      status: input.status,
      checkedAt: input.checkedAt ?? new Date(),
      summary: input.summary,
    },
    context: input.context,
  }) as RepositoryHealthEvent;
}

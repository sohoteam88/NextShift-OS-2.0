import type {
  BusinessId,
  DecisionId,
  Result,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";

export type ExecutionStatus =
  | "planned"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExecutionPlan {
  readonly businessId: BusinessId;
  readonly decisionId: DecisionId;
  readonly capability: string;
  readonly objective: string;
}

export interface ExecutionRecord {
  readonly executionId: string;
  readonly businessId: BusinessId;
  readonly decisionId: DecisionId;
  readonly status: ExecutionStatus;
  readonly executedAt: Timestamp;
  readonly notes?: string;
}

export interface ExecuteDecisionRequest {
  readonly tenant: TenantContext;
  readonly plan: ExecutionPlan;
}

export interface ExecutionLayerContract {
  executeDecision(request: ExecuteDecisionRequest): Promise<Result<ExecutionRecord>>;
}

import type { RuntimeExecutionContext } from "@nextshift/runtime-core";

export type BusinessDecision = "approved" | "rejected" | "needs_review";

export interface BusinessDecisionRequest {
  readonly requestId: string;
  readonly context: RuntimeExecutionContext;
  readonly action: string;
  readonly subject: string;
  readonly risk?: "low" | "medium" | "high";
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BusinessDecisionResult {
  readonly requestId: string;
  readonly decision: BusinessDecision;
  readonly approved: boolean;
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BusinessRuntimeAdapter {
  decide(request: BusinessDecisionRequest): Promise<BusinessDecisionResult>;
}

export class StaticBusinessRuntimeAdapter implements BusinessRuntimeAdapter {
  constructor(private readonly decision: BusinessDecision = "needs_review") {}

  async decide(
    request: BusinessDecisionRequest
  ): Promise<BusinessDecisionResult> {
    return {
      requestId: request.requestId,
      decision: this.decision,
      approved: this.decision === "approved",
      reason: "Static runtime decision",
    };
  }
}

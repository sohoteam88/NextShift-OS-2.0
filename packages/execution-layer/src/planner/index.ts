import type {
  ExecuteDecisionRequest,
  ExecutionPlan,
} from "@nextshift/contracts";
import type { Result } from "@nextshift/shared";

export interface ExecutionPlannerPort {
  createPlan(request: ExecuteDecisionRequest): Promise<Result<ExecutionPlan>>;
}

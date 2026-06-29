import type {
  ExecuteDecisionRequest,
  ExecutionLayerContract,
  ExecutionRecord,
} from "@nextshift/contracts";
import type { Result } from "@nextshift/shared";

export class ExecutionLayer implements ExecutionLayerContract {
  async executeDecision(
    request: ExecuteDecisionRequest
  ): Promise<Result<ExecutionRecord>> {
    return {
      ok: false,
      error: {
        name: "NotImplementedError",
        message: `ExecutionLayer.executeDecision is not implemented yet for capability: ${request.plan.capability}`,
      },
    };
  }
}

import { describe, expect, it } from "vitest";
import {
  RuntimeOrchestrator,
  type RuntimeWorkflow,
} from "@nextshift/runtime-orchestrator";

const context = {
  executionId: "execution-1",
  workspaceId: "workspace-1",
};

describe("RuntimeOrchestrator", () => {
  it("executes a simple workflow", async () => {
    const workflow: RuntimeWorkflow = {
      id: "workflow-1",
      name: "Simple workflow",
      steps: [
        {
          id: "step-1",
          name: "Run step",
          execute: () => ({ output: { ok: true } }),
        },
      ],
    };

    const result = await new RuntimeOrchestrator().execute(workflow, context);

    expect(result.status).toBe("completed");
    expect(result.output?.completedStepIds).toEqual(["step-1"]);
  });

  it("can pause at an approval gate", async () => {
    const workflow: RuntimeWorkflow = {
      id: "workflow-1",
      name: "Approval workflow",
      steps: [
        {
          id: "approval-1",
          name: "Operator approval",
          reason: "Destructive repository action requires review",
          isApproved: () => false,
        },
      ],
    };

    const result = await new RuntimeOrchestrator().execute(workflow, context);

    expect(result.status).toBe("approval_required");
    expect(result.output?.pendingApprovalStepId).toBe("approval-1");
  });
});

import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@nextshift/event-bus";
import type { RuntimeEvent } from "@nextshift/runtime-core";
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

  it("returns a structured failed result when a step throws", async () => {
    const workflow: RuntimeWorkflow = {
      id: "workflow-1",
      name: "Failing workflow",
      steps: [
        {
          id: "step-1",
          name: "Completed step",
          execute: () => ({ output: { ok: true } }),
        },
        {
          id: "step-2",
          name: "Failing step",
          execute: () => {
            throw new Error("step failed");
          },
        },
      ],
    };

    const result = await new RuntimeOrchestrator().execute(workflow, context);

    expect(result.status).toBe("failed");
    expect(result.output?.completedStepIds).toEqual(["step-1"]);
    expect(result.output?.failedStepId).toBe("step-2");
    expect(result.errors).toEqual(["step failed"]);
  });

  it("emits a failed workflow event when the event bus is available", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const received: RuntimeEvent[] = [];

    eventBus.subscribe("runtime.workflow.failed", (event) => {
      received.push(event);
    });

    const workflow: RuntimeWorkflow = {
      id: "workflow-1",
      name: "Failing workflow",
      steps: [
        {
          id: "step-1",
          name: "Failing step",
          execute: () => {
            throw new Error("step failed");
          },
        },
      ],
    };

    const result = await new RuntimeOrchestrator(eventBus).execute(
      workflow,
      context
    );

    expect(result.status).toBe("failed");
    expect(received).toHaveLength(1);
    expect(received[0]?.eventType).toBe("runtime.workflow.failed");
    expect(received[0]?.payload).toMatchObject({
      workflowId: "workflow-1",
      stepId: "step-1",
      error: "step failed",
    });
  });
});

import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@nextshift/event-bus";
import type { RuntimeEvent } from "@nextshift/runtime-core";
import {
  createBusinessDecisionResult,
  createRepositoryHealthEvent,
  type BusinessRuntimeAdapter,
  type RepositoryRuntimeAdapter,
} from "@nextshift/runtime-adapters";
import {
  InMemoryAuditTrailRecorder,
  RepositoryHealthWorkflow,
  RuntimeOrchestrator,
  StaticOperatorApprovalService,
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

describe("RepositoryHealthWorkflow", () => {
  it("executes the end-to-end repository health review flow", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const routedEvents: RuntimeEvent[] = [];
    const auditTrail = new InMemoryAuditTrailRecorder();
    const repositoryAdapter = createRepositoryAdapter();
    const businessAdapter: BusinessRuntimeAdapter = {
      async decide(request) {
        return createBusinessDecisionResult({
          requestId: request.requestId,
          decision: "approved",
          reason: "Approved for repository health simulation",
        });
      },
    };

    for (const eventType of [
      "repository.health",
      "repository.cleanup_candidate",
      "workspace.operator.approval_requested",
      "business.decision.requested",
      "business.decision.completed",
      "repository.action.simulated",
      "repository.validation_completed",
    ]) {
      eventBus.subscribe(eventType, (event) => {
        routedEvents.push(event);
      });
    }

    const workflow = new RepositoryHealthWorkflow({
      repositoryAdapter,
      businessAdapter,
      approvalService: new StaticOperatorApprovalService(true, "operator-1"),
      eventBus,
      auditTrail,
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    const result = await workflow.execute(context);

    expect(result.status).toBe("completed");
    expect(result.output?.candidate?.path).toBe("audit/template.md");
    expect(result.output?.operatorApproval?.approved).toBe(true);
    expect(result.output?.businessDecision?.approved).toBe(true);
    expect(result.output?.action).toMatchObject({
      candidateId: "candidate-1",
      simulated: true,
      destructive: false,
    });
    expect(result.output?.validation).toMatchObject({
      candidateId: "candidate-1",
      valid: true,
    });
    expect(auditTrail.list()).toHaveLength(5);
    expect(routedEvents.map((event) => event.eventType)).toEqual([
      "repository.health",
      "repository.cleanup_candidate",
      "workspace.operator.approval_requested",
      "business.decision.requested",
      "business.decision.completed",
      "repository.action.simulated",
      "repository.validation_completed",
    ]);
  });

  it("requires operator approval before simulated repository action", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const simulatedActions: RuntimeEvent[] = [];
    const businessDecisions: RuntimeEvent[] = [];

    eventBus.subscribe("repository.action.simulated", (event) => {
      simulatedActions.push(event);
    });
    eventBus.subscribe("business.decision.requested", (event) => {
      businessDecisions.push(event);
    });

    const workflow = new RepositoryHealthWorkflow({
      repositoryAdapter: createRepositoryAdapter(),
      businessAdapter: {
        async decide(request) {
          return createBusinessDecisionResult({
            requestId: request.requestId,
            decision: "approved",
          });
        },
      },
      approvalService: new StaticOperatorApprovalService(false),
      eventBus,
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    const result = await workflow.execute(context);

    expect(result.status).toBe("approval_required");
    expect(result.output?.operatorApproval?.approved).toBe(false);
    expect(simulatedActions).toEqual([]);
    expect(businessDecisions).toEqual([]);
  });
});

function createRepositoryAdapter(): RepositoryRuntimeAdapter {
  return {
    async emitHealthEvent(runtimeContext) {
      return createRepositoryHealthEvent({
        context: runtimeContext,
        status: "degraded",
        checkedAt: fixedNow(),
        summary: "Cleanup candidate detected",
      });
    },
    async listCleanupCandidates() {
      return [
        {
          id: "candidate-1",
          path: "audit/template.md",
          reason: "Legacy audit template ready for simulated cleanup",
          risk: "low",
        },
      ];
    },
  };
}

function fixedNow(): Date {
  return new Date("2026-07-06T00:00:00.000Z");
}

function createSequenceIdFactory(): () => string {
  let id = 0;

  return () => `runtime-id-${(id += 1)}`;
}

import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@nextshift/event-bus";
import {
  createBusinessDecisionResult,
  createRepositoryHealthEvent,
  type BusinessDecisionRequest,
  type BusinessRuntimeAdapter,
} from "@nextshift/runtime-adapters";
import type { RuntimeEvent } from "@nextshift/runtime-core";
import { WorkspaceSession } from "@nextshift/workspace-runtime";

const runtimeContext = {
  executionId: "execution-1",
  workspaceId: "workspace-1",
};

describe("WorkspaceSession", () => {
  it("creates a runtime task and timeline entry from a repository runtime event", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const routedEvents: RuntimeEvent[] = [];
    const businessAdapter = createBusinessAdapter();
    const session = new WorkspaceSession({
      businessAdapter,
      eventBus,
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    eventBus.subscribe("repository.health", (event) => {
      routedEvents.push(event);
    });
    eventBus.subscribe("workspace.task.created", (event) => {
      routedEvents.push(event);
    });

    const task = await session.receiveRepositoryRuntimeEvent({
      event: createHealthEvent(),
      context: runtimeContext,
    });

    expect(session.getStatus()).toBe("active");
    expect(task.status).toBe("awaiting_operator");
    expect(task.title).toBe("Review repository health event");
    expect(task.conversation.messages).toHaveLength(1);
    expect(session.listTasks()).toHaveLength(1);
    expect(session.getTimeline().map((entry) => entry.eventType)).toEqual([
      "repository.health",
      "workspace.task.created",
    ]);
    expect(routedEvents.map((event) => event.eventType)).toEqual([
      "repository.health",
      "workspace.task.created",
    ]);
  });

  it("presents operator decision and invokes the business runtime", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const routedEvents: RuntimeEvent[] = [];
    const businessRequests: BusinessDecisionRequest[] = [];
    const session = new WorkspaceSession({
      businessAdapter: createBusinessAdapter(businessRequests),
      eventBus,
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    eventBus.subscribe("workspace.operator.decision_presented", (event) => {
      routedEvents.push(event);
    });
    eventBus.subscribe("business.decision.completed", (event) => {
      routedEvents.push(event);
    });

    const task = await session.receiveRepositoryRuntimeEvent({
      event: createHealthEvent(),
      context: runtimeContext,
    });
    const completedTask = await session.presentOperatorDecision({
      taskId: task.id,
      operator: {
        operatorId: "operator-1",
        displayName: "Runtime Operator",
      },
      decision: {
        approved: true,
        reason: "Ready for business runtime review",
      },
      context: runtimeContext,
    });

    expect(completedTask.status).toBe("completed");
    expect(completedTask.operatorDecision?.approved).toBe(true);
    expect(completedTask.businessDecision).toMatchObject({
      decision: "approved",
      approved: true,
    });
    expect(completedTask.conversation.messages).toHaveLength(3);
    expect(businessRequests).toHaveLength(1);
    expect(businessRequests[0]).toMatchObject({
      requestId: task.id,
      action: "review_repository_runtime_event",
      subject: "repository.health",
    });
    expect(routedEvents.map((event) => event.eventType)).toEqual([
      "workspace.operator.decision_presented",
      "business.decision.completed",
    ]);
    expect(session.getTimeline().map((entry) => entry.eventType)).toEqual([
      "repository.health",
      "workspace.task.created",
      "workspace.operator.decision_presented",
      "business.decision.completed",
    ]);
  });

  it("does not invoke business runtime when operator rejects the task", async () => {
    const businessRequests: BusinessDecisionRequest[] = [];
    const session = new WorkspaceSession({
      businessAdapter: createBusinessAdapter(businessRequests),
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });
    const task = await session.receiveRepositoryRuntimeEvent({
      event: createHealthEvent(),
      context: runtimeContext,
    });

    const rejectedTask = await session.presentOperatorDecision({
      taskId: task.id,
      operator: {
        operatorId: "operator-1",
      },
      decision: {
        approved: false,
        reason: "Needs more context",
      },
      context: runtimeContext,
    });

    expect(rejectedTask.status).toBe("rejected");
    expect(rejectedTask.businessDecision).toBeUndefined();
    expect(businessRequests).toEqual([]);
  });

  it("closes the workspace session lifecycle", () => {
    const session = new WorkspaceSession({
      businessAdapter: createBusinessAdapter(),
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    session.close();

    expect(session.getStatus()).toBe("closed");
  });
});

function createBusinessAdapter(
  requests: BusinessDecisionRequest[] = []
): BusinessRuntimeAdapter {
  return {
    async decide(request) {
      requests.push(request);

      return createBusinessDecisionResult({
        requestId: request.requestId,
        decision: "approved",
        reason: "Business runtime approved workspace task",
      });
    },
  };
}

function createHealthEvent(): RuntimeEvent {
  return createRepositoryHealthEvent({
    context: runtimeContext,
    status: "degraded",
    checkedAt: fixedNow(),
    summary: "Repository cleanup candidate requires review",
  });
}

function fixedNow(): Date {
  return new Date("2026-07-06T00:00:00.000Z");
}

function createSequenceIdFactory(): () => string {
  let id = 0;

  return () => `workspace-id-${(id += 1)}`;
}

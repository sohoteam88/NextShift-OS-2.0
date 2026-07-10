import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@nextshift/event-bus";
import {
  InMemoryCRMRuntimeAdapter,
  createBusinessDecisionResult,
  createRepositoryHealthEvent,
  type BusinessDecisionRequest,
  type BusinessRuntimeAdapter,
  type CRMLead,
} from "@nextshift/runtime-adapters";
import type { RuntimeEvent } from "@nextshift/runtime-core";
import {
  InMemoryLeadQualificationAuditTrailRecorder,
  LeadQualificationWorkflow,
  WorkspaceSession,
} from "@nextshift/workspace-runtime";

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

describe("LeadQualificationWorkflow", () => {
  it("executes WF-002 end-to-end with business decision, operator approval, CRM simulation, validation, and audit trail", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const routedEvents: RuntimeEvent[] = [];
    const businessRequests: BusinessDecisionRequest[] = [];
    const auditTrail = new InMemoryLeadQualificationAuditTrailRecorder();
    const workflow = new LeadQualificationWorkflow({
      crmAdapter: new InMemoryCRMRuntimeAdapter({
        now: fixedNow,
        idFactory: createSequenceIdFactory(),
      }),
      businessAdapter: createBusinessAdapter(businessRequests),
      eventBus,
      auditTrail,
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    for (const eventType of [
      "crm.lead.created",
      "workspace.task.created",
      "business.decision.completed",
      "workspace.operator.decision_presented",
      "crm.status_update.simulated",
      "crm.status_update.validated",
    ]) {
      eventBus.subscribe(eventType, (event) => {
        routedEvents.push(event);
      });
    }

    const result = await workflow.execute({
      lead: createLead(),
      context: runtimeContext,
      operator: {
        operatorId: "operator-1",
        displayName: "Runtime Operator",
      },
      operatorDecision: {
        approved: true,
        reason: "Qualified lead can move forward",
      },
    });

    expect(result.task.title).toBe("Qualify CRM lead");
    expect(result.businessDecision).toMatchObject({
      decision: "approved",
      approved: true,
    });
    expect(result.statusUpdate).toMatchObject({
      leadId: "lead-1",
      previousStatus: "new",
      nextStatus: "qualified",
      simulated: true,
      destructive: false,
    });
    expect(result.validation).toMatchObject({
      leadId: "lead-1",
      valid: true,
    });
    expect(result.auditTrailEntries.map((entry) => entry.eventType)).toEqual([
      "crm.lead.created",
      "business.lead_qualification.completed",
      "workspace.operator.decision_presented",
      "crm.status_update.simulated",
      "crm.status_update.validated",
    ]);
    expect(auditTrail.list()).toHaveLength(5);
    expect(businessRequests).toHaveLength(1);
    expect(businessRequests[0]).toMatchObject({
      action: "qualify_crm_lead",
      subject: "lead-1",
    });
    expect(routedEvents.map((event) => event.eventType)).toEqual([
      "crm.lead.created",
      "workspace.task.created",
      "business.decision.completed",
      "workspace.operator.decision_presented",
      "crm.status_update.simulated",
      "crm.status_update.validated",
    ]);
  });

  it("requires operator approval before simulating CRM status update", async () => {
    const eventBus = new InMemoryEventBus<RuntimeEvent>();
    const simulatedUpdates: RuntimeEvent[] = [];
    const workflow = new LeadQualificationWorkflow({
      crmAdapter: new InMemoryCRMRuntimeAdapter({
        now: fixedNow,
        idFactory: createSequenceIdFactory(),
      }),
      businessAdapter: createBusinessAdapter(),
      eventBus,
      now: fixedNow,
      idFactory: createSequenceIdFactory(),
    });

    eventBus.subscribe("crm.status_update.simulated", (event) => {
      simulatedUpdates.push(event);
    });

    const result = await workflow.execute({
      lead: createLead(),
      context: runtimeContext,
      operator: {
        operatorId: "operator-1",
      },
      operatorDecision: {
        approved: false,
        reason: "Lead needs human follow-up first",
      },
    });

    expect(result.businessDecision.approved).toBe(true);
    expect(result.operatorDecision.approved).toBe(false);
    expect(result.statusUpdate).toBeUndefined();
    expect(result.validation).toBeUndefined();
    expect(simulatedUpdates).toEqual([]);
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

function createLead(): CRMLead {
  return {
    id: "lead-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    company: "Analytical Engines Ltd",
    source: "demo-request",
    status: "new",
    scoreSignals: {
      companyFit: "high",
      requestedDemo: true,
      teamSize: 12,
    },
  };
}

function fixedNow(): Date {
  return new Date("2026-07-06T00:00:00.000Z");
}

function createSequenceIdFactory(): () => string {
  let id = 0;

  return () => `workspace-id-${(id += 1)}`;
}

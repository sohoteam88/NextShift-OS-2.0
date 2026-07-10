import {
  InMemoryOpportunityEvaluationRepository,
  type OpportunityEvaluationDomainEvent,
  type OpportunityEvaluationId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  OpportunityEvaluationApplicationService,
  type OpportunityEvaluationEventPublisher,
} from "../src/opportunity-evaluation";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const evaluationId = "opportunity-evaluation-1" as OpportunityEvaluationId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingOpportunityEvaluationEventPublisher
  implements OpportunityEvaluationEventPublisher
{
  readonly events: OpportunityEvaluationDomainEvent[] = [];

  async publish(event: OpportunityEvaluationDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const repository = new InMemoryOpportunityEvaluationRepository();
  const publisher = new RecordingOpportunityEvaluationEventPublisher();
  const timestamps = [
    "2026-07-06T00:00:00.000Z",
    "2026-07-06T01:00:00.000Z",
    "2026-07-06T02:00:00.000Z",
    "2026-07-06T03:00:00.000Z",
  ];
  const service = new OpportunityEvaluationApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-07-06T04:00:00.000Z",
    () => eventId,
    () => evaluationId
  );

  return { publisher, repository, service };
}

async function createEvaluation(service: OpportunityEvaluationApplicationService) {
  return service.createOpportunityEvaluation({
    commandType: "CreateOpportunityEvaluation",
    context,
    evaluationId,
    title: "Expand CRM onboarding offer",
    summary: "Paid onboarding demand is emerging from qualified CRM leads.",
    source: {
      type: "lead",
      referenceId: "lead-1",
      summary: "Lead requested onboarding support.",
    },
  });
}

describe("OpportunityEvaluationApplicationService", () => {
  it("creates and evaluates opportunities with integration events", async () => {
    const { publisher, repository, service } = createService();

    const created = await createEvaluation(service);

    expect(created.ok).toBe(true);
    expect(await repository.exists(evaluationId)).toBe(true);

    const evaluated = await service.evaluateOpportunity({
      commandType: "EvaluateOpportunity",
      context,
      evaluationId,
      marketFit: 90,
      businessValue: 95,
      urgency: 85,
      effort: 15,
      confidence: 95,
    });

    expect(evaluated.ok).toBe(true);

    if (evaluated.ok) {
      expect(evaluated.value.evaluation.toSnapshot()).toMatchObject({
        status: "evaluated",
        score: {
          total: 90,
          priority: "critical",
        },
      });
    }

    const critical = await service.listOpportunityEvaluationsByPriority({
      queryType: "ListOpportunityEvaluationsByPriority",
      context,
      priority: "critical",
    });
    expect(critical.evaluations).toHaveLength(1);

    expect(publisher.events).toHaveLength(2);
    expect(publisher.events[0]).toMatchObject({
      eventType: "OpportunityEvaluationCreated",
      aggregateId: evaluationId,
      aggregateType: "OpportunityEvaluation",
      eventId,
      correlationId,
      payload: {
        evaluationId,
        businessId,
        title: "Expand CRM onboarding offer",
      },
    });
    expect(publisher.events[1]).toMatchObject({
      eventType: "OpportunityEvaluated",
      payload: {
        evaluationId,
        score: {
          priority: "critical",
        },
      },
    });
  });

  it("accepts, rejects, and archives evaluated opportunities", async () => {
    const { publisher, service } = createService();

    await createEvaluation(service);
    await service.evaluateOpportunity({
      commandType: "EvaluateOpportunity",
      context,
      evaluationId,
      marketFit: 80,
      businessValue: 90,
      urgency: 70,
      effort: 30,
      confidence: 80,
    });

    const accepted = await service.acceptOpportunity({
      commandType: "AcceptOpportunity",
      context,
      evaluationId,
      reason: "Strong revenue fit.",
    });

    expect(accepted.ok).toBe(true);

    if (accepted.ok) {
      expect(accepted.value.evaluation.toSnapshot()).toMatchObject({
        status: "accepted",
        decisionReason: "Strong revenue fit.",
      });
    }

    const archive = await service.archiveOpportunityEvaluation({
      commandType: "ArchiveOpportunityEvaluation",
      context,
      evaluationId,
    });

    expect(archive.ok).toBe(true);
    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "OpportunityEvaluationCreated",
      "OpportunityEvaluated",
      "OpportunityAccepted",
      "OpportunityEvaluationArchived",
    ]);
  });

  it("rejects missing and foreign opportunity evaluations", async () => {
    const { service } = createService();

    const missing = await service.evaluateOpportunity({
      commandType: "EvaluateOpportunity",
      context,
      evaluationId,
      marketFit: 80,
      businessValue: 90,
      urgency: 70,
      effort: 30,
      confidence: 80,
    });

    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("OpportunityEvaluationNotFound");
    }

    await createEvaluation(service);

    const foreign = await service.rejectOpportunity({
      commandType: "RejectOpportunity",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      evaluationId,
      reason: "Wrong business.",
    });

    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});

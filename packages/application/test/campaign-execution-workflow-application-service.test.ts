import { CampaignExecutionWorkflow } from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  CampaignExecutionApplicationService,
  type CampaignExecutionEventPublisher,
} from "../src/campaign-execution";

type CampaignExecutionDomainEvent =
  CampaignExecutionWorkflow.CampaignExecutionDomainEvent;
type CampaignExecutionId =
  CampaignExecutionWorkflow.CampaignExecutionId;

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const executionId = "workflow-campaign-execution-1" as CampaignExecutionId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingCampaignExecutionEventPublisher
  implements CampaignExecutionEventPublisher
{
  readonly events: CampaignExecutionDomainEvent[] = [];

  async publish(event: CampaignExecutionDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const repository =
    new CampaignExecutionWorkflow.InMemoryCampaignExecutionRepository();
  const publisher = new RecordingCampaignExecutionEventPublisher();
  const timestamps = [
    "2026-07-06T00:00:00.000Z",
    "2026-07-06T01:00:00.000Z",
    "2026-07-06T02:00:00.000Z",
    "2026-07-06T03:00:00.000Z",
    "2026-07-06T04:00:00.000Z",
  ];
  const service = new CampaignExecutionApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-07-06T05:00:00.000Z",
    () => eventId,
    () => executionId
  );

  return { publisher, repository, service };
}

async function createExecution(service: CampaignExecutionApplicationService) {
  return service.createCampaignExecution({
    commandType: "CreateCampaignExecution",
    context,
    executionId,
    title: "CRM onboarding launch",
    objective: "Convert approved opportunity into campaign execution.",
    channels: ["email", "webinar"],
    priority: "high",
  });
}

describe("CampaignExecutionApplicationService workflow", () => {
  it("creates, prepares, launches, and completes campaign executions", async () => {
    const { publisher, service } = createService();

    const created = await createExecution(service);
    expect(created.ok).toBe(true);

    const prepared = await service.prepareCampaignExecution({
      commandType: "PrepareCampaignExecution",
      context,
      executionId,
    });
    expect(prepared.ok).toBe(true);

    const launched = await service.launchCampaignExecution({
      commandType: "LaunchCampaignExecution",
      context,
      executionId,
    });
    expect(launched.ok).toBe(true);

    const completed = await service.completeCampaignExecution({
      commandType: "CompleteCampaignExecution",
      context,
      executionId,
      resultSummary: "Campaign launched and completed with qualified demand.",
    });
    expect(completed.ok).toBe(true);

    if (completed.ok) {
      expect(completed.value.execution.toSnapshot()).toMatchObject({
        status: "completed",
        resultSummary: "Campaign launched and completed with qualified demand.",
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "CampaignExecutionCreated",
      "CampaignExecutionPrepared",
      "CampaignExecutionLaunched",
      "CampaignExecutionCompleted",
    ]);
    expect(publisher.events[0]).toMatchObject({
      eventType: "CampaignExecutionCreated",
      aggregateId: executionId,
      eventId,
      correlationId,
      payload: {
        executionId,
        businessId,
        title: "CRM onboarding launch",
        channels: ["email", "webinar"],
        priority: "high",
      },
    });
  });

  it("cancels and archives campaign executions", async () => {
    const { publisher, service } = createService();

    await createExecution(service);
    await service.prepareCampaignExecution({
      commandType: "PrepareCampaignExecution",
      context,
      executionId,
    });

    const cancelled = await service.cancelCampaignExecution({
      commandType: "CancelCampaignExecution",
      context,
      executionId,
      reason: "Launch window moved.",
    });
    expect(cancelled.ok).toBe(true);

    const archived = await service.archiveCampaignExecution({
      commandType: "ArchiveCampaignExecution",
      context,
      executionId,
    });
    expect(archived.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "CampaignExecutionCreated",
      "CampaignExecutionPrepared",
      "CampaignExecutionCancelled",
      "CampaignExecutionArchived",
    ]);
  });

  it("lists campaign executions by business, status, and priority", async () => {
    const { service } = createService();

    await createExecution(service);
    await service.prepareCampaignExecution({
      commandType: "PrepareCampaignExecution",
      context,
      executionId,
    });

    expect(
      (
        await service.listCampaignExecutions({
          queryType: "ListCampaignExecutions",
          context,
        })
      ).executions
    ).toHaveLength(1);
    expect(
      (
        await service.listCampaignExecutionsByStatus({
          queryType: "ListCampaignExecutionsByStatus",
          context,
          status: "prepared",
        })
      ).executions
    ).toHaveLength(1);
    expect(
      (
        await service.listCampaignExecutionsByPriority({
          queryType: "ListCampaignExecutionsByPriority",
          context,
          priority: "high",
        })
      ).executions
    ).toHaveLength(1);
  });

  it("rejects missing and foreign business access", async () => {
    const { service } = createService();

    const missing = await service.prepareCampaignExecution({
      commandType: "PrepareCampaignExecution",
      context,
      executionId,
    });
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("CampaignExecutionNotFound");
    }

    await createExecution(service);

    const foreign = await service.launchCampaignExecution({
      commandType: "LaunchCampaignExecution",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      executionId,
    });
    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});

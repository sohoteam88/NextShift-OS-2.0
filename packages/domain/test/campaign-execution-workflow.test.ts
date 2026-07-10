import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  CampaignExecution,
  InMemoryCampaignExecutionRepository,
  type CampaignExecutionId,
} from "../src/campaign-execution";

const businessId = "business-1" as BusinessId;
const executionId = "workflow-campaign-execution-1" as CampaignExecutionId;
const createdAt = "2026-07-06T00:00:00.000Z";

function createExecution(
  id: CampaignExecutionId = executionId
): CampaignExecution {
  return CampaignExecution.create({
    executionId: id,
    businessId,
    title: "CRM onboarding launch",
    objective: "Convert approved onboarding opportunity into launch execution.",
    channels: ["email", "webinar", "Email"],
    priority: "high",
    createdAt,
  });
}

describe("CampaignExecution workflow aggregate", () => {
  it("creates a draft campaign execution", () => {
    const execution = createExecution();

    expect(execution.toSnapshot()).toMatchObject({
      executionId,
      businessId,
      title: "CRM onboarding launch",
      objective: "Convert approved onboarding opportunity into launch execution.",
      channels: ["email", "webinar"],
      priority: "high",
      status: "draft",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("prepares, launches, and completes a campaign execution", () => {
    const execution = createExecution();

    execution.prepare("2026-07-06T01:00:00.000Z");
    execution.launch("2026-07-06T02:00:00.000Z");
    execution.complete({
      resultSummary: "Launch completed with qualified follow-up demand.",
      completedAt: "2026-07-06T03:00:00.000Z",
    });

    expect(execution.toSnapshot()).toMatchObject({
      status: "completed",
      preparedAt: "2026-07-06T01:00:00.000Z",
      launchedAt: "2026-07-06T02:00:00.000Z",
      completedAt: "2026-07-06T03:00:00.000Z",
      resultSummary: "Launch completed with qualified follow-up demand.",
    });
  });

  it("cancels eligible campaign executions with a reason", () => {
    const execution = createExecution();

    execution.prepare("2026-07-06T01:00:00.000Z");
    execution.cancel({
      reason: "Opportunity deprioritized.",
      cancelledAt: "2026-07-06T02:00:00.000Z",
    });

    expect(execution.toSnapshot()).toMatchObject({
      status: "cancelled",
      cancellationReason: "Opportunity deprioritized.",
      cancelledAt: "2026-07-06T02:00:00.000Z",
    });
  });

  it("archives non-archived campaign executions", () => {
    const execution = createExecution();

    execution.archive("2026-07-06T01:00:00.000Z");

    expect(execution.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-07-06T01:00:00.000Z",
    });
  });

  it("rejects invalid lifecycle transitions", () => {
    const execution = createExecution();

    expect(() => execution.launch("2026-07-06T01:00:00.000Z")).toThrow(
      "Only prepared campaign executions can transition to launched."
    );

    execution.prepare("2026-07-06T01:00:00.000Z");
    execution.launch("2026-07-06T02:00:00.000Z");
    execution.complete({
      resultSummary: "Launch completed.",
      completedAt: "2026-07-06T03:00:00.000Z",
    });

    expect(() => execution.launch("2026-07-06T04:00:00.000Z")).toThrow(
      "Only prepared campaign executions can transition to launched."
    );
    expect(() =>
      execution.cancel({
        reason: "Too late.",
        cancelledAt: "2026-07-06T05:00:00.000Z",
      })
    ).toThrow(
      "Only draft, prepared, or launched campaign executions can be cancelled."
    );

    execution.archive("2026-07-06T06:00:00.000Z");

    expect(() => execution.prepare("2026-07-06T07:00:00.000Z")).toThrow(
      "Archived campaign executions cannot be mutated."
    );
  });
});

describe("InMemoryCampaignExecutionRepository workflow", () => {
  it("saves, retrieves, and filters campaign executions", async () => {
    const repository = new InMemoryCampaignExecutionRepository();
    const highPriority = createExecution();
    const critical = CampaignExecution.create({
      executionId: "workflow-campaign-execution-2" as CampaignExecutionId,
      businessId,
      title: "Partner launch",
      objective: "Execute partner campaign.",
      channels: ["manual"],
      priority: "critical",
      createdAt: "2026-07-06T01:00:00.000Z",
    });

    highPriority.prepare("2026-07-06T01:00:00.000Z");
    await repository.save(highPriority);
    await repository.save(critical);

    expect(await repository.exists(executionId)).toBe(true);
    expect((await repository.findById(executionId))?.toSnapshot()).toEqual(
      highPriority.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(2);
    expect(await repository.findByStatus(businessId, "prepared")).toHaveLength(1);
    expect(await repository.findByPriority(businessId, "critical")).toHaveLength(1);
  });
});

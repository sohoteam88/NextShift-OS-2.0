import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  assertCampaignCanStartExecution,
  CampaignExecution,
  InMemoryCampaignExecutionRepository,
  type CampaignExecutionId,
  type CampaignId,
} from "../src/campaign";

const businessId = "business-1" as BusinessId;
const campaignId = "campaign-1" as CampaignId;
const executionId = "execution-1" as CampaignExecutionId;
const createdAt = "2026-06-28T00:00:00.000Z";

function createExecution(
  id: CampaignExecutionId = executionId
): CampaignExecution {
  return CampaignExecution.create({
    executionId: id,
    campaignId,
    businessId,
    createdAt,
  });
}

describe("CampaignExecution aggregate", () => {
  it("creates a pending campaign execution", () => {
    const execution = createExecution();

    expect(execution.toSnapshot()).toMatchObject({
      executionId,
      campaignId,
      businessId,
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    });
    expect(execution.isActive()).toBe(true);
  });

  it("starts a pending execution", () => {
    const execution = createExecution();

    execution.start("2026-06-28T01:00:00.000Z");

    expect(execution.toSnapshot()).toMatchObject({
      status: "running",
      startedAt: "2026-06-28T01:00:00.000Z",
      updatedAt: "2026-06-28T01:00:00.000Z",
    });
    expect(execution.pullDomainEvents()).toMatchObject([
      {
        eventType: "CampaignExecutionStarted",
        aggregateType: "CampaignExecution",
        version: 1,
      },
    ]);
  });

  it("completes a running execution", () => {
    const execution = createExecution();
    execution.start("2026-06-28T01:00:00.000Z");
    execution.pullDomainEvents();

    execution.complete("2026-06-28T02:00:00.000Z");

    expect(execution.toSnapshot()).toMatchObject({
      status: "completed",
      completedAt: "2026-06-28T02:00:00.000Z",
    });
    expect(execution.isActive()).toBe(false);
    expect(execution.pullDomainEvents()).toMatchObject([
      { eventType: "CampaignExecutionCompleted" },
    ]);
  });

  it("fails a running execution", () => {
    const execution = createExecution();
    execution.start("2026-06-28T01:00:00.000Z");
    execution.pullDomainEvents();

    execution.fail("2026-06-28T02:00:00.000Z", " Channel unavailable ");

    expect(execution.toSnapshot()).toMatchObject({
      status: "failed",
      failedAt: "2026-06-28T02:00:00.000Z",
      failureReason: "Channel unavailable",
    });
    expect(execution.pullDomainEvents()).toMatchObject([
      {
        eventType: "CampaignExecutionFailed",
        payload: { failureReason: "Channel unavailable" },
      },
    ]);
  });

  it("cancels a running execution", () => {
    const execution = createExecution();
    execution.start("2026-06-28T01:00:00.000Z");
    execution.pullDomainEvents();

    execution.cancel("2026-06-28T02:00:00.000Z");

    expect(execution.toSnapshot()).toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-06-28T02:00:00.000Z",
    });
    expect(execution.pullDomainEvents()).toMatchObject([
      { eventType: "CampaignExecutionCancelled" },
    ]);
  });

  it("prevents invalid lifecycle transitions", () => {
    const execution = createExecution();

    expect(() => execution.complete("2026-06-28T01:00:00.000Z")).toThrow(
      "Only running campaign executions may transition to completed."
    );

    execution.start("2026-06-28T01:00:00.000Z");

    expect(() => execution.start("2026-06-28T02:00:00.000Z")).toThrow(
      "Only pending campaign executions may be started."
    );

    execution.complete("2026-06-28T03:00:00.000Z");

    expect(() => execution.cancel("2026-06-28T04:00:00.000Z")).toThrow(
      "Only running campaign executions may transition to cancelled."
    );
  });

  it("enforces campaign execution eligibility", () => {
    expect(() =>
      assertCampaignCanStartExecution({
        campaignStatus: "draft",
        hasActiveSchedule: false,
      })
    ).toThrow(
      "Campaign execution requires an active schedule or explicit eligibility."
    );

    expect(() =>
      assertCampaignCanStartExecution({
        campaignStatus: "archived",
        hasActiveSchedule: true,
      })
    ).toThrow("Archived campaigns cannot start execution.");

    expect(() =>
      assertCampaignCanStartExecution({
        campaignStatus: "completed",
        hasActiveSchedule: true,
      })
    ).toThrow("Completed campaigns cannot start execution.");

    expect(() =>
      assertCampaignCanStartExecution({
        campaignStatus: "draft",
        hasActiveSchedule: false,
        explicitlyEligible: true,
      })
    ).not.toThrow();
  });
});

describe("InMemoryCampaignExecutionRepository", () => {
  it("saves, retrieves, and lists active executions", async () => {
    const repository = new InMemoryCampaignExecutionRepository();
    const execution = createExecution();
    execution.start("2026-06-28T01:00:00.000Z");

    await repository.save(execution);

    expect(await repository.exists(executionId)).toBe(true);
    expect((await repository.findById(executionId))?.toSnapshot()).toEqual(
      execution.toSnapshot()
    );
    expect(
      (await repository.findActiveByCampaignId(campaignId))?.executionId
    ).toBe(executionId);
    expect(await repository.listActive(businessId)).toHaveLength(1);
  });

  it("supports active execution uniqueness and history retrieval", async () => {
    const repository = new InMemoryCampaignExecutionRepository();
    const completed = createExecution();
    completed.start("2026-06-28T01:00:00.000Z");
    completed.complete("2026-06-28T02:00:00.000Z");
    const active = createExecution("execution-2" as CampaignExecutionId);
    active.start("2026-06-28T03:00:00.000Z");

    await repository.save(completed);
    await repository.save(active);

    expect(
      (await repository.findActiveByCampaignId(campaignId))?.executionId
    ).toBe("execution-2");
    expect(await repository.findByCampaignId(campaignId)).toHaveLength(2);
    expect(await repository.listHistory(campaignId)).toHaveLength(2);
  });
});

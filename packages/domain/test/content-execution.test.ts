import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentExecution,
  InMemoryContentExecutionRepository,
  type ContentExecutionId,
  type ContentId,
  type ContentRecommendationId,
  type ContentRecommendationSetId,
  type ContentVariantSetId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const executionId = "execution-1" as ContentExecutionId;
const recommendationSetId =
  "recommendation-set-1" as ContentRecommendationSetId;
const recommendationId = "recommendation-1" as ContentRecommendationId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const contentId = "content-1" as ContentId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createExecution(
  id: ContentExecutionId = executionId,
  ownerBusinessId: BusinessId = businessId
): ContentExecution {
  return ContentExecution.create({
    executionId: id,
    businessId: ownerBusinessId,
    recommendationSetId,
    recommendationId,
    variantSetId,
    contentId,
    platform: "instagram",
    createdAt,
  });
}

describe("ContentExecution aggregate", () => {
  it("creates a planned execution from a content recommendation", () => {
    const execution = createExecution();

    expect(execution.toSnapshot()).toMatchObject({
      executionId,
      businessId,
      recommendationSetId,
      recommendationId,
      variantSetId,
      contentId,
      platform: "instagram",
      status: "planned",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("schedules, starts, and completes an execution", () => {
    const execution = createExecution();

    execution.schedule(
      "2026-06-28T09:00:00.000Z",
      "2026-06-27T01:00:00.000Z"
    );
    execution.start("2026-06-28T09:00:00.000Z");
    execution.complete("2026-06-28T09:30:00.000Z", "Published on Instagram.");

    expect(execution.toSnapshot()).toMatchObject({
      status: "completed",
      scheduledFor: "2026-06-28T09:00:00.000Z",
      startedAt: "2026-06-28T09:00:00.000Z",
      completedAt: "2026-06-28T09:30:00.000Z",
      note: "Published on Instagram.",
    });
  });

  it("fails and cancels executable states only", () => {
    const scheduled = createExecution();
    scheduled.schedule(
      "2026-06-28T09:00:00.000Z",
      "2026-06-27T01:00:00.000Z"
    );
    scheduled.fail("2026-06-28T09:05:00.000Z", "Platform upload failed.");

    expect(scheduled.toSnapshot()).toMatchObject({
      status: "failed",
      failedAt: "2026-06-28T09:05:00.000Z",
      note: "Platform upload failed.",
    });

    const planned = createExecution("execution-2" as ContentExecutionId);
    planned.cancel("2026-06-27T02:00:00.000Z");

    expect(planned.toSnapshot()).toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-06-27T02:00:00.000Z",
    });
  });

  it("prevents invalid transitions", () => {
    const execution = createExecution();

    expect(() =>
      execution.complete("2026-06-27T01:00:00.000Z")
    ).toThrow("Content execution cannot transition from planned.");
  });
});

describe("InMemoryContentExecutionRepository", () => {
  it("saves, retrieves, and queries content executions", async () => {
    const repository = new InMemoryContentExecutionRepository();
    const first = createExecution();
    const second = createExecution(
      "execution-2" as ContentExecutionId,
      otherBusinessId
    );

    second.schedule(
      "2026-06-28T09:00:00.000Z",
      "2026-06-27T01:00:00.000Z"
    );
    await repository.save(first);
    await repository.save(second);

    expect((await repository.findById(executionId))?.toSnapshot()).toEqual(
      first.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByRecommendationSetId(recommendationSetId)).toHaveLength(2);
    expect(await repository.findByRecommendationId(recommendationId)).toHaveLength(2);
    expect(await repository.findActiveByRecommendationId(recommendationId)).not.toBeNull();
    expect(await repository.findByVariantSetId(variantSetId)).toHaveLength(2);
    expect(await repository.findByContentId(contentId)).toHaveLength(2);
    expect(await repository.findPendingByBusinessId(otherBusinessId)).toHaveLength(1);
    expect(await repository.exists(executionId)).toBe(true);
  });
});

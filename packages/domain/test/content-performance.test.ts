import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentPerformance,
  InMemoryContentPerformanceRepository,
  type ContentId,
  type ContentPerformanceId,
  type ContentVariantSetId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const contentId = "content-1" as ContentId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const performanceId = "performance-1" as ContentPerformanceId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createPerformance(): ContentPerformance {
  return ContentPerformance.create({
    performanceId,
    businessId,
    variantSetId,
    contentId,
    createdAt,
  });
}

describe("ContentPerformance aggregate", () => {
  it("creates an active content performance record", () => {
    const performance = createPerformance();

    expect(performance.toSnapshot()).toMatchObject({
      performanceId,
      businessId,
      variantSetId,
      contentId,
      status: "active",
      metrics: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("records platform metrics", () => {
    const performance = createPerformance();

    performance.recordMetrics({
      platform: "instagram",
      measuredAt: "2026-06-28T00:00:00.000Z",
      impressions: 100,
      reach: 80,
      engagements: 20,
      clicks: 5,
      saves: 4,
      shares: 3,
      comments: 2,
      leads: 1,
      conversions: 1,
      recordedAt: "2026-06-28T01:00:00.000Z",
    });

    expect(performance.listMetrics()).toEqual([
      {
        platform: "instagram",
        measuredAt: "2026-06-28T00:00:00.000Z",
        impressions: 100,
        reach: 80,
        engagements: 20,
        clicks: 5,
        saves: 4,
        shares: 3,
        comments: 2,
        leads: 1,
        conversions: 1,
        recordedAt: "2026-06-28T01:00:00.000Z",
      },
    ]);
  });

  it("rejects negative metric values", () => {
    const performance = createPerformance();

    expect(() =>
      performance.recordMetrics({
        platform: "facebook",
        measuredAt: "2026-06-28T00:00:00.000Z",
        impressions: -1,
        recordedAt: "2026-06-28T01:00:00.000Z",
      })
    ).toThrow("Content performance impressions must be a non-negative integer.");
  });

  it("prevents duplicate platform metrics for the same measured timestamp", () => {
    const performance = createPerformance();

    performance.recordMetrics({
      platform: "tiktok",
      measuredAt: "2026-06-28T00:00:00.000Z",
      impressions: 100,
      recordedAt: "2026-06-28T01:00:00.000Z",
    });

    expect(() =>
      performance.recordMetrics({
        platform: "tiktok",
        measuredAt: "2026-06-28T00:00:00.000Z",
        impressions: 120,
        recordedAt: "2026-06-28T02:00:00.000Z",
      })
    ).toThrow(
      "Content performance metrics already exist for this platform and timestamp."
    );
  });

  it("summarizes metrics by platform", () => {
    const performance = createPerformance();

    performance.recordMetrics({
      platform: "xiaohongshu",
      measuredAt: "2026-06-28T00:00:00.000Z",
      impressions: 100,
      reach: 90,
      engagements: 30,
      clicks: 4,
      recordedAt: "2026-06-28T01:00:00.000Z",
    });
    performance.recordMetrics({
      platform: "xiaohongshu",
      measuredAt: "2026-06-29T00:00:00.000Z",
      impressions: 150,
      reach: 120,
      engagements: 40,
      clicks: 6,
      leads: 2,
      recordedAt: "2026-06-29T01:00:00.000Z",
    });

    expect(performance.summarizePlatform("xiaohongshu")).toMatchObject({
      platform: "xiaohongshu",
      impressions: 250,
      reach: 210,
      engagements: 70,
      clicks: 10,
      leads: 2,
    });
  });

  it("prevents modifying archived performance records", () => {
    const performance = createPerformance();

    performance.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      performance.recordMetrics({
        platform: "instagram",
        measuredAt: "2026-06-28T00:00:00.000Z",
        impressions: 100,
        recordedAt: "2026-06-28T01:00:00.000Z",
      })
    ).toThrow("Archived content performance cannot be modified.");
  });
});

describe("InMemoryContentPerformanceRepository", () => {
  it("saves and retrieves performance by ID", async () => {
    const repository = new InMemoryContentPerformanceRepository();
    const performance = createPerformance();

    await repository.save(performance);

    expect((await repository.findById(performanceId))?.toSnapshot()).toEqual(
      performance.toSnapshot()
    );
  });

  it("lists performance records and metrics", async () => {
    const repository = new InMemoryContentPerformanceRepository();
    const performance = createPerformance();

    performance.recordMetrics({
      platform: "facebook",
      measuredAt: "2026-06-28T00:00:00.000Z",
      impressions: 100,
      recordedAt: "2026-06-28T01:00:00.000Z",
    });
    await repository.save(performance);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByVariantSetId(variantSetId)).not.toBeNull();
    expect(await repository.findByContentId(contentId)).toHaveLength(1);
    expect(await repository.listMetrics(performanceId)).toHaveLength(1);
    expect(await repository.exists(performanceId)).toBe(true);
  });
});

import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentInsightSet,
  InMemoryContentInsightRepository,
  createInsightFromSummary,
  type ContentId,
  type ContentInsightId,
  type ContentInsightSetId,
  type ContentPerformanceId,
  type ContentVariantSetId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const contentId = "content-1" as ContentId;
const performanceId = "performance-1" as ContentPerformanceId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const insightSetId = "insight-set-1" as ContentInsightSetId;
const insightId = "insight-1" as ContentInsightId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createInsightSet(): ContentInsightSet {
  return ContentInsightSet.create({
    insightSetId,
    businessId,
    performanceId,
    variantSetId,
    contentId,
    createdAt,
  });
}

describe("ContentInsightSet aggregate", () => {
  it("creates an active content insight set", () => {
    const insightSet = createInsightSet();

    expect(insightSet.toSnapshot()).toMatchObject({
      insightSetId,
      businessId,
      performanceId,
      variantSetId,
      contentId,
      status: "active",
      insights: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("records a winner insight from performance summary", () => {
    const insightSet = createInsightSet();

    insightSet.recordInsight(
      createInsightFromSummary(
        insightId,
        {
          platform: "instagram",
          impressions: 100,
          reach: 80,
          engagements: 20,
          clicks: 5,
          saves: 4,
          shares: 3,
          comments: 2,
          leads: 1,
          conversions: 1,
        },
        "2026-06-27T01:00:00.000Z"
      )
    );

    expect(insightSet.listInsights()[0]).toMatchObject({
      insightId,
      platform: "instagram",
      type: "winner",
      severity: "high",
      action: "amplify",
      status: "open",
      evidence: {
        leads: 1,
        conversions: 1,
      },
    });
  });

  it("records an underperformer insight from low engagement reach", () => {
    const insightSet = createInsightSet();

    insightSet.recordInsight(
      createInsightFromSummary(
        insightId,
        {
          platform: "facebook",
          impressions: 100,
          reach: 80,
          engagements: 0,
          clicks: 0,
          saves: 0,
          shares: 0,
          comments: 0,
          leads: 0,
          conversions: 0,
        },
        "2026-06-27T01:00:00.000Z"
      )
    );

    expect(insightSet.listInsights()[0]).toMatchObject({
      type: "underperformer",
      severity: "medium",
      action: "iterate",
    });
  });

  it("prevents duplicate open insights for the same platform and action", () => {
    const insightSet = createInsightSet();
    const input = createInsightFromSummary(
      insightId,
      {
        platform: "tiktok",
        impressions: 0,
        reach: 0,
        engagements: 0,
        clicks: 0,
        saves: 0,
        shares: 0,
        comments: 0,
        leads: 0,
        conversions: 0,
      },
      "2026-06-27T01:00:00.000Z"
    );

    insightSet.recordInsight(input);

    expect(() =>
      insightSet.recordInsight({
        ...input,
        insightId: "insight-2" as ContentInsightId,
        createdAt: "2026-06-27T02:00:00.000Z",
      })
    ).toThrow("An open content insight already exists for this platform and action.");
  });

  it("resolves and archives insights", () => {
    const insightSet = createInsightSet();

    insightSet.recordInsight(
      createInsightFromSummary(
        insightId,
        {
          platform: "xiaohongshu",
          impressions: 0,
          reach: 0,
          engagements: 0,
          clicks: 0,
          saves: 0,
          shares: 0,
          comments: 0,
          leads: 0,
          conversions: 0,
        },
        "2026-06-27T01:00:00.000Z"
      )
    );
    insightSet.resolveInsight(insightId, "2026-06-27T02:00:00.000Z");
    insightSet.archiveInsight(insightId, "2026-06-27T03:00:00.000Z");

    expect(insightSet.getInsight(insightId)).toMatchObject({
      status: "archived",
      resolvedAt: "2026-06-27T02:00:00.000Z",
      archivedAt: "2026-06-27T03:00:00.000Z",
    });
  });

  it("prevents modifying archived insight sets", () => {
    const insightSet = createInsightSet();

    insightSet.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      insightSet.recordInsight(
        createInsightFromSummary(
          insightId,
          {
            platform: "instagram",
            impressions: 0,
            reach: 0,
            engagements: 0,
            clicks: 0,
            saves: 0,
            shares: 0,
            comments: 0,
            leads: 0,
            conversions: 0,
          },
          "2026-06-27T03:00:00.000Z"
        )
      )
    ).toThrow("Archived content insight sets cannot be modified.");
  });
});

describe("InMemoryContentInsightRepository", () => {
  it("saves and retrieves insight sets by ID", async () => {
    const repository = new InMemoryContentInsightRepository();
    const insightSet = createInsightSet();

    await repository.save(insightSet);

    expect((await repository.findById(insightSetId))?.toSnapshot()).toEqual(
      insightSet.toSnapshot()
    );
  });

  it("lists insight sets and insights", async () => {
    const repository = new InMemoryContentInsightRepository();
    const insightSet = createInsightSet();

    insightSet.recordInsight(
      createInsightFromSummary(
        insightId,
        {
          platform: "instagram",
          impressions: 100,
          reach: 80,
          engagements: 20,
          clicks: 5,
          saves: 4,
          shares: 3,
          comments: 2,
          leads: 1,
          conversions: 1,
        },
        "2026-06-27T01:00:00.000Z"
      )
    );
    await repository.save(insightSet);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByPerformanceId(performanceId)).not.toBeNull();
    expect(await repository.findByVariantSetId(variantSetId)).toHaveLength(1);
    expect(await repository.findByContentId(contentId)).toHaveLength(1);
    expect(await repository.listInsights(insightSetId)).toHaveLength(1);
    expect(await repository.exists(insightSetId)).toBe(true);
  });
});

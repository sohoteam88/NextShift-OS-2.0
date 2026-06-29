import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentRecommendationSet,
  InMemoryContentRecommendationRepository,
  createInsightFromSummary,
  createRecommendationFromInsight,
  type ContentId,
  type ContentInsightId,
  type ContentInsightSetId,
  type ContentPerformanceId,
  type ContentRecommendationId,
  type ContentRecommendationSetId,
  type ContentVariantSetId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const contentId = "content-1" as ContentId;
const insightSetId = "insight-set-1" as ContentInsightSetId;
const performanceId = "performance-1" as ContentPerformanceId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const recommendationSetId = "recommendation-set-1" as ContentRecommendationSetId;
const recommendationId = "recommendation-1" as ContentRecommendationId;
const insightId = "insight-1" as ContentInsightId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createRecommendationSet(): ContentRecommendationSet {
  return ContentRecommendationSet.create({
    recommendationSetId,
    businessId,
    insightSetId,
    performanceId,
    variantSetId,
    contentId,
    createdAt,
  });
}

function createWinnerInsight() {
  return createInsightFromSummary(
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
  );
}

describe("ContentRecommendationSet aggregate", () => {
  it("creates an active content recommendation set", () => {
    const recommendationSet = createRecommendationSet();

    expect(recommendationSet.toSnapshot()).toMatchObject({
      recommendationSetId,
      businessId,
      insightSetId,
      performanceId,
      variantSetId,
      contentId,
      status: "active",
      recommendations: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("records a recommendation from an insight", () => {
    const recommendationSet = createRecommendationSet();
    const insight = {
      ...createWinnerInsight(),
      status: "open" as const,
    };

    recommendationSet.recordRecommendation(
      createRecommendationFromInsight(
        recommendationId,
        insight,
        "2026-06-27T02:00:00.000Z"
      )
    );

    expect(recommendationSet.listRecommendations()[0]).toMatchObject({
      recommendationId,
      insightId,
      action: "amplify",
      priority: "high",
      status: "open",
    });
  });

  it("prevents duplicate open recommendations for the same insight and action", () => {
    const recommendationSet = createRecommendationSet();
    const insight = {
      ...createWinnerInsight(),
      status: "open" as const,
    };

    recommendationSet.recordRecommendation(
      createRecommendationFromInsight(
        recommendationId,
        insight,
        "2026-06-27T02:00:00.000Z"
      )
    );

    expect(() =>
      recommendationSet.recordRecommendation(
        createRecommendationFromInsight(
          "recommendation-2" as ContentRecommendationId,
          insight,
          "2026-06-27T03:00:00.000Z"
        )
      )
    ).toThrow(
      "An open content recommendation already exists for this insight and action."
    );
  });

  it("applies, dismisses, and archives recommendations", () => {
    const recommendationSet = createRecommendationSet();
    const insight = {
      ...createWinnerInsight(),
      status: "open" as const,
    };
    const secondRecommendationId = "recommendation-2" as ContentRecommendationId;

    recommendationSet.recordRecommendation(
      createRecommendationFromInsight(
        recommendationId,
        insight,
        "2026-06-27T02:00:00.000Z"
      )
    );
    recommendationSet.applyRecommendation(
      recommendationId,
      "2026-06-27T03:00:00.000Z"
    );
    recommendationSet.archiveRecommendation(
      recommendationId,
      "2026-06-27T04:00:00.000Z"
    );

    expect(recommendationSet.getRecommendation(recommendationId)).toMatchObject({
      status: "archived",
      appliedAt: "2026-06-27T03:00:00.000Z",
      archivedAt: "2026-06-27T04:00:00.000Z",
    });

    recommendationSet.recordRecommendation(
      createRecommendationFromInsight(
        secondRecommendationId,
        insight,
        "2026-06-27T05:00:00.000Z"
      )
    );
    recommendationSet.dismissRecommendation(
      secondRecommendationId,
      "2026-06-27T06:00:00.000Z"
    );

    expect(
      recommendationSet.getRecommendation(secondRecommendationId)
    ).toMatchObject({
      status: "dismissed",
      dismissedAt: "2026-06-27T06:00:00.000Z",
    });
  });

  it("prevents modifying archived recommendation sets", () => {
    const recommendationSet = createRecommendationSet();
    const insight = {
      ...createWinnerInsight(),
      status: "open" as const,
    };

    recommendationSet.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      recommendationSet.recordRecommendation(
        createRecommendationFromInsight(
          recommendationId,
          insight,
          "2026-06-27T03:00:00.000Z"
        )
      )
    ).toThrow("Archived content recommendation sets cannot be modified.");
  });
});

describe("InMemoryContentRecommendationRepository", () => {
  it("saves and retrieves recommendation sets by ID", async () => {
    const repository = new InMemoryContentRecommendationRepository();
    const recommendationSet = createRecommendationSet();

    await repository.save(recommendationSet);

    expect(
      (await repository.findById(recommendationSetId))?.toSnapshot()
    ).toEqual(recommendationSet.toSnapshot());
  });

  it("lists recommendation sets and recommendations", async () => {
    const repository = new InMemoryContentRecommendationRepository();
    const recommendationSet = createRecommendationSet();
    const insight = {
      ...createWinnerInsight(),
      status: "open" as const,
    };

    recommendationSet.recordRecommendation(
      createRecommendationFromInsight(
        recommendationId,
        insight,
        "2026-06-27T02:00:00.000Z"
      )
    );
    await repository.save(recommendationSet);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByInsightSetId(insightSetId)).not.toBeNull();
    expect(await repository.findByPerformanceId(performanceId)).toHaveLength(1);
    expect(await repository.findByVariantSetId(variantSetId)).toHaveLength(1);
    expect(await repository.findByContentId(contentId)).toHaveLength(1);
    expect(
      await repository.listRecommendations(recommendationSetId)
    ).toHaveLength(1);
    expect(await repository.exists(recommendationSetId)).toBe(true);
  });
});

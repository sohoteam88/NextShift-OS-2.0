import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentVariantSet,
  InMemoryContentVariantRepository,
  type ContentId,
  type ContentPlanId,
  type ContentVariantSetId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const planId = "plan-1" as ContentPlanId;
const contentId = "content-1" as ContentId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createVariantSet(): ContentVariantSet {
  return ContentVariantSet.create({
    variantSetId,
    businessId,
    planId,
    contentId,
    createdAt,
  });
}

describe("ContentVariantSet aggregate", () => {
  it("creates an active content variant set", () => {
    const variantSet = createVariantSet();

    expect(variantSet.toSnapshot()).toMatchObject({
      variantSetId,
      businessId,
      planId,
      contentId,
      status: "active",
      variants: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("adds a platform variant", () => {
    const variantSet = createVariantSet();

    variantSet.addVariant({
      platform: "instagram",
      format: "reel",
      hook: "Stop guessing what to post",
      body: "Turn one idea into a weekly content rhythm.",
      cta: "Save this for your next planning session.",
      ctaType: "engagement",
      createdAt: "2026-06-27T01:00:00.000Z",
    });

    expect(variantSet.listVariants()).toEqual([
      {
        platform: "instagram",
        format: "reel",
        hook: "Stop guessing what to post",
        body: "Turn one idea into a weekly content rhythm.",
        cta: "Save this for your next planning session.",
        ctaType: "engagement",
        status: "draft",
        createdAt: "2026-06-27T01:00:00.000Z",
        updatedAt: "2026-06-27T01:00:00.000Z",
      },
    ]);
  });

  it("prevents duplicate active variants for the same platform", () => {
    const variantSet = createVariantSet();

    variantSet.addVariant({
      platform: "facebook",
      format: "long_post",
      hook: "The easiest way to plan content",
      cta: "Comment PLAN.",
      ctaType: "engagement",
      createdAt: "2026-06-27T01:00:00.000Z",
    });

    expect(() =>
      variantSet.addVariant({
        platform: "facebook",
        format: "story",
        hook: "Behind the scenes",
        cta: "Follow for more.",
        ctaType: "engagement",
        createdAt: "2026-06-27T02:00:00.000Z",
      })
    ).toThrow("Content variant already exists for this platform.");
  });

  it("updates, approves, and archives variants", () => {
    const variantSet = createVariantSet();

    variantSet.addVariant({
      platform: "tiktok",
      format: "short_video",
      hook: "Content planning in 30 seconds",
      cta: "DM me PLAN.",
      ctaType: "dm_whatsapp",
      createdAt: "2026-06-27T01:00:00.000Z",
    });

    const updatedFields = variantSet.updateVariant({
      platform: "tiktok",
      hook: "Plan content without overthinking",
      ctaType: "lead_magnet",
      updatedAt: "2026-06-27T02:00:00.000Z",
    });

    expect(updatedFields).toEqual(["hook", "ctaType"]);

    variantSet.approveVariant("tiktok", "2026-06-27T03:00:00.000Z");

    expect(variantSet.getVariant("tiktok")).toMatchObject({
      status: "approved",
      approvedAt: "2026-06-27T03:00:00.000Z",
    });

    variantSet.archiveVariant("tiktok", "2026-06-27T04:00:00.000Z");

    expect(variantSet.getVariant("tiktok")).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-27T04:00:00.000Z",
    });
  });

  it("prevents modifying archived variant sets", () => {
    const variantSet = createVariantSet();

    variantSet.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      variantSet.addVariant({
        platform: "xiaohongshu",
        format: "image_note",
        hook: "Content planning checklist",
        cta: "Save this note.",
        ctaType: "engagement",
        createdAt: "2026-06-27T03:00:00.000Z",
      })
    ).toThrow("Archived content variant sets cannot be modified.");
  });
});

describe("InMemoryContentVariantRepository", () => {
  it("saves and retrieves variant sets by ID", async () => {
    const repository = new InMemoryContentVariantRepository();
    const variantSet = createVariantSet();

    await repository.save(variantSet);

    expect((await repository.findById(variantSetId))?.toSnapshot()).toEqual(
      variantSet.toSnapshot()
    );
  });

  it("lists variant sets and variants", async () => {
    const repository = new InMemoryContentVariantRepository();
    const variantSet = createVariantSet();

    variantSet.addVariant({
      platform: "instagram",
      format: "carousel",
      hook: "Five prompts for better content",
      cta: "Save this carousel.",
      ctaType: "engagement",
      createdAt: "2026-06-27T01:00:00.000Z",
    });

    await repository.save(variantSet);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByPlanId(planId)).toHaveLength(1);
    expect(await repository.findByContentId(contentId)).toHaveLength(1);
    expect(await repository.listVariants(variantSetId)).toHaveLength(1);
    expect(await repository.exists(variantSetId)).toBe(true);
  });
});

import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  Campaign,
  InMemoryCampaignRepository,
  type CampaignId,
} from "../src/campaign";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const campaignId = "campaign-1" as CampaignId;
const createdAt = "2026-06-28T00:00:00.000Z";

function createCampaign(id: CampaignId = campaignId): Campaign {
  return Campaign.create({
    campaignId: id,
    businessId,
    name: "90 Day Launch Campaign",
    objective: "Generate qualified leads for the new offer.",
    channels: ["instagram", "email", "whatsapp"],
    createdAt,
  });
}

describe("Campaign aggregate", () => {
  it("creates a draft campaign", () => {
    const campaign = createCampaign();

    expect(campaign.toSnapshot()).toMatchObject({
      campaignId,
      businessId,
      name: "90 Day Launch Campaign",
      objective: "Generate qualified leads for the new offer.",
      channels: ["instagram", "email", "whatsapp"],
      status: "draft",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("normalizes and deduplicates channels", () => {
    const campaign = Campaign.create({
      campaignId,
      businessId,
      name: "Channel Campaign",
      objective: "Test channel normalization.",
      channels: ["Instagram", "instagram", "EMAIL"],
      createdAt,
    });

    expect(campaign.toSnapshot().channels).toEqual(["instagram", "email"]);
  });

  it("requires valid campaign inputs", () => {
    expect(() =>
      Campaign.create({
        campaignId,
        businessId,
        name: " ",
        objective: "Generate qualified leads.",
        channels: ["instagram"],
        createdAt,
      })
    ).toThrow("Campaign name is required.");

    expect(() =>
      Campaign.create({
        campaignId,
        businessId,
        name: "Launch Campaign",
        objective: " ",
        channels: ["instagram"],
        createdAt,
      })
    ).toThrow("Campaign objective is required.");

    expect(() =>
      Campaign.create({
        campaignId,
        businessId,
        name: "Launch Campaign",
        objective: "Generate qualified leads.",
        channels: ["podcast"],
        createdAt,
      })
    ).toThrow("Unsupported campaign channel: podcast.");
  });

  it("updates editable campaign fields", () => {
    const campaign = createCampaign();

    campaign.update({
      name: "Updated Launch Campaign",
      objective: "Drive sales calls from warm leads.",
      channels: ["facebook", "webinar"],
      updatedAt: "2026-06-28T01:00:00.000Z",
    });

    expect(campaign.toSnapshot()).toMatchObject({
      name: "Updated Launch Campaign",
      objective: "Drive sales calls from warm leads.",
      channels: ["facebook", "webinar"],
      updatedAt: "2026-06-28T01:00:00.000Z",
    });
  });

  it("launches, pauses, resumes, and completes a campaign", () => {
    const campaign = createCampaign();

    campaign.launch("2026-06-28T02:00:00.000Z");
    campaign.pause("2026-06-28T03:00:00.000Z");
    campaign.resume("2026-06-28T04:00:00.000Z");
    campaign.complete("2026-06-28T05:00:00.000Z");

    expect(campaign.toSnapshot()).toMatchObject({
      status: "completed",
      launchedAt: "2026-06-28T02:00:00.000Z",
      pausedAt: "2026-06-28T03:00:00.000Z",
      resumedAt: "2026-06-28T04:00:00.000Z",
      completedAt: "2026-06-28T05:00:00.000Z",
    });
  });

  it("archives and restores a campaign to draft", () => {
    const campaign = createCampaign();

    campaign.archive("2026-06-28T02:00:00.000Z");
    expect(campaign.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-28T02:00:00.000Z",
    });

    campaign.restore("2026-06-28T03:00:00.000Z");
    expect(campaign.toSnapshot()).toMatchObject({
      status: "draft",
      archivedAt: undefined,
      updatedAt: "2026-06-28T03:00:00.000Z",
    });
  });

  it("prevents invalid state transitions", () => {
    const campaign = createCampaign();

    expect(() => campaign.pause("2026-06-28T02:00:00.000Z")).toThrow(
      "Only active campaigns may be paused."
    );

    campaign.launch("2026-06-28T02:00:00.000Z");

    expect(() => campaign.launch("2026-06-28T03:00:00.000Z")).toThrow(
      "Only draft campaigns may be launched."
    );
  });

  it("prevents modification after completion or archive", () => {
    const completed = createCampaign();
    completed.launch("2026-06-28T02:00:00.000Z");
    completed.complete("2026-06-28T03:00:00.000Z");

    expect(() =>
      completed.update({
        name: "Completed Campaign",
        updatedAt: "2026-06-28T04:00:00.000Z",
      })
    ).toThrow("Completed campaigns cannot be modified.");

    const archived = createCampaign("campaign-2" as CampaignId);
    archived.archive("2026-06-28T02:00:00.000Z");

    expect(() =>
      archived.update({
        name: "Archived Campaign",
        updatedAt: "2026-06-28T04:00:00.000Z",
      })
    ).toThrow("Archived campaigns cannot be modified.");
  });

  it("rehydrates only valid snapshots", () => {
    const snapshot = createCampaign().toSnapshot();

    expect(Campaign.rehydrate(snapshot).toSnapshot()).toEqual(snapshot);
    expect(() =>
      Campaign.rehydrate({
        ...snapshot,
        status: "active",
        launchedAt: undefined,
      })
    ).toThrow("Active campaigns require launchedAt.");
  });
});

describe("InMemoryCampaignRepository", () => {
  it("saves and retrieves campaigns by ID", async () => {
    const repository = new InMemoryCampaignRepository();
    const campaign = createCampaign();

    await repository.save(campaign);

    expect((await repository.findById(campaignId))?.toSnapshot()).toEqual(
      campaign.toSnapshot()
    );
  });

  it("searches campaigns by business, status, channel, and name", async () => {
    const repository = new InMemoryCampaignRepository();
    const first = createCampaign();
    const second = Campaign.create({
      campaignId: "campaign-2" as CampaignId,
      businessId: otherBusinessId,
      name: "Webinar Campaign",
      objective: "Book qualified sales calls.",
      channels: ["webinar", "email"],
      createdAt: "2026-06-28T01:00:00.000Z",
    });

    first.launch("2026-06-28T02:00:00.000Z");
    await repository.save(first);
    await repository.save(second);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.search({ status: "active" })).toHaveLength(1);
    expect(await repository.search({ channel: "webinar" })).toHaveLength(1);
    expect(await repository.search({ name: "webinar" })).toHaveLength(1);
  });

  it("checks existence and archives campaigns", async () => {
    const repository = new InMemoryCampaignRepository();

    expect(await repository.exists(campaignId)).toBe(false);

    await repository.save(createCampaign());

    expect(await repository.exists(campaignId)).toBe(true);

    const archived = await repository.archive(
      campaignId,
      "2026-06-28T02:00:00.000Z"
    );

    expect(archived?.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-28T02:00:00.000Z",
    });
  });
});

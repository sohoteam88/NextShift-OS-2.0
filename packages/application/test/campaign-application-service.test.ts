import {
  InMemoryCampaignRepository,
  type CampaignId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import { CampaignApplicationService } from "../src/campaign";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const campaignId = "campaign-1" as CampaignId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

const otherContext = {
  businessId: otherBusinessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

function createService() {
  const repository = new InMemoryCampaignRepository();
  const timestamps = [
    "2026-06-28T00:00:00.000Z",
    "2026-06-28T01:00:00.000Z",
    "2026-06-28T02:00:00.000Z",
    "2026-06-28T03:00:00.000Z",
    "2026-06-28T04:00:00.000Z",
    "2026-06-28T05:00:00.000Z",
    "2026-06-28T06:00:00.000Z",
  ];
  const service = new CampaignApplicationService(
    repository,
    () => timestamps.shift() ?? "2026-06-28T07:00:00.000Z",
    () => campaignId
  );

  return { repository, service };
}

async function createCampaign(service: CampaignApplicationService) {
  return service.createCampaign({
    commandType: "CreateCampaign",
    context,
    campaignId,
    name: "90 Day Launch Campaign",
    objective: "Generate qualified leads for the new offer.",
    channels: ["instagram", "email", "whatsapp"],
  });
}

describe("CampaignApplicationService", () => {
  it("creates and persists a campaign", async () => {
    const { repository, service } = createService();

    const result = await createCampaign(service);

    expect(result.ok).toBe(true);
    expect(await repository.exists(campaignId)).toBe(true);

    if (result.ok) {
      expect(result.value.campaign.toSnapshot()).toMatchObject({
        campaignId,
        businessId,
        name: "90 Day Launch Campaign",
        objective: "Generate qualified leads for the new offer.",
        channels: ["instagram", "email", "whatsapp"],
        status: "draft",
      });
    }
  });

  it("updates and persists campaign changes", async () => {
    const { service } = createService();

    await createCampaign(service);

    const result = await service.updateCampaign({
      commandType: "UpdateCampaign",
      context,
      campaignId,
      name: "Updated Launch Campaign",
      objective: "Book qualified sales calls.",
      channels: ["facebook", "webinar"],
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.campaign.toSnapshot()).toMatchObject({
        name: "Updated Launch Campaign",
        objective: "Book qualified sales calls.",
        channels: ["facebook", "webinar"],
        updatedAt: "2026-06-28T01:00:00.000Z",
      });
    }
  });

  it("launches, pauses, resumes, and completes a campaign", async () => {
    const { service } = createService();

    await createCampaign(service);
    await service.launchCampaign({
      commandType: "LaunchCampaign",
      context,
      campaignId,
    });
    await service.pauseCampaign({
      commandType: "PauseCampaign",
      context,
      campaignId,
    });
    await service.resumeCampaign({
      commandType: "ResumeCampaign",
      context,
      campaignId,
    });
    const result = await service.completeCampaign({
      commandType: "CompleteCampaign",
      context,
      campaignId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.campaign.toSnapshot()).toMatchObject({
        status: "completed",
        launchedAt: "2026-06-28T01:00:00.000Z",
        pausedAt: "2026-06-28T02:00:00.000Z",
        resumedAt: "2026-06-28T03:00:00.000Z",
        completedAt: "2026-06-28T04:00:00.000Z",
      });
    }
  });

  it("archives and restores a campaign", async () => {
    const { service } = createService();

    await createCampaign(service);
    await service.archiveCampaign({
      commandType: "ArchiveCampaign",
      context,
      campaignId,
    });
    const result = await service.restoreCampaign({
      commandType: "RestoreCampaign",
      context,
      campaignId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.campaign.toSnapshot()).toMatchObject({
        status: "draft",
        archivedAt: undefined,
      });
    }
  });

  it("returns not found for missing aggregate commands", async () => {
    const { service } = createService();

    const result = await service.launchCampaign({
      commandType: "LaunchCampaign",
      context,
      campaignId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "CampaignNotFound",
      });
    }
  });

  it("returns validation failures for invalid operations", async () => {
    const { service } = createService();

    await createCampaign(service);

    const result = await service.pauseCampaign({
      commandType: "PauseCampaign",
      context,
      campaignId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Only active campaigns may be paused.",
      });
    }
  });

  it("queries campaigns by ID, business, and search criteria", async () => {
    const { service } = createService();

    await createCampaign(service);
    await service.createCampaign({
      commandType: "CreateCampaign",
      context: otherContext,
      campaignId: "campaign-2" as CampaignId,
      name: "Webinar Campaign",
      objective: "Book qualified sales calls.",
      channels: ["webinar", "email"],
    });
    await service.launchCampaign({
      commandType: "LaunchCampaign",
      context,
      campaignId,
    });

    const byId = await service.getCampaign({
      queryType: "GetCampaign",
      context,
      campaignId,
    });
    const byBusiness = await service.listCampaignsByBusiness({
      queryType: "ListCampaignsByBusiness",
      context,
    });
    const byStatus = await service.searchCampaigns({
      queryType: "SearchCampaigns",
      context,
      criteria: { status: "active" },
    });
    const byChannel = await service.searchCampaigns({
      queryType: "SearchCampaigns",
      context,
      criteria: { channel: "webinar" },
    });

    expect(byId.campaign?.campaignId).toBe(campaignId);
    expect(byBusiness.campaigns).toHaveLength(1);
    expect(byStatus.campaigns).toHaveLength(1);
    expect(byChannel.campaigns).toHaveLength(1);
  });
});

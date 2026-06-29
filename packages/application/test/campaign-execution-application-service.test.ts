import {
  Campaign,
  CampaignSchedule,
  InMemoryCampaignExecutionRepository,
  InMemoryCampaignRepository,
  InMemoryCampaignScheduleRepository,
  type CampaignExecutionId,
  type CampaignId,
  type CampaignScheduleId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import { CampaignExecutionApplicationService } from "../src/campaign";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const campaignId = "campaign-1" as CampaignId;
const otherCampaignId = "campaign-2" as CampaignId;
const executionId = "execution-1" as CampaignExecutionId;

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
  const campaignRepository = new InMemoryCampaignRepository();
  const scheduleRepository = new InMemoryCampaignScheduleRepository();
  const executionRepository = new InMemoryCampaignExecutionRepository();
  const timestamps = [
    "2026-06-28T00:00:00.000Z",
    "2026-06-28T01:00:00.000Z",
    "2026-06-28T02:00:00.000Z",
    "2026-06-28T03:00:00.000Z",
    "2026-06-28T04:00:00.000Z",
  ];
  const service = new CampaignExecutionApplicationService(
    campaignRepository,
    scheduleRepository,
    executionRepository,
    () => timestamps.shift() ?? "2026-06-28T05:00:00.000Z",
    () => executionId
  );

  return {
    campaignRepository,
    executionRepository,
    scheduleRepository,
    service,
  };
}

function createCampaign(
  id: CampaignId = campaignId,
  campaignBusinessId: BusinessId = businessId
): Campaign {
  return Campaign.create({
    campaignId: id,
    businessId: campaignBusinessId,
    name: "90 Day Launch Campaign",
    objective: "Generate qualified leads for the new offer.",
    channels: ["instagram", "email", "whatsapp"],
    createdAt: "2026-06-27T00:00:00.000Z",
  });
}

async function saveCampaign(
  repository: InMemoryCampaignRepository,
  campaign: Campaign = createCampaign()
): Promise<void> {
  await repository.save(campaign);
}

async function saveSchedule(
  repository: InMemoryCampaignScheduleRepository,
  targetCampaignId: CampaignId = campaignId
): Promise<void> {
  await repository.save(
    CampaignSchedule.schedule({
      scheduleId: `${targetCampaignId}-schedule` as CampaignScheduleId,
      campaignId: targetCampaignId,
      businessId,
      campaignStatus: "draft",
      scheduledFor: "2026-06-29T00:00:00.000Z",
      createdAt: "2026-06-27T01:00:00.000Z",
    })
  );
}

describe("CampaignExecutionApplicationService", () => {
  it("starts and persists a scheduled campaign execution", async () => {
    const {
      campaignRepository,
      executionRepository,
      scheduleRepository,
      service,
    } = createService();
    await saveCampaign(campaignRepository);
    await saveSchedule(scheduleRepository);

    const result = await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
    });

    expect(result.ok).toBe(true);
    expect(await executionRepository.exists(executionId)).toBe(true);

    if (result.ok) {
      expect(result.value.execution.toSnapshot()).toMatchObject({
        executionId,
        campaignId,
        businessId,
        status: "running",
        startedAt: "2026-06-28T00:00:00.000Z",
      });
    }
  });

  it("starts explicitly eligible campaigns without an active schedule", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);

    const result = await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
      explicitlyEligible: true,
    });

    expect(result.ok).toBe(true);
  });

  it("completes, fails, and cancels running executions", async () => {
    const {
      campaignRepository,
      executionRepository,
      scheduleRepository,
      service,
    } = createService();
    await saveCampaign(campaignRepository);
    await saveCampaign(campaignRepository, createCampaign(otherCampaignId));
    await saveSchedule(scheduleRepository);
    await saveSchedule(scheduleRepository, otherCampaignId);

    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
    });
    const completed = await service.completeCampaignExecution({
      commandType: "CompleteCampaignExecution",
      context,
      campaignId,
    });
    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
      executionId: "execution-2" as CampaignExecutionId,
    });
    const failed = await service.failCampaignExecution({
      commandType: "FailCampaignExecution",
      context,
      campaignId,
      failureReason: "Channel rejected payload",
    });
    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId: otherCampaignId,
      executionId: "execution-3" as CampaignExecutionId,
    });
    const cancelled = await service.cancelCampaignExecution({
      commandType: "CancelCampaignExecution",
      context,
      campaignId: otherCampaignId,
    });

    expect(completed.ok).toBe(true);
    expect(failed.ok).toBe(true);
    expect(cancelled.ok).toBe(true);
    expect(await executionRepository.listHistory(campaignId)).toHaveLength(2);

    if (completed.ok) {
      expect(completed.value.execution.toSnapshot()).toMatchObject({
        status: "completed",
        completedAt: "2026-06-28T01:00:00.000Z",
      });
    }

    if (failed.ok) {
      expect(failed.value.execution.toSnapshot()).toMatchObject({
        status: "failed",
        failedAt: "2026-06-28T03:00:00.000Z",
        failureReason: "Channel rejected payload",
      });
    }

    if (cancelled.ok) {
      expect(cancelled.value.execution.toSnapshot()).toMatchObject({
        status: "cancelled",
        cancelledAt: "2026-06-28T05:00:00.000Z",
      });
    }
  });

  it("returns not found for missing campaigns or missing active executions", async () => {
    const { campaignRepository, service } = createService();

    const missingCampaign = await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
      explicitlyEligible: true,
    });

    await saveCampaign(campaignRepository);

    const missingExecution = await service.completeCampaignExecution({
      commandType: "CompleteCampaignExecution",
      context,
      campaignId,
    });

    expect(missingCampaign.ok).toBe(false);
    expect(missingExecution.ok).toBe(false);

    if (!missingCampaign.ok) {
      expect(missingCampaign.error).toMatchObject({ code: "CampaignNotFound" });
    }

    if (!missingExecution.ok) {
      expect(missingExecution.error).toMatchObject({
        code: "CampaignExecutionNotFound",
      });
    }
  });

  it("prevents duplicate active executions and ineligible starts", async () => {
    const { campaignRepository, scheduleRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await saveSchedule(scheduleRepository);
    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
    });

    const duplicate = await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
      executionId: "execution-2" as CampaignExecutionId,
    });

    const { campaignRepository: otherCampaignRepository, service: otherService } =
      createService();
    await saveCampaign(otherCampaignRepository);
    const ineligible = await otherService.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
    });

    expect(duplicate.ok).toBe(false);
    expect(ineligible.ok).toBe(false);

    if (!duplicate.ok) {
      expect(duplicate.error).toMatchObject({
        code: "ValidationFailed",
        message: "Campaign already has an active execution.",
      });
    }

    if (!ineligible.ok) {
      expect(ineligible.error).toMatchObject({
        code: "ValidationFailed",
        message:
          "Campaign execution requires an active schedule or explicit eligibility.",
      });
    }
  });

  it("queries active execution, active executions, and execution history", async () => {
    const { campaignRepository, scheduleRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await saveCampaign(campaignRepository, createCampaign(otherCampaignId));
    await saveSchedule(scheduleRepository);
    await saveSchedule(scheduleRepository, otherCampaignId);

    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
    });
    await service.completeCampaignExecution({
      commandType: "CompleteCampaignExecution",
      context,
      campaignId,
    });
    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
      executionId: "execution-2" as CampaignExecutionId,
    });
    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId: otherCampaignId,
      executionId: "execution-3" as CampaignExecutionId,
    });

    const active = await service.getCampaignExecution({
      queryType: "GetCampaignExecution",
      context,
      campaignId,
    });
    const activeList = await service.listActiveCampaignExecutions({
      queryType: "ListActiveCampaignExecutions",
      context,
    });
    const history = await service.listCampaignExecutionHistory({
      queryType: "ListCampaignExecutionHistory",
      context,
      campaignId,
    });

    expect(active.execution?.executionId).toBe("execution-2");
    expect(activeList.executions).toHaveLength(2);
    expect(history.executions).toHaveLength(2);
  });

  it("validates business ownership for commands and queries", async () => {
    const { campaignRepository, scheduleRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await saveSchedule(scheduleRepository);

    const command = await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context: otherContext,
      campaignId,
    });
    await service.startCampaignExecution({
      commandType: "StartCampaignExecution",
      context,
      campaignId,
    });
    const query = await service.getCampaignExecution({
      queryType: "GetCampaignExecution",
      context: otherContext,
      campaignId,
    });
    const history = await service.listCampaignExecutionHistory({
      queryType: "ListCampaignExecutionHistory",
      context: otherContext,
      campaignId,
    });

    expect(command.ok).toBe(false);
    if (!command.ok) {
      expect(command.error).toMatchObject({
        code: "ValidationFailed",
        message: "Campaign does not belong to the command context.",
      });
    }
    expect(query.execution).toBeNull();
    expect(history.executions).toHaveLength(0);
  });
});

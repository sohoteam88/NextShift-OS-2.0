import type { BusinessId } from "@nextshift/shared";
import type { CampaignId } from ".";
import {
  CampaignExecution,
  type CampaignExecutionId,
  type CampaignExecutionSnapshot,
} from "./campaign-execution";
import type { CampaignExecutionRepository } from "./campaign-execution-repository";

export class InMemoryCampaignExecutionRepository
  implements CampaignExecutionRepository
{
  private readonly executions = new Map<
    CampaignExecutionId,
    CampaignExecutionSnapshot
  >();

  async save(execution: CampaignExecution): Promise<void> {
    const snapshot = execution.toSnapshot();
    this.executions.set(snapshot.executionId, cloneSnapshot(snapshot));
  }

  async findById(
    executionId: CampaignExecutionId
  ): Promise<CampaignExecution | null> {
    const snapshot = this.executions.get(executionId);
    return snapshot ? CampaignExecution.rehydrate(snapshot) : null;
  }

  async findByCampaignId(
    campaignId: CampaignId
  ): Promise<readonly CampaignExecution[]> {
    return this.listHistory(campaignId);
  }

  async findActiveByCampaignId(
    campaignId: CampaignId
  ): Promise<CampaignExecution | null> {
    const snapshot = [...this.executions.values()].find(
      (execution) =>
        execution.campaignId === campaignId && isActive(execution)
    );

    return snapshot ? CampaignExecution.rehydrate(snapshot) : null;
  }

  async listActive(
    businessId?: BusinessId
  ): Promise<readonly CampaignExecution[]> {
    return [...this.executions.values()]
      .filter((execution) => businessId === undefined || execution.businessId === businessId)
      .filter(isActive)
      .sort(compareExecutions)
      .map((execution) => CampaignExecution.rehydrate(execution));
  }

  async listHistory(
    campaignId?: CampaignId
  ): Promise<readonly CampaignExecution[]> {
    return [...this.executions.values()]
      .filter((execution) => campaignId === undefined || execution.campaignId === campaignId)
      .sort(compareExecutions)
      .map((execution) => CampaignExecution.rehydrate(execution));
  }

  async exists(executionId: CampaignExecutionId): Promise<boolean> {
    return this.executions.has(executionId);
  }
}

function isActive(execution: CampaignExecutionSnapshot): boolean {
  return ["pending", "running"].includes(execution.status);
}

function compareExecutions(
  left: CampaignExecutionSnapshot,
  right: CampaignExecutionSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: CampaignExecutionSnapshot
): CampaignExecutionSnapshot {
  return { ...snapshot };
}

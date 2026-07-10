import type { BusinessId } from "@nextshift/shared";
import { CampaignExecution } from "./campaign-execution";
import type {
  CampaignExecutionId,
  CampaignExecutionPriority,
  CampaignExecutionSnapshot,
  CampaignExecutionStatus,
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

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly CampaignExecution[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByStatus(
    businessId: BusinessId,
    status: CampaignExecutionStatus
  ): Promise<readonly CampaignExecution[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.status === status
    );
  }

  async findByPriority(
    businessId: BusinessId,
    priority: CampaignExecutionPriority
  ): Promise<readonly CampaignExecution[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.priority === priority
    );
  }

  async exists(executionId: CampaignExecutionId): Promise<boolean> {
    return this.executions.has(executionId);
  }

  private search(
    predicate: (snapshot: CampaignExecutionSnapshot) => boolean
  ): readonly CampaignExecution[] {
    return [...this.executions.values()]
      .filter(predicate)
      .sort(compareExecutions)
      .map((snapshot) => CampaignExecution.rehydrate(snapshot));
  }
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
  return {
    ...snapshot,
    channels: Object.freeze([...snapshot.channels]),
  };
}

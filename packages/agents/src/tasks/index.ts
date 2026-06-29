import type { BusinessId, TenantContext } from "@nextshift/shared";

export interface AgentTask {
  readonly taskId: string;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly taskType: string;
  readonly description: string;
}

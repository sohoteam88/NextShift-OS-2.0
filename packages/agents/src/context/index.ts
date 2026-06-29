import type {
  ActorContext,
  BusinessId,
  CorrelationId,
  TenantContext,
} from "@nextshift/shared";
import type { BusinessTwinSnapshot } from "@nextshift/contracts";

export interface AgentRuntimeContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly actor: ActorContext;
  readonly correlationId?: CorrelationId;
  readonly businessContext?: BusinessTwinSnapshot;
}

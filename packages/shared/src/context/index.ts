import type { OrganizationId, TenantId, UserId, WorkspaceId } from "../ids";

export interface TenantContext {
  readonly tenantId: TenantId;
  readonly workspaceId?: WorkspaceId;
  readonly organizationId?: OrganizationId;
}

export interface ActorContext {
  readonly userId?: UserId;
  readonly actorType: "user" | "agent" | "system";
}

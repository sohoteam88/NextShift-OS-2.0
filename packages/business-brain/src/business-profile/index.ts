import type { BusinessProfile } from "@nextshift/domain";
import type { BusinessId, TenantContext } from "@nextshift/shared";

export interface BusinessProfileStore {
  save(profile: BusinessProfile): Promise<void>;

  get(
    businessId: BusinessId,
    tenant: TenantContext
  ): Promise<BusinessProfile | null>;
}

export class InMemoryBusinessProfileStore implements BusinessProfileStore {
  private readonly profiles = new Map<string, BusinessProfile>();

  async save(profile: BusinessProfile): Promise<void> {
    this.profiles.set(this.key(profile.businessId, profile.tenant), profile);
  }

  async get(
    businessId: BusinessId,
    tenant: TenantContext
  ): Promise<BusinessProfile | null> {
    return this.profiles.get(this.key(businessId, tenant)) ?? null;
  }

  private key(businessId: BusinessId, tenant: TenantContext): string {
    return `${tenant.tenantId}:${tenant.workspaceId ?? "default"}:${businessId}`;
  }
}
